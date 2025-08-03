// JSON Tweet Extractor with Authentication Support
(function() {
    'use strict';

    console.log('🗂️ JSON Tweet Extractor loaded');

    let isExtracting = false;

    // Listen for extraction requests
    document.addEventListener('startTweetExtraction', async function(event) {
        if (isExtracting) {
            console.log('⚠️ Extraction already in progress');
            return;
        }

        const { count, authToken, apiBase } = event.detail;
        console.log(`🚀 Starting JSON extraction of ${count} tweets`);
        
        isExtracting = true;

        try {
            const result = await extractTweetsToJSON(count, authToken, apiBase);
            
            // Dispatch result
            document.dispatchEvent(new CustomEvent('extractionResult', {
                detail: result
            }));
        } catch (error) {
            console.error('❌ Extraction error:', error);
            document.dispatchEvent(new CustomEvent('extractionResult', {
                detail: {
                    success: false,
                    error: error.message
                }
            }));
        } finally {
            isExtracting = false;
        }
    });

    async function extractTweetsToJSON(count, authToken, apiBase) {
        try {
            // Check if we're on X/Twitter
            if (!window.location.hostname.includes('x.com') && !window.location.hostname.includes('twitter.com')) {
                throw new Error('Please navigate to X/Twitter to extract tweets');
            }

            // Extract tweets data
            const tweetsData = await scrapeTweetsData(count);
            
            if (tweetsData.tweets.length === 0) {
                throw new Error('No tweets found. Please make sure you are on a profile page with tweets.');
            }

            // Upload to S3 via API
            const uploadResult = await uploadToAPI(tweetsData, authToken, apiBase);
            
            return {
                success: true,
                count: tweetsData.tweets.length,
                url: uploadResult.url,
                filename: uploadResult.filename
            };

        } catch (error) {
            throw error;
        }
    }

    async function scrapeTweetsData(maxCount) {
        const tweets = [];
        const profileInfo = extractProfileInfo();
        let attempts = 0;
        const maxAttempts = 50;

        while (tweets.length < maxCount && attempts < maxAttempts) {
            attempts++;
            
            // Find tweet elements
            const tweetElements = document.querySelectorAll('[data-testid="tweet"]');
            console.log(`🔍 Found ${tweetElements.length} tweet elements on page`);

            // Extract data from each tweet
            for (const tweetElement of tweetElements) {
                if (tweets.length >= maxCount) break;

                const tweetData = extractTweetData(tweetElement);
                if (tweetData && !tweets.some(t => t.id === tweetData.id)) {
                    tweets.push(tweetData);
                }
            }

            // If we need more tweets, scroll down
            if (tweets.length < maxCount) {
                window.scrollTo(0, document.body.scrollHeight);
                await sleep(2000); // Wait for content to load
            }
        }

        return {
            profile: profileInfo,
            tweets: tweets.slice(0, maxCount),
            extractedAt: new Date().toISOString(),
            extractedFrom: window.location.href
        };
    }

    function extractProfileInfo() {
        const profileInfo = {
            username: '',
            displayName: '',
            bio: '',
            location: '',
            website: '',
            joinedDate: '',
            following: 0,
            followers: 0,
            profileImage: '',
            coverImage: ''
        };

        try {
            // Extract username from URL or page
            const urlPath = window.location.pathname;
            profileInfo.username = urlPath.split('/')[1] || '';

            // Display name
            const displayNameElement = document.querySelector('[data-testid="UserName"] span');
            if (displayNameElement) {
                profileInfo.displayName = displayNameElement.textContent.trim();
            }

            // Bio
            const bioElement = document.querySelector('[data-testid="UserDescription"]');
            if (bioElement) {
                profileInfo.bio = bioElement.textContent.trim();
            }

            // Profile stats
            const statsElements = document.querySelectorAll('a[href*="/following"], a[href*="/verified_followers"]');
            statsElements.forEach(element => {
                const text = element.textContent.toLowerCase();
                const number = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
                
                if (text.includes('following')) {
                    profileInfo.following = number;
                } else if (text.includes('followers')) {
                    profileInfo.followers = number;
                }
            });

            // Profile image
            const profileImageElement = document.querySelector('[data-testid="UserAvatar-Container-"] img');
            if (profileImageElement) {
                profileInfo.profileImage = profileImageElement.src;
            }

        } catch (error) {
            console.warn('⚠️ Error extracting profile info:', error);
        }

        return profileInfo;
    }

    function extractTweetData(tweetElement) {
        try {
            const tweetData = {
                id: '',
                text: '',
                author: {
                    username: '',
                    displayName: '',
                    profileImage: ''
                },
                timestamp: '',
                metrics: {
                    replies: 0,
                    retweets: 0,
                    likes: 0,
                    views: 0
                },
                media: [],
                urls: [],
                hashtags: [],
                mentions: [],
                isRetweet: false,
                isReply: false
            };

            // Tweet ID (from links)
            const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
            if (tweetLink) {
                const href = tweetLink.getAttribute('href');
                const idMatch = href.match(/\/status\/(\d+)/);
                if (idMatch) {
                    tweetData.id = idMatch[1];
                }
            }

            // Tweet text
            const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
            if (textElement) {
                tweetData.text = textElement.textContent.trim();
                
                // Extract hashtags and mentions from text
                const hashtags = tweetData.text.match(/#\w+/g) || [];
                const mentions = tweetData.text.match(/@\w+/g) || [];
                tweetData.hashtags = hashtags;
                tweetData.mentions = mentions;
            }

            // Author info
            const authorElement = tweetElement.querySelector('[data-testid="User-Name"]');
            if (authorElement) {
                const usernameElement = authorElement.querySelector('span');
                if (usernameElement) {
                    tweetData.author.username = usernameElement.textContent.replace('@', '');
                }
            }

            // Timestamp
            const timeElement = tweetElement.querySelector('time');
            if (timeElement) {
                tweetData.timestamp = timeElement.getAttribute('datetime') || timeElement.textContent;
            }

            // Metrics
            const metricsElements = tweetElement.querySelectorAll('[role="group"] [role="button"]');
            metricsElements.forEach((element, index) => {
                const text = element.textContent.trim();
                const number = parseInt(text.replace(/[^\d]/g, '')) || 0;
                
                if (index === 0) tweetData.metrics.replies = number;
                else if (index === 1) tweetData.metrics.retweets = number;
                else if (index === 2) tweetData.metrics.likes = number;
                else if (index === 3) tweetData.metrics.views = number;
            });

            // Media
            const mediaElements = tweetElement.querySelectorAll('img[src*="media"], video');
            mediaElements.forEach(mediaElement => {
                if (mediaElement.tagName === 'IMG') {
                    tweetData.media.push({
                        type: 'image',
                        url: mediaElement.src,
                        alt: mediaElement.alt || ''
                    });
                } else if (mediaElement.tagName === 'VIDEO') {
                    tweetData.media.push({
                        type: 'video',
                        url: mediaElement.src || '',
                        poster: mediaElement.poster || ''
                    });
                }
            });

            // URLs
            const linkElements = tweetElement.querySelectorAll('a[href^="http"]');
            linkElements.forEach(linkElement => {
                const url = linkElement.getAttribute('href');
                if (url && !url.includes('twitter.com') && !url.includes('x.com')) {
                    tweetData.urls.push(url);
                }
            });

            // Check if retweet or reply
            tweetData.isRetweet = !!tweetElement.querySelector('[data-testid="socialContext"]');
            tweetData.isReply = !!tweetElement.querySelector('[data-testid="replying-to"]');

            return tweetData.id ? tweetData : null;

        } catch (error) {
            console.warn('⚠️ Error extracting tweet data:', error);
            return null;
        }
    }

    async function uploadToAPI(tweetsData, authToken, apiBase) {
        try {
            const jsonContent = JSON.stringify(tweetsData, null, 2);
            
            // Use chrome.runtime.sendMessage to bypass CSP restrictions
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'uploadToAPI',
                    data: {
                        content: jsonContent,
                        contentType: 'application/json',
                        authToken: authToken,
                        apiBase: apiBase
                    }
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    
                    if (response.success) {
                        resolve({
                            url: response.url,
                            filename: response.filename
                        });
                    } else {
                        reject(new Error(response.error || 'Upload failed'));
                    }
                });
            });

        } catch (error) {
            console.error('❌ Upload error:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    console.log('✅ JSON Tweet Extractor ready');
})();
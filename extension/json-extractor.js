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

            // Upload to S3 via API using postMessage to content script
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
            console.log('🔍 [EXTENSION] Extracting profile info...');
            
            // Extract username from URL or page
            const urlPath = window.location.pathname;
            profileInfo.username = urlPath.split('/')[1] || '';
            console.log('🔍 [EXTENSION] Username from URL:', profileInfo.username);

            // Display name
            const displayNameElement = document.querySelector('[data-testid="UserName"] span');
            if (displayNameElement) {
                profileInfo.displayName = displayNameElement.textContent.trim();
                console.log('🔍 [EXTENSION] Display name found:', profileInfo.displayName);
            } else {
                console.warn('⚠️ [EXTENSION] Display name element not found');
            }

            // Bio
            const bioElement = document.querySelector('[data-testid="UserDescription"]');
            if (bioElement) {
                profileInfo.bio = bioElement.textContent.trim();
                console.log('🔍 [EXTENSION] Bio found:', profileInfo.bio.substring(0, 50) + '...');
            } else {
                console.warn('⚠️ [EXTENSION] Bio element not found');
            }

            // Profile stats
            const statsElements = document.querySelectorAll('a[href*="/following"], a[href*="/verified_followers"]');
            console.log('🔍 [EXTENSION] Found stats elements:', statsElements.length);
            statsElements.forEach(element => {
                const text = element.textContent.toLowerCase();
                const number = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
                console.log('🔍 [EXTENSION] Stats element:', text, number);
                
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
                console.log('🔍 [EXTENSION] Profile image found');
            } else {
                console.warn('⚠️ [EXTENSION] Profile image element not found');
            }

            console.log('🔍 [EXTENSION] Final profile info:', profileInfo);

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
            console.log('📤 [EXTENSION] Preparing to upload data...');
            console.log('📤 [EXTENSION] Profile info:', tweetsData.profile);
            console.log('📤 [EXTENSION] Tweet count:', tweetsData.tweets.length);
            
            const jsonContent = JSON.stringify(tweetsData, null, 2);
            console.log('📤 [EXTENSION] JSON content size:', jsonContent.length, 'bytes');
            
            // Use postMessage to communicate with content script
            return new Promise((resolve, reject) => {
                const messageId = Date.now() + Math.random();
                
                // Listen for response
                const handleResponse = (event) => {
                    if (event.data.type === 'uploadResponse' && event.data.id === messageId) {
                        window.removeEventListener('message', handleResponse);
                        if (event.data.success) {
                            console.log('📤 [EXTENSION] Upload successful:', event.data);
                            resolve({
                                url: event.data.url,
                                filename: event.data.filename
                            });
                        } else {
                            console.error('📤 [EXTENSION] Upload failed:', event.data.error);
                            reject(new Error(event.data.error || 'Upload failed'));
                        }
                    }
                };
                
                window.addEventListener('message', handleResponse);
                
                // Send upload request to content script
                window.postMessage({
                    type: 'uploadRequest',
                    id: messageId,
                    data: {
                        content: jsonContent,
                        contentType: 'application/json',
                        authToken: authToken,
                        apiBase: apiBase
                    }
                }, '*');
                
                // Timeout after 30 seconds
                setTimeout(() => {
                    window.removeEventListener('message', handleResponse);
                    reject(new Error('Upload timeout'));
                }, 30000);
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
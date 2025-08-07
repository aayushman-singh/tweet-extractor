// X Tweet Scraper based on captured network requests
class XTweetScraper {
  constructor(authToken, csrfToken) {
    this.authToken = authToken;
    this.csrfToken = csrfToken;
    this.baseUrl =
      "https://x.com/i/api/graphql/p8aXzC3mi1Zjdv4H1E0O1Q/UserTweets";

    // Features from your captured request
    this.features = {
      rweb_video_screen_enabled: false,
      payments_enabled: false,
      profile_label_improvements_pcf_label_in_post_enabled: true,
      rweb_tipjar_consumption_enabled: true,
      verified_phone_label_enabled: true,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      premium_content_api_read_enabled: false,
      communities_web_enable_tweet_community_results_fetch: true,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      responsive_web_grok_analyze_button_fetch_trends_enabled: false,
      responsive_web_grok_analyze_post_followups_enabled: true,
      responsive_web_jetfuel_frame: true,
      responsive_web_grok_share_attachment_enabled: true,
      articles_preview_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      responsive_web_grok_show_grok_translated_post: false,
      responsive_web_grok_analysis_button_from_backend: true,
      creator_subscriptions_quote_tweet_preview_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      responsive_web_grok_image_annotation_enabled: true,
      responsive_web_grok_community_note_auto_translation_is_enabled: false,
      responsive_web_enhance_cards_enabled: false,
    };

    this.fieldToggles = {
      withArticlePlainText: false,
    };
  }

  // Extract tweets from the response structure
  extractTweetsFromResponse(data) {
    const tweets = [];
    let nextCursor = null;

    // console.log("🔍 Parsing response data...", data);

    try {
      // Based on your TypeScript interfaces, the correct path is:
      const instructions =
        data?.data?.user?.result?.timeline?.timeline?.instructions || [];
      // console.log("📋 Found instructions:", instructions.length);

      for (const instruction of instructions) {
        // console.log("📝 Processing instruction:", instruction.type);

        if (instruction.type === "TimelineAddEntries" && instruction.entries) {
          // console.log("📦 Found entries:", instruction.entries.length);

          for (const entry of instruction.entries) {
            // console.log(
            //   "🎯 Entry:",
            //   entry.entryId,
            //   "Type:",
            //   entry.content?.entryType
            // );

            // Extract tweet data based on your interface
            if (
              entry.content?.entryType === "TimelineTimelineItem" &&
              entry.content?.itemContent?.itemType === "TimelineTweet" &&
              entry.content?.itemContent?.tweet_results?.result
            ) {
              const tweetResult =
                entry.content.itemContent.tweet_results.result;

              if (tweetResult.__typename === "Tweet" && tweetResult.legacy) {
                const tweet = tweetResult.legacy;
                // console.log(
                //   "✅ Found tweet:",
                //   tweet.id_str,
                //   tweet.full_text?.substring(0, 50) + "..."
                // );

                tweets.push({
                  id: tweet.id_str,
                  text: tweet.full_text,
                  created_at: new Date(tweet.created_at),
                  retweet_count: tweet.retweet_count || 0,
                  favorite_count: tweet.favorite_count || 0,
                  reply_count: tweet.reply_count || 0,
                  quote_count: tweet.quote_count || 0,
                  bookmark_count: tweet.bookmark_count || 0,
                  user_id: tweet.user_id_str,
                  conversation_id: tweet.conversation_id_str,
                  is_quote_status: tweet.is_quote_status,
                  lang: tweet.lang,
                  possibly_sensitive: tweet.possibly_sensitive,

                  // Additional data from the tweet result
                  rest_id: tweetResult.rest_id,
                  view_count: tweetResult.views?.count
                    ? parseInt(tweetResult.views.count)
                    : 0,
                  source: tweetResult.source,

                  // User data
                  user: tweetResult.core?.user_results?.result
                    ? {
                        id: tweetResult.core.user_results.result.rest_id,
                        screen_name:
                          tweetResult.core.user_results.result.core
                            ?.screen_name,
                        name: tweetResult.core.user_results.result.core?.name,
                        verified:
                          tweetResult.core.user_results.result.verification
                            ?.verified,
                        followers_count:
                          tweetResult.core.user_results.result.legacy
                            ?.followers_count,
                      }
                    : null,
                });
              }
            }

            // Extract pagination cursor - check for cursor entries
            if (
              entry.entryId?.includes("cursor-bottom") ||
              entry.content?.cursorType === "Bottom"
            ) {
              nextCursor = entry.content?.value;
              // console.log(
              //   "🔄 Found cursor:",
              //   nextCursor?.substring(0, 20) + "..."
              // );
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Error extracting tweets:", error);
      console.error("Raw data structure keys:", Object.keys(data));
      if (data.data) console.error("data.data keys:", Object.keys(data.data));
      if (data.data?.user)
        console.error("data.data.user keys:", Object.keys(data.data.user));
      if (data.data?.user?.result)
        console.error(
          "data.data.user.result keys:",
          Object.keys(data.data.user.result)
        );
    }

    console.log(`🎯 Extracted ${tweets.length} tweets`);
    return { tweets, nextCursor };
  }

  // Fetch tweets for a specific user and cursor with retry logic for rate limiting
  async fetchTweets(userId, cursor = null, count = 20, retryCount = 0) {
    const maxRetries = 5;
    const baseDelay = 2000; // 2 seconds base delay
    
    const variables = {
      userId: userId,
      count: count,
      includePromotedContent: true,
      withQuickPromoteEligibilityTweetFields: true,
      withVoice: true,
    };

    if (cursor) {
      variables.cursor = cursor;
    }

    const url = new URL(this.baseUrl);
    url.searchParams.set("variables", JSON.stringify(variables));
    url.searchParams.set("features", JSON.stringify(this.features));
    url.searchParams.set("fieldToggles", JSON.stringify(this.fieldToggles));

    const headers = {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      authorization: `Bearer ${this.authToken}`,
      "content-type": "application/json",
      "x-csrf-token": this.csrfToken,
      "x-twitter-active-user": "yes",
      "x-twitter-auth-type": "OAuth2Session",
      "x-twitter-client-language": "en",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      referer: "https://x.com/",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    };

    try {
      console.log(
        `🚀 Fetching tweets for user ${userId}${
          cursor ? ` (cursor: ${cursor.substring(0, 20)}...)` : ""
        }${retryCount > 0 ? ` (retry ${retryCount}/${maxRetries})` : ""}`
      );

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: headers,
        credentials: "include",
      });

      if (response.status === 429) {
        // Rate limited - implement exponential backoff
        const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000; // Add jitter
        console.log(`⏳ Rate limited (429). Waiting ${Math.round(delay)}ms before retry ${retryCount + 1}/${maxRetries}...`);
        
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return await this.fetchTweets(userId, cursor, count, retryCount + 1);
        } else {
          console.error("❌ Max retries reached for rate limiting");
          return null;
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors) {
        console.error("API Errors:", data.errors);
        return null;
      }

      return this.extractTweetsFromResponse(data);
    } catch (error) {
      console.error("Error fetching tweets:", error);
      
      // If it's a network error and we haven't exceeded retries, try again
      if (retryCount < maxRetries && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;
        console.log(`🌐 Network error. Waiting ${Math.round(delay)}ms before retry ${retryCount + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return await this.fetchTweets(userId, cursor, count, retryCount + 1);
      }
      
      return null;
    }
  }

  // Fetch tweets until we reach the target count or run out of tweets
  async fetchAllTweets(userId, targetCount = 100, delayMs = 1000) { // Increased default delay to 1 second
    let allTweets = [];
    let cursor = null;
    let page = 0;
    let consecutiveEmptyPages = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 10; // Increased from 5
    const maxConsecutiveEmptyPages = 15; // Increased from 10

    console.log(`📊 Starting to fetch ${targetCount} tweets for user ID: ${userId}`);
    console.log(`🔧 Debug: Max consecutive empty pages: ${maxConsecutiveEmptyPages}`);
    console.log(`🔧 Debug: Max consecutive errors: ${maxConsecutiveErrors}`);
    console.log(`🔧 Debug: Tweets per page: 40`);
    console.log(`🔧 Debug: Expected pages for ${targetCount} tweets: ~${Math.ceil(targetCount / 40)}`);
    console.log(`🔧 Debug: Delay between requests: ${delayMs}ms`);

    while (allTweets.length < targetCount) {
      const result = await this.fetchTweets(userId, cursor, 40); // Fetch 40 tweets per page
      page++;

      if (!result) {
        console.log("❌ Error occurred during fetch");
        consecutiveErrors++;
        consecutiveEmptyPages++;
        
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.log("❌ Too many consecutive errors, stopping");
          break;
        }
        
        // Add extra delay after errors
        const errorDelay = delayMs * 2;
        console.log(`⏳ Error occurred, waiting ${errorDelay}ms before next attempt...`);
        await new Promise((resolve) => setTimeout(resolve, errorDelay));
        continue; // Skip the normal delay and try again
      } else if (result.tweets.length === 0) {
        console.log("❌ No more tweets found in this page");
        consecutiveEmptyPages++;
        consecutiveErrors = 0; // Reset error counter on successful response
        
        if (consecutiveEmptyPages >= maxConsecutiveEmptyPages) {
          console.log("✅ Reached end of available tweets (after many empty pages)");
          break;
        }
      } else {
        consecutiveEmptyPages = 0; // Reset error counter
        consecutiveErrors = 0; // Reset error counter
        allTweets.push(...result.tweets);
        cursor = result.nextCursor;
        
        console.log(
          `📄 Page ${page}: Found ${result.tweets.length} tweets (Total: ${allTweets.length}/${targetCount})`
        );

        // Check if we've reached our target
        if (allTweets.length >= targetCount) {
          console.log(`✅ Reached target of ${targetCount} tweets!`);
          break;
        }
      }

      if (!cursor) {
        console.log("✅ Reached end of timeline (no more cursor)");
        break;
      }

      // Safety check to prevent infinite loops (increased from 100 to 150 pages = 6000 tweets)
      if (page >= 150) {
        console.log("⚠️ Reached maximum page limit (150 pages), stopping");
        break;
      }

      // Rate limiting delay with jitter
      if (cursor) {
        const jitter = Math.random() * 500; // Add up to 500ms jitter
        const totalDelay = delayMs + jitter;
        console.log(`⏳ Waiting ${Math.round(totalDelay)}ms before next request...`);
        await new Promise((resolve) => setTimeout(resolve, totalDelay));
      }
    }

    // Remove duplicates and sort by date (oldest first)
    const uniqueTweets = allTweets.filter(
      (tweet, index, arr) => arr.findIndex((t) => t.id === tweet.id) === index
    );

    uniqueTweets.sort((a, b) => a.created_at - b.created_at);

    console.log(`🎯 Final result: ${uniqueTweets.length} unique tweets from ${page} pages`);
    return uniqueTweets;
  }

  // Get oldest tweets
  getOldestTweets(tweets, count = 10) {
    return tweets.slice(0, count);
  }

  // Get newest tweets
  getNewestTweets(tweets, count = 10) {
    return tweets.slice(-count).reverse();
  }

  // Search tweets by text
  searchTweets(tweets, searchTerm) {
    return tweets.filter((tweet) =>
      tweet.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Export tweets to JSON
  exportTweets(tweets, filename = "tweets.json") {
    const dataStr = JSON.stringify(tweets, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    console.log(`💾 Exported ${tweets.length} tweets to ${filename}`);
  }

  // Upload to S3 via API
  async uploadToS3(data, authToken, apiBase = 'http://api-extractor.aayushman.dev') {
    try {
      console.log('📤 [UPLOAD] Starting S3 upload process...');
      console.log('📤 [UPLOAD] API Base:', apiBase);
      console.log('📤 [UPLOAD] Auth token present:', !!authToken);
      console.log('📤 [UPLOAD] Data size:', JSON.stringify(data).length, 'bytes');
      
      // Send upload request via custom event to popup
      const response = await new Promise((resolve, reject) => {
        console.log('📤 [UPLOAD] Setting up response listener...');
        
        // Set up response listener for the custom event
        const handleResponse = (event) => {
          console.log('📤 [UPLOAD] Received response event:', event.detail);
          if (event.detail && event.detail.type === 'uploadResponse') {
            console.log('📤 [UPLOAD] Processing upload response...');
            document.removeEventListener('uploadResponse', handleResponse);
            if (event.detail.success) {
              console.log('📤 [UPLOAD] Upload response success:', event.detail);
              resolve(event.detail);
            } else {
              console.log('📤 [UPLOAD] Upload response error:', event.detail.error);
              reject(new Error(event.detail.error || 'Upload failed'));
            }
          }
        };
        
        document.addEventListener('uploadResponse', handleResponse);
        console.log('📤 [UPLOAD] Response listener attached');
        
        // Send upload request via custom event
        console.log('📤 [UPLOAD] Sending upload request via custom event...');
        document.dispatchEvent(new CustomEvent('uploadRequest', {
          detail: {
            type: 'uploadRequest',
            data: data,
            authToken: authToken
          }
        }));
        console.log('📤 [UPLOAD] Upload request sent via custom event');
        
        // Timeout after 60 seconds
        setTimeout(() => {
          console.log('📤 [UPLOAD] Upload timeout reached');
          document.removeEventListener('uploadResponse', handleResponse);
          reject(new Error('Upload timeout'));
        }, 60000);
      });
      
      console.log('✅ [UPLOAD] Upload successful:', response);
      return response;
      
    } catch (error) {
      console.error('❌ [UPLOAD] Upload error:', error);
      console.error('❌ [UPLOAD] Error details:', error.message);
      throw error;
    }
  }

  // Export tweets to JSON format
  async exportToJSON(tweets, username = "User", uploadToS3 = false, authToken = null, apiBase = 'http://api-extractor.aayushman.dev') {
    try {
      console.log('📝 Exporting tweets to JSON format...');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${username}_tweet_archive_${tweets.length}_${timestamp}.json`;
      
      // Prepare JSON data
      const jsonData = {
        metadata: {
          username: username,
          total_tweets: tweets.length,
          extracted_at: new Date().toISOString(),
          date_range: {
            oldest: tweets[tweets.length - 1]?.created_at?.toISOString(),
            newest: tweets[0]?.created_at?.toISOString()
          },
          total_engagement: {
            likes: tweets.reduce((sum, t) => sum + t.favorite_count, 0),
            retweets: tweets.reduce((sum, t) => sum + t.retweet_count, 0),
            replies: tweets.reduce((sum, t) => sum + (t.reply_count || 0), 0),
            views: tweets.reduce((sum, t) => sum + (t.view_count || 0), 0)
          }
        },
        tweets: tweets.map(tweet => ({
          id: tweet.id,
          text: tweet.text,
          created_at: tweet.created_at.toISOString(),
          retweet_count: tweet.retweet_count,
          favorite_count: tweet.favorite_count,
          reply_count: tweet.reply_count,
          view_count: tweet.view_count,
          quote_count: tweet.quote_count,
          bookmark_count: tweet.bookmark_count
        }))
      };
      
      if (uploadToS3 && authToken) {
        // Upload to S3
        console.log('☁️ Uploading JSON to S3...');
        const uploadResult = await this.uploadToS3(jsonData, authToken, apiBase);
        
        return {
          success: true,
          count: tweets.length,
          filename: filename,
          url: uploadResult.url,
          message: 'JSON archive uploaded to cloud storage'
        };
      } else {
        // Local download
        const jsonString = JSON.stringify(jsonData, null, 2);
        const dataBlob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        
        console.log(`📄 Generated JSON archive with ${tweets.length} tweets!`);
        
        return {
          success: true,
          count: tweets.length,
          filename: filename,
          message: 'JSON archive downloaded locally'
        };
      }
      
    } catch (error) {
      console.error('❌ Error exporting to JSON:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate and download HTML report (COMMENTED OUT - OLD FUNCTIONALITY)
  /*
  exportToHTML(tweets, username = "User") {
    const oldest = this.getOldestTweets(tweets, 20);
    const newest = this.getNewestTweets(tweets, 20);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tweet Archive - ${username}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px; 
            background: #15202b; 
            color: #fff;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding: 20px; 
            background: #1a2732; 
            border-radius: 12px;
        }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 15px; 
            margin: 20px 0;
        }
        .stat { 
            background: #253341; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center;
        }
        .stat-number { font-size: 24px; font-weight: bold; color: #1d9bf0; }
        .stat-label { font-size: 14px; color: #8b98a5; }
        .section { 
            margin: 30px 0; 
            background: #1a2732; 
            border-radius: 12px; 
            padding: 20px;
        }
        .section h2 { 
            color: #1d9bf0; 
            border-bottom: 2px solid #253341; 
            padding-bottom: 10px;
        }
        .tweet { 
            background: #253341; 
            border-radius: 8px; 
            padding: 15px; 
            margin: 15px 0; 
            border-left: 3px solid #1d9bf0;
        }
        .tweet-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 10px;
        }
        .tweet-date { 
            color: #8b98a5; 
            font-size: 14px;
        }
        .tweet-text { 
            margin: 10px 0; 
            line-height: 1.5;
        }
        .tweet-stats { 
            display: flex; 
            gap: 20px; 
            font-size: 14px; 
            color: #8b98a5; 
            margin-top: 10px;
        }
        .tweet-stat { 
            display: flex; 
            align-items: center; 
            gap: 5px;
        }
        .user-info { 
            color: #1d9bf0; 
            font-weight: bold;
        }
        .download-links { 
            text-align: center; 
            margin: 20px 0;
        }
        .download-btn { 
            background: #1d9bf0; 
            color: white; 
            padding: 10px 20px; 
            text-decoration: none; 
            border-radius: 20px; 
            margin: 0 10px; 
            display: inline-block;
            border: none;
            cursor: pointer;
            font-size: 14px;
        }
        .download-btn:hover {
            background: #1a8cd8;
        }
        .sorting-controls {
            background: #1a2732;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
        }
        .sorting-controls h3 {
            color: #1d9bf0;
            margin: 0 0 15px 0;
        }
        .control-row {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }
        .control-row label {
            color: #fff;
            font-size: 14px;
            font-weight: bold;
        }
        .sort-dropdown {
            background: #253341;
            color: white;
            border: 1px solid #1d9bf0;
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            min-width: 180px;
        }
        .sort-dropdown:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.5);
        }
        .search-box {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 8px;
            background: #253341;
            color: #fff;
            margin: 15px 0;
            font-size: 16px;
            box-sizing: border-box;
        }
        .search-box::placeholder {
            color: #8b98a5;
        }
        .search-box:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.5);
        }
        .hidden {
            display: none;
        }
        .tweet-count {
            color: #8b98a5;
            font-size: 14px;
            margin-bottom: 15px;
        }
        .timeline { 
            background: linear-gradient(to bottom, #1d9bf0 0%, #8b98a5 100%); 
            height: 200px; 
            border-radius: 8px; 
            position: relative; 
            margin: 20px 0;
        }
        .timeline-info { 
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%); 
            text-align: center; 
            background: rgba(0,0,0,0.8); 
            padding: 20px; 
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Tweet Archive for @${username}</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">${tweets.length}</div>
                    <div class="stat-label">Total Tweets</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${tweets
                      .reduce((sum, t) => sum + t.favorite_count, 0)
                      .toLocaleString()}</div>
                    <div class="stat-label">Total Likes</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${tweets
                      .reduce((sum, t) => sum + t.retweet_count, 0)
                      .toLocaleString()}</div>
                    <div class="stat-label">Total RTs</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${tweets
                      .reduce((sum, t) => sum + t.view_count, 0)
                      .toLocaleString()}</div>
                    <div class="stat-label">Total Views</div>
                </div>
            </div>

            <div class="timeline">
                <div class="timeline-info">
                    <strong>Timeline Span</strong><br>
                    ${oldest[0]?.created_at.toDateString()} → ${newest[0]?.created_at.toDateString()}
                </div>
            </div>
        </div>

        <div class="download-links">
            <button class="download-btn" onclick="downloadJSON()">📄 Download JSON</button>
            <button class="download-btn" onclick="downloadCSV()">📊 Download CSV</button>
        </div>

        <div class="sorting-controls">
            <h3>🔄 Sort & Filter Tweets</h3>
            <input type="text" class="search-box" id="searchBox" placeholder="Search tweets by text content...">
            <div class="control-row">
                <label for="sortDropdown">Sort by:</label>
                <select class="sort-dropdown" id="sortDropdown" onchange="sortTweets(this.value)">
                    <option value="newest">📅 Newest First</option>
                    <option value="oldest">⏰ Oldest First</option>
                    <option value="likes">❤️ Most Liked</option>
                    <option value="retweets">🔄 Most Retweeted</option>
                    <option value="views">👀 Most Viewed</option>
                    <option value="engagement">🚀 Most Engaging</option>
                </select>
            </div>
        </div>

        <div class="section">
            <h2 id="tweets-title">🐦 Tweets</h2>
            <div class="tweet-count" id="tweet-count">Showing ${tweets.length} tweets</div>
            <div id="tweets-container">
                ${tweets
                  .map(
                    (tweet, index) => `
                    <div class="tweet" data-index="${index}" data-date="${tweet.created_at.getTime()}" data-likes="${tweet.favorite_count}" data-retweets="${tweet.retweet_count}" data-views="${tweet.view_count || 0}" data-engagement="${(tweet.favorite_count + tweet.retweet_count + (tweet.reply_count || 0))}" data-text="${this.escapeHtml(tweet.text).toLowerCase()}">
                        <div class="tweet-header">
                            <div class="user-info">@${username}</div>
                            <div class="tweet-date">${tweet.created_at.toLocaleString()}</div>
                        </div>
                        <div class="tweet-text">${this.escapeHtml(tweet.text)}</div>
                        <div class="tweet-stats">
                            <div class="tweet-stat">👀 ${(tweet.view_count || 0).toLocaleString()}</div>
                            <div class="tweet-stat">❤️ ${tweet.favorite_count || 0}</div>
                            <div class="tweet-stat">🔄 ${tweet.retweet_count || 0}</div>
                            <div class="tweet-stat">💬 ${tweet.reply_count || 0}</div>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        </div>
    </div>

    <script>
        const tweetsData = ${JSON.stringify(tweets, null, 2)};
        let currentSort = 'newest';
        let currentSearchTerm = '';
        
        // Initialize search functionality
        document.getElementById('searchBox').addEventListener('input', function(e) {
            currentSearchTerm = e.target.value.toLowerCase();
            filterAndSortTweets();
        });
        
        // Sort tweets function
        function sortTweets(sortType) {
            currentSort = sortType;
            
            // Update dropdown selection
            document.getElementById('sortDropdown').value = sortType;
            
            filterAndSortTweets();
        }
        
        // Filter and sort tweets
        function filterAndSortTweets() {
            const container = document.getElementById('tweets-container');
            const tweets = Array.from(container.children);
            
            // Filter tweets based on search term
            let visibleTweets = tweets.filter(tweet => {
                const text = tweet.getAttribute('data-text');
                const isVisible = !currentSearchTerm || text.includes(currentSearchTerm);
                tweet.style.display = isVisible ? 'block' : 'none';
                return isVisible;
            });
            
            // Sort visible tweets
            visibleTweets.sort((a, b) => {
                switch(currentSort) {
                    case 'newest':
                        return parseInt(b.getAttribute('data-date')) - parseInt(a.getAttribute('data-date'));
                    case 'oldest':
                        return parseInt(a.getAttribute('data-date')) - parseInt(b.getAttribute('data-date'));
                    case 'likes':
                        return parseInt(b.getAttribute('data-likes')) - parseInt(a.getAttribute('data-likes'));
                    case 'retweets':
                        return parseInt(b.getAttribute('data-retweets')) - parseInt(a.getAttribute('data-retweets'));
                    case 'views':
                        return parseInt(b.getAttribute('data-views')) - parseInt(a.getAttribute('data-views'));
                    case 'engagement':
                        return parseInt(b.getAttribute('data-engagement')) - parseInt(a.getAttribute('data-engagement'));
                    default:
                        return 0;
                }
            });
            
            // Reorder tweets in the DOM
            visibleTweets.forEach(tweet => container.appendChild(tweet));
            
            // Update tweet count
            const count = visibleTweets.length;
            const totalCount = tweets.length;
            const countText = currentSearchTerm ? 
                \`Showing \${count} of \${totalCount} tweets (filtered)\` : 
                \`Showing \${count} tweets\`;
            document.getElementById('tweet-count').textContent = countText;
            
            // Keep title simple - no need to update based on sort
            document.getElementById('tweets-title').textContent = '🐦 Tweets';
        }
        
        function downloadJSON() {
            const dataStr = JSON.stringify(tweetsData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = '${username}_tweets.json';
            link.click();
            URL.revokeObjectURL(url);
        }
        
        function downloadCSV() {
            const headers = ['id', 'text', 'created_at', 'favorite_count', 'retweet_count', 'reply_count', 'view_count', 'user_screen_name'];
            const csvContent = [
                headers.join(','),
                ...tweetsData.map(tweet => [
                    tweet.id,
                    '"' + tweet.text.replace(/"/g, '""') + '"',
                    tweet.created_at,
                    tweet.favorite_count,
                    tweet.retweet_count,
                    tweet.reply_count,
                    tweet.view_count,
                    tweet.user?.screen_name || ''
                ].join(','))
            ].join('\\n');
            
            const dataBlob = new Blob([csvContent], {type: 'text/csv'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = '${username}_tweets.csv';
            link.click();
            URL.revokeObjectURL(url);
        }
        
        // Initialize with newest first sort
        document.addEventListener('DOMContentLoaded', function() {
            filterAndSortTweets();
        });
    </script>
</body>
</html>`;

    // Local download
    const dataBlob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${username}_tweet_archive.html`;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log(`🎨 Generated HTML archive with ${tweets.length} tweets!`);
  }
  */

  // Helper function to escape HTML
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Get current user ID from the page
  async getCurrentUserId() {
    try {
      // Extract username from URL
      const path = window.location.pathname;
      const usernameMatch = path.match(/^\/([^\/]+)/);
      if (usernameMatch) {
        const username = usernameMatch[1];
        console.log(`🔍 Found username from URL: ${username}`);
        
        // Method 1: Try to get user ID from page data
        const pageData = window.__INITIAL_STATE__;
        if (pageData && pageData.entities && pageData.entities.users) {
          const users = Object.values(pageData.entities.users);
          for (const user of users) {
            if (user.screen_name === username || user.screen_name?.toLowerCase() === username.toLowerCase()) {
              console.log(`✅ Found user ID for ${username}: ${user.id_str}`);
              return user.id_str;
            }
          }
        }
        
        // Method 2: Try to get from meta tags
        const metaUserId = document.querySelector('meta[name="user_id"]');
        if (metaUserId) {
          const userId = metaUserId.getAttribute('content');
          console.log(`✅ Found user ID from meta tag: ${userId}`);
          return userId;
        }
        
        // Method 3: Fetch user ID from API
        console.log(`🔍 Fetching user ID for ${username} from API...`);
        const userId = await this.fetchUserIdByScreenName(username);
        if (userId) {
          console.log(`✅ Found user ID from API: ${userId}`);
          return userId;
        }
      }
      
      console.warn("⚠️ Could not determine user ID from page");
      return null;
    } catch (error) {
      console.error("Error getting current user ID:", error);
      return null;
    }
  }

  // Fetch user ID by screen name using the UserByScreenName API
  async fetchUserIdByScreenName(screenName) {
    try {
      const variables = {
        screen_name: screenName,
        withGrokTranslatedBio: false
      };

      const features = {
        hidden_profile_subscriptions_enabled: true,
        payments_enabled: false,
        profile_label_improvements_pcf_label_in_post_enabled: true,
        rweb_tipjar_consumption_enabled: true,
        verified_phone_label_enabled: true,
        subscriptions_verification_info_is_identity_verified_enabled: true,
        subscriptions_verification_info_verified_since_enabled: true,
        highlights_tweets_tab_ui_enabled: true,
        responsive_web_twitter_article_notes_tab_enabled: true,
        subscriptions_feature_can_gift_premium: true,
        creator_subscriptions_tweet_preview_api_enabled: true,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
        responsive_web_graphql_timeline_navigation_enabled: true
      };

      const fieldToggles = {
        withAuxiliaryUserLabels: true
      };

      const url = new URL("https://x.com/i/api/graphql/IHyLL37gkgw1TgIXAL6Wlw/UserByScreenName");
      url.searchParams.set("variables", JSON.stringify(variables));
      url.searchParams.set("features", JSON.stringify(features));
      url.searchParams.set("fieldToggles", JSON.stringify(fieldToggles));

      const headers = {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        authorization: `Bearer ${this.authToken}`,
        "content-type": "application/json",
        "x-csrf-token": this.csrfToken,
        "x-twitter-active-user": "yes",
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-client-language": "en",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        referer: "https://x.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      };

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: headers,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors) {
        console.error("API Errors:", data.errors);
        return null;
      }

      const userId = data?.data?.user?.result?.rest_id;
      if (userId) {
        console.log(`✅ Successfully fetched user ID: ${userId} for @${screenName}`);
        return userId;
      } else {
        console.warn(`⚠️ No user ID found in API response for @${screenName}`);
        return null;
      }

    } catch (error) {
      console.error("Error fetching user ID by screen name:", error);
      return null;
    }
  }

  // Download tweets function that can be called from popup
  async downloadTweets(count = 100, uploadToS3 = false, authToken = null, apiBase = 'http://api-extractor.aayushman.dev') {
    try {
      console.log(`🚀 Starting download of ${count} tweets...`);
      
      // Get current user ID from the page
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        throw new Error("Could not determine current user ID. Please make sure you're on a valid Twitter/X profile page.");
      }
      
      const username = window.location.pathname.match(/^\/([^\/]+)/)?.[1] || 'unknown';
      
      // Fetch tweets until we reach the target count
      const tweets = await this.fetchAllTweets(currentUserId, count);
      
      if (!tweets || tweets.length === 0) {
        throw new Error("No tweets found");
      }
      
      // Limit to requested count (in case we got slightly more due to pagination)
      const limitedTweets = tweets.slice(0, count);
      
      console.log(`✅ Successfully fetched ${limitedTweets.length} tweets (requested: ${count})`);
      
      if (uploadToS3 && authToken) {
        // Export to JSON and upload to S3
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${username}_tweet_archive_${limitedTweets.length}_${timestamp}.json`;
        const result = await this.exportToJSON(limitedTweets, username, uploadToS3, authToken, apiBase);
        return result;
      } else {
        // Export to HTML file (local download)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${username}_tweet_archive_${limitedTweets.length}_${timestamp}.html`;
        this.exportToHTML(limitedTweets, username);
        
        return {
          success: true,
          count: limitedTweets.length,
          filename: filename,
          tweets: limitedTweets
        };
      }
      
    } catch (error) {
      console.error("❌ Error downloading tweets:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Comprehensive download method
  async downloadAllTweets(userId, username = null, maxPages = 20) {
    console.log("🚀 Starting comprehensive tweet download...");
    console.log(`📊 Will fetch up to ${maxPages} pages of tweets`);

    // Fetch all tweets
    const tweets = await this.fetchAllTweets(userId, maxPages, 2000); // 2s delay

    if (!tweets || tweets.length === 0) {
      console.error("❌ No tweets found!");
      return;
    }

    // Get username from first tweet if not provided
    const finalUsername = username || tweets[0]?.user?.screen_name || userId;

    console.log("📈 Download Summary:");
    console.log(`- Total tweets: ${tweets.length}`);
    console.log(
      `- Date range: ${tweets[0]?.created_at.toDateString()} to ${tweets[
        tweets.length - 1
      ]?.created_at.toDateString()}`
    );
    console.log(
      `- Total engagement: ${tweets
        .reduce((sum, t) => sum + t.favorite_count + t.retweet_count, 0)
        .toLocaleString()}`
    );

    // Generate and download HTML archive
    await this.exportToHTML(tweets, finalUsername);

    // Also save JSON backup
    setTimeout(() => {
      this.exportTweets(tweets, `${finalUsername}_tweets_backup.json`);
    }, 1000);

    console.log("✅ Download complete! Check your downloads folder.");
    return tweets;
  }
}

// Auto-extract tokens from current session
function extractTokensFromSession() {
  // Extract auth token from current page
  const authMatch = document.cookie.match(/auth_token=([^;]+)/);
  const csrfMatch = document.cookie.match(/ct0=([^;]+)/);

  return {
    authToken:
      "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA", // Bearer token from your request
    csrfToken: csrfMatch ? csrfMatch[1] : null,
  };
}

// Usage example
const tokens = extractTokensFromSession();
console.log("🔑 Extracted tokens:", tokens);

if (tokens.authToken && tokens.csrfToken) {
  const scraper = new XTweetScraper(tokens.authToken, tokens.csrfToken);

  // Make scraper globally available
  window.tweetScraper = scraper;

  console.log("🎉 Tweet scraper ready!");
  console.log("Usage examples:");
  console.log('- tweetScraper.downloadTweets(100) // Download 100 tweets from current profile');
  console.log('- tweetScraper.downloadAllTweets(userId, username, pages) // Manual download');
  console.log('- tweetScraper.fetchAllTweets(userId, pages) // Just fetch tweets');

  // Quick download function for current profile
  window.downloadTweets = async function (count = 100) {
    console.log(`🎯 Quick download: fetching ${count} tweets from current profile...`);
    return await scraper.downloadTweets(count);
  };

  // Quick test function
  window.testScraper = async function () {
    console.log("🧪 Testing scraper with current profile...");
    const currentUserId = await scraper.getCurrentUserId();
    if (!currentUserId) {
      console.log("❌ No user ID found for current page");
      return null;
    }
    const result = await scraper.fetchTweets(currentUserId);
    if (result) {
      console.log("✅ Test successful! Found:", result.tweets.length, "tweets");
      console.log("Sample tweet:", result.tweets[0]);
      return result;
    } else {
      console.log("❌ Test failed");
      return null;
    }
  };

  // Listen for download requests from extension popup
  document.addEventListener('startTweetDownload', async function(event) {
    console.log('🚀 Tweet Downloader: Starting tweet download...');
    console.log('📋 Event detail:', event.detail);
    
    const { count, uploadToS3, authToken } = event.detail;
    
    try {
      console.log('🔍 Starting download with count:', count, 'uploadToS3:', uploadToS3);
      const result = await scraper.downloadTweets(count, uploadToS3, authToken);
      
      console.log('📊 Download result:', result);
      
      if (result.success) {
        // Dispatch success result
        console.log('✅ Dispatching success result');
        document.dispatchEvent(new CustomEvent('downloadTweetsResult', {
          detail: result
        }));
      } else {
        throw new Error(result.error || 'Download failed');
      }
    } catch (error) {
      console.error('❌ Download error:', error);
      
      // Dispatch error result
      console.log('❌ Dispatching error result');
      document.dispatchEvent(new CustomEvent('downloadTweetsResult', {
        detail: {
          success: false,
          error: error.message
        }
      }));
    }
  });

} else {
  console.error("❌ Could not extract required tokens from session");
}

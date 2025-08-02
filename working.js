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

    console.log("🔍 Parsing response data...", data);

    try {
      // Based on your TypeScript interfaces, the correct path is:
      const instructions =
        data?.data?.user?.result?.timeline?.timeline?.instructions || [];
      console.log("📋 Found instructions:", instructions.length);

      for (const instruction of instructions) {
        console.log("📝 Processing instruction:", instruction.type);

        if (instruction.type === "TimelineAddEntries" && instruction.entries) {
          console.log("📦 Found entries:", instruction.entries.length);

          for (const entry of instruction.entries) {
            console.log(
              "🎯 Entry:",
              entry.entryId,
              "Type:",
              entry.content?.entryType
            );

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
                console.log(
                  "✅ Found tweet:",
                  tweet.id_str,
                  tweet.full_text?.substring(0, 50) + "..."
                );

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
              console.log(
                "🔄 Found cursor:",
                nextCursor?.substring(0, 20) + "..."
              );
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

  // Fetch tweets for a specific user and cursor
  async fetchTweets(userId, cursor = null, count = 20) {
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
        }`
      );

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

      return this.extractTweetsFromResponse(data);
    } catch (error) {
      console.error("Error fetching tweets:", error);
      return null;
    }
  }

  // Fetch all tweets for a user (with pagination)
  async fetchAllTweets(userId, maxPages = 10, delayMs = 1000) {
    let allTweets = [];
    let cursor = null;
    let page = 0;

    console.log(`📊 Starting to fetch tweets for user ID: ${userId}`);

    while (page < maxPages) {
      const result = await this.fetchTweets(userId, cursor, 40); // Increased count

      if (!result || result.tweets.length === 0) {
        console.log("❌ No more tweets found or error occurred");
        break;
      }

      allTweets.push(...result.tweets);
      cursor = result.nextCursor;
      page++;

      console.log(
        `📄 Page ${page}: Found ${result.tweets.length} tweets (Total: ${allTweets.length})`
      );

      if (!cursor) {
        console.log("✅ Reached end of timeline");
        break;
      }

      // Rate limiting delay
      if (page < maxPages && cursor) {
        console.log(`⏳ Waiting ${delayMs}ms before next request...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Remove duplicates and sort by date (oldest first)
    const uniqueTweets = allTweets.filter(
      (tweet, index, arr) => arr.findIndex((t) => t.id === tweet.id) === index
    );

    uniqueTweets.sort((a, b) => a.created_at - b.created_at);

    console.log(`🎯 Final result: ${uniqueTweets.length} unique tweets`);
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
  console.log(
    '- tweetScraper.fetchAllTweets("1663994484529717249", 5) // Fetch tweets for user'
  );
  console.log(
    "- tweetScraper.getOldestTweets(tweets, 10) // Get 10 oldest tweets (after fetching)"
  );
  console.log(
    "- tweetScraper.exportTweets(tweets) // Download as JSON (after fetching)"
  );

  // Quick test function
  window.testScraper = async function () {
    console.log("🧪 Testing scraper with one request...");
    const result = await scraper.fetchTweets("1663994484529717249");
    if (result) {
      console.log("✅ Test successful! Found:", result.tweets.length, "tweets");
      console.log("Sample tweet:", result.tweets[0]);
      return result;
    } else {
      console.log("❌ Test failed");
      return null;
    }
  };

  // Example usage for the user ID from your capture
  /*
  scraper.fetchAllTweets("1663994484529717249", 5).then(tweets => {
    console.log('📈 All tweets:', tweets);
    
    const oldest = scraper.getOldestTweets(tweets, 10);
    console.log('👴 Oldest 10 tweets:');
    oldest.forEach((tweet, i) => {
      console.log(`${i+1}. ${tweet.created_at.toDateString()}: ${tweet.text.substring(0, 100)}...`);
    });
    
    // Export to file
    scraper.exportTweets(tweets, 'user_tweets.json');
  });
  */
} else {
  console.error("❌ Could not extract required tokens from session");
}

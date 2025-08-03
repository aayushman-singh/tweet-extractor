// Download helper script that runs in the page context
window.handleTweetDownload = async function(count) {
  try {
    // Check if we're on Twitter/X
    if (!window.location.hostname.includes('x.com') && !window.location.hostname.includes('twitter.com')) {
      return {
        success: false,
        error: 'This feature only works on Twitter/X (x.com or twitter.com)'
      };
    }
    
    // Check if we're on a profile page
    const path = window.location.pathname;
    const profilePattern = /^\/[^\/]+(\/status\/\d+)?$/;
    if (!profilePattern.test(path)) {
      return {
        success: false,
        error: 'Please navigate to a Twitter/X profile page (e.g., x.com/username)'
      };
    }
    
    // Wait for tweetScraper to be available
    let attempts = 0;
    const maxAttempts = 20;
    
    while (!window.tweetScraper && attempts < maxAttempts) {
      console.log(`🔄 Waiting for tweetScraper to initialize... (attempt ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 250));
      attempts++;
    }
    
    if (!window.tweetScraper) {
      return {
        success: false,
        error: 'Tweet scraper not initialized. Please refresh the page and try again.'
      };
    }
    
    console.log('✅ TweetScraper found, calling downloadTweets...');
    
    // Call the downloadTweets method
    const result = await window.tweetScraper.downloadTweets(count);
    return result;
    
  } catch (error) {
    console.error('❌ Error in downloadTweets:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Listen for download requests
document.addEventListener('startTweetDownload', function(event) {
  if (event.detail && event.detail.count) {
    const count = event.detail.count;
    console.log('🚀 Helper script starting download for', count, 'tweets');
    
    window.handleTweetDownload(count).then(result => {
      console.log('📝 Helper script finished download, sending result back');
      document.dispatchEvent(new CustomEvent('downloadTweetsResult', {
        detail: {
          action: 'downloadTweetsResult',
          result: result
        }
      }));
    });
  }
}); 
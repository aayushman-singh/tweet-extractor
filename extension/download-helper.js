// Download helper script that runs in the page context
window.handleTweetDownload = async function(count, uploadToS3 = false, authToken = null) {
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
    
    // Call the downloadTweets method with S3 upload parameters
    const result = await window.tweetScraper.downloadTweets(count, uploadToS3, authToken);
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
let isDownloadInProgress = false;

document.addEventListener('startTweetDownload', function(event) {
  if (isDownloadInProgress) {
    console.log('⚠️ Download already in progress, ignoring duplicate request');
    return;
  }
  
  if (event.detail && event.detail.count) {
    const count = event.detail.count;
    const uploadToS3 = event.detail.uploadToS3 || false;
    const authToken = event.detail.authToken || null;
    
    console.log('🚀 Helper script starting download for', count, 'tweets, uploadToS3:', uploadToS3);
    isDownloadInProgress = true;
    
    window.handleTweetDownload(count, uploadToS3, authToken).then(result => {
      console.log('📝 Helper script finished download, sending result back');
      isDownloadInProgress = false;
      document.dispatchEvent(new CustomEvent('downloadTweetsResult', {
        detail: {
          action: 'downloadTweetsResult',
          result: result
        }
      }));
    }).catch(error => {
      console.error('❌ Download error:', error);
      isDownloadInProgress = false;
      document.dispatchEvent(new CustomEvent('downloadTweetsResult', {
        detail: {
          action: 'downloadTweetsResult',
          result: {
            success: false,
            error: error.message
          }
        }
      }));
    });
  }
}); 
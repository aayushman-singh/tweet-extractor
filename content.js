// Content script that runs in the context of web pages
let isDownloading = false;

// Listen for custom events from the popup
document.addEventListener('requestTweetDownload', function(event) {
  if (event.detail && event.detail.count && !isDownloading) {
    console.log('📥 Content script received download request for', event.detail.count, 'tweets');
    isDownloading = true;
    
    // Trigger the download using the injected helper script
    document.dispatchEvent(new CustomEvent('startTweetDownload', {
      detail: { count: event.detail.count }
    }));
  }
});

// Listen for download completion from helper script
document.addEventListener('downloadTweetsResult', function(event) {
  console.log('✅ Content script received download result');
  isDownloading = false;
  
  // Forward the result back to the popup
  document.dispatchEvent(new CustomEvent('tweetDownloadComplete', {
    detail: event.detail
  }));
});

// Check if current page is a profile page
function isProfilePage() {
  const path = window.location.pathname;
  // Profile pages have format like /username or /username/status/123456789
  const profilePattern = /^\/[^\/]+(\/status\/\d+)?$/;
  return profilePattern.test(path);
}

// Inject the working.js script for tweet scraping functionality
function injectWorkingScript() {
  // Only inject on Twitter/X pages
  if (window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com')) {
    console.log('🐦 Tweet Downloader: Injecting scraper script...');
    
    // Check if script is already injected
    if (document.querySelector('script[src*="working.js"]')) {
      console.log('✅ Working.js script already injected');
    } else {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('working.js');
      script.onload = function() {
        console.log('✅ Working.js script loaded successfully');
      };
      script.onerror = function() {
        console.error('❌ Failed to load working.js script');
      };
      document.head.appendChild(script);
    }
    
    // Also inject the download helper script
    if (document.querySelector('script[src*="download-helper.js"]')) {
      console.log('✅ Download helper script already injected');
    } else {
      const helperScript = document.createElement('script');
      helperScript.src = chrome.runtime.getURL('download-helper.js');
      helperScript.onload = function() {
        console.log('✅ Download helper script loaded successfully');
      };
      helperScript.onerror = function() {
        console.error('❌ Failed to load download helper script');
      };
      document.head.appendChild(helperScript);
    }
  }
}

// Inject the script immediately when the content script loads
injectWorkingScript();

// Also inject when the page changes (for SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('🔄 URL changed, checking if scraper needs to be injected...');
    if ((window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com')) && !window.tweetScraper) {
      setTimeout(injectWorkingScript, 1000); // Small delay to ensure page is loaded
    }
  }
}).observe(document, { subtree: true, childList: true }); 
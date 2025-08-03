// Content script that runs in the context of web pages
let isDownloading = false;

// Listen for tweet extraction requests from the popup (new event name)
document.addEventListener('startTweetExtraction', function(event) {
  if (event.detail && event.detail.count && !isDownloading) {
    console.log('📥 Content script received extraction request for', event.detail.count, 'tweets');
    isDownloading = true;
    
    // Check if S3 upload is requested
    if (event.detail.uploadToS3 && event.detail.authToken) {
      console.log('☁️ S3 upload requested with auth token');
      // Trigger the extraction with S3 upload using the injected helper script
      document.dispatchEvent(new CustomEvent('startTweetDownload', {
        detail: { 
          count: event.detail.count,
          uploadToS3: true,
          authToken: event.detail.authToken
        }
      }));
    } else {
      // Trigger the download using the injected helper script (legacy event name)
      document.dispatchEvent(new CustomEvent('startTweetDownload', {
        detail: { count: event.detail.count }
      }));
    }
  } else if (isDownloading) {
    console.log('⚠️ Download already in progress, ignoring duplicate request');
  }
});

// Listen for extraction completion from helper script (new event name)
document.addEventListener('extractionResult', function(event) {
  console.log('✅ Content script received extraction result');
  isDownloading = false;
  
  // Forward the result back to the popup
  document.dispatchEvent(new CustomEvent('tweetExtractionComplete', {
    detail: {
      action: 'extractionResult',
      result: event.detail
    }
  }));
});

// Legacy support for old download events (backward compatibility)
document.addEventListener('requestTweetDownload', function(event) {
  if (event.detail && event.detail.count && !isDownloading) {
    console.log('📥 Content script received legacy download request for', event.detail.count, 'tweets');
    isDownloading = true;
    
    // Trigger the download using the injected helper script
    document.dispatchEvent(new CustomEvent('startTweetDownload', {
      detail: { count: event.detail.count }
    }));
  }
});

document.addEventListener('downloadTweetsResult', function(event) {
  console.log('✅ Content script received legacy download result');
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

// Handle S3 upload requests from injected scripts
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'uploadRequest') {
    console.log('📤 [CONTENT] Received upload request from injected script');
    console.log('📤 [CONTENT] Request data size:', JSON.stringify(event.data.data).length, 'bytes');
    console.log('📤 [CONTENT] Auth token present:', !!event.data.authToken);
    
    // Forward the upload request to the background script
    console.log('📤 [CONTENT] Forwarding to background script...');
    chrome.runtime.sendMessage({
      action: 'uploadToAPI',
      data: event.data.data,
      authToken: event.data.authToken
    }, function(response) {
      console.log('📤 [CONTENT] Background script response received:', response);
      
      if (response && response.success) {
        console.log('📤 [CONTENT] Upload successful, sending response back');
      } else {
        console.log('📤 [CONTENT] Upload failed, sending error back:', response?.error);
      }
      
      // Send the response back to the injected script
      window.postMessage({
        type: 'uploadResponse',
        success: response ? response.success : false,
        url: response ? response.url : null,
        filename: response ? response.filename : null,
        error: response ? response.error : 'No response from background script'
      }, '*');
      console.log('📤 [CONTENT] Response sent back to injected script');
    });
  }
});

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
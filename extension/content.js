// Content script that runs in the context of web pages
let isExtracting = false;

// Listen for tweet extraction requests from the popup
document.addEventListener('requestTweetExtraction', function(event) {
  if (event.detail && event.detail.count && !isExtracting) {
    console.log('📥 Content script received extraction request for', event.detail.count, 'tweets');
    isExtracting = true;
    
    // Trigger the extraction using the injected helper script
    document.dispatchEvent(new CustomEvent('startTweetExtraction', {
      detail: { 
        count: event.detail.count,
        authToken: event.detail.authToken,
        apiBase: event.detail.apiBase
      }
    }));
  }
});

// Listen for extraction completion from helper script
document.addEventListener('extractionResult', function(event) {
  console.log('✅ Content script received extraction result');
  isExtracting = false;
  
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
  if (event.detail && event.detail.count && !isExtracting) {
    console.log('📥 Content script received legacy download request for', event.detail.count, 'tweets');
    isExtracting = true;
    
    // Trigger the download using the injected helper script
    document.dispatchEvent(new CustomEvent('startTweetDownload', {
      detail: { count: event.detail.count }
    }));
  }
});

document.addEventListener('downloadTweetsResult', function(event) {
  console.log('✅ Content script received legacy download result');
  isExtracting = false;
  
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

// Inject the JSON extractor script for tweet extraction functionality
function injectExtractorScript() {
  // Only inject on Twitter/X pages
  if (window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com')) {
    console.log('🗂️ X Archive Extractor: Injecting JSON extractor script...');
    
    // Check if JSON extractor script is already injected
    if (document.querySelector('script[src*="json-extractor.js"]')) {
      console.log('✅ JSON extractor script already injected');
    } else {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('json-extractor.js');
      script.onload = function() {
        console.log('✅ JSON extractor script loaded successfully');
      };
      script.onerror = function() {
        console.error('❌ Failed to load JSON extractor script');
      };
      document.head.appendChild(script);
    }
    
    // Legacy support: Also inject old scripts for backward compatibility
    if (!document.querySelector('script[src*="working.js"]')) {
      const legacyScript = document.createElement('script');
      legacyScript.src = chrome.runtime.getURL('working.js');
      legacyScript.onload = function() {
        console.log('✅ Legacy working.js script loaded');
      };
      legacyScript.onerror = function() {
        console.warn('⚠️ Legacy working.js script not found (optional)');
      };
      document.head.appendChild(legacyScript);
    }
    
    if (!document.querySelector('script[src*="download-helper.js"]')) {
      const helperScript = document.createElement('script');
      helperScript.src = chrome.runtime.getURL('download-helper.js');
      helperScript.onload = function() {
        console.log('✅ Legacy download helper script loaded');
      };
      helperScript.onerror = function() {
        console.warn('⚠️ Legacy download helper script not found (optional)');
      };
      document.head.appendChild(helperScript);
    }
  }
}

// Inject the script immediately when the content script loads
injectExtractorScript();

// Also inject when the page changes (for SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('🔄 URL changed, checking if extractor needs to be injected...');
    if (window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com')) {
      setTimeout(injectExtractorScript, 1000); // Small delay to ensure page is loaded
    }
  }
}).observe(document, { subtree: true, childList: true }); 
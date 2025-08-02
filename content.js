// Content script that runs in the context of web pages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'executeScript') {
    try {
      // Create a function from the script string
      const scriptFunction = new Function(request.script);
      
      // Execute the script in the page context
      const result = scriptFunction();
      
      // Send the result back
      sendResponse({
        success: true,
        data: result
      });
    } catch (error) {
      // Send error back
      sendResponse({
        success: false,
        error: error.message
      });
    }
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

// Inject a small helper script to make the extension more robust
const helperScript = `
// Helper functions that can be used in scripts
window.jsScriptRunnerHelpers = {
  // Wait for an element to appear
  waitForElement: function(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver((mutations) => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error('Element not found within timeout'));
      }, timeout);
    });
  },
  
  // Scroll to bottom of page
  scrollToBottom: function() {
    return new Promise((resolve) => {
      const scrollHeight = document.documentElement.scrollHeight;
      window.scrollTo(0, scrollHeight);
      setTimeout(resolve, 1000);
    });
  },
  
  // Get all text content
  getAllText: function() {
    return document.body.innerText || document.body.textContent || '';
  },
  
  // Get page metadata
  getPageMetadata: function() {
    const meta = {};
    document.querySelectorAll('meta').forEach(tag => {
      const name = tag.getAttribute('name') || tag.getAttribute('property');
      const content = tag.getAttribute('content');
      if (name && content) {
        meta[name] = content;
      }
    });
    return meta;
  }
};
`;

// Inject the helper script
const script = document.createElement('script');
script.textContent = helperScript;
document.head.appendChild(script);
script.remove(); 
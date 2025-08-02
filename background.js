// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('JS Script Runner extension installed');
});

// Handle any background tasks if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle any background messages here
  return true;
}); 
// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('🐦 Tweet Downloader extension installed');
});

// Handle any background tasks if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle any background messages here
  return true;
});

// S3 Upload functionality (re-added)
async function handleAPIUpload(data, authToken) {
  try {
    console.log('📤 Uploading to S3 via API...');
    
    const response = await fetch('https://extractor.aayushman.dev/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        data: data,
        filename: data.filename || 'tweet_archive.json',
        contentType: 'application/json'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Upload successful:', result);
      return {
        success: true,
        url: result.url,
        filename: result.filename
      };
    } else {
      console.error('❌ Upload failed:', result);
      return {
        success: false,
        error: result.error || 'Upload failed'
      };
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Handle upload requests from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'uploadToAPI') {
    console.log('📤 Received upload request from content script');
    
    handleAPIUpload(request.data, request.authToken)
      .then(result => {
        console.log('📤 Upload completed:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('❌ Upload error:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });
    
    return true; // Keep message channel open for async response
  }
  
  // Handle any other background messages here
  return true;
}); 
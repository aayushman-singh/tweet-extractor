// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('🐦 Tweet Downloader extension installed');
});

// S3 Upload functionality
async function handleAPIUpload(data, authToken) {
  try {
    console.log('📤 [BACKGROUND] Starting API upload...');
    console.log('📤 [BACKGROUND] Data type:', typeof data);
    console.log('📤 [BACKGROUND] Data size:', JSON.stringify(data).length, 'bytes');
    console.log('📤 [BACKGROUND] Auth token present:', !!authToken);
    
    const requestBody = {
      content: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      filename: data.filename || 'tweet_archive.json',
      contentType: 'application/json'
    };
    
    console.log('📤 [BACKGROUND] Request body prepared, size:', JSON.stringify(requestBody).length, 'bytes');
    console.log('📤 [BACKGROUND] Making fetch request to API...');
    
            const response = await fetch('http://api-extractor.aayushman.dev/api/upload-to-s3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📤 [BACKGROUND] API response status:', response.status);
    console.log('📤 [BACKGROUND] API response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('📤 [BACKGROUND] API response body:', result);
    
    if (response.ok) {
      console.log('✅ [BACKGROUND] Upload successful:', result);
      return {
        success: true,
        url: result.url,
        filename: result.filename
      };
    } else {
      console.error('❌ [BACKGROUND] Upload failed:', result);
      return {
        success: false,
        error: result.error || 'Upload failed'
      };
    }
  } catch (error) {
    console.error('❌ [BACKGROUND] Upload error:', error);
    console.error('❌ [BACKGROUND] Error details:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Handle all background messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'uploadToAPI') {
    console.log('📤 [BACKGROUND] Received upload request from content script');
    console.log('📤 [BACKGROUND] Request data size:', JSON.stringify(request.data).length, 'bytes');
    console.log('📤 [BACKGROUND] Auth token present:', !!request.authToken);
    
    handleAPIUpload(request.data, request.authToken)
      .then(result => {
        console.log('📤 [BACKGROUND] Upload completed:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('❌ [BACKGROUND] Upload error:', error);
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
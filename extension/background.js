// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('🗂️ X Archive Extractor extension installed');
});

// Handle API uploads to bypass CSP restrictions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'uploadToAPI') {
    handleAPIUpload(request.data)
      .then(result => {
        sendResponse({ success: true, ...result });
      })
      .catch(error => {
        console.error('❌ Background upload error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
  
  return false;
});

async function handleAPIUpload(data) {
  try {
    const { content, contentType, authToken, apiBase } = data;
    
    console.log('🔌 Background: Uploading to API...');
    
    const response = await fetch(`${apiBase}/api/upload-to-s3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        content: content,
        contentType: contentType
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Upload failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Background: Upload successful:', result);
    
    return {
      url: result.url,
      filename: result.filename
    };

  } catch (error) {
    console.error('❌ Background: Upload error:', error);
    throw error;
  }
} 
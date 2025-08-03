// Show status message
function showStatus(message, type = 'success') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  
  // Clear status after 5 seconds for success/error, keep info messages
  if (type !== 'info') {
    setTimeout(() => {
      status.textContent = 'Navigate to a Twitter/X profile page to download tweets';
      status.className = 'status info';
    }, 5000);
  }
}

// Download tweets functionality
async function downloadTweets() {
  const tweetCountSelect = document.getElementById('tweetCount');
  const customTweetCountInput = document.getElementById('customTweetCount');
  const downloadBtn = document.getElementById('downloadTweetsBtn');
  
  // Get the selected count
  let count;
  if (tweetCountSelect.value === 'custom') {
    count = parseInt(customTweetCountInput.value);
    if (!count || count < 1 || count > 50000) {
      showStatus('Please enter a valid number between 1 and 50000', 'error');
      return;
    }
  } else {
    count = parseInt(tweetCountSelect.value);
  }
  
  try {
    // Disable button and show loading
    downloadBtn.disabled = true;
    downloadBtn.textContent = '⏳ Downloading...';
    showStatus(`Starting download of ${count} tweets as HTML archive...`, 'info');
    
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Execute script in the page to trigger download
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (tweetCount) => {
        // Send message to content script
        document.dispatchEvent(new CustomEvent('requestTweetDownload', {
          detail: { count: tweetCount }
        }));
        
        // Return a promise that will be resolved when we get the result
        return new Promise((resolve) => {
          const handleResult = (event) => {
            if (event.detail && event.detail.action === 'downloadTweetsResult') {
              document.removeEventListener('tweetDownloadComplete', handleResult);
              resolve(event.detail.result);
            }
          };
          document.addEventListener('tweetDownloadComplete', handleResult);
          
          // Timeout after 30 seconds
          setTimeout(() => {
            document.removeEventListener('tweetDownloadComplete', handleResult);
            resolve({
              success: false,
              error: 'Download timed out'
            });
          }, 30000);
        });
      },
      args: [count]
    });
    
    const result = results[0].result;
    
    if (result.success) {
      showStatus(`✅ Successfully downloaded ${result.count} tweets as HTML archive!`, 'success');
    } else {
      showStatus(`❌ Error: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`❌ Error: ${error.message}`, 'error');
  } finally {
    // Re-enable button
    downloadBtn.disabled = false;
    downloadBtn.textContent = '📥 Download HTML Archive';
  }
}

// Handle custom tweet count input visibility
function handleTweetCountChange() {
  const tweetCountSelect = document.getElementById('tweetCount');
  const customTweetCountInput = document.getElementById('customTweetCount');
  
  if (tweetCountSelect.value === 'custom') {
    customTweetCountInput.style.display = 'block';
    customTweetCountInput.focus();
  } else {
    customTweetCountInput.style.display = 'none';
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('downloadTweetsBtn').addEventListener('click', downloadTweets);
  document.getElementById('tweetCount').addEventListener('change', handleTweetCountChange);
}); 
// 🌐 API Configuration
const API_BASE = "http://api-extractor.aayushman.dev";

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  API_BASE: 'apiBase',
  EXTRACTION_STATUS: 'extractionStatus',
  EXTRACTION_START_TIME: 'extractionStartTime'
};

// Show status message
function showStatus(message, type = 'success') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  
  // Clear status after 5 seconds for success/error, keep info messages
  if (type !== 'info') {
    setTimeout(() => {
      updateStatusMessage();
    }, 5000);
  }
}

// Save extraction state
function saveExtractionState(status, count = null) {
  chrome.storage.local.set({
    [STORAGE_KEYS.EXTRACTION_STATUS]: status,
    [STORAGE_KEYS.EXTRACTION_START_TIME]: status === 'extracting' ? Date.now() : null
  });
}

// Clear extraction state
function clearExtractionState() {
  chrome.storage.local.remove([STORAGE_KEYS.EXTRACTION_STATUS, STORAGE_KEYS.EXTRACTION_START_TIME]);
}

// Manual reset function for stuck extractions
function resetExtractionState() {
  clearExtractionState();
  const downloadBtn = document.getElementById('extractTweetsBtn');
  if (downloadBtn) {
    downloadBtn.disabled = false;
    downloadBtn.textContent = '📥 Extract to JSON Archive';
  }
  showStatus('Extraction state reset. Ready to extract tweets.', 'info');
}

// Update status message based on current state
function updateStatusMessage() {
  const status = document.getElementById('status');
  
  // Check if user is logged in and extraction status
  chrome.storage.local.get([
    STORAGE_KEYS.AUTH_TOKEN, 
    STORAGE_KEYS.USER_DATA, 
    STORAGE_KEYS.EXTRACTION_STATUS,
    STORAGE_KEYS.EXTRACTION_START_TIME
  ], (result) => {
    if (result.extractionStatus === 'extracting') {
      // Show extraction in progress
      const elapsed = result.extractionStartTime ? Math.floor((Date.now() - result.extractionStartTime) / 1000) : 0;
      status.textContent = `⏳ Extraction in progress... (${elapsed}s elapsed)`;
      status.className = 'status info';
      
      // Update button state
      const downloadBtn = document.getElementById('downloadBtn');
      if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.textContent = '⏳ Extracting...';
      }
    } else if (result.authToken && result.userData) {
      // User is logged in - show ready message
      status.textContent = `Welcome back! Ready to extract tweets for ${result.userData.email}`;
      status.className = 'status success';
      
      // Reset button state
      const downloadBtn = document.getElementById('downloadBtn');
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.textContent = '📥 Extract to JSON Archive';
      }
    } else {
      // User is not logged in - show login message
      status.textContent = 'Please login to extract and upload tweets to cloud storage';
      status.className = 'status info';
    }
  });
}

// Authentication functions
async function login(email, password) {
  try {
    console.log(`🔄 Attempting login with API: ${API_BASE}`);
    
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailOrPhone: email,
        password: password
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Server error' }));
      showStatus(`❌ ${data.error || 'Login failed'}`, 'error');
      return false;
    }

    const data = await response.json();

    // Store token and user data
    await chrome.storage.local.set({
      [STORAGE_KEYS.AUTH_TOKEN]: data.token,
      [STORAGE_KEYS.USER_DATA]: data.user,
      [STORAGE_KEYS.API_BASE]: API_BASE
    });
    
    showStatus('✅ Login successful!', 'success');
    updateUI();
    return true;

  } catch (error) {
    console.error(`❌ Login error:`, error);
    
    if (error.message.includes('Failed to fetch')) {
      showStatus('❌ Cannot connect to server. Please check if the API is running.', 'error');
    } else {
      showStatus(`❌ Login failed: ${error.message}`, 'error');
    }
    return false;
  }
}

async function signup(email, phone, password) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        phone: phone || null,
        password: password
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Store token and user data
      await chrome.storage.local.set({
        [STORAGE_KEYS.AUTH_TOKEN]: data.token,
        [STORAGE_KEYS.USER_DATA]: data.user
      });
      
      showStatus('✅ Account created successfully!', 'success');
      updateUI();
      return true;
    } else {
      showStatus(`❌ ${data.error}`, 'error');
      return false;
    }
  } catch (error) {
    showStatus(`❌ Signup failed: ${error.message}`, 'error');
    return false;
  }
}

async function logout() {
  await chrome.storage.local.clear();
  updateUI();
  showStatus('👋 Logged out successfully', 'info');
}

// Update UI based on authentication state
function updateUI() {
  chrome.storage.local.get([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_DATA], (result) => {
    const authSection = document.getElementById('authSection');
    const userSection = document.getElementById('userSection');
    const extractionSection = document.getElementById('extractionSection');
    const userEmail = document.getElementById('userEmail');

    if (result.authToken && result.userData) {
      // User is logged in - show user info and extraction section
      authSection.classList.add('hidden');
      userSection.classList.remove('hidden');
      extractionSection.classList.remove('hidden');
      userEmail.textContent = result.userData.email;
    } else {
      // User is not logged in - show auth section only
      authSection.classList.remove('hidden');
      userSection.classList.add('hidden');
      extractionSection.classList.add('hidden'); // Hide extraction section without auth
    }
    
    // Update status message based on authentication state
    updateStatusMessage();
  });
}

// Download tweets functionality (reverted to working local download)
async function downloadTweets() {
  const tweetCountSelect = document.getElementById('tweetCount');
  const customTweetCountInput = document.getElementById('customTweetCount');
  const downloadBtn = document.getElementById('extractTweetsBtn');
  
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
  
  // Check authentication for S3 upload
  const { authToken } = await chrome.storage.local.get(['authToken']);
  if (!authToken) {
    showStatus('Please login to extract and upload tweets to cloud storage', 'error');
    return;
  }
  
  // Validate count is a valid number
  if (!count || isNaN(count) || count < 1 || count > 50000) {
    showStatus('Please enter a valid number between 1 and 50000', 'error');
    return;
  }
  
  // Ensure authToken is a string
  if (typeof authToken !== 'string') {
    showStatus('Authentication token is invalid. Please login again.', 'error');
    return;
  }
  
  try {
    // Save extraction state
    saveExtractionState('extracting', count);
    
    // Disable button and show loading
    downloadBtn.disabled = true;
    downloadBtn.textContent = '⏳ Extracting...';
    showStatus(`Starting extraction of ${count} tweets as JSON archive... This may take several minutes for large extractions.`, 'info');
    
    // Set up periodic status updates to show the process is still running
    const statusInterval = setInterval(() => {
      showStatus(`Extracting ${count} tweets... Still working, please wait.`, 'info');
    }, 15000); // Update every 15 seconds
    
    // Set up periodic elapsed time updates
    const elapsedInterval = setInterval(() => {
      updateStatusMessage(); // This will update the elapsed time
    }, 1000); // Update every second
    
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Debug logging
    console.log('🔍 Debug - Arguments being passed:', { count, authToken: authToken ? '***' : 'undefined', tabId: tab.id });
    
    // Execute script in the page to trigger extraction with S3 upload
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['working.js']
    });
    
    // Inject a bridge script to handle upload requests
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Set up upload request handler
        document.addEventListener('uploadRequest', async (event) => {
          if (event.detail && event.detail.type === 'uploadRequest') {
            console.log('📤 [BRIDGE] Received upload request from working.js');
            
            try {
              // Forward the request to the popup via chrome.runtime.sendMessage
              const response = await chrome.runtime.sendMessage({
                action: 'uploadToAPI',
                data: event.detail.data,
                authToken: event.detail.authToken
              });
              
              console.log('📤 [BRIDGE] Received response from background:', response);
              
              // Send response back to working.js via custom event
              document.dispatchEvent(new CustomEvent('uploadResponse', {
                detail: {
                  type: 'uploadResponse',
                  success: response.success,
                  url: response.url,
                  filename: response.filename,
                  error: response.error
                }
              }));
              
            } catch (error) {
              console.error('❌ [BRIDGE] Error handling upload request:', error);
              
              // Send error response back to working.js
              document.dispatchEvent(new CustomEvent('uploadResponse', {
                detail: {
                  type: 'uploadResponse',
                  success: false,
                  error: error.message || 'Upload failed'
                }
              }));
            }
          }
        });
        
        console.log('📤 [BRIDGE] Upload request handler set up');
      }
    });
    
    // Now execute the extraction logic
    const extractionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (tweetCount, authToken) => {
        // Return a promise that will be resolved when we get the result
        return new Promise((resolve) => {
          const handleResult = (event) => {
            if (event.detail && event.detail.success !== undefined) {
              document.removeEventListener('downloadTweetsResult', handleResult);
              resolve(event.detail);
            }
          };
          document.addEventListener('downloadTweetsResult', handleResult);
          
          // Wait for the script to initialize
          const checkScraper = () => {
            if (window.tweetScraper) {
              console.log('🎯 Triggering extraction...');
              // Trigger the extraction using the event system
              document.dispatchEvent(new CustomEvent('startTweetDownload', {
                detail: { 
                  count: tweetCount,
                  uploadToS3: true,
                  authToken: authToken
                }
              }));
            } else {
              console.log('⏳ Waiting for scraper to initialize...');
              setTimeout(checkScraper, 500);
            }
          };
          
          // Start checking for scraper
          setTimeout(checkScraper, 1000);
          
          // Timeout after 30 seconds
          setTimeout(() => {
            document.removeEventListener('downloadTweetsResult', handleResult);
            resolve({
              success: false,
              error: 'Extraction timed out'
            });
          }, 30000);
        });
      },
      args: [count, authToken]
    });
    
    const result = extractionResults[0].result;
    
    if (result.success) {
      clearInterval(statusInterval);
      clearInterval(elapsedInterval);
      clearExtractionState();
      showStatus(`✅ Successfully extracted ${result.count} tweets and uploaded to cloud storage!`, 'success');
    } else {
      clearInterval(statusInterval);
      clearInterval(elapsedInterval);
      clearExtractionState();
      showStatus(`❌ Error: ${result.error}`, 'error');
    }
  } catch (error) {
    clearInterval(statusInterval);
    clearInterval(elapsedInterval);
    clearExtractionState();
    showStatus(`❌ Error: ${error.message}`, 'error');
  } finally {
    // Re-enable button
    downloadBtn.disabled = false;
    downloadBtn.textContent = '📥 Extract to JSON Archive';
  }
}

// OLD LOCAL DOWNLOAD FUNCTION (COMMENTED OUT)
/*
async function downloadTweets() {
  const tweetCountSelect = document.getElementById('tweetCount');
  const customTweetCountInput = document.getElementById('customTweetCount');
  const downloadBtn = document.getElementById('extractTweetsBtn');
  
  // Get the selected count
  let count;
  if (tweetCountSelect.value === 'custom') {
    count = parseInt(customTweetCountInput.value);
    if (!count || count < 1 || count > 50000) {
      showStatus('Please enter a valid number between 1 and 50000', 'error');
      return;
    }
  } else {
    count = parseInt(customTweetCountSelect.value);
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
        // Send message to content script using new event name
        document.dispatchEvent(new CustomEvent('startTweetExtraction', {
          detail: { count: tweetCount }
        }));
        
        // Return a promise that will be resolved when we get the result
        return new Promise((resolve) => {
          const handleResult = (event) => {
            if (event.detail && event.detail.action === 'extractionResult') {
              document.removeEventListener('tweetExtractionComplete', handleResult);
              resolve(event.detail.result);
            }
          };
          document.addEventListener('tweetExtractionComplete', handleResult);
          
          // Timeout after 30 seconds
          setTimeout(() => {
            document.removeEventListener('tweetExtractionComplete', handleResult);
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
*/

// Handle custom tweet count input visibility
function handleTweetCountChange() {
  const tweetCountSelect = document.getElementById('tweetCount');
  const customInputGroup = document.getElementById('customInputGroup');
  
  if (tweetCountSelect.value === 'custom') {
    customInputGroup.style.display = 'block';
    document.getElementById('customTweetCount').focus();
  } else {
    customInputGroup.style.display = 'none';
  }
}

// Toggle between login and signup forms
function showSignupForm() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('signupForm').classList.remove('hidden');
}

function showLoginForm() {
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Initialize UI
  updateUI();
  
  // Check for ongoing extraction and restore state
  chrome.storage.local.get([STORAGE_KEYS.EXTRACTION_STATUS, STORAGE_KEYS.EXTRACTION_START_TIME], (result) => {
    if (result.extractionStatus === 'extracting') {
      // Check if extraction has been running for more than 10 minutes (likely stuck)
      const elapsed = result.extractionStartTime ? (Date.now() - result.extractionStartTime) / 1000 / 60 : 0;
      if (elapsed > 10) {
        console.log('⚠️ Extraction appears to be stuck, clearing state...');
        clearExtractionState();
        showStatus('Previous extraction may have completed. Please try again if needed.', 'info');
      } else {
        console.log('🔄 Restoring extraction state...');
        updateStatusMessage(); // This will show the extraction in progress
      }
    }
  });

  // Authentication event listeners
  document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      showStatus('Please fill in all fields', 'error');
      return;
    }
    
    await login(email, password);
  });

  document.getElementById('signupBtn').addEventListener('click', async () => {
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;
    
    if (!email || !password) {
      showStatus('Email and password are required', 'error');
      return;
    }
    
    if (password.length < 8) {
      showStatus('Password must be at least 8 characters', 'error');
      return;
    }
    
    await signup(email, phone, password);
  });

  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('showSignupBtn').addEventListener('click', showSignupForm);
  document.getElementById('showLoginBtn').addEventListener('click', showLoginForm);

  // Download event listeners
  document.getElementById('extractTweetsBtn').addEventListener('click', downloadTweets);
  document.getElementById('resetBtn').addEventListener('click', resetExtractionState);
  document.getElementById('tweetCount').addEventListener('change', handleTweetCountChange);

  // Handle Enter key in forms
  document.getElementById('loginEmail').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
  });
  document.getElementById('loginPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
  });
  document.getElementById('signupPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('signupBtn').click();
  });
}); 
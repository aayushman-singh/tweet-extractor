// API Configuration
// This will be set based on the environment
// For production: https://extractor.aayushman.dev
// For EC2: http://172.31.24.102 (or your API_BASE_URL)
const API_BASE = 'http://13.203.72.69'; // Update this to match your API_BASE_URL
// Fallback for local development
const LOCAL_API_BASE = 'http://localhost:8000';

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  API_BASE: 'apiBase'
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

// Update status message based on current state
function updateStatusMessage() {
  const status = document.getElementById('status');
  status.textContent = 'Please login to extract and upload tweets to cloud storage';
  status.className = 'status info';
}

// Authentication functions
async function login(email, password) {
  // Try main API first, then fallback to local if available
  const apiUrls = [API_BASE, LOCAL_API_BASE];
  
  for (let i = 0; i < apiUrls.length; i++) {
    const currentApiBase = apiUrls[i];
    
    try {
      console.log(`🔄 Attempting login with API: ${currentApiBase}`);
      
      const response = await fetch(`${currentApiBase}/api/auth/login`, {
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
        // If it's a 404 and we have more APIs to try, continue
        if (response.status === 404 && i < apiUrls.length - 1) {
          console.log(`📡 API ${currentApiBase} returned 404, trying next...`);
          continue;
        }
        
        const data = await response.json().catch(() => ({ error: 'Server error' }));
        showStatus(`❌ ${data.error || 'Login failed'}`, 'error');
        return false;
      }

      const data = await response.json();

      // Store token and user data
      await chrome.storage.local.set({
        [STORAGE_KEYS.AUTH_TOKEN]: data.token,
        [STORAGE_KEYS.USER_DATA]: data.user,
        [STORAGE_KEYS.API_BASE]: currentApiBase // Store which API worked
      });
      
      showStatus('✅ Login successful!', 'success');
      updateUI();
      return true;

    } catch (error) {
      console.error(`❌ Login error with ${currentApiBase}:`, error);
      
      // If this is the last API to try, show the error
      if (i === apiUrls.length - 1) {
        if (error.message.includes('Failed to fetch')) {
          showStatus('❌ Cannot connect to server. Please check if the API is running or try local development mode.', 'error');
        } else {
          showStatus(`❌ Login failed: ${error.message}`, 'error');
        }
        return false;
      }
    }
  }
  
  return false;
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
    // Disable button and show loading
    downloadBtn.disabled = true;
    downloadBtn.textContent = '⏳ Extracting...';
    showStatus(`Starting extraction of ${count} tweets as JSON archive...`, 'info');
    
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Debug logging
    console.log('🔍 Debug - Arguments being passed:', { count, authToken: authToken ? '***' : 'undefined', tabId: tab.id });
    
    // Execute script in the page to trigger extraction with S3 upload
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (tweetCount, authToken) => {
        // Send message to content script using new event name
        document.dispatchEvent(new CustomEvent('startTweetExtraction', {
          detail: { 
            count: tweetCount,
            authToken: authToken,
            uploadToS3: true
          }
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
              error: 'Extraction timed out'
            });
          }, 30000);
        });
      },
      args: [count, authToken]
    });
    
    const result = results[0].result;
    
    if (result.success) {
      showStatus(`✅ Successfully extracted ${result.count} tweets and uploaded to cloud storage!`, 'success');
    } else {
      showStatus(`❌ Error: ${result.error}`, 'error');
    }
  } catch (error) {
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
  const customTweetCountInput = document.getElementById('customTweetCount');
  
  if (tweetCountSelect.value === 'custom') {
    customTweetCountInput.style.display = 'block';
    customTweetCountInput.focus();
  } else {
    customTweetCountInput.style.display = 'none';
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
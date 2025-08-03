// API Configuration
const API_BASE = 'https://extractor.aayushman.dev';

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData'
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
  chrome.storage.local.get([STORAGE_KEYS.AUTH_TOKEN], (result) => {
    if (result.authToken) {
      status.textContent = 'Navigate to a Twitter/X profile page to extract tweets';
      status.className = 'status info';
    } else {
      status.textContent = 'Please login to start extracting tweets';
      status.className = 'status info';
    }
  });
}

// Authentication functions
async function login(email, password) {
  try {
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

    const data = await response.json();

    if (response.ok) {
      // Store token and user data
      await chrome.storage.local.set({
        [STORAGE_KEYS.AUTH_TOKEN]: data.token,
        [STORAGE_KEYS.USER_DATA]: data.user
      });
      
      showStatus('✅ Login successful!', 'success');
      updateUI();
      return true;
    } else {
      showStatus(`❌ ${data.error}`, 'error');
      return false;
    }
  } catch (error) {
    showStatus(`❌ Login failed: ${error.message}`, 'error');
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
      // User is logged in
      authSection.classList.add('hidden');
      userSection.classList.remove('hidden');
      extractionSection.classList.remove('hidden');
      userEmail.textContent = result.userData.email;
    } else {
      // User is not logged in
      authSection.classList.remove('hidden');
      userSection.classList.add('hidden');
      extractionSection.classList.add('hidden');
    }
    
    updateStatusMessage();
  });
}

// Extract tweets functionality
async function extractTweets() {
  const tweetCountSelect = document.getElementById('tweetCount');
  const customTweetCountInput = document.getElementById('customTweetCount');
  const extractBtn = document.getElementById('extractTweetsBtn');
  
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
    // Get auth token
    const result = await chrome.storage.local.get([STORAGE_KEYS.AUTH_TOKEN]);
    if (!result.authToken) {
      showStatus('❌ Please login first', 'error');
      updateUI();
      return;
    }

    // Disable button and show loading
    extractBtn.disabled = true;
    extractBtn.textContent = '⏳ Extracting...';
    showStatus(`Starting extraction of ${count} tweets to JSON...`, 'info');
    
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Execute script in the page to trigger extraction
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (tweetCount, authToken, apiBase) => {
        // Send message to content script with auth token
        document.dispatchEvent(new CustomEvent('requestTweetExtraction', {
          detail: { 
            count: tweetCount, 
            authToken: authToken,
            apiBase: apiBase
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
          
          // Timeout after 60 seconds
          setTimeout(() => {
            document.removeEventListener('tweetExtractionComplete', handleResult);
            resolve({
              success: false,
              error: 'Extraction timed out'
            });
          }, 60000);
        });
      },
      args: [count, result.authToken, API_BASE]
    });
    
    const extractionResult = results[0].result;
    
    if (extractionResult.success) {
      showStatus(`✅ Successfully extracted and uploaded ${extractionResult.count} tweets! Check your dashboard.`, 'success');
    } else {
      showStatus(`❌ Error: ${extractionResult.error}`, 'error');
    }
  } catch (error) {
    showStatus(`❌ Error: ${error.message}`, 'error');
  } finally {
    // Re-enable button
    extractBtn.disabled = false;
    extractBtn.textContent = '📤 Extract to JSON Archive';
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

  // Extraction event listeners
  document.getElementById('extractTweetsBtn').addEventListener('click', extractTweets);
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
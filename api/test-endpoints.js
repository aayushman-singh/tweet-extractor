#!/usr/bin/env node

/**
 * 🧪 API Endpoint Testing Script
 * Tests all API endpoints to ensure they're working correctly
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  phone: '+1234567890'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https://') ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Tester/1.0',
        ...options.headers
      },
      timeout: 10000
    };
    
    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            body: data,
            json: null
          };
          
          if (res.headers['content-type']?.includes('application/json')) {
            result.json = JSON.parse(data);
          }
          
          resolve(result);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            json: null,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, options = {}) {
  log(`\n🔍 Testing: ${name}`, 'cyan');
  log(`   URL: ${url}`, 'blue');
  
  try {
    const response = await makeRequest(url, options);
    
    if (response.status >= 200 && response.status < 300) {
      log(`   ✅ Status: ${response.status}`, 'green');
    } else if (response.status >= 400 && response.status < 500) {
      log(`   ⚠️  Status: ${response.status} (Client Error - Expected for some tests)`, 'yellow');
    } else {
      log(`   ❌ Status: ${response.status}`, 'red');
    }
    
    if (response.json) {
      log(`   📄 Response: ${JSON.stringify(response.json, null, 2)}`, 'blue');
    } else if (response.body && response.body.length < 200) {
      log(`   📄 Response: ${response.body}`, 'blue');
    }
    
    return response;
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    return { error: error.message };
  }
}

async function runTests() {
  log('🚀 API Endpoint Testing Suite', 'bright');
  log('==============================', 'bright');
  log(`Testing API at: ${API_BASE}`, 'cyan');
  
  let authToken = null;
  
  // Test 1: Health Check
  await testEndpoint('Health Check', `${API_BASE}/health`);
  
  // Test 2: API Status
  await testEndpoint('API Status', `${API_BASE}/api/status`);
  
  // Test 3: Register (should create user or return existing)
  const registerResponse = await testEndpoint('User Registration', `${API_BASE}/api/auth/register`, {
    method: 'POST',
    body: {
      email: TEST_USER.email,
      phone: TEST_USER.phone,
      password: TEST_USER.password
    }
  });
  
  // Test 4: Login
  const loginResponse = await testEndpoint('User Login', `${API_BASE}/api/auth/login`, {
    method: 'POST',
    body: {
      emailOrPhone: TEST_USER.email,
      password: TEST_USER.password
    }
  });
  
  if (loginResponse.json && loginResponse.json.token) {
    authToken = loginResponse.json.token;
    log(`   🔑 Auth token received: ${authToken.substring(0, 20)}...`, 'green');
  }
  
  // Test 5: Profile (with auth)
  if (authToken) {
    await testEndpoint('User Profile', `${API_BASE}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  } else {
    log('   ⚠️  Skipping profile test - no auth token', 'yellow');
  }
  
  // Test 6: Upload endpoint (should fail without data, but test availability)
  await testEndpoint('Upload Endpoint', `${API_BASE}/api/upload`, {
    method: 'POST',
    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
    body: {
      data: { test: 'data' },
      filename: 'test.json'
    }
  });
  
  // Test 7: Non-existent endpoint (should return 404)
  await testEndpoint('404 Test', `${API_BASE}/api/nonexistent`);
  
  // Test 8: CORS test (OPTIONS request)
  await testEndpoint('CORS Preflight', `${API_BASE}/api/auth/login`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'chrome-extension://test',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  });
  
  log('\n🏁 Testing Complete!', 'bright');
  log('===================', 'bright');
  
  // Summary
  log('\n📊 Summary:', 'cyan');
  log('- Health and status endpoints should return 200', 'blue');
  log('- Auth endpoints should return 200/201 for valid requests', 'blue');
  log('- 401 responses are expected for unauthorized requests', 'blue');
  log('- 404 response is expected for non-existent endpoints', 'blue');
  log('- CORS headers should be present in responses', 'blue');
  
  log('\n💡 Next Steps:', 'yellow');
  log('1. Update environment variables if needed', 'yellow');
  log('2. Test with your Chrome extension', 'yellow');
  log('3. Monitor PM2 logs: pm2 logs tweet-extractor-api', 'yellow');
  log('4. Check server resources: pm2 monit', 'yellow');
}

// Error handling
process.on('uncaughtException', (error) => {
  log(`❌ Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection at:`, 'red');
  console.log(promise);
  log(`Reason: ${reason}`, 'red');
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, makeRequest };
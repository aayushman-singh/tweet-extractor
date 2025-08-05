// 🌐 Frontend Configuration
// Update this file to change the API endpoint

// API Base URL Configuration
// For production: https://your-api-domain.com
// For local development: http://localhost:8000

window.API_BASE_URL = 'https://your-api-domain.com'; // Production API URL

// Alternative: Use environment detection
// if (window.location.hostname === 'localhost') {
//     window.API_BASE_URL = 'http://localhost:8000';
// } else {
//     window.API_BASE_URL = 'https://your-api-domain.com';
// }

console.log('🔧 Frontend configured with API_BASE_URL:', window.API_BASE_URL); 
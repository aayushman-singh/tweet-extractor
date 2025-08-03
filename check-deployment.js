#!/usr/bin/env node

/**
 * 🔍 API Deployment Checker
 * This script checks if the API is properly deployed and accessible
 */

const https = require('https');
const http = require('http');

const API_BASE = 'extractor.aayushman.dev';
const ENDPOINTS_TO_TEST = [
    '/',
    '/api/auth/login',
    '/api/auth/register',
    '/api/upload'
];

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https://') ? https : http;
        const request = protocol.request(url, options, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                resolve({
                    status: response.statusCode,
                    headers: response.headers,
                    body: data
                });
            });
        });
        
        request.on('error', reject);
        request.setTimeout(10000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (options.body) {
            request.write(options.body);
        }
        request.end();
    });
}

async function checkEndpoint(endpoint) {
    const url = `https://${API_BASE}${endpoint}`;
    console.log(`\n🔍 Testing: ${url}`);
    
    try {
        const response = await makeRequest(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'API-Checker/1.0'
            }
        });
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`📡 Response: ${response.body.substring(0, 100)}...`);
        
        return { endpoint, status: response.status, success: true };
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return { endpoint, error: error.message, success: false };
    }
}

async function testLoginEndpoint() {
    const url = `https://${API_BASE}/api/auth/login`;
    console.log(`\n🔐 Testing Login POST: ${url}`);
    
    try {
        const response = await makeRequest(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'API-Checker/1.0'
            },
            body: JSON.stringify({
                emailOrPhone: 'test@example.com',
                password: 'testpassword'
            })
        });
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`📡 Response: ${response.body}`);
        
        return { success: true, status: response.status };
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function checkDNS() {
    console.log(`\n🌐 Checking DNS for ${API_BASE}...`);
    
    const dns = require('dns');
    return new Promise((resolve) => {
        dns.lookup(API_BASE, (err, address, family) => {
            if (err) {
                console.log(`❌ DNS Error: ${err.message}`);
                resolve({ success: false, error: err.message });
            } else {
                console.log(`✅ DNS Resolution: ${address} (IPv${family})`);
                resolve({ success: true, address, family });
            }
        });
    });
}

async function main() {
    console.log('🚀 API Deployment Checker');
    console.log('==========================');
    
    // Check DNS first
    await checkDNS();
    
    // Check basic endpoints
    for (const endpoint of ENDPOINTS_TO_TEST) {
        await checkEndpoint(endpoint);
    }
    
    // Test login specifically
    await testLoginEndpoint();
    
    console.log('\n📋 Summary:');
    console.log('If you see 404 errors, the API might not be deployed correctly.');
    console.log('If you see DNS errors, the domain might not be configured properly.');
    console.log('If you see connection errors, the server might be down.');
    
    console.log('\n💡 Solutions:');
    console.log('1. Check Vercel deployment status');
    console.log('2. Verify domain DNS settings');
    console.log('3. Use local development mode (see start-local-api.md)');
    console.log('4. Check if the API code is properly deployed');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { checkEndpoint, testLoginEndpoint, checkDNS };
#!/usr/bin/env node

/**
 * Test Registration Endpoint
 * Run with: node test-registration.js
 */

const fetch = require('node-fetch');

const API_BASE = process.env.API_BASE || 'https://api-extractor.aayushman.dev';

async function testRegistration() {
    console.log('🧪 Testing Registration Endpoint');
    console.log('================================');
    console.log(`API Base: ${API_BASE}`);
    console.log('');

    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

    console.log(`📧 Test Email: ${testEmail}`);
    console.log(`🔑 Test Password: ${testPassword}`);
    console.log('');

    try {
        console.log('⏳ Sending registration request...');
        const startTime = Date.now();

        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`⏱️ Response time: ${duration}ms`);
        console.log(`📊 Status: ${response.status}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Registration successful!');
            console.log('📋 Response data:', {
                success: data.success,
                message: data.message,
                hasToken: !!data.token,
                userEmail: data.user?.email
            });
        } else {
            const errorData = await response.json();
            console.log('❌ Registration failed!');
            console.log('📋 Error data:', errorData);
        }

    } catch (error) {
        console.log('❌ Request failed!');
        console.log('📋 Error:', error.message);
    }
}

// Run the test
testRegistration().catch(console.error);

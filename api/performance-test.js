#!/usr/bin/env node

/**
 * Performance Test Script for Registration Endpoint
 * Run with: node performance-test.js
 */

const fetch = require('node-fetch');

const API_BASE = process.env.API_BASE || 'http://localhost:8000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

async function testRegistrationPerformance() {
    console.log('🚀 Starting Registration Performance Test');
    console.log('==========================================');
    console.log(`API Base: ${API_BASE}`);
    console.log('');

    const results = [];
    const numTests = 5;

    for (let i = 0; i < numTests; i++) {
        const testEmail = `test${Date.now()}_${i}@example.com`;
        
        console.log(`📊 Test ${i + 1}/${numTests}: ${testEmail}`);
        
        const startTime = Date.now();
        
        try {
            const response = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: testEmail,
                    password: TEST_PASSWORD
                })
            });

            const endTime = Date.now();
            const duration = endTime - startTime;
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Success: ${duration}ms`);
                results.push({ success: true, duration, status: response.status });
            } else {
                const errorData = await response.json();
                console.log(`❌ Failed: ${duration}ms - ${errorData.error || 'Unknown error'}`);
                results.push({ success: false, duration, status: response.status, error: errorData.error });
            }
        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            console.log(`❌ Error: ${duration}ms - ${error.message}`);
            results.push({ success: false, duration, error: error.message });
        }
        
        // Wait 1 second between tests
        if (i < numTests - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Calculate statistics
    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);
    
    if (successfulTests.length > 0) {
        const durations = successfulTests.map(r => r.duration);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);
        
        console.log('');
        console.log('📈 Performance Results:');
        console.log('=======================');
        console.log(`✅ Successful tests: ${successfulTests.length}/${numTests}`);
        console.log(`❌ Failed tests: ${failedTests.length}/${numTests}`);
        console.log(`⏱️ Average duration: ${avgDuration.toFixed(2)}ms`);
        console.log(`⚡ Fastest: ${minDuration}ms`);
        console.log(`🐌 Slowest: ${maxDuration}ms`);
        
        if (failedTests.length > 0) {
            console.log('');
            console.log('❌ Failed Tests:');
            failedTests.forEach((test, index) => {
                console.log(`  ${index + 1}. ${test.duration}ms - ${test.error || 'Unknown error'}`);
            });
        }
    } else {
        console.log('');
        console.log('❌ All tests failed!');
    }
}

// Run the test
testRegistrationPerformance().catch(console.error);

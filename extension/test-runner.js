// 🏃‍♂️ Simple Test Runner for GraphQL API Limits
// Easy-to-use functions for testing API behavior

// Quick test with exponential backoff
window.testWithBackoff = async (count = 20, maxRetries = 3) => {
  console.log(`🧪 Testing with ${count} tweets, max ${maxRetries} retries`);
  
  const currentUserId = await window.tweetScraper.getCurrentUserId();
  if (!currentUserId) {
    console.error('❌ No user ID found');
    return;
  }

  const startTime = Date.now();
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      console.log(`🔍 Attempt ${attempt + 1}/${maxRetries}`);
      const result = await window.tweetScraper.fetchTweets(currentUserId, null, count);
      
      if (result && result.tweets && result.tweets.length > 0) {
        const duration = Date.now() - startTime;
        console.log(`✅ Success! Got ${result.tweets.length} tweets in ${duration}ms`);
        return { success: true, tweets: result.tweets.length, duration, attempt: attempt + 1 };
      }
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    attempt++;
  }

  console.error(`❌ All ${maxRetries} attempts failed`);
  return { success: false, error: lastError?.message, attempt: maxRetries };
};

// Test rate limiting by making rapid requests
window.testRateLimiting = async (requestCount = 10, delay = 100) => {
  console.log(`🧪 Testing rate limiting with ${requestCount} rapid requests`);
  
  const currentUserId = await window.tweetScraper.getCurrentUserId();
  if (!currentUserId) {
    console.error('❌ No user ID found');
    return;
  }

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < requestCount; i++) {
    console.log(`📤 Request ${i + 1}/${requestCount}`);
    
    try {
      const result = await window.tweetScraper.fetchTweets(currentUserId, null, 20);
      results.push({
        request: i + 1,
        success: true,
        tweets: result?.tweets?.length || 0,
        timestamp: Date.now() - startTime
      });
    } catch (error) {
      results.push({
        request: i + 1,
        success: false,
        error: error.message,
        timestamp: Date.now() - startTime
      });
    }

    if (i < requestCount - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`📊 Results: ${successCount}/${requestCount} successful`);
  
  return {
    totalRequests: requestCount,
    successfulRequests: successCount,
    successRate: successCount / requestCount,
    results
  };
};

// Test different tweet counts to find optimal values
window.testTweetCounts = async () => {
  console.log('🧪 Testing different tweet counts...');
  
  const counts = [10, 20, 40, 60, 80, 100];
  const results = [];

  for (const count of counts) {
    console.log(`\n📊 Testing count: ${count}`);
    const result = await window.testWithBackoff(count, 2);
    results.push({ count, ...result });
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n📋 Tweet count test results:');
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${r.count} tweets: ${r.success ? `${r.tweets} tweets in ${r.duration}ms` : r.error}`);
  });

  return results;
};

// Test concurrent requests
window.testConcurrent = async (concurrency = 3) => {
  console.log(`🧪 Testing ${concurrency} concurrent requests...`);
  
  const currentUserId = await window.tweetScraper.getCurrentUserId();
  if (!currentUserId) {
    console.error('❌ No user ID found');
    return;
  }

  const promises = [];
  const startTime = Date.now();

  for (let i = 0; i < concurrency; i++) {
    promises.push(
      window.tweetScraper.fetchTweets(currentUserId, null, 20)
        .then(result => ({
          request: i + 1,
          success: true,
          tweets: result?.tweets?.length || 0
        }))
        .catch(error => ({
          request: i + 1,
          success: false,
          error: error.message
        }))
    );
  }

  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;

  console.log(`📊 Concurrent test results: ${successCount}/${concurrency} successful in ${duration}ms`);
  
  return {
    concurrency,
    duration,
    successCount,
    successRate: successCount / concurrency,
    results
  };
};

// Monitor API behavior over time
window.monitorAPI = async (duration = 60000, interval = 5000) => {
  console.log(`🧪 Monitoring API for ${duration/1000}s with ${interval}ms intervals...`);
  
  const startTime = Date.now();
  const results = [];
  let requestCount = 0;

  const intervalId = setInterval(async () => {
    requestCount++;
    const elapsed = Date.now() - startTime;
    
    console.log(`📊 Monitor request ${requestCount} (${elapsed}ms elapsed)`);
    
    try {
      const result = await window.testWithBackoff(20, 1);
      results.push({
        request: requestCount,
        timestamp: elapsed,
        ...result
      });
    } catch (error) {
      results.push({
        request: requestCount,
        timestamp: elapsed,
        success: false,
        error: error.message
      });
    }
  }, interval);

  // Stop monitoring after duration
  setTimeout(() => {
    clearInterval(intervalId);
    console.log('✅ Monitoring complete!');
    
    const successCount = results.filter(r => r.success).length;
    console.log(`📊 Final results: ${successCount}/${results.length} successful`);
    
    // Calculate average response time
    const successfulRequests = results.filter(r => r.success);
    const avgResponseTime = successfulRequests.length > 0 
      ? successfulRequests.reduce((sum, r) => sum + r.duration, 0) / successfulRequests.length
      : 0;
    
    console.log(`📊 Average response time: ${Math.round(avgResponseTime)}ms`);
  }, duration);

  return { startTime, intervalId, results };
};

// Quick diagnostic
window.quickDiagnostic = async () => {
  console.log('🔍 Running quick diagnostic...');
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // Test 1: Basic functionality
  console.log('\n📊 Test 1: Basic functionality');
  diagnostic.tests.basic = await window.testWithBackoff(20, 2);

  // Test 2: Rate limiting
  console.log('\n📊 Test 2: Rate limiting');
  diagnostic.tests.rateLimiting = await window.testRateLimiting(5, 500);

  // Test 3: Concurrent requests
  console.log('\n📊 Test 3: Concurrent requests');
  diagnostic.tests.concurrent = await window.testConcurrent(2);

  console.log('\n📋 Diagnostic complete!');
  console.log(JSON.stringify(diagnostic, null, 2));
  
  return diagnostic;
};

console.log('🏃‍♂️ Test Runner loaded!');
console.log('Available functions:');
console.log('- testWithBackoff(count, retries) - Test with exponential backoff');
console.log('- testRateLimiting(count, delay) - Test rate limiting');
console.log('- testTweetCounts() - Test different tweet counts');
console.log('- testConcurrent(concurrency) - Test concurrent requests');
console.log('- monitorAPI(duration, interval) - Monitor API over time');
console.log('- quickDiagnostic() - Run all tests quickly'); 
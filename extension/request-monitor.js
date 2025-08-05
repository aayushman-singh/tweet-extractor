// 🔍 Request Monitor for UserTweets API
// Monitors scrolling and logs UserTweets requests for analysis

class RequestMonitor {
  constructor() {
    this.requestLog = [];
    this.scrollCount = 0;
    this.maxRequests = 200; // Stop after 200 requests
    this.isMonitoring = false;
    this.scrollInterval = null;
    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    
    // Request tracking
    this.requestCount = 0;
    this.startTime = Date.now();
    
    console.log('🔍 Request Monitor initialized');
    console.log('📊 Will monitor until', this.maxRequests, 'requests are logged');
  }

  // Start monitoring
  start() {
    if (this.isMonitoring) {
      console.log('⚠️ Already monitoring');
      return;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();
    console.log('🚀 Starting request monitoring...');

    // Intercept fetch requests
    this.interceptFetch();
    
    // Intercept XMLHttpRequest
    this.interceptXHR();
    
    // Start auto-scrolling
    this.startAutoScroll();
    
    // Set up periodic logging
    this.setupPeriodicLogging();
  }

  // Stop monitoring
  stop() {
    if (!this.isMonitoring) {
      console.log('⚠️ Not currently monitoring');
      return;
    }

    this.isMonitoring = false;
    console.log('⏹️ Stopping request monitoring...');

    // Stop auto-scrolling
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }

    // Restore original methods
    window.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;

    // Final log
    this.logFinalReport();
  }

  // Intercept fetch requests
  interceptFetch() {
    const self = this;
    window.fetch = async function(...args) {
      const url = args[0];
      const startTime = Date.now();
      
      try {
        const response = await self.originalFetch.apply(this, args);
        const endTime = Date.now();
        
        // Check if it's a UserTweets request
        if (typeof url === 'string' && url.includes('UserTweets')) {
          self.logRequest({
            type: 'fetch',
            url: url,
            method: 'GET',
            status: response.status,
            statusText: response.statusText,
            duration: endTime - startTime,
            timestamp: new Date().toISOString(),
            scrollCount: self.scrollCount
          });
        }
        
        return response;
      } catch (error) {
        const endTime = Date.now();
        
        if (typeof url === 'string' && url.includes('UserTweets')) {
          self.logRequest({
            type: 'fetch',
            url: url,
            method: 'GET',
            status: 'ERROR',
            statusText: error.message,
            duration: endTime - startTime,
            timestamp: new Date().toISOString(),
            scrollCount: self.scrollCount,
            error: true
          });
        }
        
        throw error;
      }
    };
  }

  // Intercept XMLHttpRequest
  interceptXHR() {
    const self = this;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._monitorUrl = url;
      this._monitorMethod = method;
      this._monitorStartTime = Date.now();
      return self.originalXHROpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      const xhr = this;
      const originalOnReadyStateChange = xhr.onreadystatechange;
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          const endTime = Date.now();
          
          // Check if it's a UserTweets request
          if (xhr._monitorUrl && xhr._monitorUrl.includes('UserTweets')) {
            self.logRequest({
              type: 'xhr',
              url: xhr._monitorUrl,
              method: xhr._monitorMethod,
              status: xhr.status,
              statusText: xhr.statusText,
              duration: endTime - xhr._monitorStartTime,
              timestamp: new Date().toISOString(),
              scrollCount: self.scrollCount
            });
          }
        }
        
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.apply(xhr);
        }
      };
      
      return self.originalXHRSend.apply(this, args);
    };
  }

  // Log a request
  logRequest(requestData) {
    this.requestCount++;
    this.requestLog.push(requestData);
    
    // Log to console with emoji indicators
    const status = requestData.status;
    let emoji = '📡';
    if (status === 429) emoji = '🚫';
    else if (status >= 400) emoji = '❌';
    else if (status === 200) emoji = '✅';
    
    console.log(`${emoji} Request #${this.requestCount}/${this.maxRequests}: ${requestData.method} ${requestData.url.split('?')[0]} - ${status} (${requestData.duration}ms) - Scroll #${requestData.scrollCount}`);
    
    // Log rate limiting info
    if (status === 429) {
      console.log('🚫 RATE LIMITED! Waiting before next request...');
    }
    
    // Check if we've reached the request limit
    if (this.requestCount >= this.maxRequests) {
      console.log(`🎯 Reached ${this.maxRequests} requests! Stopping monitoring...`);
      this.stop();
    }
  }

  // Start auto-scrolling
  startAutoScroll() {
    this.scrollInterval = setInterval(() => {
      if (!this.isMonitoring || this.requestCount >= this.maxRequests) {
        this.stop();
        return;
      }

      // Scroll down only - continuous scrolling
      for (let i = 0; i < 3; i++) {
        window.scrollBy(0, 500);
        this.scrollCount++;
        
        // Small delay between scrolls to trigger requests
        if (i < 2) {
          setTimeout(() => {}, 100);
        }
      }

      // Log progress every 50 scrolls
      if (this.scrollCount % 50 === 0) {
        console.log(`📊 Progress: ${this.scrollCount} scrolls, ${this.requestCount}/${this.maxRequests} requests logged`);
      }

    }, 200); // Scroll every 200ms
  }

  // Set up periodic logging
  setupPeriodicLogging() {
    setInterval(() => {
      if (this.isMonitoring) {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const requestsPerMinute = (this.requestCount / elapsed) * 60;
        
        console.log(`📈 Stats: ${this.requestCount} requests in ${elapsed.toFixed(1)}s (${requestsPerMinute.toFixed(1)} req/min)`);
        
        // Check for rate limiting patterns
        const recentRequests = this.requestLog.slice(-10);
        const rateLimited = recentRequests.filter(r => r.status === 429).length;
        if (rateLimited > 0) {
          console.log(`⚠️ Recent rate limiting: ${rateLimited}/10 recent requests were 429`);
        }
      }
    }, 30000); // Log stats every 30 seconds
  }

  // Generate final report
  logFinalReport() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const requestsPerMinute = (this.requestCount / elapsed) * 60;
    
    console.log('\n📊 FINAL REPORT');
    console.log('================');
    console.log(`Total scrolls: ${this.scrollCount}`);
    console.log(`Total requests: ${this.requestCount}`);
    console.log(`Time elapsed: ${elapsed.toFixed(1)} seconds`);
    console.log(`Average requests per minute: ${requestsPerMinute.toFixed(1)}`);
    
    // Status breakdown
    const statusCounts = {};
    this.requestLog.forEach(req => {
      statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
    });
    
    console.log('\nStatus breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} requests`);
    });
    
    // Rate limiting analysis
    const rateLimited = this.requestLog.filter(r => r.status === 429);
    if (rateLimited.length > 0) {
      console.log(`\n🚫 Rate limiting analysis:`);
      console.log(`  Total 429 responses: ${rateLimited.length}`);
      console.log(`  Rate limiting frequency: ${(rateLimited.length / this.requestCount * 100).toFixed(1)}%`);
      
      // Find patterns in rate limiting
      const intervals = [];
      for (let i = 1; i < rateLimited.length; i++) {
        const time1 = new Date(rateLimited[i-1].timestamp).getTime();
        const time2 = new Date(rateLimited[i].timestamp).getTime();
        intervals.push(time2 - time1);
      }
      
      if (intervals.length > 0) {
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        console.log(`  Average time between rate limits: ${(avgInterval / 1000).toFixed(1)}s`);
      }
    }
    
    // Export data
    this.exportData();
  }

  // Export data to file
  exportData() {
    const data = {
      summary: {
        totalScrolls: this.scrollCount,
        totalRequests: this.requestCount,
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: (Date.now() - this.startTime) / 1000
      },
      requests: this.requestLog
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usertweets-requests-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('💾 Request data exported to file');
  }

  // Get current stats
  getStats() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    return {
      scrolls: this.scrollCount,
      requests: this.requestCount,
      elapsed: elapsed,
      requestsPerMinute: (this.requestCount / elapsed) * 60,
      isMonitoring: this.isMonitoring
    };
  }

  // Clear log
  clearLog() {
    this.requestLog = [];
    this.requestCount = 0;
    console.log('🗑️ Request log cleared');
  }
}

// Create global instance
window.requestMonitor = new RequestMonitor();

// Global control functions
window.startMonitoring = () => window.requestMonitor.start();
window.stopMonitoring = () => window.requestMonitor.stop();
window.getStats = () => window.requestMonitor.getStats();
window.clearLog = () => window.requestMonitor.clearLog();

console.log('🎯 Request Monitor loaded!');
console.log('Available commands:');
console.log('  startMonitoring() - Start monitoring UserTweets requests');
console.log('  stopMonitoring() - Stop monitoring and generate report');
console.log('  getStats() - Get current statistics');
console.log('  clearLog() - Clear the request log');
console.log('');
console.log('🚀 Run startMonitoring() to begin...'); 
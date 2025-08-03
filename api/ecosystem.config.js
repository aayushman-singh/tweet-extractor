/**
 * PM2 Ecosystem Configuration for AWS t4g
 * Optimized for ARM64 architecture
 */

module.exports = {
  apps: [{
    name: 'tweet-extractor-api',
    script: 'server.js',
    
    // Instance configuration
    instances: 1, // Single instance for t4g.micro
    exec_mode: 'fork', // Fork mode for single instance
    
    // Auto-restart configuration
    autorestart: true,
    watch: false, // Disable in production
    max_memory_restart: '400M', // Restart if memory exceeds 400MB (t4g.micro has 1GB)
    
    // Logging
    log_file: '/home/ec2-user/logs/api.log',
    out_file: '/home/ec2-user/logs/api-out.log',
    error_file: '/home/ec2-user/logs/api-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Environment variables
    env_production: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    
    env_development: {
      NODE_ENV: 'development',
      PORT: 8000,
      watch: true,
      ignore_watch: ['node_modules', 'logs']
    },
    
    // Process management
    min_uptime: '10s',
    max_restarts: 10,
    
    // Health monitoring
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // ARM64 optimizations
    node_args: '--max-old-space-size=512', // Limit memory for t4g.micro
  }],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'ec2-user',
      host: ['3.110.132.100'],
      ref: 'origin/master',
      repo: 'https://github.com/aayushman-singh/tweet-extractor.git',
      path: '/home/ec2-user/tweet-extractor/api',
      'pre-deploy-local': '',
      'post-deploy': 'cd api && npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'ForwardAgent=yes'
    }
  }
};
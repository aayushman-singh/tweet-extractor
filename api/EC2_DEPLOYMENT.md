# 🚀 EC2 Deployment Guide for Tweet Extractor API

This guide will help you deploy the Tweet Extractor API on AWS EC2 using a t4g.micro instance.

## 📋 Prerequisites

- AWS Account
- Domain name (optional but recommended)
- SSH key pair for EC2 access
- MongoDB Atlas account
- AWS S3 bucket

## 🏗️ Architecture Overview

```
🌐 Frontend: Vercel/Netlify (extractor.aayushman.dev)
├── Static HTML files
└── Communicates with API

☁️ API: AWS EC2 t4g.micro (api.extractor.aayushman.dev)
├── Express.js server
├── MongoDB Atlas connection
├── AWS S3 integration
└── PM2 process management
```

## 🔧 Step 1: Launch EC2 Instance

### 1.1 Create t4g.micro Instance

1. **Go to AWS Console** → EC2 → Launch Instance
2. **Choose AMI**: Amazon Linux 2023 (ARM64)
3. **Instance Type**: t4g.micro
4. **Key Pair**: Create or select existing SSH key
5. **Security Group**: Create new with these rules:
   ```
   SSH (22): 0.0.0.0/0 (or your IP)
   HTTP (80): 0.0.0.0/0
   HTTPS (443): 0.0.0.0/0
   Custom TCP (3000): 0.0.0.0/0 (for API)
   ```
6. **Storage**: 8GB gp3 (default)
7. **Launch Instance**

### 1.2 Connect to Instance

```bash
# Replace with your key and instance IP
ssh -i "your-key.pem" ec2-user@your-instance-ip
```

## 🔧 Step 2: Install Dependencies

### 2.1 Update System

```bash
# Update system packages
sudo yum update -y

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install nginx (for reverse proxy)
sudo yum install -y nginx

# Install git
sudo yum install -y git
```

### 2.2 Verify Installation

```bash
# Check versions
node --version  # Should be v18.x.x
npm --version   # Should be 8.x.x or higher
pm2 --version   # Should be 5.x.x or higher
nginx -v        # Should show nginx version
```

## 🔧 Step 3: Setup Application

### 3.1 Clone Repository

```bash
# Create application directory
mkdir -p /home/ec2-user/tweet-extractor
cd /home/ec2-user/tweet-extractor

# Clone your repository (replace with your repo URL)
git clone https://github.com/your-username/tweet-extractor.git .

# Or upload files manually via SCP
# scp -r ./api/* ec2-user@your-instance-ip:/home/ec2-user/tweet-extractor/
```

### 3.2 Install Dependencies

```bash
cd /home/ec2-user/tweet-extractor/api
npm install --production
```

### 3.3 Create Environment File

```bash
# Create .env file
nano .env
```

Add your environment variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Secret (generate a strong one)
JWT_SECRET=your-super-secret-jwt-key-change-this-immediately

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-tweet-archives-bucket

# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tweet_extractor?retryWrites=true&w=majority

# CORS Configuration
ALLOWED_ORIGINS=https://extractor.aayushman.dev,chrome-extension://*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3.4 Generate JWT Secret

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🔧 Step 4: Configure Nginx

### 4.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/conf.d/tweet-extractor.conf
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name api.extractor.aayushman.dev;  # Replace with your domain

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

### 4.2 Enable and Start Nginx

```bash
# Test nginx configuration
sudo nginx -t

# Enable nginx to start on boot
sudo systemctl enable nginx

# Start nginx
sudo systemctl start nginx

# Check status
sudo systemctl status nginx
```

## 🔧 Step 5: Setup PM2 Process Manager

### 5.1 Create Log Directory

```bash
# Create logs directory
mkdir -p /home/ec2-user/logs
```

### 5.2 Start Application with PM2

```bash
cd /home/ec2-user/tweet-extractor/api

# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Check status
pm2 status
pm2 logs
```

### 5.3 PM2 Commands Reference

```bash
# View logs
pm2 logs tweet-extractor-api

# Restart application
pm2 restart tweet-extractor-api

# Stop application
pm2 stop tweet-extractor-api

# Monitor resources
pm2 monit

# View detailed info
pm2 show tweet-extractor-api
```

## 🔧 Step 6: Setup SSL with Let's Encrypt

### 6.1 Install Certbot

```bash
# Install certbot
sudo yum install -y certbot python3-certbot-nginx
```

### 6.2 Obtain SSL Certificate

```bash
# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d api.extractor.aayushman.dev

# Test auto-renewal
sudo certbot renew --dry-run
```

### 6.3 Update Nginx Configuration

The certbot will automatically update your nginx configuration to include SSL.

## 🔧 Step 7: Setup Monitoring and Logging

### 7.1 Install CloudWatch Agent (Optional)

```bash
# Install CloudWatch agent
sudo yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### 7.2 Setup Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/tweet-extractor
```

Add this configuration:

```
/home/ec2-user/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 ec2-user ec2-user
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 🔧 Step 8: Security Hardening

### 8.1 Update Security Group

```bash
# Remove port 3000 from security group (only allow 80, 443, 22)
# Do this in AWS Console
```

### 8.2 Setup Firewall (Optional)

```bash
# Install and configure firewalld
sudo yum install -y firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld

# Allow only necessary ports
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 8.3 Regular Updates

```bash
# Create update script
nano /home/ec2-user/update.sh
```

```bash
#!/bin/bash
# Update script
sudo yum update -y
cd /home/ec2-user/tweet-extractor
git pull
cd api
npm install --production
pm2 restart tweet-extractor-api
```

```bash
chmod +x /home/ec2-user/update.sh
```

## 🔧 Step 9: Testing

### 9.1 Test API Endpoints

```bash
# Test health endpoint
curl https://api.extractor.aayushman.dev/health

# Test API status
curl https://api.extractor.aayushman.dev/api/status

# Test registration (replace with your domain)
curl -X POST https://api.extractor.aayushman.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

### 9.2 Monitor Application

```bash
# Check PM2 status
pm2 status

# Check nginx status
sudo systemctl status nginx

# Check logs
pm2 logs tweet-extractor-api
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔧 Step 10: Update Extension Configuration

Update your Chrome extension to use the new API domain:

```javascript
// In extension/popup.js
const API_BASE = 'https://api.extractor.aayushman.dev';
```

## 📊 Monitoring and Maintenance

### Daily Tasks
- Check PM2 status: `pm2 status`
- Monitor logs: `pm2 logs`
- Check disk space: `df -h`

### Weekly Tasks
- Update system: `sudo yum update -y`
- Check SSL certificate: `sudo certbot certificates`
- Review logs for errors

### Monthly Tasks
- Update application: `git pull && npm install && pm2 restart`
- Review security group rules
- Check CloudWatch metrics (if enabled)

## 🚨 Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   pm2 logs tweet-extractor-api
   # Check for missing environment variables or database connection issues
   ```

2. **Nginx 502 Bad Gateway**
   ```bash
   sudo systemctl status nginx
   pm2 status
   # Check if Node.js app is running on port 3000
   ```

3. **SSL Certificate Issues**
   ```bash
   sudo certbot certificates
   sudo certbot renew
   ```

4. **High Memory Usage**
   ```bash
   pm2 monit
   # Check memory usage and restart if needed
   ```

### Performance Optimization

1. **Enable Gzip compression** (already in Express.js)
2. **Use CDN for static assets** (frontend on Vercel/Netlify)
3. **Monitor MongoDB connection pool**
4. **Setup CloudWatch alarms** for CPU/memory usage

## 💰 Cost Estimation

| Service | Instance | Monthly Cost |
|---------|----------|--------------|
| **EC2 t4g.micro** | 1 instance | ~$8-10 |
| **EBS Storage** | 8GB gp3 | ~$0.80 |
| **Data Transfer** | 1GB | ~$0.09 |
| **Total** | | **~$9-11/month** |

## 🎯 Next Steps

1. **Deploy frontend** to Vercel/Netlify
2. **Setup domain DNS** to point to your EC2 instance
3. **Configure CloudWatch alarms** for monitoring
4. **Setup automated backups** for your database
5. **Implement CI/CD pipeline** for automated deployments

---

**Need help?** Check the logs and refer to the troubleshooting section above. 
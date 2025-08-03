#!/bin/bash

# 🚀 Tweet Extractor API - EC2 Deployment Script
# This script automates the deployment process on EC2

set -e  # Exit on any error

echo "🚀 Starting Tweet Extractor API deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as ec2-user."
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo yum update -y

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
else
    print_warning "Node.js is already installed: $(node --version)"
fi

# Install PM2 globally
print_status "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    print_warning "PM2 is already installed: $(pm2 --version)"
fi

# Install nginx
print_status "Installing nginx..."
if ! command -v nginx &> /dev/null; then
    sudo yum install -y nginx
else
    print_warning "nginx is already installed: $(nginx -v 2>&1)"
fi

# Install git
print_status "Installing git..."
if ! command -v git &> /dev/null; then
    sudo yum install -y git
else
    print_warning "git is already installed: $(git --version)"
fi

# Create application directory
print_status "Setting up application directory..."
mkdir -p /home/ec2-user/tweet-extractor
cd /home/ec2-user/tweet-extractor

# Check if .env file exists
if [ ! -f "api/.env" ]; then
    print_warning ".env file not found. Please create it manually with your configuration."
    print_status "Creating .env template..."
    cat > api/.env << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=production

# API Base URL (your EC2 instance IP or domain)
API_BASE_URL=13.203.72.69

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
EOF
    print_warning "Please edit api/.env with your actual configuration before continuing."
    read -p "Press Enter after you've configured the .env file..."
fi

# Install dependencies
print_status "Installing Node.js dependencies..."
cd api
npm install --production

# Create logs directory
print_status "Creating logs directory..."
mkdir -p /home/ec2-user/logs

# Create nginx configuration
print_status "Configuring nginx..."
sudo tee /etc/nginx/conf.d/tweet-extractor.conf > /dev/null << 'EOF'
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
EOF

# Test nginx configuration
print_status "Testing nginx configuration..."
sudo nginx -t

# Enable and start nginx
print_status "Starting nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Start application with PM2
print_status "Starting application with PM2..."
cd /home/ec2-user/tweet-extractor/api
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Setup PM2 to start on boot
print_status "Setting up PM2 startup script..."
pm2 startup

# Create update script
print_status "Creating update script..."
cat > /home/ec2-user/update.sh << 'EOF'
#!/bin/bash
echo "🔄 Updating Tweet Extractor API..."
sudo yum update -y
cd /home/ec2-user/tweet-extractor
git pull
cd api
npm install --production
pm2 restart tweet-extractor-api
echo "✅ Update completed!"
EOF

chmod +x /home/ec2-user/update.sh

# Create logrotate configuration
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/tweet-extractor > /dev/null << 'EOF'
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
EOF

# Display status
print_status "Deployment completed! Checking status..."
echo ""
echo "📊 Application Status:"
pm2 status
echo ""
echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager
echo ""
echo "📁 Application Directory: /home/ec2-user/tweet-extractor"
echo "📝 Logs Directory: /home/ec2-user/logs"
echo "🔄 Update Script: /home/ec2-user/update.sh"
echo ""
echo "🔧 Next Steps:"
echo "1. Configure your domain DNS to point to this server"
echo "2. Run: sudo certbot --nginx -d api.yourdomain.com"
echo "3. Update your Chrome extension to use the new API domain"
echo "4. Test the API endpoints"
echo ""
echo "📖 Useful Commands:"
echo "- View logs: pm2 logs tweet-extractor-api"
echo "- Monitor: pm2 monit"
echo "- Restart: pm2 restart tweet-extractor-api"
echo "- Update: ./update.sh"
echo ""
print_status "Deployment completed successfully! 🎉" 
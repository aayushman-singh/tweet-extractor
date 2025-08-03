#!/bin/bash

# 🚀 Quick AWS t4g Deployment Script for Tweet Extractor API
# This script automates the deployment to an AWS t4g instance

set -e

# Configuration - UPDATE THESE VALUES
EC2_IP="your-ec2-instance-ip"
EC2_USER="ubuntu"
KEY_PATH="~/.ssh/your-key.pem"
DOMAIN="your-domain.com"  # Optional: leave empty to skip domain setup

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if configuration is set
check_config() {
    if [ "$EC2_IP" = "your-ec2-instance-ip" ]; then
        log_error "Please update EC2_IP in the script configuration"
        exit 1
    fi
    
    if [ "$KEY_PATH" = "~/.ssh/your-key.pem" ]; then
        log_error "Please update KEY_PATH in the script configuration"
        exit 1
    fi
    
    if [ ! -f "${KEY_PATH/#\~/$HOME}" ]; then
        log_error "SSH key not found at $KEY_PATH"
        exit 1
    fi
}

# Test SSH connection
test_ssh() {
    log_info "Testing SSH connection to $EC2_IP..."
    if ssh -i "$KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        log_success "SSH connection successful"
    else
        log_error "Cannot connect to EC2 instance. Check your IP, key, and security groups."
        exit 1
    fi
}

# Upload code to server
upload_code() {
    log_info "Uploading code to server..."
    
    # Create directory on server
    ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" "mkdir -p /home/ubuntu/tweet-extractor"
    
    # Upload API code
    scp -i "$KEY_PATH" -r ./api "$EC2_USER@$EC2_IP:/home/ubuntu/tweet-extractor/"
    
    # Upload deployment scripts
    scp -i "$KEY_PATH" deploy-to-aws.md "$EC2_USER@$EC2_IP:/home/ubuntu/"
    
    log_success "Code uploaded successfully"
}

# Setup server environment
setup_server() {
    log_info "Setting up server environment..."
    
    ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" << 'EOF'
        # Update system
        sudo apt update && sudo apt upgrade -y
        
        # Install Node.js 18 (ARM64 compatible)
        if ! command -v node &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        
        # Install PM2
        if ! command -v pm2 &> /dev/null; then
            sudo npm install -g pm2
        fi
        
        # Install Nginx
        if ! command -v nginx &> /dev/null; then
            sudo apt install nginx -y
            sudo systemctl start nginx
            sudo systemctl enable nginx
        fi
        
        # Create logs directory
        mkdir -p /home/ubuntu/logs
        
        echo "✅ Server environment setup complete"
EOF
    
    log_success "Server environment configured"
}

# Install API dependencies
install_dependencies() {
    log_info "Installing API dependencies..."
    
    ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" << 'EOF'
        cd /home/ubuntu/tweet-extractor/api
        npm install --production
        echo "✅ Dependencies installed"
EOF
    
    log_success "Dependencies installed"
}

# Configure environment
configure_environment() {
    log_info "Configuring environment variables..."
    
    ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" << 'EOF'
        cd /home/ubuntu/tweet-extractor/api
        
        # Create .env file if it doesn't exist
        if [ ! -f .env ]; then
            cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
JWT_SECRET=please-change-this-super-secure-jwt-secret-key
MONGODB_URI=mongodb://localhost:27017/tweet-extractor

# AWS S3 Configuration (update with your values)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-s3-bucket

# CORS Origins
ALLOWED_ORIGINS=chrome-extension://*,https://your-domain.com
ENVEOF
            
            echo "⚠️  Please update the .env file with your actual values:"
            echo "   - JWT_SECRET"
            echo "   - MONGODB_URI"
            echo "   - AWS credentials"
            echo "   - Domain configuration"
        fi
EOF
    
    log_warning "Environment file created. Please update with your actual values!"
}

# Start application with PM2
start_application() {
    log_info "Starting application with PM2..."
    
    ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" << 'EOF'
        cd /home/ubuntu/tweet-extractor/api
        
        # Stop existing process if running
        pm2 stop tweet-extractor-api 2>/dev/null || true
        pm2 delete tweet-extractor-api 2>/dev/null || true
        
        # Start new process
        pm2 start ecosystem.config.js --env production
        pm2 save
        pm2 startup ubuntu -u ubuntu --hp /home/ubuntu
        
        echo "✅ Application started with PM2"
EOF
    
    log_success "Application started successfully"
}

# Configure Nginx
configure_nginx() {
    if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "your-domain.com" ]; then
        log_warning "Domain not configured. Skipping Nginx setup. You can access the API directly on port 3000."
        return
    fi
    
    log_info "Configuring Nginx for domain: $DOMAIN"
    
    ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" << EOF
        # Create Nginx configuration
        sudo tee /etc/nginx/sites-available/tweet-extractor > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

        # Enable site
        sudo ln -sf /etc/nginx/sites-available/tweet-extractor /etc/nginx/sites-enabled/
        sudo nginx -t && sudo systemctl reload nginx
        
        echo "✅ Nginx configured for $DOMAIN"
EOF
    
    log_success "Nginx configured"
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."
    
    # Test health endpoint
    if curl -f "http://$EC2_IP:3000/health" >/dev/null 2>&1; then
        log_success "API health check passed"
    else
        log_error "API health check failed"
        return 1
    fi
    
    # Test API status
    if curl -f "http://$EC2_IP:3000/api/status" >/dev/null 2>&1; then
        log_success "API status check passed"
    else
        log_error "API status check failed"
        return 1
    fi
    
    log_success "Deployment test completed successfully"
}

# Main deployment function
main() {
    echo "🚀 AWS t4g Deployment Script for Tweet Extractor API"
    echo "====================================================="
    
    check_config
    test_ssh
    upload_code
    setup_server
    install_dependencies
    configure_environment
    start_application
    configure_nginx
    test_deployment
    
    echo ""
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Update the .env file on the server with your actual values"
    echo "2. Restart the application: ssh -i $KEY_PATH $EC2_USER@$EC2_IP 'cd tweet-extractor/api && npm run pm2:restart'"
    echo "3. Test your API: curl http://$EC2_IP:3000/api/status"
    
    if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "your-domain.com" ]; then
        echo "4. Point your domain DNS to $EC2_IP"
        echo "5. Set up SSL with: ssh -i $KEY_PATH $EC2_USER@$EC2_IP 'sudo certbot --nginx -d $DOMAIN'"
    fi
    
    echo ""
    echo "🔗 API Endpoints:"
    echo "- Health: http://$EC2_IP:3000/health"
    echo "- Status: http://$EC2_IP:3000/api/status"
    echo "- Login: http://$EC2_IP:3000/api/auth/login"
}

# Run main function
main "$@"
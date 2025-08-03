# Deployment Guide

## Environment Variables

Create these environment variables in your deployment platform:

```
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
PORT=8000
```

## Vercel Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd api
   vercel
   ```

3. **Set Environment Variables:**
   - Go to Vercel Dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add the variables listed above

## Netlify Deployment

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   cd api
   netlify deploy --functions=netlify/functions
   ```

## AWS S3 Bucket Setup

1. **Create Bucket:**
   ```bash
   aws s3 mb s3://your-tweet-archive-bucket
   ```

2. **Set Bucket Policy:**
   ```bash
   aws s3api put-bucket-policy --bucket your-bucket --policy '{
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicReadGetObject",
       "Effect": "Allow", 
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::your-bucket/*"
     }]
   }'
   ```

3. **Configure CORS:**
   ```bash
   aws s3api put-bucket-cors --bucket your-bucket --cors-configuration '{
     "CORSRules": [{
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedHeaders": ["*"]
     }]
   }'
   ```

## Testing

After deployment, test your API:

```bash
# Health check
curl https://your-domain.com/api/health

# Upload test
curl -X POST https://your-domain.com/api/upload-to-s3 \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.html","content":"<html>Test</html>","contentType":"text/html"}'
```
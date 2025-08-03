# Tweet Downloader S3 Upload API

Backend API for uploading HTML tweet archives to AWS S3, enabling cloud-hosted reports accessible via custom domain.

## Features

- 🌐 Upload HTML files to AWS S3
- 🔒 CORS configured for Chrome extension security
- 📁 Public read access for generated reports
- 🚀 Serverless deployment ready (Vercel, Netlify, AWS Lambda)
- 📊 Health check and recent uploads endpoints
- 🔧 Environment-based configuration

## Quick Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd api
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - `AWS_ACCESS_KEY_ID` - Your AWS access key
   - `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
   - `AWS_REGION` - AWS region (e.g., us-east-1)
   - `S3_BUCKET_NAME` - Your S3 bucket name

## Environment Setup

Create a `.env` file (for local development):

```env
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
PORT=3000
```

## S3 Bucket Configuration

1. **Create S3 Bucket:**
   ```bash
   aws s3 mb s3://your-tweet-archive-bucket
   ```

2. **Enable Public Read Access:**
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

## API Endpoints

### POST `/api/upload-to-s3`
Upload HTML content to S3.

**Request:**
```json
{
  "filename": "report1704123456.html",
  "content": "<html>...</html>", 
  "contentType": "text/html"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://bucket.s3.region.amazonaws.com/report1704123456.html",
  "key": "report1704123456.html",
  "filename": "report1704123456.html"
}
```

### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### GET `/api/recent-uploads`
List recent uploads.

**Response:**
```json
{
  "files": [
    {
      "filename": "report1704123456.html",
      "size": 157234,
      "lastModified": "2024-01-01T12:00:00.000Z",
      "url": "https://bucket.s3.region.amazonaws.com/report1704123456.html"
    }
  ]
}
```

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Test the API:**
   ```bash
   curl http://localhost:3000/api/health
   ```

## Deployment Options

### Vercel (Recommended)
- Zero configuration
- Automatic HTTPS
- Global CDN
- Environment variables UI

### Netlify Functions
```bash
netlify deploy --functions=netlify/functions
```

### AWS Lambda
```bash
serverless deploy
```

### Traditional Server
```bash
npm start
```

## Files

- **`s3-upload-api.js`** - Main Express.js server
- **`package.json`** - Dependencies and scripts
- **`vercel.json`** - Vercel deployment configuration

## Security

- CORS restricted to Chrome extensions and your domain
- File size limits (10MB)
- Content type validation
- Environment-based AWS credentials
- Public read-only access to uploaded files

## Domain Setup

Point your custom domain (e.g., `extractor.aayushman.dev`) to your deployment:

1. Add CNAME record pointing to your deployment URL
2. Configure SSL certificate
3. Update `API_BASE_URL` in the extension to your domain
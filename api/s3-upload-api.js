// S3 Upload API for Tweet Downloader Extension
// Deploy this to your server (e.g., Vercel, Netlify Functions, or EC2)

const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
const app = express();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

// Middleware
app.use(cors({
  origin: ['chrome-extension://*', 'https://extractor.aayushman.dev'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Upload endpoint
app.post('/api/upload-to-s3', async (req, res) => {
  try {
    const { filename, content, contentType } = req.body;
    
    if (!filename || !content) {
      return res.status(400).json({ error: 'Missing filename or content' });
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filename,
      Body: content,
      ContentType: contentType || 'text/html',
      ACL: 'public-read', // Make the file publicly accessible
      CacheControl: 'max-age=31536000', // Cache for 1 year
      Metadata: {
        'source': 'tweet-downloader-extension',
        'created': new Date().toISOString()
      }
    };

    const result = await s3.upload(params).promise();
    
    console.log(`✅ Uploaded ${filename} to S3:`, result.Location);
    
    res.json({
      success: true,
      url: result.Location,
      key: result.Key,
      filename: filename
    });

  } catch (error) {
    console.error('❌ S3 upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// List recent uploads (optional)
app.get('/api/recent-uploads', async (req, res) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      MaxKeys: 10,
      Prefix: 'report'
    };

    const result = await s3.listObjectsV2(params).promise();
    
    const files = result.Contents.map(item => ({
      filename: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`
    }));

    res.json({ files });

  } catch (error) {
    console.error('❌ Error listing files:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 S3 Upload API running on port ${PORT}`);
  console.log(`📁 Bucket: ${process.env.S3_BUCKET_NAME}`);
  console.log(`🌍 Region: ${process.env.AWS_REGION}`);
});

module.exports = app;
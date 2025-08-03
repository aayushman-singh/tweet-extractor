const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDatabase, getDatabaseInfo, connectDB, UserDB, ArchiveDB } = require('./database');
const app = express();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1'
});

const s3 = new AWS.S3();

// Middleware
app.use(
  cors({
    origin: [
      "chrome-extension://*",
      "https://extractor.aayushman.dev",
      "https://tweet-extractor-api.vercel.app",
      "https://tweet-extractor-api.vercel.app/api/upload-to-s3",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// Initialize database (don't exit process in serverless)
initDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  // Don't exit process in serverless environment
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('🔐 Registration attempt:', { email: req.body.email, hasPhone: !!req.body.phone });
    
    const { email, phone, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        field: 'email',
        error: 'Email and password are required' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        field: 'password',
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        field: 'email',
        error: 'Please enter a valid email address' 
      });
    }

    // Phone validation (if provided)
    if (phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ 
          field: 'phone',
          error: 'Please enter a valid phone number' 
        });
      }
    }

    // Ensure database connection
    await connectDB();

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    console.log('🔐 Creating user in database...');

    // Create user
    const user = await UserDB.create({
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      password_hash
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        phone: user.phone 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`✅ New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Provide more specific error messages
    if (error.code === 11000) {
      // Duplicate key error
      const field = error.keyPattern?.email ? 'email' : 'phone';
      return res.status(400).json({ 
        success: false,
        field: field,
        error: `${field === 'email' ? 'Email' : 'Phone'} already exists. Please use a different ${field}.` 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid data provided. Please check your input.' 
      });
    }
    
    if (error.message.includes('MONGODB_URI')) {
      return res.status(500).json({ 
        success: false,
        error: 'Database configuration error. Please contact support.' 
      });
    }
    
    if (error.field) {
      return res.status(400).json(error);
    }
    
    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', { emailOrPhone: req.body.emailOrPhone });
    
    const { emailOrPhone, password } = req.body;

    // Validation
    if (!emailOrPhone || !password) {
      return res.status(400).json({ 
        error: 'Email/phone and password are required' 
      });
    }

    // Ensure database connection
    await connectDB();

    // Find user
    const user = await UserDB.findByEmailOrPhone(emailOrPhone.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Update last login
    await UserDB.updateLastLogin(user.id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        phone: user.phone 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`✅ User logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    
    if (error.message.includes('MONGODB_URI')) {
      return res.status(500).json({ 
        success: false,
        error: 'Database configuration error. Please contact support.' 
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await UserDB.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user statistics
    const stats = await ArchiveDB.getStats(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        last_login: user.last_login
      },
      stats: {
        total_archives: stats.total_archives || 0,
        total_size: stats.total_size || 0,
        last_archive_date: stats.last_archive_date
      }
    });

  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load profile'
    });
  }
});

// Upload endpoint (now requires authentication)
app.post('/api/upload-to-s3', authenticateToken, async (req, res) => {
  try {
    const { filename, content, contentType } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Missing content' });
    }

    // Generate randomized filename: report-date-random_numbers with appropriate extension
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const randomNumbers = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
    // Determine file extension based on content type
    const isJson = contentType === 'application/json';
    const extension = isJson ? 'json' : 'html';
    const generatedFilename = `report-${dateStr}-${randomNumbers}.${extension}`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: generatedFilename,
      Body: content,
      ContentType: contentType || 'text/html',
      ACL: 'public-read', // Make the file publicly accessible
      CacheControl: 'max-age=31536000', // Cache for 1 year
      Metadata: {
        'source': 'tweet-extractor-extension',
        'created': new Date().toISOString()
      }
    };

    const result = await s3.upload(params).promise();
    
    console.log(`✅ Uploaded ${generatedFilename} to S3:`, result.Location);
    
    // Save archive to database
    try {
      await ArchiveDB.create({
        user_id: req.user.userId,
        filename: generatedFilename,
        s3_key: result.Key,
        s3_url: result.Location,
        file_size: Buffer.byteLength(content, 'utf8'),
        content_type: contentType || 'text/html'
      });
      console.log(`✅ Archive saved to database for user ${req.user.email}`);
    } catch (dbError) {
      console.error('❌ Database save error:', dbError);
      // Don't fail the upload if database save fails
    }
    
    res.json({
      success: true,
      url: result.Location,
      key: result.Key,
      filename: generatedFilename
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

// Database info endpoint
app.get('/api/database-info', async (req, res) => {
  try {
    const dbInfo = await getDatabaseInfo();
    res.json({
      success: true,
      ...dbInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// List user's recent uploads
app.get('/api/recent-uploads', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 items
    const offset = parseInt(req.query.offset) || 0;

    const archives = await ArchiveDB.findByUserId(req.user.userId, limit, offset);
    
    const files = archives.map(archive => ({
      filename: archive.filename,
      size: archive.file_size,
      lastModified: archive.created_at,
      url: archive.s3_url,
      contentType: archive.content_type
    }));

    res.json({ 
      files,
      pagination: {
        limit,
        offset,
        hasMore: files.length === limit
      }
    });

  } catch (error) {
    console.error('❌ Error listing user files:', error);
    res.status(500).json({ error: 'Failed to load your archives' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 S3 Upload API running on port ${PORT}`);
  console.log(`📁 Bucket: ${process.env.S3_BUCKET_NAME}`);
  console.log(`🌍 Region: ${process.env.AWS_REGION}`);
});

module.exports = app;
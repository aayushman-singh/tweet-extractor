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
      process.env.API_BASE_URL ? `http://${process.env.API_BASE_URL}` : null,
      process.env.API_BASE_URL ? `https://${process.env.API_BASE_URL}` : null
    ].filter(Boolean), // Remove null values
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// Initialize database (don't exit process in serverless)
initDatabase().catch(err => {
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

    // Extract profile information from JSON content if available
    let profileInfo = {
      username: 'user',
      displayName: 'User'
    };
    let tweetCount = 100;

    if (isJson) {
      try {
        const jsonData = JSON.parse(content);
        console.log('📤 [API] Parsed JSON data, checking for profile info...');
        console.log('📤 [API] JSON keys:', Object.keys(jsonData));
        
        if (jsonData.metadata) {
          // Use metadata format
          console.log('📤 [API] Found metadata section:', jsonData.metadata);
          profileInfo = {
            username: jsonData.metadata.username || 'user',
            displayName: jsonData.metadata.username || 'User',
            bio: '',
            followers: 0,
            following: 0
          };
          tweetCount = jsonData.metadata.total_tweets || (jsonData.tweets ? jsonData.tweets.length : 100);
          console.log('📤 [API] Extracted profile info from metadata:', profileInfo);
        } else if (jsonData.profile) {
          // Use profile format (fallback)
          console.log('📤 [API] Found profile section:', jsonData.profile);
          profileInfo = {
            username: jsonData.profile.username || 'user',
            displayName: jsonData.profile.displayName || 'User',
            bio: jsonData.profile.bio || '',
            followers: jsonData.profile.followers || 0,
            following: jsonData.profile.following || 0
          };
          tweetCount = jsonData.tweets ? jsonData.tweets.length : 100;
          console.log('📤 [API] Extracted profile info from profile:', profileInfo);
        } else {
          console.log('📤 [API] No metadata or profile section found, using defaults');
        }
      } catch (parseError) {
        console.warn('⚠️ Could not parse JSON content for profile info:', parseError);
      }
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: generatedFilename,
      Body: content,
      ContentType: contentType || 'text/html',
      CacheControl: 'max-age=31536000', // Cache for 1 year
      Metadata: {
        'source': 'tweet-extractor-extension',
        'created': new Date().toISOString(),
        'profile-username': profileInfo.username,
        'profile-displayname': profileInfo.displayName,
        'tweet-count': tweetCount.toString()
      }
    };

    const result = await s3.upload(params).promise();
    
    // Save archive to database with profile information
    try {
      await ArchiveDB.create({
        user_id: req.user.userId,
        filename: generatedFilename,
        s3_key: result.Key,
        s3_url: result.Location,
        file_size: Buffer.byteLength(content, 'utf8'),
        content_type: contentType || 'text/html',
        profile_info: profileInfo,
        tweet_count: tweetCount
      });
    } catch (dbError) {
      console.error('❌ Database save error:', dbError);
      // Don't fail the upload if database save fails
    }
    
    res.json({
      success: true,
      url: result.Location,
      key: result.Key,
      filename: generatedFilename,
      profileInfo: profileInfo,
      tweetCount: tweetCount
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

// Delete archive endpoint
app.delete('/api/archive/:archiveId', authenticateToken, async (req, res) => {
  try {
    const { archiveId } = req.params;
    console.log('🗑️ [API] Deleting archive with ID:', archiveId);
    
    // Find the archive in the database
    const archive = await ArchiveDB.findById(archiveId);
    
    if (!archive) {
      console.log('🗑️ [API] Archive not found for ID:', archiveId);
      return res.status(404).json({ error: 'Archive not found' });
    }
    
    // Check if user owns this archive
    if (archive.user_id.toString() !== req.user.userId.toString()) {
      console.log('🗑️ [API] Access denied - user mismatch');
      return res.status(403).json({ error: 'Access denied' });
    }
    
    console.log('🗑️ [API] Access granted, deleting from S3 and database...');
    
    // Delete from S3
    try {
      await s3.deleteObject({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: archive.s3_key
      }).promise();
      console.log('🗑️ [API] Successfully deleted from S3');
    } catch (s3Error) {
      console.warn('⚠️ [API] S3 deletion failed (file might not exist):', s3Error);
      // Continue with database deletion even if S3 deletion fails
    }
    
    // Delete from database
    try {
      await ArchiveDB.deleteById(archiveId);
      console.log('🗑️ [API] Successfully deleted from database');
    } catch (dbError) {
      console.error('❌ [API] Database deletion failed:', dbError);
      return res.status(500).json({ error: 'Failed to delete archive from database' });
    }
    
    res.json({
      success: true,
      message: 'Archive deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting archive:', error);
    res.status(500).json({ error: 'Failed to delete the archive' });
  }
});

// List user's recent uploads
app.get('/api/recent-uploads', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 items
    const offset = parseInt(req.query.offset) || 0;

    console.log('📋 [API] Fetching archives for user:', req.user.userId);
    console.log('📋 [API] Limit:', limit, 'Offset:', offset);

    const archives = await ArchiveDB.findByUserId(req.user.userId, limit, offset);
    
    console.log('📋 [API] Found archives:', archives.length);
    console.log('📋 [API] First archive structure:', archives[0] ? Object.keys(archives[0]) : 'No archives');
    archives.forEach((archive, index) => {
      console.log(`📋 [API] Archive ${index + 1}:`, {
        id: archive.id,
        _id: archive._id,
        filename: archive.filename,
        created_at: archive.created_at
      });
    });
    
    const archivesList = archives.map(archive => ({
      _id: archive.id,
      filename: archive.filename,
      originalName: archive.filename,
      size: archive.file_size,
      uploadDate: archive.created_at,
      s3Url: archive.s3_url,
      tweetCount: archive.tweet_count || 100,
      profileInfo: archive.profile_info || {
        username: 'user',
        displayName: 'User'
      }
    }));

    res.json({ 
      archives: archivesList,
      pagination: {
        limit,
        offset,
        hasMore: archivesList.length === limit
      }
    });

  } catch (error) {
    console.error('❌ Error listing user files:', error);
    res.status(500).json({ error: 'Failed to load your archives' });
  }
});

// Get specific report data
app.get('/api/report/:reportId', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    console.log('📊 [API] Fetching report with ID:', reportId);
    console.log('📊 [API] User ID:', req.user.userId);
    
    // Find the archive in the database
    const archive = await ArchiveDB.findById(reportId);
    console.log('📊 [API] Archive found:', !!archive);
    
    if (!archive) {
      console.log('📊 [API] Archive not found for ID:', reportId);
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Check if user owns this archive
    if (archive.user_id.toString() !== req.user.userId.toString()) {
      console.log('📊 [API] Access denied - user mismatch');
      console.log('📊 [API] Archive user ID:', archive.user_id.toString());
      console.log('📊 [API] Request user ID:', req.user.userId.toString());
      return res.status(403).json({ error: 'Access denied' });
    }
    
    console.log('📊 [API] Access granted, fetching from S3...');
    
    // Get the report data from S3
    const s3Response = await s3.getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: archive.s3_key
    }).promise();
    
    // Parse the HTML content to extract JSON data
    const htmlContent = s3Response.Body.toString('utf-8');
    console.log('📊 [API] S3 content length:', htmlContent.length);
    
    // Extract JSON data from the HTML (this is a simplified approach)
    // In a real implementation, you'd want to store the JSON data separately
    const jsonMatch = htmlContent.match(/<script id="tweet-data" type="application\/json">(.*?)<\/script>/s);
    
    let reportData;
    if (jsonMatch) {
      try {
        reportData = JSON.parse(jsonMatch[1]);
        console.log('📊 [API] JSON data extracted successfully');
        
        // If the JSON data contains metadata information, use it
        if (reportData.metadata) {
          console.log('📊 [API] Using metadata from JSON data');
          reportData.profileInfo = {
            username: reportData.metadata.username || 'user',
            displayName: reportData.metadata.username || 'User', // Use username as display name if no separate display name
            description: '',
            followers_count: 0,
            following_count: 0,
            tweet_count: reportData.metadata.total_tweets || (reportData.tweets ? reportData.tweets.length : 100)
          };
          
          // Set timeline from metadata if available
          if (reportData.metadata.date_range) {
            reportData.timeline = {
              startDate: reportData.metadata.date_range.oldest,
              endDate: reportData.metadata.date_range.newest
            };
          }
          
          // Set generatedAt from metadata
          reportData.generatedAt = reportData.metadata.extracted_at || new Date().toISOString();
          
        } else if (reportData.profile) {
          // Fallback to profile object if metadata doesn't exist
          console.log('📊 [API] Using profile info from JSON data');
          reportData.profileInfo = {
            username: reportData.profile.username || 'user',
            displayName: reportData.profile.displayName || 'User',
            description: reportData.profile.bio || '',
            followers_count: reportData.profile.followers || 0,
            following_count: reportData.profile.following || 0,
            tweet_count: reportData.tweets ? reportData.tweets.length : 100
          };
        } else {
          // Use profile info from database as fallback
          console.log('📊 [API] Using profile info from database');
          reportData.profileInfo = archive.profile_info || {
            username: 'user',
            displayName: 'User',
            description: '',
            followers_count: 0,
            following_count: 0,
            tweet_count: archive.tweet_count || 100
          };
        }
        
        // Ensure tweets array exists
        if (!reportData.tweets) {
          reportData.tweets = [];
        }
        
        // Calculate stats from actual tweets
        const stats = {
          totalTweets: reportData.tweets.length,
          totalLikes: 0,
          totalRetweets: 0,
          totalViews: 0,
          totalReplies: 0
        };
        
        reportData.tweets.forEach(tweet => {
          if (tweet.metrics) {
            stats.totalLikes += tweet.metrics.likes || 0;
            stats.totalRetweets += tweet.metrics.retweets || 0;
            stats.totalViews += tweet.metrics.views || 0;
            stats.totalReplies += tweet.metrics.replies || 0;
          } else if (tweet.favorite_count !== undefined) {
            // Handle the format from your example
            stats.totalLikes += tweet.favorite_count || 0;
            stats.totalRetweets += tweet.retweet_count || 0;
          }
        });
        
        // If metadata has engagement info, use it
        if (reportData.metadata && reportData.metadata.total_engagement) {
          stats.totalLikes = reportData.metadata.total_engagement.likes || stats.totalLikes;
          stats.totalRetweets = reportData.metadata.total_engagement.retweets || stats.totalRetweets;
        }
        
        reportData.stats = stats;
        
        // Set timeline if not already set from metadata
        if (!reportData.timeline) {
          if (reportData.tweets.length > 0) {
            const dates = reportData.tweets.map(t => new Date(t.created_at || t.timestamp)).sort();
            reportData.timeline = {
              startDate: dates[0].toISOString(),
              endDate: dates[dates.length - 1].toISOString()
            };
          } else {
            reportData.timeline = {
              startDate: new Date().toISOString(),
              endDate: new Date().toISOString()
            };
          }
        }
        
        // Set generatedAt if not already set
        if (!reportData.generatedAt) {
          reportData.generatedAt = new Date().toISOString();
        }
        
      } catch (parseError) {
        console.error('Failed to parse JSON data:', parseError);
        reportData = generateDefaultReportData(archive.filename, archive.profile_info, archive.tweet_count);
      }
    } else {
      // Generate default report data if no JSON found
      console.log('📊 [API] No JSON data found, generating default');
      reportData = generateDefaultReportData(archive.filename, archive.profile_info, archive.tweet_count);
    }
    
    console.log('📊 [API] Sending report data');
    res.json(reportData);
    
  } catch (error) {
    console.error('❌ Error fetching report:', error);
    res.status(500).json({ error: 'Failed to load the report' });
  }
});

// Download report as JSON
app.get('/api/report/:reportId/download', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    // Find the archive in the database
    const archive = await ArchiveDB.findById(reportId);
    
    if (!archive) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Check if user owns this archive
    if (archive.user_id.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get the report data from S3
    const s3Response = await s3.getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: archive.s3_key
    }).promise();
    
    const htmlContent = s3Response.Body.toString('utf-8');
    
    // Extract JSON data from the HTML
    const jsonMatch = htmlContent.match(/<script id="tweet-data" type="application\/json">(.*?)<\/script>/s);
    
    let jsonData;
    if (jsonMatch) {
      try {
        jsonData = JSON.parse(jsonMatch[1]);
        
        // If the JSON data contains metadata information, use it
        if (jsonData.metadata) {
          console.log('📊 [API] Using metadata from JSON data for download');
          jsonData.profileInfo = {
            username: jsonData.metadata.username || 'user',
            displayName: jsonData.metadata.username || 'User', // Use username as display name if no separate display name
            description: '',
            followers_count: 0,
            following_count: 0,
            tweet_count: jsonData.metadata.total_tweets || (jsonData.tweets ? jsonData.tweets.length : 100)
          };
          
          // Set timeline from metadata if available
          if (jsonData.metadata.date_range) {
            jsonData.timeline = {
              startDate: jsonData.metadata.date_range.oldest,
              endDate: jsonData.metadata.date_range.newest
            };
          }
          
          // Set generatedAt from metadata
          jsonData.generatedAt = jsonData.metadata.extracted_at || new Date().toISOString();
          
        } else if (jsonData.profile) {
          // Fallback to profile object if metadata doesn't exist
          jsonData.profileInfo = {
            username: jsonData.profile.username || 'user',
            displayName: jsonData.profile.displayName || 'User',
            description: jsonData.profile.bio || '',
            followers_count: jsonData.profile.followers || 0,
            following_count: jsonData.profile.following || 0,
            tweet_count: jsonData.tweets ? jsonData.tweets.length : 100
          };
        } else {
          // Use profile info from database as fallback
          jsonData.profileInfo = archive.profile_info || {
            username: 'user',
            displayName: 'User',
            description: '',
            followers_count: 0,
            following_count: 0,
            tweet_count: archive.tweet_count || 100
          };
        }
        
        // Ensure tweets array exists
        if (!jsonData.tweets) {
          jsonData.tweets = [];
        }
        
        // Calculate stats from actual tweets
        const stats = {
          totalTweets: jsonData.tweets.length,
          totalLikes: 0,
          totalRetweets: 0,
          totalViews: 0,
          totalReplies: 0
        };
        
        jsonData.tweets.forEach(tweet => {
          if (tweet.metrics) {
            stats.totalLikes += tweet.metrics.likes || 0;
            stats.totalRetweets += tweet.metrics.retweets || 0;
            stats.totalViews += tweet.metrics.views || 0;
            stats.totalReplies += tweet.metrics.replies || 0;
          } else if (tweet.favorite_count !== undefined) {
            // Handle the format from your example
            stats.totalLikes += tweet.favorite_count || 0;
            stats.totalRetweets += tweet.retweet_count || 0;
          }
        });
        
        // If metadata has engagement info, use it
        if (jsonData.metadata && jsonData.metadata.total_engagement) {
          stats.totalLikes = jsonData.metadata.total_engagement.likes || stats.totalLikes;
          stats.totalRetweets = jsonData.metadata.total_engagement.retweets || stats.totalRetweets;
        }
        
        jsonData.stats = stats;
        
        // Set timeline if not already set from metadata
        if (!jsonData.timeline) {
          if (jsonData.tweets.length > 0) {
            const dates = jsonData.tweets.map(t => new Date(t.timestamp || t.created_at)).sort();
            jsonData.timeline = {
              startDate: dates[0].toISOString(),
              endDate: dates[dates.length - 1].toISOString()
            };
          } else {
            jsonData.timeline = {
              startDate: new Date().toISOString(),
              endDate: new Date().toISOString()
            };
          }
        }
        
        // Set generatedAt if not already set
        if (!jsonData.generatedAt) {
          jsonData.generatedAt = new Date().toISOString();
        }
        
      } catch (parseError) {
        jsonData = generateDefaultReportData(archive.filename, archive.profile_info, archive.tweet_count);
      }
    } else {
      jsonData = generateDefaultReportData(archive.filename, archive.profile_info, archive.tweet_count);
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${archive.filename.replace('.html', '.json')}"`);
    res.json(jsonData);
    
  } catch (error) {
    console.error('❌ Error downloading report:', error);
    res.status(500).json({ error: 'Failed to download the report' });
  }
});

// Helper function to generate default report data
function generateDefaultReportData(filename, profileInfo = null, tweetCount = 100) {
  // Extract username from filename (e.g., "PixPerk__tweet_archive (1).html" -> "PixPerk_")
  const usernameMatch = filename.match(/^([^_]+)_/);
  const username = usernameMatch ? usernameMatch[1] : 'user';
  
  return {
    profileInfo: profileInfo || {
      username: username,
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
      description: 'Twitter user',
      followers_count: 0,
      following_count: 0,
      tweet_count: tweetCount || 100
    },
    tweets: [
      {
        id: '1',
        text: 'Sample tweet content',
        created_at: new Date().toISOString(),
        public_metrics: {
          retweet_count: 0,
          reply_count: 0,
          like_count: 0,
          quote_count: 0,
          impression_count: 0
        }
      }
    ],
    stats: {
      totalTweets: tweetCount || 100,
      totalLikes: 0,
      totalRetweets: 0,
      totalViews: 0,
      totalReplies: 0
    },
    timeline: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      endDate: new Date().toISOString()
    },
    generatedAt: new Date().toISOString()
  };
}

module.exports = app;
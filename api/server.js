#!/usr/bin/env node

/**
 * 🚀 Tweet Extractor API Server
 * Optimized for AWS t4g instances
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import existing API logic
const apiRoutes = require('./s3-upload-api');

const app = express();
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'chrome-extension://*',
      'https://extractor.aayushman.dev',
      'https://www.extractor.aayushman.dev',
      'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
      'http://localhost:4173'  // Vite preview
    ];
    
    // Check if origin matches any pattern
    const isAllowed = allowedOrigins.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(origin);
      }
      return pattern === origin;
    });
    
    if (isAllowed || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: NODE_ENV
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: '2.0.0',
    endpoints: [
      '/api/auth/register',
      '/api/auth/login', 
      '/api/auth/profile',
      '/api/upload'
    ]
  });
});


try {
  app.use('/', apiRoutes);
} catch (error) {
  console.warn('⚠️ Could not mount API routes directly. Using inline routes.');
  
  // Basic auth routes for fallback
  app.post('/api/auth/register', (req, res) => {
    res.status(501).json({ error: 'Registration temporarily unavailable' });
  });
  
  app.post('/api/auth/login', (req, res) => {
    res.status(501).json({ error: 'Login temporarily unavailable' });
  });
  
  app.post('/api/upload', (req, res) => {
    res.status(501).json({ error: 'Upload temporarily unavailable' });
  });
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.status(500).json({
    error: NODE_ENV === 'development' ? error.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Tweet Extractor API Server Started');
  console.log('=====================================');
  console.log(`📡 Server running on: http://0.0.0.0:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('=====================================');
  
  if (NODE_ENV === 'development') {
    console.log('🔗 Available endpoints:');
    console.log('  - GET  /health');
    console.log('  - GET  /api/status');
    console.log('  - POST /api/auth/register');
    console.log('  - POST /api/auth/login');
    console.log('  - POST /api/upload');
  }
});

module.exports = app;
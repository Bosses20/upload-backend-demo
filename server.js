const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const uploadRoutes = require('./routes/upload');
const healthRoutes = require('./routes/health');

// Import middleware
const authMiddleware = require('./middleware/auth');
const { handleUploadError } = require('./middleware/upload');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security and CORS middleware
app.use(authMiddleware.securityHeaders);
app.use(authMiddleware.corsHeaders);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use(authMiddleware.logRequest);

// Rate limiting middleware
app.use(authMiddleware.rateLimit);

// Routes
app.use('/health', healthRoutes);
app.use('/upload', uploadRoutes);

// Upload error handling middleware
app.use(handleUploadError);

// Global error handling middleware
app.use((error, req, res, next) => {
  logger.error('Server error:', error);
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    requestId: req.requestId
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /health',
      'GET /health/info',
      'POST /upload',
      'POST /upload/batch',
      'GET /upload/validate/:fileId'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`MEGA Upload Backend Server started`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Upload endpoint: http://localhost:${PORT}/upload`);
  console.log(`Status endpoint: http://localhost:${PORT}/status/:deviceId`);
});

module.exports = app;
const logger = require('../utils/logger');

// Basic authentication middleware for API endpoints
// For demo purposes, this implements simple validation

const authMiddleware = {
  // Validate device ID format and presence
  validateDeviceId: (req, res, next) => {
    try {
      const deviceId = req.body.deviceId || req.params.deviceId || req.query.deviceId;
      
      if (!deviceId) {
        return res.status(400).json({
          success: false,
          error: 'Device ID required',
          message: 'deviceId must be provided in request body, params, or query'
        });
      }

      // Basic device ID format validation (alphanumeric, underscores, hyphens)
      const deviceIdPattern = /^[a-zA-Z0-9_-]{3,50}$/;
      if (!deviceIdPattern.test(deviceId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid device ID format',
          message: 'Device ID must be 3-50 characters, alphanumeric with underscores/hyphens only'
        });
      }

      // Add validated device ID to request
      req.validatedDeviceId = deviceId;
      next();

    } catch (error) {
      logger.error('Device ID validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication validation failed',
        message: error.message
      });
    }
  },

  // Rate limiting middleware (basic implementation)
  rateLimit: (() => {
    const requests = new Map();
    const WINDOW_MS = 60 * 1000; // 1 minute window
    const MAX_REQUESTS = 100; // Max requests per window per device

    return (req, res, next) => {
      try {
        const deviceId = req.validatedDeviceId || req.body.deviceId || req.ip;
        const now = Date.now();
        const windowStart = now - WINDOW_MS;

        // Clean old entries
        if (requests.has(deviceId)) {
          const deviceRequests = requests.get(deviceId);
          const validRequests = deviceRequests.filter(timestamp => timestamp > windowStart);
          requests.set(deviceId, validRequests);
        }

        // Check current request count
        const currentRequests = requests.get(deviceId) || [];
        
        if (currentRequests.length >= MAX_REQUESTS) {
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            message: `Maximum ${MAX_REQUESTS} requests per minute exceeded`,
            retryAfter: Math.ceil((currentRequests[0] + WINDOW_MS - now) / 1000)
          });
        }

        // Add current request
        currentRequests.push(now);
        requests.set(deviceId, currentRequests);

        next();

      } catch (error) {
        logger.error('Rate limiting error:', error);
        next(); // Continue on rate limiting errors
      }
    };
  })(),

  // Request logging middleware
  logRequest: (req, res, next) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add request ID to request object
    req.requestId = requestId;

    // Log request start (server console only)
    console.log(`[${requestId}] ${req.method} ${req.originalUrl} - Start`);

    // Override res.json to log response
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
      return originalJson.call(this, data);
    };

    next();
  },

  // CORS middleware for cross-origin requests
  corsHeaders: (req, res, next) => {
    // Set CORS headers for React Native app
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Device-ID');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  },

  // Security headers middleware
  securityHeaders: (req, res, next) => {
    // Basic security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Remove server identification
    res.removeHeader('X-Powered-By');
    
    next();
  }
};

module.exports = authMiddleware;
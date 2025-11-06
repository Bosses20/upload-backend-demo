// Helper utilities for backend operations

const crypto = require('crypto');

class Helpers {
  // Generate unique device fingerprint
  static generateDeviceId(deviceInfo = {}) {
    const data = JSON.stringify(deviceInfo) + Date.now();
    return crypto.createHash('md5').update(data).digest('hex').substring(0, 8).toUpperCase();
  }

  // Validate file metadata
  static validateFileMetadata(metadata) {
    const required = ['fileName', 'fileSize', 'mimeType'];
    const missing = required.filter(field => !metadata[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required metadata: ${missing.join(', ')}`);
    }

    // Validate file size (max 100MB)
    if (metadata.fileSize > 100 * 1024 * 1024) {
      throw new Error('File size exceeds 100MB limit');
    }

    return true;
  }

  // Format file size for logging
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Generate timestamp for file naming
  static generateTimestamp() {
    return new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
  }

  // Validate source location
  static validateSourceLocation(location) {
    const validLocations = ['DCIM_CAMERA', 'DCIM_SNAPCHAT', 'SNAPCHAT_ROOT'];
    return validLocations.includes(location);
  }

  // Create error response
  static createErrorResponse(message, code = 'UNKNOWN_ERROR', details = null) {
    return {
      error: message,
      code,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    };
  }

  // Create success response
  static createSuccessResponse(data, message = 'Operation successful') {
    return {
      success: true,
      message,
      timestamp: new Date().toISOString(),
      data
    };
  }

  // Retry logic with exponential backoff
  static async retry(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retry attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

module.exports = Helpers;
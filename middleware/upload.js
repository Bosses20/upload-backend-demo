// Upload middleware for file handling and validation
const multer = require('multer');
const logger = require('../utils/logger');

// Configure multer storage
const storage = multer.memoryStorage();

// File validation functions
const fileValidation = {
  // Validate file size
  validateFileSize: (file, maxSizeMB = 100) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB, received: ${Math.round(file.size / (1024 * 1024) * 100) / 100}MB`);
    }
    return true;
  },

  // Validate file type (accept all for security research demo)
  validateFileType: (file) => {
    // For security research demo, accept all file types
    // In production, you might want to restrict certain types
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv',
      'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg',
      'application/pdf', 'text/plain', 'application/json'
    ];

    // Log file type for monitoring (server console only)
    console.log(`File validation - Type: ${file.mimetype}, Size: ${file.size} bytes`);
    
    return true; // Accept all files for demo
  },

  // Validate file name
  validateFileName: (fileName) => {
    if (!fileName || fileName.trim().length === 0) {
      throw new Error('File name is required');
    }

    // Check for dangerous file name patterns
    const dangerousPatterns = [
      /\.\./,  // Directory traversal
      /[<>:"|?*]/,  // Invalid characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i  // Reserved names
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(fileName)) {
        throw new Error('Invalid file name format');
      }
    }

    return true;
  },

  // Validate file content (basic checks)
  validateFileContent: (file) => {
    // Check if file is empty
    if (file.size === 0) {
      throw new Error('File is empty');
    }

    // Check for minimum file size (1 byte)
    if (file.size < 1) {
      throw new Error('File size must be at least 1 byte');
    }

    return true;
  }
};

// Multer configuration with validation
const uploadConfig = {
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10, // Maximum 10 files for batch upload
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // Field name size limit
    fields: 20 // Maximum number of fields
  },
  fileFilter: (req, file, cb) => {
    try {
      // Validate file name
      fileValidation.validateFileName(file.originalname);
      
      // Validate file type
      fileValidation.validateFileType(file);
      
      // Accept file
      cb(null, true);
      
    } catch (error) {
      logger.error('File filter validation failed:', error);
      cb(error, false);
    }
  }
};

// Create multer instance
const upload = multer(uploadConfig);

// Middleware for additional file validation after upload
const validateUploadedFile = (req, res, next) => {
  try {
    if (req.file) {
      // Validate single file
      fileValidation.validateFileSize(req.file);
      fileValidation.validateFileContent(req.file);
      
      // Log successful validation (server console only)
      console.log(`File validated - Name: ${req.file.originalname}, Size: ${req.file.size} bytes, Type: ${req.file.mimetype}`);
    }

    if (req.files && req.files.length > 0) {
      // Validate multiple files
      for (const file of req.files) {
        fileValidation.validateFileSize(file);
        fileValidation.validateFileContent(file);
      }
      
      // Log successful batch validation (server console only)
      console.log(`Batch files validated - Count: ${req.files.length}, Total size: ${req.files.reduce((sum, f) => sum + f.size, 0)} bytes`);
    }

    next();

  } catch (error) {
    logger.error('File validation failed:', error);
    res.status(400).json({
      success: false,
      error: 'File validation failed',
      message: error.message
    });
  }
};

// Error handling middleware for multer errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    let statusCode = 400;

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large (maximum 100MB)';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files (maximum 10 files)';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = `Upload error: ${error.message}`;
    }

    logger.error('Multer upload error:', error);
    return res.status(statusCode).json({
      success: false,
      error: 'Upload failed',
      message: message,
      code: error.code
    });
  }

  // Pass non-multer errors to next middleware
  next(error);
};

module.exports = {
  single: upload.single('file'),
  array: upload.array('files', 10),
  validateUploadedFile,
  handleUploadError,
  fileValidation
};
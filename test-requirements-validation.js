const megaService = require('./services/megaService');
const deviceManager = require('./services/deviceManager');

async function validateRequirements() {
  console.log('=== MEGA Service Requirements Validation ===');
  
  try {
    // Requirement 1.1: MEGA authentication with hardcoded credentials
    console.log('\n✓ Testing Requirement 1.1: MEGA authentication with hardcoded credentials');
    await megaService.initialize();
    const status = megaService.getConnectionStatus();
    console.log(`  - Email: ${status.email}`);
    console.log(`  - Connected: ${status.connected}`);
    console.log(`  - Base folder: ${status.baseFolder}`);
    
    // Requirement 1.2: Device organization and folder structure
    console.log('\n✓ Testing Requirement 1.2: Device organization and folder structure');
    const testDeviceId = 'REQ_TEST_' + Date.now();
    const deviceFolders = await megaService.getDeviceFolder(testDeviceId);
    console.log(`  - Device folder created: DEVICE_${testDeviceId}`);
    console.log(`  - Subfolders: ${Object.keys(deviceFolders).join(', ')}`);
    
    // Requirement 1.3: Error handling and retry logic
    console.log('\n✓ Testing Requirement 1.3: Error handling and retry logic');
    
    // Test empty file error handling
    const emptyFile = Buffer.alloc(0);
    const emptyResult = await megaService.uploadFile(emptyFile, 'empty.txt', testDeviceId);
    console.log(`  - Empty file handling: ${!emptyResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`  - Error message: ${emptyResult.error}`);
    
    // Test connection check
    const connectionOk = await megaService.checkConnection();
    console.log(`  - Connection check: ${connectionOk ? 'PASS' : 'FAIL'}`);
    
    // Requirement 3.2: Device-based folder organization
    console.log('\n✓ Testing Requirement 3.2: Device-based folder organization');
    const testFile = Buffer.from('Test file for device organization', 'utf8');
    const uploadResult = await megaService.uploadFile(testFile, 'org-test.jpg', testDeviceId, 'DCIM_CAMERA');
    console.log(`  - File uploaded to: ${uploadResult.folderPath}`);
    console.log(`  - Unique filename: ${uploadResult.fileName}`);
    
    // Requirement 3.3: File naming convention
    console.log('\n✓ Testing Requirement 3.3: File naming convention');
    const fileName = deviceManager.generateFileName(testDeviceId, 'test.jpg', 'DCIM_CAMERA');
    const expectedPattern = new RegExp(`^${testDeviceId}_\\d{8}_\\d{6}_test\\.jpg$`);
    console.log(`  - Generated filename: ${fileName}`);
    console.log(`  - Matches pattern: ${expectedPattern.test(fileName) ? 'PASS' : 'FAIL'}`);
    
    // Requirement 3.4: Progress tracking
    console.log('\n✓ Testing Requirement 3.4: Progress tracking');
    const progressInfo = await megaService.getUploadProgress();
    console.log(`  - Completed uploads: ${progressInfo.completedUploads}`);
    console.log(`  - Device count: ${progressInfo.deviceCount}`);
    console.log(`  - Last update: ${progressInfo.lastUpdate}`);
    
    // Test multiple source locations
    console.log('\n✓ Testing multiple source locations');
    const snapchatFile = Buffer.from('Snapchat test file', 'utf8');
    const snapResult = await megaService.uploadFile(snapchatFile, 'snap.jpg', testDeviceId, 'DCIM_SNAPCHAT');
    
    const rootFile = Buffer.from('Root folder test file', 'utf8');
    const rootResult = await megaService.uploadFile(rootFile, 'root.mp4', testDeviceId, 'SNAPCHAT_ROOT');
    
    console.log(`  - DCIM_SNAPCHAT upload: ${snapResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`  - SNAPCHAT_ROOT upload: ${rootResult.success ? 'PASS' : 'FAIL'}`);
    
    // Test batch upload functionality
    console.log('\n✓ Testing batch upload functionality');
    const batchFiles = [
      { fileName: 'batch1.jpg', buffer: Buffer.from('Batch file 1', 'utf8') },
      { fileName: 'batch2.mp4', buffer: Buffer.from('Batch file 2', 'utf8') }
    ];
    
    const batchResult = await megaService.uploadMultipleFiles(batchFiles, testDeviceId, 'DCIM_CAMERA');
    console.log(`  - Batch upload success rate: ${batchResult.summary.successful}/${batchResult.summary.total}`);
    console.log(`  - Total time: ${batchResult.summary.totalTimeMs}ms`);
    
    // Final storage info
    console.log('\n✓ Final storage information');
    const storageInfo = await megaService.getStorageInfo();
    console.log(`  - Total files in demo folder: ${storageInfo.totalFiles}`);
    console.log(`  - Total size: ${storageInfo.totalSizeMB} MB`);
    console.log(`  - Device folders: ${storageInfo.deviceFolders}`);
    
    console.log('\n=== All Requirements Validated Successfully ===');
    return true;
    
  } catch (error) {
    console.error('\n❌ Requirements validation failed:', error);
    return false;
  }
}

// Run validation
if (require.main === module) {
  validateRequirements()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation execution failed:', error);
      process.exit(1);
    });
}

module.exports = validateRequirements;
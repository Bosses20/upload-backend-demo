const megaService = require('./services/megaService');
const logger = require('./utils/logger');

async function testUploadLogic() {
  console.log('=== MEGA Upload Logic Test ===');
  
  try {
    // Initialize MEGA service
    console.log('\n1. Initializing MEGA service...');
    await megaService.initialize();
    console.log('✓ MEGA service initialized');
    
    const testDeviceId = 'UPLOAD_TEST_' + Date.now();
    
    // Test 2: Single file upload with progress tracking
    console.log('\n2. Testing single file upload with progress tracking...');
    const testFile1 = Buffer.from('Test file content for upload logic validation - File 1', 'utf8');
    const result1 = await megaService.uploadFile(testFile1, 'test-upload-1.txt', testDeviceId, 'DCIM_CAMERA');
    
    if (result1.success) {
      console.log('✓ Single file upload successful');
      console.log(`  - File ID: ${result1.fileId}`);
      console.log(`  - Upload time: ${result1.uploadDurationMs}ms`);
      console.log(`  - Upload speed: ${result1.uploadSpeed} bytes/sec`);
    } else {
      throw new Error(`Single file upload failed: ${result1.error}`);
    }
    
    // Test 3: Duplicate file handling
    console.log('\n3. Testing duplicate file handling...');
    const duplicateResult = await megaService.uploadFile(testFile1, 'test-upload-1.txt', testDeviceId, 'DCIM_CAMERA');
    
    if (duplicateResult.success && duplicateResult.skipped) {
      console.log('✓ Duplicate file handling works correctly');
      console.log(`  - Reason: ${duplicateResult.reason}`);
    } else {
      console.log('⚠ Duplicate file was uploaded again (this may be expected behavior)');
    }
    
    // Test 4: Different source locations
    console.log('\n4. Testing different source locations...');
    const testFile2 = Buffer.from('Test file for Snapchat folder', 'utf8');
    const result2 = await megaService.uploadFile(testFile2, 'snapchat-test.jpg', testDeviceId, 'DCIM_SNAPCHAT');
    
    const testFile3 = Buffer.from('Test file for Snapchat root folder', 'utf8');
    const result3 = await megaService.uploadFile(testFile3, 'snapchat-root-test.mp4', testDeviceId, 'SNAPCHAT_ROOT');
    
    if (result2.success && result3.success) {
      console.log('✓ Multiple source locations work correctly');
      console.log(`  - DCIM_SNAPCHAT: ${result2.fileName}`);
      console.log(`  - SNAPCHAT_ROOT: ${result3.fileName}`);
    } else {
      throw new Error('Source location uploads failed');
    }
    
    // Test 5: Batch upload
    console.log('\n5. Testing batch upload...');
    const batchFiles = [
      { fileName: 'batch-1.jpg', buffer: Buffer.from('Batch file 1 content', 'utf8') },
      { fileName: 'batch-2.mp4', buffer: Buffer.from('Batch file 2 content', 'utf8') },
      { fileName: 'batch-3.png', buffer: Buffer.from('Batch file 3 content', 'utf8') }
    ];
    
    const batchResult = await megaService.uploadMultipleFiles(batchFiles, testDeviceId, 'DCIM_CAMERA');
    
    console.log('✓ Batch upload completed');
    console.log(`  - Total files: ${batchResult.summary.total}`);
    console.log(`  - Successful: ${batchResult.summary.successful}`);
    console.log(`  - Failed: ${batchResult.summary.failed}`);
    console.log(`  - Total time: ${batchResult.summary.totalTimeMs}ms`);
    
    // Test 6: Upload progress tracking
    console.log('\n6. Testing upload progress tracking...');
    const progressInfo = await megaService.getUploadProgress();
    console.log('Upload progress info:', JSON.stringify(progressInfo, null, 2));
    
    // Test 7: Storage information
    console.log('\n7. Testing storage information...');
    const storageInfo = await megaService.getStorageInfo();
    console.log('Storage info:', JSON.stringify(storageInfo, null, 2));
    
    // Test 8: Upload validation
    console.log('\n8. Testing upload validation...');
    if (result1.fileId) {
      const validation = await megaService.validateUpload(result1.fileId);
      console.log('Upload validation:', JSON.stringify(validation, null, 2));
    }
    
    // Test 9: Error handling - empty file
    console.log('\n9. Testing error handling (empty file)...');
    const emptyFile = Buffer.alloc(0);
    const emptyResult = await megaService.uploadFile(emptyFile, 'empty-file.txt', testDeviceId, 'DCIM_CAMERA');
    
    if (!emptyResult.success) {
      console.log('✓ Empty file error handling works correctly');
      console.log(`  - Error: ${emptyResult.error}`);
    } else {
      console.log('⚠ Empty file was uploaded (unexpected)');
    }
    
    // Test 10: Large file simulation (just under limit)
    console.log('\n10. Testing large file handling...');
    const largeFile = Buffer.alloc(1024 * 1024); // 1MB file
    largeFile.fill('A');
    const largeResult = await megaService.uploadFile(largeFile, 'large-test.bin', testDeviceId, 'DCIM_CAMERA');
    
    if (largeResult.success) {
      console.log('✓ Large file upload successful');
      console.log(`  - File size: ${largeResult.fileSize} bytes`);
      console.log(`  - Upload time: ${largeResult.uploadDurationMs}ms`);
    } else {
      console.log(`⚠ Large file upload failed: ${largeResult.error}`);
    }
    
    console.log('\n=== Upload Logic Tests Completed ===');
    
    // Final summary
    const finalProgress = await megaService.getUploadProgress();
    console.log('\nFinal Upload Summary:');
    console.log(`- Total completed uploads: ${finalProgress.completedUploads}`);
    console.log(`- Devices: ${finalProgress.deviceCount}`);
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Upload Logic Test Failed:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testUploadLogic()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = testUploadLogic;
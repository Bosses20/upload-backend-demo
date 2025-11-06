const megaService = require('./services/megaService');

async function testDeviceTracking() {
  try {
    await megaService.initialize();
    
    const testFile = Buffer.from('Device tracking test', 'utf8');
    await megaService.uploadFile(testFile, 'device-test.txt', 'TRACKING_TEST', 'DCIM_CAMERA');
    
    const progress = await megaService.getUploadProgress();
    console.log('Device tracking test result:');
    console.log(JSON.stringify(progress, null, 2));
    
    return progress.completedUploads > 0;
  } catch (error) {
    console.error('Device tracking test failed:', error);
    return false;
  }
}

testDeviceTracking().then(success => {
  console.log(success ? '✓ Device tracking works' : '❌ Device tracking failed');
  process.exit(success ? 0 : 1);
});
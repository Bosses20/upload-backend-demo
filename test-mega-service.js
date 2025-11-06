const megaService = require('./services/megaService');
const logger = require('./utils/logger');

async function testMegaService() {
  console.log('=== MEGA Service Test ===');
  
  try {
    // Test 1: Initialize MEGA service
    console.log('\n1. Testing MEGA service initialization...');
    await megaService.initialize();
    console.log('✓ MEGA service initialized successfully');
    
    // Test 2: Check connection status
    console.log('\n2. Testing connection status...');
    const status = megaService.getConnectionStatus();
    console.log('Connection status:', JSON.stringify(status, null, 2));
    
    // Test 3: Get account info
    console.log('\n3. Testing account info...');
    const accountInfo = await megaService.getAccountInfo();
    console.log('Account info:', JSON.stringify(accountInfo, null, 2));
    
    // Test 4: Test device folder creation
    console.log('\n4. Testing device folder creation...');
    const testDeviceId = 'TEST123';
    const deviceFolders = await megaService.getDeviceFolder(testDeviceId);
    console.log(`✓ Device folders created for ${testDeviceId}`);
    console.log('Folder structure:', Object.keys(deviceFolders));
    
    // Test 5: Test file upload with dummy data
    console.log('\n5. Testing file upload...');
    const testFileContent = Buffer.from('This is a test file for MEGA service validation', 'utf8');
    const testFileName = 'test-file.txt';
    
    const uploadResult = await megaService.uploadFile(
      testFileContent, 
      testFileName, 
      testDeviceId, 
      'DCIM_CAMERA'
    );
    
    console.log('✓ File upload successful');
    console.log('Upload result:', JSON.stringify(uploadResult, null, 2));
    
    // Test 6: Check connection after operations
    console.log('\n6. Testing connection check...');
    const connectionOk = await megaService.checkConnection();
    console.log(`Connection status: ${connectionOk ? 'OK' : 'FAILED'}`);
    
    console.log('\n=== All MEGA Service Tests Passed ===');
    return true;
    
  } catch (error) {
    console.error('\n❌ MEGA Service Test Failed:', error);
    console.error('Error details:', error.message);
    
    // Test connection recovery
    console.log('\nTesting connection recovery...');
    try {
      const reconnected = await megaService.reconnect();
      console.log(`Reconnection ${reconnected ? 'successful' : 'failed'}`);
    } catch (reconnectError) {
      console.error('Reconnection failed:', reconnectError.message);
    }
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testMegaService()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = testMegaService;
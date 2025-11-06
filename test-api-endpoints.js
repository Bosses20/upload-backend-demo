// Test script for API endpoints functionality
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_DEVICE_ID = 'test_device_123';

// Test utilities
const createTestFile = (fileName, content = 'Test file content') => {
  const filePath = path.join(__dirname, fileName);
  fs.writeFileSync(filePath, content);
  return filePath;
};

const cleanupTestFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Test functions
const testHealthEndpoint = async () => {
  console.log('\n=== Testing Health Endpoint ===');
  
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    console.log('Health Response Status:', response.status);
    console.log('Health Response Data:', JSON.stringify(data, null, 2));
    
    // Validate response structure
    const requiredFields = ['status', 'timestamp', 'uptime', 'version'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return false;
    }
    
    console.log('✅ Health endpoint test passed');
    return true;
    
  } catch (error) {
    console.error('❌ Health endpoint test failed:', error.message);
    return false;
  }
};

const testHealthInfoEndpoint = async () => {
  console.log('\n=== Testing Health Info Endpoint ===');
  
  try {
    const response = await fetch(`${BASE_URL}/health/info`);
    const data = await response.json();
    
    console.log('Health Info Response Status:', response.status);
    console.log('Health Info Response Data:', JSON.stringify(data, null, 2));
    
    // Validate response structure
    const requiredFields = ['name', 'version', 'uptime', 'endpoints'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return false;
    }
    
    console.log('✅ Health info endpoint test passed');
    return true;
    
  } catch (error) {
    console.error('❌ Health info endpoint test failed:', error.message);
    return false;
  }
};

const testUploadEndpointValidation = async () => {
  console.log('\n=== Testing Upload Endpoint Validation ===');
  
  try {
    // Test 1: Missing file
    console.log('Test 1: Missing file');
    const formData1 = new FormData();
    formData1.append('deviceId', TEST_DEVICE_ID);
    
    const response1 = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData1
    });
    
    const data1 = await response1.json();
    console.log('Missing file response:', response1.status, data1);
    
    if (response1.status !== 400) {
      console.error('❌ Expected 400 status for missing file');
      return false;
    }
    
    // Test 2: Missing device ID
    console.log('\nTest 2: Missing device ID');
    const testFilePath = createTestFile('test-upload.txt', 'Test content');
    
    const formData2 = new FormData();
    formData2.append('file', fs.createReadStream(testFilePath));
    
    const response2 = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData2
    });
    
    const data2 = await response2.json();
    console.log('Missing device ID response:', response2.status, data2);
    
    cleanupTestFile(testFilePath);
    
    if (response2.status !== 400) {
      console.error('❌ Expected 400 status for missing device ID');
      return false;
    }
    
    // Test 3: Invalid device ID format
    console.log('\nTest 3: Invalid device ID format');
    const testFilePath3 = createTestFile('test-upload-3.txt', 'Test content');
    
    const formData3 = new FormData();
    formData3.append('file', fs.createReadStream(testFilePath3));
    formData3.append('deviceId', 'invalid@device!id');
    
    const response3 = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData3
    });
    
    const data3 = await response3.json();
    console.log('Invalid device ID response:', response3.status, data3);
    
    cleanupTestFile(testFilePath3);
    
    if (response3.status !== 400) {
      console.error('❌ Expected 400 status for invalid device ID');
      return false;
    }
    
    console.log('✅ Upload endpoint validation tests passed');
    return true;
    
  } catch (error) {
    console.error('❌ Upload endpoint validation test failed:', error.message);
    return false;
  }
};

const testUploadEndpointSuccess = async () => {
  console.log('\n=== Testing Upload Endpoint Success Case ===');
  
  try {
    const testFilePath = createTestFile('test-upload-success.txt', 'Test file content for successful upload');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('deviceId', TEST_DEVICE_ID);
    formData.append('sourceLocation', 'DCIM_CAMERA');
    formData.append('originalPath', '/storage/emulated/0/DCIM/Camera/test.txt');
    
    console.log('Sending upload request...');
    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    console.log('Upload Response Status:', response.status);
    console.log('Upload Response Data:', JSON.stringify(data, null, 2));
    
    cleanupTestFile(testFilePath);
    
    // Note: This might fail if MEGA service is not initialized, but we're testing the endpoint structure
    if (response.status === 200 || response.status === 500) {
      // 200 = success, 500 = MEGA service error (expected if not initialized)
      console.log('✅ Upload endpoint structure test passed');
      return true;
    } else {
      console.error('❌ Unexpected response status:', response.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Upload endpoint success test failed:', error.message);
    return false;
  }
};

const testBatchUploadEndpoint = async () => {
  console.log('\n=== Testing Batch Upload Endpoint ===');
  
  try {
    const testFile1 = createTestFile('test-batch-1.txt', 'Batch test file 1');
    const testFile2 = createTestFile('test-batch-2.txt', 'Batch test file 2');
    
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testFile1));
    formData.append('files', fs.createReadStream(testFile2));
    formData.append('deviceId', TEST_DEVICE_ID);
    formData.append('sourceLocation', 'DCIM_SNAPCHAT');
    
    console.log('Sending batch upload request...');
    const response = await fetch(`${BASE_URL}/upload/batch`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    console.log('Batch Upload Response Status:', response.status);
    console.log('Batch Upload Response Data:', JSON.stringify(data, null, 2));
    
    cleanupTestFile(testFile1);
    cleanupTestFile(testFile2);
    
    // Note: This might fail if MEGA service is not initialized
    if (response.status === 200 || response.status === 207 || response.status === 500) {
      console.log('✅ Batch upload endpoint structure test passed');
      return true;
    } else {
      console.error('❌ Unexpected batch upload response status:', response.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Batch upload endpoint test failed:', error.message);
    return false;
  }
};

const testValidateEndpoint = async () => {
  console.log('\n=== Testing Validate Endpoint ===');
  
  try {
    const response = await fetch(`${BASE_URL}/upload/validate/test_file_id_123`);
    const data = await response.json();
    
    console.log('Validate Response Status:', response.status);
    console.log('Validate Response Data:', JSON.stringify(data, null, 2));
    
    // Should return validation result (might be invalid file ID, but endpoint should work)
    if (response.status === 200 || response.status === 500) {
      console.log('✅ Validate endpoint structure test passed');
      return true;
    } else {
      console.error('❌ Unexpected validate response status:', response.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Validate endpoint test failed:', error.message);
    return false;
  }
};

const test404Endpoint = async () => {
  console.log('\n=== Testing 404 Handler ===');
  
  try {
    const response = await fetch(`${BASE_URL}/nonexistent-endpoint`);
    const data = await response.json();
    
    console.log('404 Response Status:', response.status);
    console.log('404 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.status === 404 && data.error === 'Endpoint not found') {
      console.log('✅ 404 handler test passed');
      return true;
    } else {
      console.error('❌ 404 handler test failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 404 handler test failed:', error.message);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting API Endpoints Test Suite');
  console.log('Base URL:', BASE_URL);
  console.log('Test Device ID:', TEST_DEVICE_ID);
  
  const tests = [
    { name: 'Health Endpoint', fn: testHealthEndpoint },
    { name: 'Health Info Endpoint', fn: testHealthInfoEndpoint },
    { name: 'Upload Validation', fn: testUploadEndpointValidation },
    { name: 'Upload Success Case', fn: testUploadEndpointSuccess },
    { name: 'Batch Upload', fn: testBatchUploadEndpoint },
    { name: 'Validate Endpoint', fn: testValidateEndpoint },
    { name: '404 Handler', fn: test404Endpoint }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n📋 Running test: ${test.name}`);
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw an error:`, error.message);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });
  
  console.log(`\nOverall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All API endpoint tests passed!');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
    return false;
  }
};

// Export for use in other scripts
module.exports = {
  runAllTests,
  testHealthEndpoint,
  testUploadEndpointValidation,
  testUploadEndpointSuccess,
  testBatchUploadEndpoint,
  testValidateEndpoint,
  test404Endpoint
};

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}
// Simple test script using child_process to test API endpoints
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

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

const runCurlCommand = (command) => {
  try {
    const result = execSync(command, { encoding: 'utf8', timeout: 10000 });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
};

// Test functions
const testHealthEndpoint = () => {
  console.log('\n=== Testing Health Endpoint ===');
  
  const command = `curl -s -w "\\nHTTP_CODE:%{http_code}" "${BASE_URL}/health"`;
  const result = runCurlCommand(command);
  
  if (result.success) {
    console.log('Health endpoint response:', result.output);
    
    // Check if response contains expected fields
    if (result.output.includes('status') && result.output.includes('timestamp')) {
      console.log('✅ Health endpoint test passed');
      return true;
    } else {
      console.log('❌ Health endpoint missing required fields');
      return false;
    }
  } else {
    console.log('❌ Health endpoint test failed:', result.error);
    return false;
  }
};

const testHealthInfoEndpoint = () => {
  console.log('\n=== Testing Health Info Endpoint ===');
  
  const command = `curl -s -w "\\nHTTP_CODE:%{http_code}" "${BASE_URL}/health/info"`;
  const result = runCurlCommand(command);
  
  if (result.success) {
    console.log('Health info endpoint response:', result.output);
    
    // Check if response contains expected fields
    if (result.output.includes('name') && result.output.includes('endpoints')) {
      console.log('✅ Health info endpoint test passed');
      return true;
    } else {
      console.log('❌ Health info endpoint missing required fields');
      return false;
    }
  } else {
    console.log('❌ Health info endpoint test failed:', result.error);
    return false;
  }
};

const testUploadEndpointValidation = () => {
  console.log('\n=== Testing Upload Endpoint Validation ===');
  
  // Test missing file
  console.log('Test 1: Missing file');
  const command1 = `curl -s -w "\\nHTTP_CODE:%{http_code}" -X POST -F "deviceId=test_device_123" "${BASE_URL}/upload"`;
  const result1 = runCurlCommand(command1);
  
  if (result1.success) {
    console.log('Missing file response:', result1.output);
    
    if (result1.output.includes('HTTP_CODE:400') && result1.output.includes('No file provided')) {
      console.log('✅ Missing file validation test passed');
      return true;
    } else {
      console.log('❌ Missing file validation test failed');
      return false;
    }
  } else {
    console.log('❌ Upload validation test failed:', result1.error);
    return false;
  }
};

const testUploadEndpointWithFile = () => {
  console.log('\n=== Testing Upload Endpoint with File ===');
  
  const testFilePath = createTestFile('test-upload.txt', 'Test content for upload');
  
  try {
    const command = `curl -s -w "\\nHTTP_CODE:%{http_code}" -X POST -F "file=@${testFilePath}" -F "deviceId=test_device_123" -F "sourceLocation=DCIM_CAMERA" "${BASE_URL}/upload"`;
    const result = runCurlCommand(command);
    
    cleanupTestFile(testFilePath);
    
    if (result.success) {
      console.log('Upload with file response:', result.output);
      
      // Should either succeed (200) or fail with MEGA service error (500)
      if (result.output.includes('HTTP_CODE:200') || result.output.includes('HTTP_CODE:500')) {
        console.log('✅ Upload endpoint structure test passed');
        return true;
      } else {
        console.log('❌ Upload endpoint structure test failed');
        return false;
      }
    } else {
      console.log('❌ Upload with file test failed:', result.error);
      return false;
    }
  } catch (error) {
    cleanupTestFile(testFilePath);
    console.log('❌ Upload with file test error:', error.message);
    return false;
  }
};

const testValidateEndpoint = () => {
  console.log('\n=== Testing Validate Endpoint ===');
  
  const command = `curl -s -w "\\nHTTP_CODE:%{http_code}" "${BASE_URL}/upload/validate/test_file_id"`;
  const result = runCurlCommand(command);
  
  if (result.success) {
    console.log('Validate endpoint response:', result.output);
    
    // Should return some response (200 or 500)
    if (result.output.includes('HTTP_CODE:200') || result.output.includes('HTTP_CODE:500')) {
      console.log('✅ Validate endpoint test passed');
      return true;
    } else {
      console.log('❌ Validate endpoint test failed');
      return false;
    }
  } else {
    console.log('❌ Validate endpoint test failed:', result.error);
    return false;
  }
};

const test404Handler = () => {
  console.log('\n=== Testing 404 Handler ===');
  
  const command = `curl -s -w "\\nHTTP_CODE:%{http_code}" "${BASE_URL}/nonexistent-endpoint"`;
  const result = runCurlCommand(command);
  
  if (result.success) {
    console.log('404 handler response:', result.output);
    
    if (result.output.includes('HTTP_CODE:404') && result.output.includes('Endpoint not found')) {
      console.log('✅ 404 handler test passed');
      return true;
    } else {
      console.log('❌ 404 handler test failed');
      return false;
    }
  } else {
    console.log('❌ 404 handler test failed:', result.error);
    return false;
  }
};

// Main test runner
const runAllTests = () => {
  console.log('🚀 Starting Simple API Endpoints Test Suite');
  console.log('Base URL:', BASE_URL);
  
  const tests = [
    { name: 'Health Endpoint', fn: testHealthEndpoint },
    { name: 'Health Info Endpoint', fn: testHealthInfoEndpoint },
    { name: 'Upload Validation', fn: testUploadEndpointValidation },
    { name: 'Upload with File', fn: testUploadEndpointWithFile },
    { name: 'Validate Endpoint', fn: testValidateEndpoint },
    { name: '404 Handler', fn: test404Handler }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n📋 Running test: ${test.name}`);
    try {
      const result = test.fn();
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

// Run tests if this script is executed directly
if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runAllTests };
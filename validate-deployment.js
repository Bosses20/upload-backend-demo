#!/usr/bin/env node

/**
 * Deployment Validation Script for Render.com
 * Tests backend deployment and MEGA integration
 */

const https = require('https');
const http = require('http');

// Configuration
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://upload-backend-demo.onrender.com';
const LOCAL_URL = 'http://localhost:3000';

// Test configuration
const TESTS = [
  {
    name: 'Health Check',
    path: '/health',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['status', 'timestamp', 'uptime']
  },
  {
    name: 'Health Info Check',
    path: '/health/info',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['megaConnected', 'megaAccount']
  },
  {
    name: '404 Handler',
    path: '/nonexistent',
    method: 'GET',
    expectedStatus: 404,
    expectedFields: ['success', 'error']
  }
];

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(url, path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const fullUrl = `${url}${path}`;
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const options = {
      method,
      timeout: 10000
    };
    
    console.log(`  → Testing: ${method} ${fullUrl}`);
    
    const req = client.request(fullUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Validate test response
 */
function validateResponse(test, response) {
  const results = {
    passed: true,
    issues: []
  };
  
  // Check status code
  if (response.status !== test.expectedStatus) {
    results.passed = false;
    results.issues.push(`Expected status ${test.expectedStatus}, got ${response.status}`);
  }
  
  // Check expected fields
  if (test.expectedFields && response.data && typeof response.data === 'object') {
    for (const field of test.expectedFields) {
      if (!(field in response.data)) {
        results.passed = false;
        results.issues.push(`Missing expected field: ${field}`);
      }
    }
  }
  
  // Check for parse errors
  if (response.parseError) {
    results.passed = false;
    results.issues.push(`JSON parse error: ${response.parseError}`);
  }
  
  return results;
}

/**
 * Run tests against a URL
 */
async function runTests(baseUrl, environment) {
  console.log(`\n🧪 Testing ${environment} Environment: ${baseUrl}`);
  console.log('=' .repeat(60));
  
  let passedTests = 0;
  let totalTests = TESTS.length;
  
  for (const test of TESTS) {
    console.log(`\n📋 Test: ${test.name}`);
    
    try {
      const response = await makeRequest(baseUrl, test.path, test.method);
      const validation = validateResponse(test, response);
      
      if (validation.passed) {
        console.log(`  ✅ PASSED`);
        console.log(`  📊 Status: ${response.status}`);
        
        if (response.data && typeof response.data === 'object') {
          console.log(`  📄 Response:`, JSON.stringify(response.data, null, 2).split('\n').map(line => `     ${line}`).join('\n'));
        }
        
        passedTests++;
      } else {
        console.log(`  ❌ FAILED`);
        console.log(`  📊 Status: ${response.status}`);
        
        for (const issue of validation.issues) {
          console.log(`  🚨 Issue: ${issue}`);
        }
        
        if (response.data) {
          console.log(`  📄 Response:`, JSON.stringify(response.data, null, 2).split('\n').map(line => `     ${line}`).join('\n'));
        }
      }
      
    } catch (error) {
      console.log(`  ❌ FAILED - Connection Error`);
      console.log(`  🚨 Error: ${error.message}`);
    }
  }
  
  console.log(`\n📈 Results: ${passedTests}/${totalTests} tests passed`);
  return { passed: passedTests, total: totalTests, success: passedTests === totalTests };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Backend Deployment Validation');
  console.log('================================');
  
  const args = process.argv.slice(2);
  const testLocal = args.includes('--local');
  const testDeployment = args.includes('--deployment') || args.length === 0;
  
  let allTestsPassed = true;
  
  // Test local development server
  if (testLocal) {
    const localResults = await runTests(LOCAL_URL, 'Local Development');
    if (!localResults.success) {
      allTestsPassed = false;
    }
  }
  
  // Test deployment
  if (testDeployment) {
    const deploymentResults = await runTests(DEPLOYMENT_URL, 'Production Deployment');
    if (!deploymentResults.success) {
      allTestsPassed = false;
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('🎉 All tests passed! Deployment is ready.');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check the issues above.');
    process.exit(1);
  }
}

// Handle command line usage
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Validation script error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, makeRequest, validateResponse };
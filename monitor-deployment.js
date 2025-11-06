#!/usr/bin/env node

/**
 * Render.com Deployment Monitor
 * Monitors deployment status and provides real-time feedback
 */

const https = require('https');

// Configuration
const DEPLOYMENT_URL = 'https://upload-backend-demo.onrender.com';
const CHECK_INTERVAL = 10000; // 10 seconds
const MAX_ATTEMPTS = 60; // 10 minutes total

let attempts = 0;
let deploymentStartTime = Date.now();

/**
 * Make HTTPS request with timeout
 */
function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { timeout }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
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
 * Check deployment status
 */
async function checkDeployment() {
  attempts++;
  const elapsed = Math.floor((Date.now() - deploymentStartTime) / 1000);
  
  console.log(`\n🔍 Attempt ${attempts}/${MAX_ATTEMPTS} (${elapsed}s elapsed)`);
  console.log(`📡 Checking: ${DEPLOYMENT_URL}/health`);
  
  try {
    const response = await makeRequest(`${DEPLOYMENT_URL}/health`);
    
    if (response.status === 200 && response.data && response.data.status) {
      console.log('✅ Deployment is LIVE!');
      console.log(`📊 Status: ${response.data.status}`);
      console.log(`🔧 Environment: ${response.data.environment}`);
      console.log(`⏱️  Uptime: ${response.data.uptime}s`);
      console.log(`🔗 MEGA Connected: ${response.data.megaConnected ? 'Yes' : 'No'}`);
      
      // Test additional endpoints
      await testAdditionalEndpoints();
      
      console.log('\n🎉 Deployment monitoring complete!');
      console.log(`🌐 Your backend is live at: ${DEPLOYMENT_URL}`);
      
      return true;
    } else {
      console.log(`❌ Service not ready - Status: ${response.status}`);
      if (response.data) {
        console.log(`📄 Response: ${JSON.stringify(response.data, null, 2)}`);
      }
    }
    
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      console.log('🚧 Service not deployed yet (DNS not resolved)');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🚧 Service starting up (connection refused)');
    } else {
      console.log(`⚠️  Connection error: ${error.message}`);
    }
  }
  
  return false;
}

/**
 * Test additional endpoints once deployment is live
 */
async function testAdditionalEndpoints() {
  console.log('\n🧪 Testing additional endpoints...');
  
  // Test /health/info
  try {
    const infoResponse = await makeRequest(`${DEPLOYMENT_URL}/health/info`);
    if (infoResponse.status === 200) {
      console.log('✅ /health/info - OK');
      if (infoResponse.data.megaConnected) {
        console.log(`📧 MEGA Account: ${infoResponse.data.megaAccount}`);
      }
    } else {
      console.log(`❌ /health/info - Status: ${infoResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ /health/info - Error: ${error.message}`);
  }
  
  // Test 404 handler
  try {
    const notFoundResponse = await makeRequest(`${DEPLOYMENT_URL}/nonexistent`);
    if (notFoundResponse.status === 404) {
      console.log('✅ 404 handler - OK');
    } else {
      console.log(`⚠️  404 handler - Unexpected status: ${notFoundResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ 404 handler test - Error: ${error.message}`);
  }
}

/**
 * Main monitoring loop
 */
async function monitorDeployment() {
  console.log('🚀 Render.com Deployment Monitor');
  console.log('================================');
  console.log(`📍 Target URL: ${DEPLOYMENT_URL}`);
  console.log(`⏰ Check interval: ${CHECK_INTERVAL / 1000}s`);
  console.log(`⏱️  Max wait time: ${(MAX_ATTEMPTS * CHECK_INTERVAL) / 60000} minutes`);
  console.log('\n🔄 Starting monitoring...');
  
  while (attempts < MAX_ATTEMPTS) {
    const isLive = await checkDeployment();
    
    if (isLive) {
      process.exit(0);
    }
    
    if (attempts < MAX_ATTEMPTS) {
      console.log(`⏳ Waiting ${CHECK_INTERVAL / 1000}s before next check...`);
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
  }
  
  console.log('\n⏰ Monitoring timeout reached');
  console.log('🔍 Possible issues:');
  console.log('  • Build is taking longer than expected');
  console.log('  • Environment variables not set correctly');
  console.log('  • MEGA authentication failing');
  console.log('  • Service configuration issues');
  console.log('\n📋 Next steps:');
  console.log('  1. Check Render.com dashboard for build logs');
  console.log('  2. Verify environment variables are set');
  console.log('  3. Check for any error messages in logs');
  console.log(`  4. Try manual check: ${DEPLOYMENT_URL}/health`);
  
  process.exit(1);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Monitoring stopped by user');
  console.log(`📊 Checked ${attempts} times over ${Math.floor((Date.now() - deploymentStartTime) / 1000)}s`);
  process.exit(0);
});

// Start monitoring
if (require.main === module) {
  monitorDeployment().catch(error => {
    console.error('💥 Monitor error:', error);
    process.exit(1);
  });
}

module.exports = { checkDeployment, testAdditionalEndpoints };
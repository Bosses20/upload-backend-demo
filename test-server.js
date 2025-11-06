const http = require('http');

// Test the health endpoint
function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Health endpoint test passed');
          console.log('Response:', response);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Test upload endpoint (should return 501)
function testUploadEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 501) {
            console.log('✅ Upload endpoint test passed (correctly returns 501)');
            console.log('Response:', response);
            resolve(response);
          } else {
            reject(new Error(`Expected 501, got ${res.statusCode}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Test status endpoint (should return 501)
function testStatusEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/status/TEST123',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 501) {
            console.log('✅ Status endpoint test passed (correctly returns 501)');
            console.log('Response:', response);
            resolve(response);
          } else {
            reject(new Error(`Expected 501, got ${res.statusCode}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing backend server endpoints...\n');
  
  try {
    await testHealthEndpoint();
    await testUploadEndpoint();
    await testStatusEndpoint();
    
    console.log('\n✅ All endpoint tests passed!');
    console.log('✅ Server structure is working correctly');
    console.log('✅ Ready for MEGA service integration in task 2');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Start server and run tests
const app = require('./server.js');
setTimeout(() => {
  runTests().then(() => {
    process.exit(0);
  });
}, 1000); // Wait for server to start
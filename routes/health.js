const express = require('express');
const megaService = require('../services/megaService');
const logger = require('../utils/logger');

const router = express.Router();

// Basic health endpoint for Render.com deployment verification only
router.get('/', async (req, res) => {
  try {
    // Get basic server status
    const serverStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // Check MEGA connection status (silent check)
    let megaConnected = false;
    try {
      megaConnected = await megaService.checkConnection();
    } catch (error) {
      // Silent failure - log to server console only
      console.log(`Health check - MEGA connection failed: ${error.message}`);
    }

    // Add MEGA status to response
    serverStatus.megaConnected = megaConnected;

    // Determine overall health status
    if (!megaConnected) {
      serverStatus.status = 'degraded';
    }

    // Log health check to server console only (not user-visible)
    console.log(`Health check - Status: ${serverStatus.status}, MEGA: ${megaConnected ? 'connected' : 'disconnected'}, Uptime: ${serverStatus.uptime}s`);

    // Return health status
    res.status(200).json(serverStatus);

  } catch (error) {
    // Log error to server console only
    console.error('Health check error:', error.message);
    
    // Return degraded status
    res.status(503).json({
      status: 'down',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: '1.0.0',
      error: 'Health check failed',
      megaConnected: false
    });
  }
});

// Minimal server info endpoint (for Render.com deployment verification)
router.get('/info', (req, res) => {
  try {
    const serverInfo = {
      name: 'MEGA Upload Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /health',
        'GET /health/info', 
        'POST /upload',
        'POST /upload/batch',
        'GET /upload/validate/:fileId'
      ]
    };

    // Log info request to server console only
    console.log(`Server info requested - Uptime: ${serverInfo.uptime}s`);

    res.status(200).json(serverInfo);

  } catch (error) {
    console.error('Server info error:', error.message);
    
    res.status(500).json({
      error: 'Server info unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
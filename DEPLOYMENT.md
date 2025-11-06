# Render.com Deployment Guide

## Prerequisites

1. GitHub repository: https://github.com/Bosses20/upload-backend-demo
2. Render.com account
3. MEGA account credentials (jakebosses@gmail.com)

## Deployment Steps

### 1. Connect GitHub Repository to Render.com

1. Log in to [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub account if not already connected
4. Select the repository: `Bosses20/upload-backend-demo`
5. Configure the service:
   - **Name**: `upload-backend-demo`
   - **Environment**: `Node`
   - **Region**: Choose closest to your location
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 2. Configure Environment Variables

In the Render.com dashboard, add these environment variables:

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `NODE_ENV` | `production` | Sets production mode |
| `MEGA_EMAIL` | `jakebosses@gmail.com` | MEGA account email |
| `MEGA_PASSWORD` | `jakebosses@gmail.com` | MEGA account password |

**Important**: Set MEGA credentials as "secret" environment variables for security.

### 3. Health Check Configuration

- **Health Check Path**: `/health`
- **Health Check Grace Period**: 60 seconds
- **Auto-Deploy**: Enabled (deploys on every push to main branch)

### 4. Deployment URL

After deployment, your backend will be available at:
```
https://upload-backend-demo.onrender.com
```

## Testing Deployment

### 1. Health Check
```bash
curl https://upload-backend-demo.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T...",
  "uptime": "...",
  "version": "1.0.0",
  "environment": "production"
}
```

### 2. MEGA Connection Test
```bash
curl https://upload-backend-demo.onrender.com/health/info
```

Expected response should include:
```json
{
  "megaConnected": true,
  "megaAccount": "jakebosses@gmail.com"
}
```

## Monitoring and Logs

### View Deployment Logs
1. Go to Render.com dashboard
2. Select your service: `upload-backend-demo`
3. Click "Logs" tab to view real-time logs

### Monitor Service Health
- Render.com provides automatic health monitoring
- Service will restart automatically if health checks fail
- Email notifications available for service issues

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that `package.json` has correct dependencies
   - Verify Node.js version compatibility (>=16.0.0)

2. **Environment Variable Issues**
   - Ensure MEGA credentials are set correctly
   - Check that variables are marked as "secret" for security

3. **Health Check Failures**
   - Verify `/health` endpoint responds correctly
   - Check MEGA authentication in logs

4. **Port Configuration**
   - Render.com automatically sets `PORT` environment variable
   - Server.js uses `process.env.PORT || 3000`

### Log Analysis
Monitor these log entries for successful deployment:
```
MEGA Upload Backend Server started
Port: [PORT_NUMBER]
Environment: production
Health check: https://upload-backend-demo.onrender.com/health
```

## Security Considerations

1. **Environment Variables**: MEGA credentials stored as encrypted secrets
2. **HTTPS**: All traffic automatically encrypted via Render.com
3. **Rate Limiting**: Built-in rate limiting for API endpoints
4. **CORS**: Configured for secure cross-origin requests

## Automatic Deployment

- **Trigger**: Push to `main` branch on GitHub
- **Process**: Render.com automatically detects changes and redeploys
- **Downtime**: Minimal downtime during deployment (usually <30 seconds)
- **Rollback**: Previous versions available for quick rollback if needed
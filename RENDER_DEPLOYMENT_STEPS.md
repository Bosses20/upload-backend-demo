# Render.com Deployment Steps

## 🚀 Quick Deployment Guide

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Configure Render.com deployment"
git push origin main
```

### Step 2: Create Render.com Web Service

1. **Go to Render.com Dashboard**
   - Visit: https://render.com/dashboard
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Select "Build and deploy from a Git repository"
   - Connect GitHub account if needed
   - Choose repository: `Bosses20/upload-backend-demo`
   - Click "Connect"

3. **Configure Service Settings**
   ```
   Name: upload-backend-demo
   Environment: Node
   Region: Oregon (US West) or closest to you
   Branch: main
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set Environment Variables**
   Click "Advanced" → "Environment Variables":
   ```
   NODE_ENV = production
   MEGA_EMAIL = jakebosses@gmail.com
   MEGA_PASSWORD = jakebosses@gmail.com
   ```
   ⚠️ **Important**: Mark MEGA credentials as "secret" variables

5. **Configure Health Check**
   ```
   Health Check Path: /health
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (usually 2-3 minutes)

### Step 3: Verify Deployment

Your service will be available at:
```
https://upload-backend-demo.onrender.com
```

**Test endpoints:**
```bash
# Health check
curl https://upload-backend-demo.onrender.com/health

# MEGA connection info
curl https://upload-backend-demo.onrender.com/health/info
```

### Step 4: Monitor Deployment

1. **View Logs**
   - Go to service dashboard
   - Click "Logs" tab
   - Monitor for successful startup messages

2. **Expected Log Messages**
   ```
   MEGA Upload Backend Server started
   Port: [PORT]
   Environment: production
   Health check: https://upload-backend-demo.onrender.com/health
   ```

## 🔧 Configuration Details

### Environment Variables Required
| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Sets production mode |
| `MEGA_EMAIL` | `jakebosses@gmail.com` | MEGA account email |
| `MEGA_PASSWORD` | `jakebosses@gmail.com` | MEGA account password |

### Automatic Features
- ✅ **Auto-deploy**: Deploys on every push to `main` branch
- ✅ **Health monitoring**: Automatic health checks every 30 seconds
- ✅ **HTTPS**: Automatic SSL certificate
- ✅ **Custom domain**: Available if needed
- ✅ **Zero downtime**: Rolling deployments

### Service Specifications
- **Plan**: Free tier (sufficient for demo)
- **Memory**: 512 MB
- **CPU**: Shared
- **Build time**: ~2-3 minutes
- **Cold start**: ~10-15 seconds

## 🧪 Testing Deployment

### Automated Testing
```bash
# Test deployment after it's live
npm run validate-deployment
```

### Manual Testing
```bash
# Health check
curl https://upload-backend-demo.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-06T...",
  "uptime": 123,
  "version": "1.0.0",
  "environment": "production",
  "megaConnected": true
}

# Info check
curl https://upload-backend-demo.onrender.com/health/info

# Expected response:
{
  "name": "MEGA Upload Backend",
  "version": "1.0.0",
  "environment": "production",
  "megaConnected": true,
  "megaAccount": "jakebosses@gmail.com",
  ...
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```
   Solution: Check package.json dependencies
   Verify: Node.js version >=16.0.0 in engines
   ```

2. **Environment Variables Not Set**
   ```
   Solution: Add MEGA_EMAIL and MEGA_PASSWORD in dashboard
   Verify: Mark as "secret" variables
   ```

3. **Health Check Failures**
   ```
   Solution: Verify /health endpoint responds
   Check: MEGA authentication in logs
   ```

4. **MEGA Connection Issues**
   ```
   Solution: Verify credentials are correct
   Check: MEGA service status
   ```

### Log Analysis
Monitor these patterns in logs:
```
✅ Success: "MEGA Upload Backend Server started"
✅ Success: "Health check - Status: healthy, MEGA: connected"
❌ Error: "MEGA authentication failed"
❌ Error: "Health check failed"
```

## 📊 Monitoring

### Key Metrics to Watch
- **Response time**: Should be <500ms for health checks
- **Uptime**: Should maintain 99%+ uptime
- **MEGA connection**: Should stay connected
- **Memory usage**: Should stay under 400MB

### Alerts Setup
Render.com provides:
- Email notifications for service down
- Slack integration available
- Custom webhook notifications

## 🔄 Updates and Maintenance

### Deploying Updates
1. Push changes to `main` branch
2. Render.com automatically detects and deploys
3. Zero downtime rolling deployment
4. Monitor logs for successful deployment

### Rollback Process
1. Go to Render.com dashboard
2. Click "Deploys" tab
3. Select previous successful deploy
4. Click "Redeploy"

### Maintenance Windows
- Render.com handles infrastructure maintenance
- No scheduled downtime required
- Automatic security updates applied
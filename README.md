# MEGA Upload Backend Demo

Node.js backend for handling MEGA Drive uploads from React Native app.

## Features

- Express.js server with MEGA SDK integration
- File upload handling with multipart support
- Device-based file organization
- Silent operation with system-only logging
- Deployed on Render.com for 24/7 uptime

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Start production server:
```bash
npm start
```

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /upload` - File upload endpoint (coming soon)
- `GET /status/:deviceId` - Upload status endpoint (coming soon)

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `MEGA_EMAIL` - MEGA account email
- `MEGA_PASSWORD` - MEGA account password

## Deployment

This backend is designed to be deployed on Render.com with automatic GitHub integration.
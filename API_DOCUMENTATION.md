# MEGA Upload Backend API Documentation

## Overview

This API provides endpoints for uploading files to MEGA Drive through a Node.js backend. The backend handles MEGA authentication, file organization, and upload processing for React Native apps.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://upload-backend-demo.onrender.com`

## Authentication

The API uses device ID validation for basic authentication. All upload endpoints require a valid `deviceId` parameter.

### Device ID Format
- 3-50 characters
- Alphanumeric with underscores and hyphens only
- Pattern: `^[a-zA-Z0-9_-]{3,50}$`

## Rate Limiting

- **Limit**: 100 requests per minute per device ID
- **Response**: 429 Too Many Requests when exceeded
- **Headers**: `retryAfter` field indicates seconds to wait

## Endpoints

### Health Check

#### GET /health

Check server health and MEGA connection status.

**Response:**
```json
{
  "status": "healthy|degraded|down",
  "timestamp": "2025-11-06T14:30:22.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "megaConnected": true
}
```

**Status Codes:**
- `200`: Server healthy
- `503`: Server down or degraded

#### GET /health/info

Get basic server information.

**Response:**
```json
{
  "name": "MEGA Upload Backend",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "timestamp": "2025-11-06T14:30:22.000Z",
  "endpoints": [
    "GET /health",
    "GET /health/info",
    "POST /upload",
    "POST /upload/batch",
    "GET /upload/validate/:fileId"
  ]
}
```

### File Upload

#### POST /upload

Upload a single file to MEGA Drive.

**Content-Type:** `multipart/form-data`

**Parameters:**
- `file` (file, required): The file to upload
- `deviceId` (string, required): Unique device identifier
- `sourceLocation` (string, optional): Source location type
  - Values: `DCIM_CAMERA`, `DCIM_SNAPCHAT`, `SNAPCHAT_ROOT`
  - Default: `DCIM_CAMERA`
- `originalPath` (string, optional): Original file path on device
- `timestamp` (number, optional): File timestamp

**Example Request:**
```bash
curl -X POST https://upload-backend-demo.onrender.com/upload \
  -F "file=@photo.jpg" \
  -F "deviceId=device_abc123" \
  -F "sourceLocation=DCIM_CAMERA"
```

**Success Response (200):**
```json
{
  "success": true,
  "uploadId": "device_abc123_1699276222000_xyz789",
  "fileName": "device_abc123_20251106_143022_photo.jpg",
  "originalName": "photo.jpg",
  "deviceId": "device_abc123",
  "sourceLocation": "DCIM_CAMERA",
  "fileSize": 2048576,
  "uploadTime": "2025-11-06T14:30:22.000Z",
  "uploadDurationMs": 1500,
  "folderPath": "KP-Demo-Files/DEVICE_device_abc123/DCIM_CAMERA",
  "fileId": "mega_file_id_123",
  "uploadSpeed": 1365717
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "uploadId": "device_abc123_1699276222000_xyz789",
  "error": "File validation failed",
  "message": "File too large. Maximum size: 100MB",
  "uploadDurationMs": 100,
  "retryable": false
}
```

#### POST /upload/batch

Upload multiple files in a single request.

**Content-Type:** `multipart/form-data`

**Parameters:**
- `files` (file[], required): Array of files to upload (max 10)
- `deviceId` (string, required): Unique device identifier
- `sourceLocation` (string, optional): Source location for all files

**Success Response (200/207):**
```json
{
  "success": true,
  "batchId": "batch_device_abc123_1699276222000_xyz789",
  "deviceId": "device_abc123",
  "sourceLocation": "DCIM_CAMERA",
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "totalTimeMs": 4500,
    "deviceId": "device_abc123",
    "sourceLocation": "DCIM_CAMERA"
  },
  "results": [
    {
      "success": true,
      "fileName": "device_abc123_20251106_143022_photo1.jpg",
      "fileId": "mega_file_id_123"
    },
    {
      "success": false,
      "fileName": "photo2.jpg",
      "error": "File too large"
    }
  ],
  "batchDurationMs": 4500
}
```

**Status Codes:**
- `200`: All files uploaded successfully
- `207`: Partial success (some files failed)
- `400`: Invalid request
- `500`: Server error

#### GET /upload/validate/:fileId

Validate that a file was successfully uploaded to MEGA.

**Parameters:**
- `fileId` (string, required): MEGA file ID to validate

**Response:**
```json
{
  "success": true,
  "validation": {
    "valid": true,
    "fileId": "mega_file_id_123",
    "fileName": "device_abc123_20251106_143022_photo.jpg",
    "fileSize": 2048576,
    "uploadDate": "2025-11-06T14:30:22.000Z"
  }
}
```

## File Organization

Files are organized in MEGA Drive using the following structure:

```
KP-Demo-Files/
├── DEVICE_{deviceId}/
│   ├── DCIM_CAMERA/
│   │   └── {deviceId}_{timestamp}_{originalName}
│   ├── DCIM_SNAPCHAT/
│   │   └── {deviceId}_{timestamp}_{originalName}
│   └── SNAPCHAT_ROOT/
│       └── {deviceId}_{timestamp}_{originalName}
```

### File Naming Convention

Format: `{deviceId}_{YYYYMMDD}_{HHMMSS}_{originalName}.{ext}`

Example: `device_abc123_20251106_143022_photo.jpg`

## Error Codes

### Client Errors (4xx)

- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Invalid or missing device ID
- `413 Payload Too Large`: File exceeds 100MB limit
- `429 Too Many Requests`: Rate limit exceeded

### Server Errors (5xx)

- `500 Internal Server Error`: Unexpected server error
- `503 Service Unavailable`: MEGA service unavailable

## File Limits

- **Maximum file size**: 100MB
- **Maximum files per batch**: 10 files
- **Supported file types**: All types accepted (for security research demo)
- **Rate limit**: 100 requests per minute per device

## Request/Response Schemas

### Upload Request Schema

```json
{
  "type": "object",
  "required": ["file", "deviceId"],
  "properties": {
    "file": {
      "type": "file",
      "description": "File to upload (max 100MB)"
    },
    "deviceId": {
      "type": "string",
      "pattern": "^[a-zA-Z0-9_-]{3,50}$",
      "description": "Unique device identifier"
    },
    "sourceLocation": {
      "type": "string",
      "enum": ["DCIM_CAMERA", "DCIM_SNAPCHAT", "SNAPCHAT_ROOT"],
      "default": "DCIM_CAMERA",
      "description": "Source location type"
    },
    "originalPath": {
      "type": "string",
      "description": "Original file path on device"
    },
    "timestamp": {
      "type": "number",
      "description": "File timestamp (Unix timestamp)"
    }
  }
}
```

### Upload Response Schema

```json
{
  "type": "object",
  "required": ["success"],
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Upload success status"
    },
    "uploadId": {
      "type": "string",
      "description": "Unique upload identifier"
    },
    "fileName": {
      "type": "string",
      "description": "Generated file name in MEGA"
    },
    "originalName": {
      "type": "string",
      "description": "Original file name"
    },
    "deviceId": {
      "type": "string",
      "description": "Device identifier"
    },
    "sourceLocation": {
      "type": "string",
      "description": "Source location type"
    },
    "fileSize": {
      "type": "number",
      "description": "File size in bytes"
    },
    "uploadTime": {
      "type": "string",
      "format": "date-time",
      "description": "Upload completion time"
    },
    "uploadDurationMs": {
      "type": "number",
      "description": "Upload duration in milliseconds"
    },
    "folderPath": {
      "type": "string",
      "description": "MEGA folder path"
    },
    "fileId": {
      "type": "string",
      "description": "MEGA file identifier"
    },
    "error": {
      "type": "string",
      "description": "Error message (if success is false)"
    },
    "retryable": {
      "type": "boolean",
      "description": "Whether the error is retryable"
    }
  }
}
```

## Example Usage

### JavaScript/React Native

```javascript
// Single file upload
const uploadFile = async (file, deviceId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('deviceId', deviceId);
  formData.append('sourceLocation', 'DCIM_CAMERA');

  try {
    const response = await fetch('https://upload-backend-demo.onrender.com/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Upload successful:', result.fileName);
    } else {
      console.error('Upload failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Health check
const checkHealth = async () => {
  try {
    const response = await fetch('https://upload-backend-demo.onrender.com/health');
    const health = await response.json();
    
    console.log('Server status:', health.status);
    console.log('MEGA connected:', health.megaConnected);
    
    return health;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};
```

### cURL Examples

```bash
# Health check
curl https://upload-backend-demo.onrender.com/health

# Single file upload
curl -X POST https://upload-backend-demo.onrender.com/upload \
  -F "file=@photo.jpg" \
  -F "deviceId=my_device_123" \
  -F "sourceLocation=DCIM_CAMERA"

# Batch upload
curl -X POST https://upload-backend-demo.onrender.com/upload/batch \
  -F "files=@photo1.jpg" \
  -F "files=@photo2.jpg" \
  -F "deviceId=my_device_123" \
  -F "sourceLocation=DCIM_SNAPCHAT"

# Validate upload
curl https://upload-backend-demo.onrender.com/upload/validate/mega_file_id_123
```

## Security Considerations

- All file types are accepted for security research demonstration purposes
- Device ID validation prevents unauthorized uploads
- Rate limiting prevents abuse
- File size limits prevent resource exhaustion
- CORS headers configured for cross-origin requests
- Security headers included in all responses

## Deployment

The backend is deployed on Render.com with automatic deployment from GitHub:

- **Repository**: https://github.com/Bosses20/upload-backend-demo
- **Deployment**: Automatic on push to main branch
- **Environment**: Node.js with Express.js
- **MEGA Credentials**: Configured via environment variables
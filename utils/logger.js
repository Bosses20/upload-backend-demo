// Simple logging utility for backend operations
// System-only logging (not user-visible)

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(data && { data })
    };
    
    return JSON.stringify(logEntry);
  }

  info(message, data = null) {
    console.log(this.formatMessage('info', message, data));
  }

  error(message, data = null) {
    console.error(this.formatMessage('error', message, data));
  }

  warn(message, data = null) {
    console.warn(this.formatMessage('warn', message, data));
  }

  debug(message, data = null) {
    if (this.logLevel === 'debug') {
      console.log(this.formatMessage('debug', message, data));
    }
  }

  // Log upload events
  logUpload(deviceId, fileName, fileSize, status) {
    this.info('File upload event', {
      deviceId,
      fileName,
      fileSize,
      status,
      event: 'upload'
    });
  }

  // Log MEGA operations
  logMegaOperation(operation, status, details = null) {
    this.info('MEGA operation', {
      operation,
      status,
      details,
      event: 'mega'
    });
  }

  // Log device activity
  logDeviceActivity(deviceId, activity, details = null) {
    this.info('Device activity', {
      deviceId,
      activity,
      details,
      event: 'device'
    });
  }
}

module.exports = new Logger();
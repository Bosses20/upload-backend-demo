// Device management service for organizing uploads by device
// Implementation will be completed in task 2

class DeviceManager {
  constructor() {
    this.devices = new Map();
  }

  registerDevice(deviceId, deviceInfo = {}) {
    // Device registration implementation coming in task 2
    this.devices.set(deviceId, {
      id: deviceId,
      registeredAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      uploadCount: 0,
      ...deviceInfo
    });
  }

  getDeviceInfo(deviceId) {
    return this.devices.get(deviceId) || null;
  }

  updateDeviceActivity(deviceId) {
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastActivity = new Date().toISOString();
      device.uploadCount += 1;
    }
  }

  generateFileName(deviceId, originalName, sourceLocation) {
    // File naming convention: DEVICEID_YYYYMMDD_HHMMSS_originalname.ext
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
    const extension = originalName.split('.').pop();
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    return `${deviceId}_${timestamp}_${baseName}.${extension}`;
  }

  getDeviceStats() {
    const stats = {};
    this.devices.forEach((device, deviceId) => {
      stats[deviceId] = {
        uploadCount: device.uploadCount,
        lastActivity: device.lastActivity,
        registeredAt: device.registeredAt
      };
    });
    return stats;
  }
}

module.exports = new DeviceManager();
import { env } from '../config/environment.js';

export function authenticateDevice(req, res, next) {
  const deviceKey = req.headers['x-device-key'] || req.body?.deviceApiKey || req.query?.deviceKey;

  if (!deviceKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized device. Missing x-device-key header.',
    });
  }

  if (deviceKey !== env.deviceApiKey) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden device. Invalid x-device-key credential.',
    });
  }

  next();
}

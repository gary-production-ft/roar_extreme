import { AuditLog } from '../models/AuditLog.js';
import { logger } from './logger.js';

/**
 * Record an administrative action into the AuditLog collection
 * @param {Object} req Express request object
 * @param {string} action Action identifier, e.g. 'MEMBER_CREATE', 'FACE_ENROL'
 * @param {string} targetResource Target resource, e.g. 'Member:123'
 * @param {Object} [details={}] Supplementary metadata
 */
export async function logAdminAudit(req, action, targetResource, details = {}) {
  try {
    const actorId = req.admin?.email || req.admin?.id || 'anonymous';
    const actorType = req.admin ? 'admin' : (req.headers['x-device-key'] ? 'system' : 'visitor');
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';

    await AuditLog.create({
      action,
      actorType,
      actorId: String(actorId),
      targetResource,
      details,
      ipAddress,
    });
  } catch (err) {
    logger.error(`Failed to record audit log [${action}]: ${err.message}`);
  }
}

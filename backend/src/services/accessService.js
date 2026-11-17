import { AccessLog } from '../models/AccessLog.js';
import { Attendance } from '../models/Attendance.js';
import { Device } from '../models/Device.js';
import { DoorEvent } from '../models/DoorEvent.js';
import { matchFaceDescriptor } from './faceMatchingService.js';
import { evaluateAccess } from './accessEvaluator.js';
import { triggerUnlockOnGrant } from './doorService.js';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

/**
 * Core verification controller logic for face-based kiosk check-in.
 * Single entry point ensuring auditability, liveness verification,
 * deduplicated attendance, brute-force denial lockout, and signed physical door unlock.
 *
 * @param {Object} params
 * @param {Array<number>} params.descriptor 128-d float array
 * @param {Object} [params.livenessProof] Challenge outcome from client camera
 * @param {string} [params.deviceId='kiosk-main'] Identifier of the scanning hardware
 * @param {Date} [params.now=new Date()]
 * @returns {Promise<{
 *   decision: 'granted' | 'denied',
 *   reason: string,
 *   memberName: string | null,
 *   daysRemaining: number,
 *   unlockDispatched?: boolean
 * }>}
 */
export async function verifyAccess({ descriptor, livenessProof, deviceId = 'kiosk-main', now = new Date() }) {
  // 0. Kiosk Brute-Force Lockout Guard
  const kioskDevice = await Device.findOne({ deviceId });
  if (kioskDevice && kioskDevice.isLockedOut()) {
    const minutesRemaining = Math.ceil((kioskDevice.lockedOutUntil.getTime() - now.getTime()) / 60000);
    logger.warn(`[KIOSK:LOCKOUT] Access scan rejected: Kiosk ${deviceId} locked out for ${minutesRemaining} more minute(s).`);
    return {
      decision: 'denied',
      reason: 'kiosk_locked_out',
      memberName: null,
      daysRemaining: 0,
      lockoutMinutes: minutesRemaining,
    };
  }

  const handleDenial = async (reason, member = null, matchDistance = null) => {
    const log = await AccessLog.create({
      memberId: member ? member._id : null,
      memberName: member ? member.name : null,
      decision: 'denied',
      reason,
      matchDistance,
      livenessResult: livenessProof || null,
      deviceId,
      timestamp: now,
      method: 'face',
    });

    // Record denial against device to protect against physical brute-force presentation attacks
    if (kioskDevice) {
      await kioskDevice.recordDenial(env.kioskLockoutDenialThreshold || 5, env.kioskLockoutDurationMs || 180000);
      if (kioskDevice.isLockedOut()) {
        await DoorEvent.create({
          doorId: kioskDevice.doorId || 'DOOR-ROOFTOP-MAIN',
          deviceId,
          eventType: 'kiosk_lockout',
          details: { reason: 'Exceeded maximum consecutive denied scans', threshold: env.kioskLockoutDenialThreshold || 5 },
          timestamp: now,
        });
      }
    }

    return {
      decision: 'denied',
      reason,
      memberName: member ? member.name : null,
      daysRemaining: 0,
      logId: log._id,
    };
  };

  // 1. Pluggable Liveness Verification
  if (!livenessProof || livenessProof.passed !== true) {
    return handleDenial('liveness_failed');
  }

  // 2. Biometric 1:N Euclidean Matching
  const matchResult = await matchFaceDescriptor(descriptor);
  if (!matchResult.matched) {
    return handleDenial(matchResult.reason || 'no_face_match', null, matchResult.distance);
  }

  const member = matchResult.member;

  // 3. Single Source of Truth Membership & Access Evaluation
  const accessDecision = await evaluateAccess(member, now);
  if (!accessDecision.allowed) {
    return handleDenial(accessDecision.reason, member, matchResult.distance);
  }

  // Reset any previous failed denial streak on a successful grant
  if (kioskDevice) {
    await kioskDevice.resetDenials();
  }

  // 4. Access is Allowed: Create Access Log
  const accessLog = await AccessLog.create({
    memberId: member._id,
    memberName: member.name,
    decision: 'granted',
    reason: 'granted',
    matchDistance: matchResult.distance,
    livenessResult: livenessProof,
    deviceId,
    timestamp: now,
    method: 'face',
  });

  // 5. Attendance Recording with Cool-down Deduplication
  const cooldownMs = (env.attendanceCooldownMinutes || 5) * 60 * 1000;
  const cooldownWindowStart = new Date(now.getTime() - cooldownMs);

  const recentAttendance = await Attendance.findOne({
    memberId: member._id,
    checkInTime: { $gte: cooldownWindowStart },
  });

  if (!recentAttendance) {
    await Attendance.create({
      memberId: member._id,
      checkInTime: now,
      method: 'face',
      accessLogId: accessLog._id,
    });
    logger.info(`Recorded attendance check-in for member ${member.name} (${member.memberId})`);
  } else {
    logger.info(`Attendance cooldown active for member ${member.name}; access granted without duplicate check-in.`);
  }

  // 6. PHASE 2: Dispatch Signed Unlock Command to Physical Door Lock!
  // Rule: Unlock occurs ONLY after a logged GRANT
  const unlockRes = await triggerUnlockOnGrant(accessLog._id, deviceId, now.getTime());

  return {
    decision: 'granted',
    reason: 'granted',
    memberName: member.name,
    daysRemaining: accessDecision.daysRemaining,
    logId: accessLog._id,
    unlockDispatched: unlockRes.unlocked,
  };
}

import { Door } from '../models/Door.js';
import { Device } from '../models/Device.js';
import { DoorEvent } from '../models/DoorEvent.js';
import { AccessLog } from '../models/AccessLog.js';
import { signUnlockCommand } from '../utils/commandSigner.js';
import { getDoorTransport } from './doorTransport/index.js';
import { logAdminAudit } from '../utils/auditLogger.js';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

// In-memory lookup for active device plain secrets (or retrieved securely from env/key-vault)
const devicePlainSecrets = new Map([
  ['lock-esp32-01', process.env.LOCK_DEVICE_SECRET || 'roar_esp32_lock_hmac_secret_key_2026!'],
]);

export function registerDeviceSecretInMemory(deviceId, secret) {
  devicePlainSecrets.set(deviceId, secret);
}

/**
 * Ensure default door and lock device exist in database
 */
export async function ensureDefaultDoorAndDevices() {
  const defaultDoorId = 'DOOR-ROOFTOP-MAIN';
  const defaultLockDeviceId = 'lock-esp32-01';
  const defaultKioskDeviceId = 'kiosk-main';

  // 1. Ensure Lock Controller Device
  let lockDev = await Device.findOne({ deviceId: defaultLockDeviceId });
  if (!lockDev) {
    const plainSecret = devicePlainSecrets.get(defaultLockDeviceId);
    const { hash, salt } = Device.hashSecret(plainSecret);
    lockDev = await Device.create({
      deviceId: defaultLockDeviceId,
      type: 'lock',
      name: 'Rooftop Entrance ESP32 Lock Controller',
      secretHash: hash,
      secretSalt: salt,
      doorId: defaultDoorId,
      status: 'online',
      firmwareVersion: '1.2.0-esp32',
      lastSeen: new Date(),
    });
    logger.info(`Provisioned default lock device: ${defaultLockDeviceId}`);
  }

  // 2. Ensure Kiosk Device
  let kioskDev = await Device.findOne({ deviceId: defaultKioskDeviceId });
  if (!kioskDev) {
    const { hash, salt } = Device.hashSecret('roar_kiosk_key_2026');
    kioskDev = await Device.create({
      deviceId: defaultKioskDeviceId,
      type: 'kiosk',
      name: 'Rooftop Entrance Kiosk Tablet',
      secretHash: hash,
      secretSalt: salt,
      doorId: defaultDoorId,
      status: 'online',
      lastSeen: new Date(),
    });
    logger.info(`Provisioned default kiosk device: ${defaultKioskDeviceId}`);
  }

  // 3. Ensure Main Rooftop Door
  let door = await Door.findOne({ doorId: defaultDoorId });
  if (!door) {
    door = await Door.create({
      doorId: defaultDoorId,
      name: '6th Floor Rooftop Arena Entrance',
      description: 'Main rooftop entrance door above 5th-floor staircase',
      status: 'locked',
      isLockedDown: false,
      lockType: 'maglock',
      failMode: 'fail_safe',
      unlockDurationSeconds: 5,
      kioskDeviceId: defaultKioskDeviceId,
      lockDeviceId: defaultLockDeviceId,
    });
    logger.info(`Provisioned default door: ${defaultDoorId}`);
  }

  return { door, lockDev, kioskDev };
}

/**
 * Trigger physical lock unlock upon a strictly validated, logged GRANT
 * Rule: NO UNLOCK WITHOUT A FRESH LOGGED GRANT!
 *
 * @param {string} accessLogId ID of the persisted AccessLog record
 * @param {string} [kioskDeviceId='kiosk-main'] Identifier of requesting kiosk
 * @param {number} [now=Date.now()] Timestamp
 * @returns {Promise<{ unlocked: boolean, reason?: string, command?: Object }>}
 */
export async function triggerUnlockOnGrant(accessLogId, kioskDeviceId = 'kiosk-main', now = Date.now()) {
  // 1. Verify AccessLog exists and decision is 'granted'
  const accessLog = await AccessLog.findById(accessLogId);
  if (!accessLog) {
    logger.error(`[LOCK:REJECT] Cannot unlock door: AccessLog record ${accessLogId} not found.`);
    return { unlocked: false, reason: 'access_log_not_found' };
  }

  if (accessLog.decision !== 'granted') {
    logger.error(`[LOCK:REJECT] Attempted unlock with non-granted AccessLog status: ${accessLog.decision}`);
    return { unlocked: false, reason: 'access_not_granted' };
  }

  // Check freshness (log must be within last 10 seconds)
  const ageMs = now - new Date(accessLog.timestamp).getTime();
  if (ageMs > 10000) {
    logger.error(`[LOCK:REJECT] AccessLog ${accessLogId} is stale (${ageMs}ms old).`);
    return { unlocked: false, reason: 'grant_stale' };
  }

  // 2. Find Door Associated with this Kiosk
  let door = await Door.findOne({ kioskDeviceId });
  if (!door) {
    door = await Door.findOne(); // Fallback to default door
  }

  if (!door) {
    logger.error('[LOCK:REJECT] No door configured for kiosk.');
    return { unlocked: false, reason: 'door_not_configured' };
  }

  // 3. Strict Lockdown Check
  if (door.isLockedDown) {
    await DoorEvent.create({
      doorId: door.doorId,
      deviceId: kioskDeviceId,
      eventType: 'lockdown_blocked',
      accessLogId: accessLog._id,
      details: { memberName: accessLog.memberName, reason: 'Unlock suppressed by active studio lockdown' },
      timestamp: new Date(now),
    });
    logger.warn(`[LOCK:LOCKDOWN] Access granted for ${accessLog.memberName}, but door ${door.doorId} is in LOCKDOWN mode.`);
    return { unlocked: false, reason: 'door_locked_down' };
  }

  // 4. Retrieve Secret for the Lock Controller Device
  const lockDeviceId = door.lockDeviceId;
  const secret = devicePlainSecrets.get(lockDeviceId) || process.env.LOCK_DEVICE_SECRET || 'roar_esp32_lock_hmac_secret_key_2026!';

  // 5. Generate Cryptographic Signed Unlock Command
  const signedCommand = signUnlockCommand({
    doorId: door.doorId,
    accessLogId: String(accessLog._id),
    secret,
    durationSeconds: door.unlockDurationSeconds || 5,
    expiryMs: env.doorCommandExpiryMs || 5000,
    now,
  });

  // 6. Record DoorEvent (command issued)
  await DoorEvent.create({
    doorId: door.doorId,
    deviceId: lockDeviceId,
    eventType: 'unlock_command',
    accessLogId: accessLog._id,
    commandId: signedCommand.commandId,
    details: {
      memberName: accessLog.memberName,
      memberId: accessLog.memberId,
      durationSeconds: door.unlockDurationSeconds,
    },
    timestamp: new Date(now),
  });

  // 7. Dispatch via Active Transport (MQTT or In-Memory Simulated)
  const transport = getDoorTransport();
  await transport.publishUnlockCommand(door.doorId, signedCommand);

  // Update door status
  door.status = 'unlocked';
  door.lastCommandAt = new Date(now);
  await door.save();

  logger.info(`[DOOR:UNLOCKED] Signed unlock command dispatched to ${door.doorId} for ${accessLog.memberName}.`);

  return {
    unlocked: true,
    command: signedCommand,
  };
}

/**
 * Role-protected manual unlock (e.g. Receptionist buzzer or Owner override)
 */
export async function manualUnlockDoor(doorId, reason, adminUser, req = null, durationSeconds = 5) {
  if (!reason || reason.trim().length < 3) {
    throw new Error('A mandatory reason is required for manual door unlock.');
  }

  const door = await Door.findOne({ doorId });
  if (!door) throw new Error('Door not found.');

  if (door.isLockedDown) {
    throw new Error('Cannot manually unlock: Door is in emergency lockdown mode.');
  }

  const lockDeviceId = door.lockDeviceId;
  const secret = devicePlainSecrets.get(lockDeviceId) || process.env.LOCK_DEVICE_SECRET || 'roar_esp32_lock_hmac_secret_key_2026!';

  const now = Date.now();
  const signedCommand = signUnlockCommand({
    doorId: door.doorId,
    accessLogId: 'manual_admin_override',
    secret,
    durationSeconds,
    expiryMs: 5000,
    now,
  });

  await DoorEvent.create({
    doorId: door.doorId,
    deviceId: lockDeviceId,
    eventType: 'manual_unlock',
    commandId: signedCommand.commandId,
    details: {
      initiatedBy: adminUser.email,
      adminName: adminUser.name,
      reason,
      durationSeconds,
    },
    timestamp: new Date(now),
  });

  const transport = getDoorTransport();
  await transport.publishUnlockCommand(door.doorId, signedCommand);

  door.status = 'unlocked';
  door.lastCommandAt = new Date(now);
  await door.save();

  if (req) {
    await logAdminAudit(req, 'MANUAL_DOOR_UNLOCK', `Door:${door.doorId}`, {
      reason,
      admin: adminUser.email,
      durationSeconds,
    });
  }

  return { success: true, door, command: signedCommand };
}

/**
 * Toggle emergency lockdown mode
 */
export async function toggleDoorLockdown(doorId, shouldLockdown, adminUser, reason = '', req = null) {
  const door = await Door.findOne({ doorId });
  if (!door) throw new Error('Door not found.');

  door.isLockedDown = shouldLockdown;
  door.status = shouldLockdown ? 'locked_down' : 'locked';
  await door.save();

  await DoorEvent.create({
    doorId: door.doorId,
    deviceId: door.lockDeviceId,
    eventType: shouldLockdown ? 'lockdown_enabled' : 'lockdown_disabled',
    details: {
      initiatedBy: adminUser.email,
      reason: reason || (shouldLockdown ? 'Emergency security lockdown initiated' : 'Lockdown released'),
    },
    timestamp: new Date(),
  });

  const transport = getDoorTransport();
  await transport.publishLockdown(door.doorId, shouldLockdown);

  if (req) {
    await logAdminAudit(req, shouldLockdown ? 'DOOR_LOCKDOWN_ENABLED' : 'DOOR_LOCKDOWN_RELEASED', `Door:${door.doorId}`, {
      reason,
      admin: adminUser.email,
    });
  }

  return door;
}

/**
 * Ingest telemetry, status reports, and acks from the ESP32 hardware
 */
export async function handleInboundDeviceEvent({ doorId, eventType, deviceId, details = {} }) {
  const now = new Date();

  // Update device presence
  if (deviceId) {
    await Device.findOneAndUpdate(
      { deviceId },
      {
        $set: {
          lastSeen: now,
          status: 'online',
          ...(details.firmwareVersion ? { firmwareVersion: details.firmwareVersion } : {}),
          ...(details.ipAddress ? { ipAddress: details.ipAddress } : {}),
        },
      },
      { upsert: false }
    );
  }

  // Update door state
  const door = await Door.findOne({ doorId });
  if (door) {
    door.lastEventAt = now;
    if (eventType === 'relock' && !door.isLockedDown) {
      door.status = 'locked';
    } else if (eventType === 'unlock_ack') {
      door.status = 'unlocked';
    }
    await door.save();
  }

  // Persist DoorEvent
  await DoorEvent.create({
    doorId,
    deviceId: deviceId || (door ? door.lockDeviceId : ''),
    eventType: eventType || 'heartbeat',
    details,
    timestamp: now,
  });
}

/**
 * Background sweep: mark devices offline if heartbeat missed (> 45s)
 */
export async function sweepOfflineDevices() {
  const cutoff = new Date(Date.now() - (env.deviceHeartbeatTimeoutMs || 45000));
  const result = await Device.updateMany(
    {
      status: 'online',
      lastSeen: { $lt: cutoff },
    },
    {
      $set: { status: 'offline' },
    }
  );

  if (result.modifiedCount > 0) {
    logger.warn(`[DEVICE SWEEP] Marked ${result.modifiedCount} device(s) offline due to missed heartbeats.`);
  }
}

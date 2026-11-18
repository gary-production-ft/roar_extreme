import { z } from 'zod';
import { Door } from '../models/Door.js';
import { Device } from '../models/Device.js';
import { DoorEvent } from '../models/DoorEvent.js';
import { manualUnlockDoor, toggleDoorLockdown } from '../services/doorService.js';
import { logAdminAudit } from '../utils/auditLogger.js';

export const manualUnlockSchema = z.object({
  body: z.object({
    reason: z.string().min(3, 'A clear reason is required for manual unlock (min 3 chars)'),
    durationSeconds: z.number().int().min(1).max(30).default(5),
  }),
});

export const lockdownSchema = z.object({
  body: z.object({
    lockdown: z.boolean(),
    reason: z.string().optional(),
  }),
});

export const createDeviceSchema = z.object({
  body: z.object({
    deviceId: z.string().min(3),
    type: z.enum(['kiosk', 'lock', 'sensor']),
    name: z.string().min(2),
    secret: z.string().min(8),
    doorId: z.string().optional(),
  }),
});

export async function listDoors(req, res, next) {
  try {
    const doors = await Door.find().sort({ createdAt: -1 });
    const devices = await Device.find();
    const devMap = new Map(devices.map((d) => [d.deviceId, d]));

    const enriched = doors.map((door) => {
      const lockDev = devMap.get(door.lockDeviceId);
      const kioskDev = devMap.get(door.kioskDeviceId);
      return {
        ...door.toObject(),
        lockDevice: lockDev ? { status: lockDev.status, lastSeen: lockDev.lastSeen, firmwareVersion: lockDev.firmwareVersion } : null,
        kioskDevice: kioskDev ? { status: kioskDev.status, lastSeen: kioskDev.lastSeen } : null,
      };
    });

    res.json({ success: true, doors: enriched });
  } catch (err) {
    next(err);
  }
}

export async function handleManualUnlock(req, res, next) {
  try {
    const { id } = req.params;
    const { reason, durationSeconds } = req.validatedData.body;

    const result = await manualUnlockDoor(id, reason, req.admin, req, durationSeconds);
    res.json({
      success: true,
      message: `Manual unlock command dispatched to door ${id}.`,
      door: result.door,
      command: result.command,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleToggleLockdown(req, res, next) {
  try {
    const { id } = req.params;
    const { lockdown, reason } = req.validatedData.body;

    const door = await toggleDoorLockdown(id, lockdown, req.admin, reason, req);
    res.json({
      success: true,
      door,
      message: lockdown
        ? `EMERGENCY LOCKDOWN ACTIVATED for door ${id}. All access suspended.`
        : `Lockdown released for door ${id}. Normal access restored.`,
    });
  } catch (err) {
    next(err);
  }
}

export async function listDoorEvents(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '25', 10);
    const { doorId, eventType } = req.query;

    const query = {};
    if (doorId) query.doorId = doorId;
    if (eventType) query.eventType = eventType;

    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      DoorEvent.find(query).populate('accessLogId').sort({ timestamp: -1 }).skip(skip).limit(limit),
      DoorEvent.countDocuments(query),
    ]);

    res.json({
      success: true,
      events,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function exportDoorEventsCsv(req, res, next) {
  try {
    const events = await DoorEvent.find().sort({ timestamp: -1 }).limit(1000);
    const headers = ['Timestamp', 'Door ID', 'Device ID', 'Event Type', 'Command ID', 'Details'];
    const rows = events.map((e) => [
      new Date(e.timestamp).toLocaleString('en-IN'),
      e.doorId,
      e.deviceId || '',
      e.eventType,
      e.commandId || '',
      `"${JSON.stringify(e.details || {}).replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="roar_door_events_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function listDevices(req, res, next) {
  try {
    const devices = await Device.find().select('-secretHash -secretSalt').sort({ lastSeen: -1 });
    res.json({ success: true, devices });
  } catch (err) {
    next(err);
  }
}

export async function createDevice(req, res, next) {
  try {
    const { deviceId, type, name, secret, doorId } = req.validatedData.body;
    const { hash, salt } = Device.hashSecret(secret);

    const device = await Device.create({
      deviceId,
      type,
      name,
      secretHash: hash,
      secretSalt: salt,
      doorId: doorId || null,
      status: 'offline',
    });

    await logAdminAudit(req, 'DEVICE_PROVISIONED', `Device:${device.deviceId}`, { type, name });
    res.status(201).json({
      success: true,
      device: { deviceId: device.deviceId, type: device.type, name: device.name },
      message: 'Hardware device registered successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function resetDeviceLockout(req, res, next) {
  try {
    const { id } = req.params;
    const device = await Device.findOne({ deviceId: id });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found.' });

    await device.resetDenials();
    await Device.updateOne({ _id: device._id }, { $set: { status: 'online' } });

    await logAdminAudit(req, 'DEVICE_LOCKOUT_RESET', `Device:${device.deviceId}`, {
      admin: req.admin.email,
    });

    res.json({
      success: true,
      message: `Lockout cleared for device ${device.deviceId}.`,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleSeedDemoData(req, res, next) {
  try {
    const { seedAttendanceAndDoors } = await import('../scripts/seedAttendanceAndDoors.js');
    await seedAttendanceAndDoors();
    res.json({
      success: true,
      message: 'Successfully seeded demo attendance, doors, devices, members, and access logs into database.',
    });
  } catch (err) {
    next(err);
  }
}

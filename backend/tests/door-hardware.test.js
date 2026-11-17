import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { env } from '../src/config/environment.js';
import { Door } from '../src/models/Door.js';
import { Device } from '../src/models/Device.js';
import { DoorEvent } from '../src/models/DoorEvent.js';
import { AccessLog } from '../src/models/AccessLog.js';
import { Admin } from '../src/models/Admin.js';
import { Member } from '../src/models/Member.js';
import { MembershipPlan } from '../src/models/MembershipPlan.js';
import {
  signUnlockCommand,
  verifyUnlockCommand,
  buildCanonicalPayload,
  _resetSeenNonces,
} from '../src/utils/commandSigner.js';
import {
  triggerUnlockOnGrant,
  manualUnlockDoor,
  toggleDoorLockdown,
  handleInboundDeviceEvent,
  sweepOfflineDevices,
  ensureDefaultDoorAndDevices,
} from '../src/services/doorService.js';
import { SimulatedDoorTransport } from '../src/services/doorTransport/SimulatedDoorTransport.js';
import { setDoorTransport } from '../src/services/doorTransport/index.js';
import { verifyAccess } from '../src/services/accessService.js';

let testTransport;
let testDoor;
let testLockDev;
let testKioskDev;
let ownerToken;
let receptionistToken;
let trainerToken;
let testMember;
let testPlan;
const testSecret = 'vitest_shared_esp32_secret_key_12345';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.mongoUri);
  }

  // Use isolated in-memory simulated transport for vitest
  testTransport = new SimulatedDoorTransport();
  await testTransport.init();
  setDoorTransport(testTransport);

  // Clear collections for test isolation
  await Door.deleteMany({ doorId: { $regex: /^TEST-/ } });
  await Device.deleteMany({ deviceId: { $regex: /^test-/ } });
  await DoorEvent.deleteMany({ doorId: { $regex: /^TEST-/ } });
  await AccessLog.deleteMany({ deviceId: 'test-kiosk-unit' });
  await Member.deleteMany({ phone: '9888877777' });
  await MembershipPlan.deleteMany({ name: 'Hardware Test Plan' });
  await Admin.deleteMany({ email: { $in: ['door_owner@roar.com', 'door_rec@roar.com', 'door_trn@roar.com'] } });

  // Provision Admin accounts with distinct roles
  const owner = await Admin.create({
    name: 'Door Owner Admin',
    email: 'door_owner@roar.com',
    passwordHash: 'dummyhash',
    role: 'owner',
    isActive: true,
  });
  const receptionist = await Admin.create({
    name: 'Door Receptionist',
    email: 'door_rec@roar.com',
    passwordHash: 'dummyhash',
    role: 'receptionist',
    isActive: true,
  });
  const trainer = await Admin.create({
    name: 'Door Trainer',
    email: 'door_trn@roar.com',
    passwordHash: 'dummyhash',
    role: 'trainer',
    isActive: true,
  });

  ownerToken = jwt.sign({ id: owner._id, email: owner.email, role: 'owner' }, env.jwtSecret, { expiresIn: '1h' });
  receptionistToken = jwt.sign({ id: receptionist._id, email: receptionist.email, role: 'receptionist' }, env.jwtSecret, { expiresIn: '1h' });
  trainerToken = jwt.sign({ id: trainer._id, email: trainer.email, role: 'trainer' }, env.jwtSecret, { expiresIn: '1h' });

  // Provision test membership plan & active member
  testPlan = await MembershipPlan.create({
    name: 'Hardware Test Plan',
    durationDays: 30,
    price: 6000,
    active: true,
  });

  const now = new Date();
  testMember = await Member.create({
    memberId: 'ROAR-M-HWTEST',
    name: 'Rohan Mehra',
    phone: '9888877777',
    email: 'rohan.hw@example.com',
    status: 'active',
    planId: testPlan._id,
    membershipStartDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    membershipEndDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
    paymentStatus: 'paid',
    amountDue: 0,
    isBlocked: false,
    isFrozen: false,
    faceConsent: { given: true, timestamp: now, noticeVersion: '1.0' },
    faceEnrolled: true,
  });

  // Provision Devices and Door
  const { hash, salt } = Device.hashSecret(testSecret);
  testLockDev = await Device.create({
    deviceId: 'test-esp32-lock',
    type: 'lock',
    name: 'Test Rooftop ESP32 Controller',
    secretHash: hash,
    secretSalt: salt,
    doorId: 'TEST-DOOR-ROOFTOP',
    status: 'online',
    firmwareVersion: '1.2.0-esp32',
    lastSeen: new Date(),
  });

  testKioskDev = await Device.create({
    deviceId: 'test-kiosk-unit',
    type: 'kiosk',
    name: 'Test Kiosk Face Unit',
    secretHash: hash,
    secretSalt: salt,
    doorId: 'TEST-DOOR-ROOFTOP',
    status: 'online',
    lastSeen: new Date(),
  });

  testDoor = await Door.create({
    doorId: 'TEST-DOOR-ROOFTOP',
    name: 'Test Rooftop Door',
    description: 'Hardware test door for rooftop turnstile',
    status: 'locked',
    isLockedDown: false,
    lockType: 'maglock',
    failMode: 'fail_safe',
    unlockDurationSeconds: 5,
    lockDeviceId: testLockDev.deviceId,
    kioskDeviceId: testKioskDev.deviceId,
  });
});

beforeEach(async () => {
  _resetSeenNonces();
  await Door.updateOne({ doorId: testDoor.doorId }, { isLockedDown: false, status: 'locked' });
});

afterAll(async () => {
  await Door.deleteMany({ doorId: { $regex: /^TEST-/ } });
  await Device.deleteMany({ deviceId: { $regex: /^test-/ } });
  await DoorEvent.deleteMany({ doorId: { $regex: /^TEST-/ } });
  await AccessLog.deleteMany({ deviceId: 'test-kiosk-unit' });
  await Member.deleteMany({ phone: '9888877777' });
  await MembershipPlan.deleteMany({ name: 'Hardware Test Plan' });
  await Admin.deleteMany({ email: { $in: ['door_owner@roar.com', 'door_rec@roar.com', 'door_trn@roar.com'] } });
});

describe('Phase 2 Hardware Access — Cryptographic Command Signing & Verification', () => {
  it('generates a valid HMAC-SHA256 signature with nonce and expiry', () => {
    const now = Date.now();
    const command = signUnlockCommand({
      doorId: 'TEST-DOOR-ROOFTOP',
      accessLogId: 'log_abc_123',
      secret: testSecret,
      durationSeconds: 5,
      expiryMs: 5000,
      now,
    });

    expect(command.commandId).toBeDefined();
    expect(command.doorId).toBe('TEST-DOOR-ROOFTOP');
    expect(command.accessLogId).toBe('log_abc_123');
    expect(command.timestamp).toBe(now);
    expect(command.expiresAt).toBe(now + 5000);
    expect(command.nonce).toHaveLength(32); // 16 bytes hex
    expect(command.signature).toHaveLength(64); // SHA-256 hex string

    // Verification passes with identical secret and valid clock
    const verification = verifyUnlockCommand(command, testSecret, { now: now + 500 });
    expect(verification.valid).toBe(true);
  });

  it('rejects an invalid or tampered HMAC signature', () => {
    const now = Date.now();
    const command = signUnlockCommand({
      doorId: 'TEST-DOOR-ROOFTOP',
      accessLogId: 'log_abc_123',
      secret: testSecret,
      durationSeconds: 5,
      expiryMs: 5000,
      now,
    });

    // Verification with wrong secret fails
    const wrongSecretResult = verifyUnlockCommand(command, 'wrong_secret_key_12345', { now: now + 500 });
    expect(wrongSecretResult.valid).toBe(false);
    expect(wrongSecretResult.error).toBe('invalid_signature');

    // Verification of tampered duration fails
    const tamperedCommand = { ...command, durationSeconds: 60 };
    const tamperedResult = verifyUnlockCommand(tamperedCommand, testSecret, { now: now + 500 });
    expect(tamperedResult.valid).toBe(false);
    expect(tamperedResult.error).toBe('invalid_signature');
  });

  it('rejects expired command (replay outside 5s window)', () => {
    const now = Date.now();
    const command = signUnlockCommand({
      doorId: 'TEST-DOOR-ROOFTOP',
      accessLogId: 'log_abc_123',
      secret: testSecret,
      durationSeconds: 5,
      expiryMs: 5000,
      now,
    });

    // Attempting verification 6 seconds later (> 5s expiry)
    const result = verifyUnlockCommand(command, testSecret, { now: now + 6000 });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('command_expired');
  });

  it('rejects replay attack when reusing the exact same nonce', () => {
    const now = Date.now();
    const command = signUnlockCommand({
      doorId: 'TEST-DOOR-ROOFTOP',
      accessLogId: 'log_abc_123',
      secret: testSecret,
      durationSeconds: 5,
      expiryMs: 5000,
      now,
    });

    // First attempt succeeds
    const firstAttempt = verifyUnlockCommand(command, testSecret, { now: now + 100 });
    expect(firstAttempt.valid).toBe(true);

    // Second attempt with duplicate nonce is blocked by anti-replay cache
    const replayAttempt = verifyUnlockCommand(command, testSecret, { now: now + 200 });
    expect(replayAttempt.valid).toBe(false);
    expect(replayAttempt.error).toBe('replay_detected');
  });

  it('rejects timestamps significantly in the future (clock skew)', () => {
    const now = Date.now();
    const command = signUnlockCommand({
      doorId: 'TEST-DOOR-ROOFTOP',
      accessLogId: 'log_abc_123',
      secret: testSecret,
      durationSeconds: 5,
      expiryMs: 5000,
      now: now + 10000, // 10s into future
    });

    const result = verifyUnlockCommand(command, testSecret, { now });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('future_timestamp_detected');
  });
});

describe('Phase 2 Rule Enforcement — No Unlock Without a Fresh Logged GRANT', () => {
  it('refuses unlock if AccessLog record does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const result = await triggerUnlockOnGrant(fakeId, testKioskDev.deviceId);
    expect(result.unlocked).toBe(false);
    expect(result.reason).toBe('access_log_not_found');
  });

  it('refuses unlock if AccessLog decision is "denied"', async () => {
    const deniedLog = await AccessLog.create({
      memberId: testMember._id,
      memberName: testMember.name,
      decision: 'denied',
      reason: 'membership_expired',
      deviceId: testKioskDev.deviceId,
      timestamp: new Date(),
      method: 'face',
    });

    const result = await triggerUnlockOnGrant(deniedLog._id, testKioskDev.deviceId);
    expect(result.unlocked).toBe(false);
    expect(result.reason).toBe('access_not_granted');
  });

  it('refuses unlock if AccessLog is stale (> 10s old)', async () => {
    const staleTime = new Date(Date.now() - 15000);
    const staleLog = await AccessLog.create({
      memberId: testMember._id,
      memberName: testMember.name,
      decision: 'granted',
      reason: 'granted',
      deviceId: testKioskDev.deviceId,
      timestamp: staleTime,
      method: 'face',
    });

    const result = await triggerUnlockOnGrant(staleLog._id, testKioskDev.deviceId);
    expect(result.unlocked).toBe(false);
    expect(result.reason).toBe('grant_stale');
  });

  it('successfully dispatches signed unlock command on fresh valid GRANT', async () => {
    const freshLog = await AccessLog.create({
      memberId: testMember._id,
      memberName: testMember.name,
      decision: 'granted',
      reason: 'granted',
      deviceId: testKioskDev.deviceId,
      timestamp: new Date(),
      method: 'face',
    });

    let publishedCommand = null;
    const commandListener = ({ doorId, command }) => {
      if (doorId === testDoor.doorId) {
        publishedCommand = command;
      }
    };
    testTransport.on('command', commandListener);

    const result = await triggerUnlockOnGrant(freshLog._id, testKioskDev.deviceId);
    testTransport.off('command', commandListener);

    expect(result.unlocked).toBe(true);
    expect(result.command).toBeDefined();
    expect(result.command.doorId).toBe(testDoor.doorId);
    expect(result.command.accessLogId).toBe(String(freshLog._id));
    expect(publishedCommand).toBeDefined();

    // Verify door updated to unlocked
    const updatedDoor = await Door.findOne({ doorId: testDoor.doorId });
    expect(updatedDoor.status).toBe('unlocked');

    // Verify DoorEvent logged
    const event = await DoorEvent.findOne({
      doorId: testDoor.doorId,
      eventType: 'unlock_command',
      commandId: result.command.commandId,
    });
    expect(event).toBeDefined();
    expect(event.details.memberName).toBe(testMember.name);
  });
});

describe('Phase 2 Emergency Lockdown & Security Overrides', () => {
  it('blocks all unlocks when door is in emergency lockdown mode', async () => {
    try {
      // Put door into lockdown
      await Door.updateOne({ doorId: testDoor.doorId }, { isLockedDown: true, status: 'locked_down' });

      const freshLog = await AccessLog.create({
        memberId: testMember._id,
        memberName: testMember.name,
        decision: 'granted',
        reason: 'granted',
        deviceId: testKioskDev.deviceId,
        timestamp: new Date(),
        method: 'face',
      });

      const result = await triggerUnlockOnGrant(freshLog._id, testKioskDev.deviceId);
      expect(result.unlocked).toBe(false);
      expect(result.reason).toBe('door_locked_down');

      // Check lockdown_blocked event was recorded
      const blockEvent = await DoorEvent.findOne({
        doorId: testDoor.doorId,
        eventType: 'lockdown_blocked',
        accessLogId: freshLog._id,
      });
      expect(blockEvent).toBeDefined();
    } finally {
      // Release lockdown
      await Door.updateOne({ doorId: testDoor.doorId }, { isLockedDown: false, status: 'locked' });
    }
  });

  it('requires a non-empty reason for manual unlock', async () => {
    const adminUser = { email: 'door_owner@roar.com', name: 'Owner' };
    await expect(manualUnlockDoor(testDoor.doorId, '', adminUser)).rejects.toThrow(
      'A mandatory reason is required for manual door unlock.'
    );
  });

  it('executes manual unlock with reason and records DoorEvent', async () => {
    const adminUser = { email: 'door_rec@roar.com', name: 'Receptionist' };
    const res = await manualUnlockDoor(testDoor.doorId, 'Delivery person buzzer override', adminUser);

    expect(res.success).toBe(true);
    expect(res.command.accessLogId).toBe('manual_admin_override');

    const manualEvent = await DoorEvent.findOne({
      doorId: testDoor.doorId,
      eventType: 'manual_unlock',
      commandId: res.command.commandId,
    });
    expect(manualEvent).toBeDefined();
    expect(manualEvent.details.reason).toBe('Delivery person buzzer override');
    expect(manualEvent.details.initiatedBy).toBe('door_rec@roar.com');
  });
});

describe('Phase 2 Kiosk Brute-Force Presentation Protection & Lockout', () => {
  it('locks out kiosk device after 5 consecutive denials within 3 minutes', async () => {
    const kiosk = await Device.findOne({ deviceId: testKioskDev.deviceId });
    await kiosk.resetDenials();

    // Record 4 denials
    for (let i = 0; i < 4; i++) {
      await kiosk.recordDenial(5, 180000);
    }
    let updated = await Device.findOne({ deviceId: testKioskDev.deviceId });
    expect(updated.consecutiveDenials).toBe(4);
    expect(updated.isLockedOut()).toBe(false);

    // 5th denial triggers lockout
    await updated.recordDenial(5, 180000);
    updated = await Device.findOne({ deviceId: testKioskDev.deviceId });
    expect(updated.consecutiveDenials).toBe(5);
    expect(updated.status).toBe('locked_out');
    expect(updated.isLockedOut()).toBe(true);
    expect(updated.lockedOutUntil.getTime()).toBeGreaterThan(Date.now());

    // Clean up
    await updated.resetDenials();
  });
});

describe('Phase 2 Device Telemetry, Inbound Events & Offline Sweep', () => {
  it('updates device presence and door state on inbound hardware telemetry', async () => {
    await handleInboundDeviceEvent({
      doorId: testDoor.doorId,
      deviceId: testLockDev.deviceId,
      eventType: 'unlock_ack',
      details: { firmwareVersion: '1.2.1-esp32', ipAddress: '192.168.1.150' },
    });

    const dev = await Device.findOne({ deviceId: testLockDev.deviceId });
    expect(dev.status).toBe('online');
    expect(dev.firmwareVersion).toBe('1.2.1-esp32');
    expect(dev.ipAddress).toBe('192.168.1.150');

    // On relock event, door status updates back to locked
    await handleInboundDeviceEvent({
      doorId: testDoor.doorId,
      deviceId: testLockDev.deviceId,
      eventType: 'relock',
      details: {},
    });

    const door = await Door.findOne({ doorId: testDoor.doorId });
    expect(door.status).toBe('locked');
  });

  it('marks devices offline if lastSeen exceeds heartbeat timeout', async () => {
    // Force device lastSeen to 2 minutes ago
    await Device.updateOne(
      { deviceId: testLockDev.deviceId },
      { lastSeen: new Date(Date.now() - 120000), status: 'online' }
    );

    await sweepOfflineDevices();

    const staleDev = await Device.findOne({ deviceId: testLockDev.deviceId });
    expect(staleDev.status).toBe('offline');

    // Restore to online for subsequent tests
    await Device.updateOne(
      { deviceId: testLockDev.deviceId },
      { lastSeen: new Date(), status: 'online' }
    );
  });
});

describe('Phase 2 Admin Door & Device REST APIs', () => {
  it('GET /api/admin/doors returns configured doors with device metadata', async () => {
    const res = await request(app)
      .get('/api/admin/doors')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.doors)).toBe(true);
    const found = res.body.doors.find((d) => d.doorId === testDoor.doorId);
    expect(found).toBeDefined();
    expect(found.lockType).toBe('maglock');
  });

  it('POST /api/admin/doors/:id/unlock executes manual unlock (receptionist)', async () => {
    const res = await request(app)
      .post(`/api/admin/doors/${testDoor.doorId}/unlock`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({ reason: 'Member forgot phone, identity verified at desk' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.command).toBeDefined();
    expect(res.body.door.status).toBe('unlocked');
  });

  it('POST /api/admin/doors/:id/unlock rejects empty reason with 400', async () => {
    const res = await request(app)
      .post(`/api/admin/doors/${testDoor.doorId}/unlock`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({ reason: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/admin/doors/:id/lockdown allows owner to engage and release emergency lockdown', async () => {
    // 1. Engage lockdown
    const lockRes = await request(app)
      .post(`/api/admin/doors/${testDoor.doorId}/lockdown`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ lockdown: true, reason: 'Police drill in neighborhood' });

    expect(lockRes.status).toBe(200);
    expect(lockRes.body.success).toBe(true);
    expect(lockRes.body.door.isLockedDown).toBe(true);
    expect(lockRes.body.door.status).toBe('locked_down');

    // 2. Release lockdown
    const releaseRes = await request(app)
      .post(`/api/admin/doors/${testDoor.doorId}/lockdown`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ lockdown: false, reason: 'Drill ended, normal access resumed' });

    expect(releaseRes.status).toBe(200);
    expect(releaseRes.body.success).toBe(true);
    expect(releaseRes.body.door.isLockedDown).toBe(false);
  });

  it('GET /api/admin/doors/events returns paginated telemetry events', async () => {
    const res = await request(app)
      .get('/api/admin/doors/events')
      .set('Authorization', `Bearer ${receptionistToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });
});

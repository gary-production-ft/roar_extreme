import mongoose from 'mongoose';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { MembershipPlan } from '../models/MembershipPlan.js';
import { Member } from '../models/Member.js';
import { Door } from '../models/Door.js';
import { Device } from '../models/Device.js';
import { AccessLog } from '../models/AccessLog.js';
import { Attendance } from '../models/Attendance.js';
import { DoorEvent } from '../models/DoorEvent.js';
import { Admin } from '../models/Admin.js';

export async function seedAttendanceAndDoors() {
  const isDirect = mongoose.connection.readyState === 0;
  if (isDirect) {
    await mongoose.connect(env.mongoUri);
    logger.info('Connected to MongoDB Atlas for Attendance & Door simulation seeding...');
  }

  // 0. Ensure Admin Account
  const existingAdmin = await Admin.findOne({ email: 'admin@roarextreme.com' });
  if (!existingAdmin) {
    const passwordHash = await Admin.hashPassword('RoarAdmin#2026');
    await Admin.create({
      name: 'Roar Operations Admin',
      email: 'admin@roarextreme.com',
      passwordHash,
      role: 'owner',
      isActive: true,
      mustChangePassword: false,
    });
    logger.info('Provisioned default admin: admin@roarextreme.com (Password: RoarAdmin#2026)');
  }

  // 1. Ensure Membership Plans
  const plansData = [
    { name: 'Monthly Pass', durationDays: 30, price: 6500, active: true, features: ['Gym Access', 'Locker Room'] },
    { name: 'Quarterly Transformation', durationDays: 90, price: 8500, active: true, features: ['Gym Access', 'Cardio Zone', 'Body Comp Review'] },
    { name: 'Annual Beast Membership', durationDays: 365, price: 12000, active: true, features: ['Unrestricted 365 Days', 'Priority Batch', 'Sauna Access'] },
  ];

  const planMap = {};
  for (const p of plansData) {
    let plan = await MembershipPlan.findOne({ name: p.name });
    if (!plan) {
      plan = await MembershipPlan.create(p);
      logger.info(`Created plan: ${p.name}`);
    }
    planMap[p.name] = plan._id;
  }

  // 2. Ensure Doors
  const doorsData = [
    {
      doorId: 'DOOR-ROOFTOP-MAIN',
      name: '6th Floor Rooftop Arena Entrance',
      description: 'Main rooftop entrance turnstile above 5th-floor staircase',
      status: 'locked',
      isLockedDown: false,
      lockType: 'maglock',
      failMode: 'fail_safe',
      unlockDurationSeconds: 5,
      kioskDeviceId: 'kiosk-main',
      lockDeviceId: 'lock-esp32-01',
    },
    {
      doorId: 'DOOR-STRENGTH-ZONE',
      name: 'Strength & Free Weights Arena',
      description: 'Secondary access door to dedicated powerlifting platform',
      status: 'locked',
      isLockedDown: false,
      lockType: 'maglock',
      failMode: 'fail_safe',
      unlockDurationSeconds: 5,
      kioskDeviceId: 'kiosk-main',
      lockDeviceId: 'lock-esp32-02',
    },
    {
      doorId: 'DOOR-RECOVERY-LOUNGE',
      name: 'Steam & Recovery Lounge',
      description: 'Private recovery suites and athlete changing rooms',
      status: 'locked',
      isLockedDown: false,
      lockType: 'strike',
      failMode: 'fail_secure',
      unlockDurationSeconds: 7,
      kioskDeviceId: 'kiosk-main',
      lockDeviceId: 'lock-esp32-01',
    },
  ];

  for (const d of doorsData) {
    await Door.findOneAndUpdate({ doorId: d.doorId }, { $set: d }, { upsert: true, new: true });
  }
  logger.info(`Seeded ${doorsData.length} doors.`);

  // 3. Ensure Hardware Devices
  const devicesData = [
    {
      deviceId: 'kiosk-main',
      type: 'kiosk',
      name: 'Rooftop Entrance Kiosk Tablet',
      doorId: 'DOOR-ROOFTOP-MAIN',
      status: 'online',
      firmwareVersion: '2.1.0-android',
      lastSeen: new Date(),
    },
    {
      deviceId: 'lock-esp32-01',
      type: 'lock',
      name: 'Rooftop Main Turnstile Controller (ESP32-W5500)',
      doorId: 'DOOR-ROOFTOP-MAIN',
      status: 'online',
      firmwareVersion: '1.4.2-esp32',
      lastSeen: new Date(),
    },
    {
      deviceId: 'lock-esp32-02',
      type: 'lock',
      name: 'Strength Arena Lock Controller (ESP32)',
      doorId: 'DOOR-STRENGTH-ZONE',
      status: 'online',
      firmwareVersion: '1.4.2-esp32',
      lastSeen: new Date(),
    },
  ];

  for (const dev of devicesData) {
    const existing = await Device.findOne({ deviceId: dev.deviceId });
    if (!existing) {
      const { hash, salt } = Device.hashSecret('roar_secret_device_pass');
      await Device.create({
        ...dev,
        secretHash: hash,
        secretSalt: salt,
      });
    } else {
      await Device.updateOne({ deviceId: dev.deviceId }, { $set: { status: 'online', lastSeen: new Date() } });
    }
  }
  logger.info(`Seeded ${devicesData.length} devices.`);

  // 4. Seed Realistic Members
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 3600 * 1000);
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 3600 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 3600 * 1000);

  const membersData = [
    {
      memberId: 'MEM-2026-001',
      name: 'Vikram Shinde',
      phone: '9822012345',
      email: 'vikram.shinde@example.com',
      status: 'active',
      planId: planMap['Annual Beast Membership'],
      membershipStartDate: thirtyDaysAgo,
      membershipEndDate: oneYearLater,
      paymentStatus: 'paid',
      amountDue: 0,
      emergencyContact: { name: 'Kavita Shinde', phone: '9822012346', relation: 'Spouse' },
    },
    {
      memberId: 'MEM-2026-002',
      name: 'Neha Patil',
      phone: '9822054321',
      email: 'neha.patil@example.com',
      status: 'active',
      planId: planMap['Quarterly Transformation'],
      membershipStartDate: thirtyDaysAgo,
      membershipEndDate: threeMonthsLater,
      paymentStatus: 'paid',
      amountDue: 0,
      emergencyContact: { name: 'Rajesh Patil', phone: '9822054322', relation: 'Brother' },
    },
    {
      memberId: 'MEM-2026-003',
      name: 'Rahul Kulkarni',
      phone: '9822098765',
      email: 'rahul.kulkarni@example.com',
      status: 'active',
      planId: planMap['Monthly Pass'],
      membershipStartDate: new Date(now.getTime() - 10 * 24 * 3600 * 1000),
      membershipEndDate: thirtyDaysLater,
      paymentStatus: 'paid',
      amountDue: 0,
    },
    {
      memberId: 'MEM-2026-004',
      name: 'Ananya Deshmukh',
      phone: '9822011223',
      email: 'ananya.deshmukh@example.com',
      status: 'expired',
      planId: planMap['Monthly Pass'],
      membershipStartDate: new Date(now.getTime() - 35 * 24 * 3600 * 1000),
      membershipEndDate: fiveDaysAgo,
      paymentStatus: 'paid',
      amountDue: 0,
    },
    {
      memberId: 'MEM-2026-005',
      name: 'Sameer Joshi',
      phone: '9822099887',
      email: 'sameer.joshi@example.com',
      status: 'pending',
      planId: planMap['Monthly Pass'],
      membershipStartDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
      membershipEndDate: thirtyDaysLater,
      paymentStatus: 'pending',
      amountDue: 6500,
    },
    {
      memberId: 'MEM-2026-006',
      name: 'Pooja Sharma',
      phone: '9822066778',
      email: 'pooja.sharma@example.com',
      status: 'active',
      planId: planMap['Annual Beast Membership'],
      membershipStartDate: thirtyDaysAgo,
      membershipEndDate: oneYearLater,
      paymentStatus: 'paid',
      amountDue: 0,
    },
  ];

  const seededMembers = [];
  for (const m of membersData) {
    const member = await Member.findOneAndUpdate(
      { phone: m.phone },
      { $set: m },
      { upsert: true, new: true }
    );
    seededMembers.push(member);
  }
  logger.info(`Seeded ${seededMembers.length} active and test members.`);

  // 5. Seed Historical Attendance & Access Logs (Past 5 Days + Today)
  const activeMembers = seededMembers.filter((m) => m.status === 'active');
  let accessLogCount = 0;
  let attendanceCount = 0;
  let doorEventCount = 0;

  // Clear previous simulated logs so they don't pile up uncontrollably
  await AccessLog.deleteMany({ deviceId: 'kiosk-main' });
  await Attendance.deleteMany({ method: { $in: ['face', 'manual'] } });
  await DoorEvent.deleteMany({ doorId: { $in: ['DOOR-ROOFTOP-MAIN', 'DOOR-STRENGTH-ZONE'] } });

  for (let dayOffset = 4; dayOffset >= 0; dayOffset--) {
    const dayDate = new Date(now.getTime() - dayOffset * 24 * 3600 * 1000);

    for (const member of activeMembers) {
      // 80% chance member checked in on this day
      if (Math.random() > 0.25 || dayOffset === 0) {
        // Morning batch: 06:30 - 08:30 AM
        const checkInTime = new Date(dayDate);
        checkInTime.setHours(6 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0);

        // 1. Create AccessLog (Granted)
        const accessLog = await AccessLog.create({
          memberId: member._id,
          memberName: member.name,
          decision: 'granted',
          reason: 'granted',
          matchDistance: Number((0.32 + Math.random() * 0.1).toFixed(3)),
          livenessResult: { score: 0.96, passed: true },
          deviceId: 'kiosk-main',
          method: 'face',
          timestamp: checkInTime,
        });
        accessLogCount++;

        // 2. Create Attendance
        await Attendance.create({
          memberId: member._id,
          checkInTime: checkInTime,
          method: 'face',
          accessLogId: accessLog._id,
        });
        attendanceCount++;

        // 3. Create Door Events for this unlock
        const cmdId = `cmd_${Math.random().toString(36).substring(2, 9)}`;
        await DoorEvent.create({
          doorId: 'DOOR-ROOFTOP-MAIN',
          deviceId: 'lock-esp32-01',
          eventType: 'unlock_command',
          accessLogId: accessLog._id,
          commandId: cmdId,
          details: { triggeredBy: 'kiosk_face_match', memberId: member.memberId, name: member.name },
          timestamp: checkInTime,
        });

        const ackTime = new Date(checkInTime.getTime() + 150);
        await DoorEvent.create({
          doorId: 'DOOR-ROOFTOP-MAIN',
          deviceId: 'lock-esp32-01',
          eventType: 'unlock_ack',
          commandId: cmdId,
          details: { state: 'unlocked', durationSeconds: 5 },
          timestamp: ackTime,
        });

        const openTime = new Date(checkInTime.getTime() + 1200);
        await DoorEvent.create({
          doorId: 'DOOR-ROOFTOP-MAIN',
          deviceId: 'lock-esp32-01',
          eventType: 'door_opened',
          timestamp: openTime,
        });

        const closeTime = new Date(checkInTime.getTime() + 4500);
        await DoorEvent.create({
          doorId: 'DOOR-ROOFTOP-MAIN',
          deviceId: 'lock-esp32-01',
          eventType: 'door_closed',
          timestamp: closeTime,
        });

        const relockTime = new Date(checkInTime.getTime() + 5000);
        await DoorEvent.create({
          doorId: 'DOOR-ROOFTOP-MAIN',
          deviceId: 'lock-esp32-01',
          eventType: 'relock',
          timestamp: relockTime,
        });
        doorEventCount += 5;
      }
    }
  }

  // 6. Add Denied Check-in Attempts (for Testing Edge Cases & Security Audits)
  const expiredMember = seededMembers.find((m) => m.name === 'Ananya Deshmukh');
  if (expiredMember) {
    const expiredAttemptTime = new Date(now.getTime() - 2 * 3600 * 1000);
    await AccessLog.create({
      memberId: expiredMember._id,
      memberName: expiredMember.name,
      decision: 'denied',
      reason: 'membership_expired',
      matchDistance: 0.34,
      livenessResult: { score: 0.95, passed: true },
      deviceId: 'kiosk-main',
      method: 'face',
      timestamp: expiredAttemptTime,
    });
    accessLogCount++;
  }

  const pendingMember = seededMembers.find((m) => m.name === 'Sameer Joshi');
  if (pendingMember) {
    const pendingAttemptTime = new Date(now.getTime() - 4 * 3600 * 1000);
    await AccessLog.create({
      memberId: pendingMember._id,
      memberName: pendingMember.name,
      decision: 'denied',
      reason: 'payment_pending',
      matchDistance: 0.35,
      livenessResult: { score: 0.94, passed: true },
      deviceId: 'kiosk-main',
      method: 'face',
      timestamp: pendingAttemptTime,
    });
    accessLogCount++;
  }

  // Unknown visitor
  const visitorTime = new Date(now.getTime() - 6 * 3600 * 1000);
  await AccessLog.create({
    memberId: null,
    memberName: 'Unregistered Visitor',
    decision: 'denied',
    reason: 'no_face_match',
    matchDistance: 0.78,
    livenessResult: { score: 0.92, passed: true },
    deviceId: 'kiosk-main',
    method: 'face',
    timestamp: visitorTime,
  });
  accessLogCount++;

  // 7. Add Controller Heartbeats
  const heartbeatTime = new Date(now.getTime() - 15 * 60 * 1000);
  await DoorEvent.create({
    doorId: 'DOOR-ROOFTOP-MAIN',
    deviceId: 'lock-esp32-01',
    eventType: 'heartbeat',
    details: { uptimeSeconds: 86400, rssi: -58, heapFreeBytes: 184200 },
    timestamp: heartbeatTime,
  });
  doorEventCount++;

  logger.info(`✅ Successfully seeded:`);
  logger.info(`   - ${seededMembers.length} Members (Active, Expired, Pending)`);
  logger.info(`   - ${doorsData.length} Doors (Rooftop Turnstile, Strength Arena, Recovery Lounge)`);
  logger.info(`   - ${devicesData.length} Hardware Devices (Kiosk + ESP32s)`);
  logger.info(`   - ${accessLogCount} Access Logs (Granted + Denied scenarios)`);
  logger.info(`   - ${attendanceCount} Attendance Records`);
  logger.info(`   - ${doorEventCount} Door Events & Telemetry Signals`);

  if (isDirect) {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB Atlas.');
  }
}

if (process.argv[1]?.endsWith('seedAttendanceAndDoors.js')) {
  seedAttendanceAndDoors().catch((err) => {
    logger.error('Error seeding attendance and door data:', err);
    process.exit(1);
  });
}

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { env } from '../src/config/environment.js';
import { Member } from '../src/models/Member.js';
import { MembershipPlan } from '../src/models/MembershipPlan.js';
import { Payment } from '../src/models/Payment.js';
import { FaceTemplate } from '../src/models/FaceTemplate.js';
import { AccessLog } from '../src/models/AccessLog.js';
import { Attendance } from '../src/models/Attendance.js';
import { Admin } from '../src/models/Admin.js';
import { Lead } from '../src/models/Lead.js';
import { evaluateAccess } from '../src/services/accessEvaluator.js';
import { encryptDescriptor, decryptDescriptor, euclideanDistance } from '../src/utils/faceCrypto.js';
import { verifyAccess } from '../src/services/accessService.js';

let testPlan;
let ownerToken;
let receptionistToken;
let trainerToken;

// Sample 128-d face descriptors for synthetic tests
function makeMockDescriptor(baseVal = 0.1) {
  return Array.from({ length: 128 }, (_, i) => baseVal + Math.sin(i) * 0.01);
}

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.mongoUri);
  }

  // Clear existing test collections
  await Member.deleteMany({ phone: { $regex: /^9999/ } });
  await MembershipPlan.deleteMany({ name: 'Vitest Test Plan' });
  await AccessLog.deleteMany({ deviceId: 'vitest-test-kiosk' });
  await Attendance.deleteMany({});
  await Lead.deleteMany({ bookingReference: { $regex: /^ROAR-TEST-LEAD/ } });
  await Admin.deleteMany({ email: { $in: ['test_owner@roar.com', 'test_rec@roar.com', 'test_trainer@roar.com'] } });

  // Provision plans
  testPlan = await MembershipPlan.create({
    name: 'Vitest Test Plan',
    durationDays: 30,
    price: 5000,
    active: true,
  });

  // Provision test admins with different roles
  const owner = await Admin.create({
    name: 'Gym Owner',
    email: 'test_owner@roar.com',
    passwordHash: 'hash',
    role: 'owner',
  });
  const receptionist = await Admin.create({
    name: 'Desk Receptionist',
    email: 'test_rec@roar.com',
    passwordHash: 'hash',
    role: 'receptionist',
  });
  const trainer = await Admin.create({
    name: 'Floor Trainer',
    email: 'test_trainer@roar.com',
    passwordHash: 'hash',
    role: 'trainer',
  });

  ownerToken = jwt.sign({ id: owner._id, email: owner.email, role: owner.role }, env.jwtSecret);
  receptionistToken = jwt.sign({ id: receptionist._id, email: receptionist.email, role: receptionist.role }, env.jwtSecret);
  trainerToken = jwt.sign({ id: trainer._id, email: trainer.email, role: trainer.role }, env.jwtSecret);
});

afterAll(async () => {
  await Member.deleteMany({ phone: { $regex: /^9999/ } });
  await MembershipPlan.deleteMany({ name: 'Vitest Test Plan' });
  await AccessLog.deleteMany({ deviceId: 'vitest-test-kiosk' });
  await Lead.deleteMany({ bookingReference: { $regex: /^ROAR-TEST-LEAD/ } });
  await Admin.deleteMany({ email: { $in: ['test_owner@roar.com', 'test_rec@roar.com', 'test_trainer@roar.com'] } });
  await mongoose.disconnect();
});

describe('ROAR EXTREME — Membership & Biometric Access Control Tests', () => {
  describe('Biometric Cryptography (AES-256-GCM) & Distances', () => {
    it('encrypts and decrypts 128-d face descriptors accurately without data loss', () => {
      const original = makeMockDescriptor(0.25);
      const encrypted = encryptDescriptor(original);

      expect(typeof encrypted).toBe('string');
      expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/); // iv:authTag:ciphertext

      const decrypted = decryptDescriptor(encrypted);
      expect(decrypted.length).toBe(128);
      for (let i = 0; i < 128; i++) {
        expect(decrypted[i]).toBeCloseTo(original[i], 5);
      }
    });

    it('computes Euclidean distance accurately between descriptors', () => {
      const descA = [0, 0, 0];
      const descB = [3, 4, 0];
      expect(euclideanDistance(descA, descB)).toBe(5);
    });
  });

  describe('evaluateAccess Single Source of Truth Decision Engine', () => {
    // Normal open test time: Wednesday 10:00 AM IST (04:30 AM UTC)
    const testWednesday10AM = new Date('2026-11-18T04:30:00.000Z');

    it('grants access to a paid, active member with days remaining', async () => {
      const startDate = new Date('2026-11-01');
      const endDate = new Date('2026-11-30');

      const mockMember = {
        name: 'Arjun Tendulkar',
        status: 'active',
        isBlocked: false,
        isFrozen: false,
        paymentStatus: 'paid',
        membershipStartDate: startDate,
        membershipEndDate: endDate,
      };

      const result = await evaluateAccess(mockMember, testWednesday10AM);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('granted');
      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.memberName).toBe('Arjun Tendulkar');
    });

    it('flags warning when 7 days or fewer remain', async () => {
      const startDate = new Date('2026-11-01');
      const endDate = new Date('2026-11-20'); // 2 days after test date

      const mockMember = {
        name: 'Pooja Sharma',
        status: 'active',
        isBlocked: false,
        isFrozen: false,
        paymentStatus: 'paid',
        membershipStartDate: startDate,
        membershipEndDate: endDate,
      };

      const result = await evaluateAccess(mockMember, testWednesday10AM);
      expect(result.allowed).toBe(true);
      expect(result.warningExpiringSoon).toBe(true);
      expect(result.daysRemaining).toBeLessThanOrEqual(7);
    });

    it('denies access if membership is expired', async () => {
      const startDate = new Date('2026-10-01');
      const endDate = new Date('2026-11-10'); // Expired before Nov 18

      const mockMember = {
        name: 'Rohan Mehra',
        status: 'active',
        isBlocked: false,
        isFrozen: false,
        paymentStatus: 'paid',
        membershipStartDate: startDate,
        membershipEndDate: endDate,
      };

      const result = await evaluateAccess(mockMember, testWednesday10AM);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('membership_expired');
    });

    it('denies access if payment is pending or overdue', async () => {
      const mockMember = {
        name: 'Karan Johar',
        status: 'active',
        isBlocked: false,
        isFrozen: false,
        paymentStatus: 'pending',
        membershipStartDate: new Date('2026-11-01'),
        membershipEndDate: new Date('2026-11-30'),
      };

      const result = await evaluateAccess(mockMember, testWednesday10AM);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('payment_pending');
    });

    it('denies access if member is frozen', async () => {
      const mockMember = {
        name: 'Sunil Gavaskar',
        status: 'frozen',
        isBlocked: false,
        isFrozen: true,
        paymentStatus: 'paid',
        membershipStartDate: new Date('2026-11-01'),
        membershipEndDate: new Date('2026-11-30'),
      };

      const result = await evaluateAccess(mockMember, testWednesday10AM);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('membership_frozen');
    });

    it('denies access if member is blocked', async () => {
      const mockMember = {
        name: 'Blocked User',
        status: 'blocked',
        isBlocked: true,
        isFrozen: false,
        paymentStatus: 'paid',
        membershipStartDate: new Date('2026-11-01'),
        membershipEndDate: new Date('2026-11-30'),
      };

      const result = await evaluateAccess(mockMember, testWednesday10AM);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('member_blocked');
    });

    it('denies access if attempted outside operating hours', async () => {
      // 03:00 AM IST (21:30 PM UTC previous day)
      const testEarlyMorning3AM = new Date('2026-11-17T21:30:00.000Z');

      const mockMember = {
        name: 'Night Owl',
        status: 'active',
        isBlocked: false,
        isFrozen: false,
        paymentStatus: 'paid',
        membershipStartDate: new Date('2026-11-01'),
        membershipEndDate: new Date('2026-11-30'),
      };

      const result = await evaluateAccess(mockMember, testEarlyMorning3AM);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('outside_hours');
    });
  });

  describe('Kiosk Access Verification & Duplicate Cool-down Deduplication', () => {
    let enrolledMember;
    const testDescriptor = makeMockDescriptor(0.3);

    beforeAll(async () => {
      enrolledMember = await Member.create({
        memberId: 'ROAR-M-TEST01',
        name: 'Sanjay Dutt',
        phone: '9999000001',
        email: 'sanjay@test.com',
        status: 'active',
        planId: testPlan._id,
        membershipStartDate: new Date('2026-11-01'),
        membershipEndDate: new Date('2026-12-31'),
        paymentStatus: 'paid',
        amountDue: 0,
        faceConsent: { given: true, timestamp: new Date(), noticeVersion: '1.0-DPDP-2023' },
        faceEnrolled: true,
      });

      const encrypted = [
        encryptDescriptor(testDescriptor),
        encryptDescriptor(testDescriptor),
        encryptDescriptor(testDescriptor),
      ];

      await FaceTemplate.create({
        memberId: enrolledMember._id,
        encryptedDescriptors: encrypted,
        descriptorCount: 3,
      });
    });

    it('denies access if liveness proof fails or is missing', async () => {
      const res = await verifyAccess({
        descriptor: testDescriptor,
        livenessProof: { passed: false },
        deviceId: 'vitest-test-kiosk',
      });

      expect(res.decision).toBe('denied');
      expect(res.reason).toBe('liveness_failed');

      const log = await AccessLog.findById(res.logId);
      expect(log).toBeTruthy();
      expect(log.decision).toBe('denied');
      expect(log.reason).toBe('liveness_failed');
    });

    it('grants access to matching enrolled member and records attendance', async () => {
      const evalTime = new Date('2026-11-18T05:00:00.000Z'); // 10:30 AM IST

      const res = await verifyAccess({
        descriptor: testDescriptor,
        livenessProof: { passed: true, challenge: 'blink', confidence: 0.95 },
        deviceId: 'vitest-test-kiosk',
        now: evalTime,
      });

      expect(res.decision).toBe('granted');
      expect(res.memberName).toBe('Sanjay Dutt');
      expect(res.daysRemaining).toBeGreaterThan(0);

      // Verify attendance was written
      const attendance = await Attendance.findOne({ memberId: enrolledMember._id, checkInTime: evalTime });
      expect(attendance).toBeTruthy();
      expect(attendance.method).toBe('face');
    });

    it('prevents duplicate attendance check-in within cool-down window (5 mins)', async () => {
      const initialTime = new Date('2026-11-18T06:00:00.000Z'); // 11:30 AM IST
      const duplicateTime = new Date('2026-11-18T06:02:00.000Z'); // 11:32 AM IST (2 min later)

      // First check-in
      const first = await verifyAccess({
        descriptor: testDescriptor,
        livenessProof: { passed: true },
        deviceId: 'vitest-test-kiosk',
        now: initialTime,
      });
      expect(first.decision).toBe('granted');

      const attendanceCountBefore = await Attendance.countDocuments({ memberId: enrolledMember._id });

      // Immediate second scan
      const second = await verifyAccess({
        descriptor: testDescriptor,
        livenessProof: { passed: true },
        deviceId: 'vitest-test-kiosk',
        now: duplicateTime,
      });

      expect(second.decision).toBe('granted');

      const attendanceCountAfter = await Attendance.countDocuments({ memberId: enrolledMember._id });
      // Count should NOT have increased because cool-down is active
      expect(attendanceCountAfter).toBe(attendanceCountBefore);

      // But AccessLog MUST record the second scan
      const secondLog = await AccessLog.findById(second.logId);
      expect(secondLog).toBeTruthy();
      expect(secondLog.decision).toBe('granted');
    });

    it('POST /api/access/verify endpoint requires valid x-device-key header', async () => {
      const res = await request(app)
        .post('/api/access/verify')
        .send({
          descriptor: testDescriptor,
          livenessProof: { passed: true },
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Missing x-device-key');
    });

    it('POST /api/access/verify endpoint returns expected contract with valid device key', async () => {
      const res = await request(app)
        .post('/api/access/verify')
        .set('x-device-key', env.deviceApiKey)
        .send({
          descriptor: testDescriptor,
          livenessProof: { passed: true },
          deviceId: 'vitest-test-kiosk',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('decision');
      expect(res.body).toHaveProperty('reason');
      expect(res.body).toHaveProperty('memberName');
      expect(res.body).toHaveProperty('daysRemaining');
    });
  });

  describe('Role-Based Admin Authorization & Route Guarding', () => {
    it('allows owner to freeze, block and delete biometrics', async () => {
      const member = await Member.create({
        memberId: 'ROAR-M-TEST02',
        name: 'Rahul Dravid',
        phone: '9999000002',
        status: 'active',
        planId: testPlan._id,
        membershipStartDate: new Date(),
        membershipEndDate: new Date(Date.now() + 30 * 86400000),
      });

      // Owner freeze
      const freezeRes = await request(app)
        .post(`/api/members/${member._id}/freeze`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(freezeRes.status).toBe(200);
      expect(freezeRes.body.member.isFrozen).toBe(true);

      // Owner unfreeze
      const unfreezeRes = await request(app)
        .post(`/api/members/${member._id}/unfreeze`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(unfreezeRes.status).toBe(200);
      expect(unfreezeRes.body.member.isFrozen).toBe(false);
    });

    it('forbids receptionist from deleting biometric data or freezing members', async () => {
      const member = await Member.create({
        memberId: 'ROAR-M-TEST03',
        name: 'Kapil Dev',
        phone: '9999000003',
        status: 'active',
        planId: testPlan._id,
        membershipStartDate: new Date(),
        membershipEndDate: new Date(Date.now() + 30 * 86400000),
      });

      const res = await request(app)
        .post(`/api/members/${member._id}/freeze`)
        .set('Authorization', `Bearer ${receptionistToken}`);
      expect(res.status).toBe(403);

      const delRes = await request(app)
        .delete(`/api/members/${member._id}/face`)
        .set('Authorization', `Bearer ${receptionistToken}`);
      expect(delRes.status).toBe(403);
    });

    it('forbids trainer from enrolling face or recording payments', async () => {
      const member = await Member.create({
        memberId: 'ROAR-M-TEST04',
        name: 'Sourav Ganguly',
        phone: '9999000004',
        status: 'active',
        planId: testPlan._id,
        membershipStartDate: new Date(),
        membershipEndDate: new Date(Date.now() + 30 * 86400000),
      });

      const res = await request(app)
        .post(`/api/members/${member._id}/payment`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({ amount: 1000, method: 'cash' });
      expect(res.status).toBe(403);
    });
  });

  describe('Lead-to-Member Conversion Pipeline Flow', () => {
    it('converts a sales lead into an active member with plan and first payment', async () => {
      const lead = await Lead.create({
        bookingReference: 'ROAR-TEST-LEAD-01',
        fullName: 'Virat Kohli',
        phone: '9999000005',
        email: 'virat@example.com',
        preferredTime: 'morning',
        fitnessGoal: 'strength',
        experienceLevel: 'advanced',
        status: 'attended',
      });

      const res = await request(app)
        .post(`/api/members/convert-lead/${lead._id}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          planId: testPlan._id.toString(),
          paymentMethod: 'UPI',
          amountPaid: testPlan.price,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.member.name).toBe('Virat Kohli');
      expect(res.body.member.phone).toBe('9999000005');
      expect(res.body.member.paymentStatus).toBe('paid');
      expect(res.body.member.sourceLeadId).toBe(lead._id.toString());

      // Check lead status updated to converted
      const updatedLead = await Lead.findById(lead._id);
      expect(updatedLead.status).toBe('converted');

      // Check payment receipt created
      const payment = await Payment.findOne({ memberId: res.body.member._id });
      expect(payment).toBeTruthy();
      expect(payment.amount).toBe(testPlan.price);
      expect(payment.method).toBe('UPI');
    });
  });
});

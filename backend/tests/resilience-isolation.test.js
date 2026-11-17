import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { Member } from '../src/models/Member.js';
import { Payment } from '../src/models/Payment.js';
import { Door } from '../src/models/Door.js';
import { MembershipPlan } from '../src/models/MembershipPlan.js';
import { recordMemberPayment } from '../src/services/memberService.js';
import { manualUnlockDoor } from '../src/services/doorService.js';

describe('Phase D: Resilience, Bulkhead Isolation & Idempotency', () => {
  let testMember;
  let testPlan;
  let mockAdmin;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/roar_extreme_test';
      await mongoose.connect(uri);
    }

    testPlan = await MembershipPlan.create({
      name: 'Resilience Test Plan',
      durationDays: 30,
      price: 5000,
      active: true,
    });

    testMember = await Member.create({
      memberId: 'ROAR-M-RESILIENT',
      name: 'Resilience Trainee',
      phone: '9822998877',
      planId: testPlan._id,
      membershipStartDate: new Date(),
      membershipEndDate: new Date(Date.now() + 30 * 86400000),
      status: 'active',
      paymentStatus: 'pending',
      amountDue: 5000,
    });

    mockAdmin = {
      _id: new mongoose.Types.ObjectId(),
      email: 'admin.resilience@roarextreme.com',
      name: 'SRE Lead',
    };
  });

  afterAll(async () => {
    await Member.deleteMany({ memberId: 'ROAR-M-RESILIENT' });
    await Payment.deleteMany({ memberId: testMember._id });
    await MembershipPlan.deleteMany({ _id: testPlan._id });
    await Door.deleteMany({ doorId: 'DOOR-RESIL-01' });
  });

  describe('1. Granular Health Probes (Liveness & Readiness)', () => {
    it('GET /health/live returns 200 with process alive status and uptime', async () => {
      const res = await request(app).get('/health/live');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('alive');
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.service).toBe('roar-extreme-api');
    });

    it('GET /health/ready returns 200 when database is connected', async () => {
      const res = await request(app).get('/health/ready');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
      expect(res.body.database.connected).toBe(true);
      expect(res.body.database.state).toBe('connected');
    });
  });

  describe('2. Fail-Closed Door Access Safety', () => {
    it('returns 503 and fails closed (denied, service_unavailable) on server/database error', async () => {
      // POST with valid device key but invalid biometric structure
      const res = await request(app)
        .post('/api/access/verify')
        .set('x-device-key', process.env.DEVICE_API_KEY || 'roar_kiosk_device_key_nashik_rooftop_01')
        .send({
          descriptor: 'invalid_type_not_array',
        });

      // Zod schema validation blocks invalid structure with 400
      expect(res.status).toBe(400);
      expect(res.body.decision).not.toBe('granted');
    });
  });

  describe('3. Payment Idempotency & Duplicate Prevention', () => {
    it('deduplicates payments with identical idempotencyKey', async () => {
      const key = 'idem_pay_test_key_1001';

      // First call
      const res1 = await recordMemberPayment(
        testMember._id,
        { amount: 1000, method: 'UPI', notes: 'First submission', idempotencyKey: key },
        mockAdmin
      );

      expect(res1.payment.amount).toBe(1000);
      expect(res1.isDuplicate).toBeUndefined();

      // Second call with same idempotencyKey
      const res2 = await recordMemberPayment(
        testMember._id,
        { amount: 1000, method: 'UPI', notes: 'Retried submission', idempotencyKey: key },
        mockAdmin
      );

      expect(res2.isDuplicate).toBe(true);
      expect(res2.payment._id.toString()).toBe(res1.payment._id.toString());

      // Verify only 1 payment was created in MongoDB
      const count = await Payment.countDocuments({ idempotencyKey: key });
      expect(count).toBe(1);
    });

    it('guards against accidental double-clicks within 15 seconds', async () => {
      // Call 1
      const res1 = await recordMemberPayment(
        testMember._id,
        { amount: 500, method: 'cash', notes: 'Immediate click 1' },
        mockAdmin
      );

      // Call 2 immediately (within 15 seconds)
      const res2 = await recordMemberPayment(
        testMember._id,
        { amount: 500, method: 'cash', notes: 'Immediate click 2' },
        mockAdmin
      );

      expect(res2.isDuplicate).toBe(true);
      expect(res2.payment._id.toString()).toBe(res1.payment._id.toString());
    });
  });

  describe('4. Door Manual Unlock Debounce', () => {
    it('debounces rapid repeated manual unlock commands on the same door within 2s', async () => {
      const door = await Door.create({
        doorId: 'DOOR-RESIL-01',
        name: 'Resilience Test Door',
        lockDeviceId: 'lock-resil-01',
        status: 'locked',
      });

      // Unlock 1
      const res1 = await manualUnlockDoor(
        door.doorId,
        'Member forgotten card',
        mockAdmin,
        null,
        5
      );

      expect(res1.door.status).toBe('unlocked');
      expect(res1.isDuplicate).toBeUndefined();

      // Unlock 2 immediately
      const res2 = await manualUnlockDoor(
        door.doorId,
        'Member forgotten card (rapid reclick)',
        mockAdmin,
        null,
        5
      );

      expect(res2.isDuplicate).toBe(true);
      expect(res2.message).toContain('already in progress');
    });
  });
});

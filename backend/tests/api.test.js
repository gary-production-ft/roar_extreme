import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { env } from '../src/config/environment.js';
import { Lead } from '../src/models/Lead.js';
import { Admin } from '../src/models/Admin.js';
import { ChatSession } from '../src/models/ChatSession.js';
import { UserPreference } from '../src/models/UserPreference.js';

let adminToken = '';
const testPhone = '9876543210';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.mongoUri);
  }

  // Ensure test admin
  await Admin.deleteMany({ email: 'testadmin@roarextreme.com' });
  const hash = await Admin.hashPassword('TestPassword#123');
  await Admin.create({
    name: 'Test Administrator',
    email: 'testadmin@roarextreme.com',
    passwordHash: hash,
    role: 'superadmin',
  });
});

afterAll(async () => {
  // Clean test artifacts
  await Lead.deleteMany({ phone: testPhone });
  await Admin.deleteMany({ email: 'testadmin@roarextreme.com' });
  await ChatSession.deleteMany({ anonymousVisitorId: 'test_vis_123' });
  await UserPreference.deleteMany({ ownerId: 'test_session_123' });
  await mongoose.disconnect();
});

describe('ROAR EXTREME Backend API Tests', () => {
  it('GET /health - returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  describe('Lead Registration API', () => {
    it('POST /api/leads - successfully registers a valid lead with unique reference', async () => {
      await Lead.deleteMany({ phone: testPhone });

      const res = await request(app)
        .post('/api/leads')
        .send({
          fullName: 'Vikram Rajput',
          phone: testPhone,
          email: 'vikram.test@example.com',
          preferredTime: 'morning',
          fitnessGoal: 'strength',
          experienceLevel: 'intermediate',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.bookingReference).toMatch(/^ROAR-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(res.body.lead.status).toBe('New');
    });

    it('POST /api/leads - returns duplicate status on immediate resubmission with same phone', async () => {
      const res = await request(app)
        .post('/api/leads')
        .send({
          fullName: 'Vikram Rajput',
          phone: testPhone,
          email: 'vikram.test@example.com',
          preferredTime: 'morning',
          fitnessGoal: 'strength',
          experienceLevel: 'intermediate',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.bookingReference).toBeDefined();
    });

    it('POST /api/leads - rejects invalid 8-digit mobile number with 400', async () => {
      const res = await request(app)
        .post('/api/leads')
        .send({
          fullName: 'Test User',
          phone: '98765432', // Only 8 digits
          preferredTime: 'morning',
          fitnessGoal: 'strength',
          experienceLevel: 'beginner',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Admin Authentication & Protection', () => {
    it('POST /api/auth/login - rejects invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testadmin@roarextreme.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login - logs in with valid credentials and sets token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testadmin@roarextreme.com',
          password: 'TestPassword#123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      adminToken = res.body.token;
    });

    it('GET /api/leads - rejects unauthenticated access with 401', async () => {
      const res = await request(app).get('/api/leads');
      expect(res.status).toBe(401);
    });

    it('GET /api/leads - authorizes access with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.leads)).toBe(true);
    });

    it('GET /api/dashboard - returns real aggregated metrics', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics.totalLeads).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Chatbot Sessions & Personalized Memory', () => {
    const sessionId = 'test_session_123';

    it('POST /api/chat/session - creates a new chat session', async () => {
      const res = await request(app)
        .post('/api/chat/session')
        .send({
          sessionId,
          visitorId: 'test_vis_123',
          language: 'en',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.sessionId).toBe(sessionId);
    });

    it('POST /api/preferences - stores user preference with explicit consent', async () => {
      const res = await request(app)
        .post('/api/preferences')
        .send({
          sessionId,
          preferenceKey: 'fitnessGoal',
          preferenceValue: 'muscle-building',
          source: 'chat_consent',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.preference.preferenceValue).toBe('muscle-building');
    });

    it('GET /api/preferences - retrieves saved preferences', async () => {
      const res = await request(app)
        .get(`/api/preferences?sessionId=${sessionId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.preferences.length).toBeGreaterThanOrEqual(1);
    });

    it('DELETE /api/preferences/:key - deletes a single preference', async () => {
      const res = await request(app)
        .delete('/api/preferences/fitnessGoal')
        .send({ sessionId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});


import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { maskPii, scrubObject } from '../src/utils/logger.js';
import { cleanInput, escapeRegex } from '../src/middleware/sanitize.js';
import { UserPreference } from '../src/models/UserPreference.js';

describe('Phase B: Security Hardening & OWASP ASVS Verification', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/roar_extreme_test';
      await mongoose.connect(uri);
    }
  });

  afterAll(async () => {
    await UserPreference.deleteMany({ sessionId: 'sec_test_session_999' });
  });

  describe('1. NoSQL Injection & Prototype Pollution Sanitization', () => {
    it('strips MongoDB operator keys ($gt, $ne, $where) from request body', () => {
      const maliciousPayload = {
        email: { $gt: '' },
        password: { $ne: null },
        normalField: 'clean_value',
      };
      const cleaned = cleanInput(maliciousPayload);

      expect(cleaned).toEqual({
        email: {},
        password: {},
        normalField: 'clean_value',
      });
      expect(cleaned.email.$gt).toBeUndefined();
      expect(cleaned.password.$ne).toBeUndefined();
    });

    it('strips prototype pollution attempts (__proto__, constructor, prototype)', () => {
      const pollutionPayload = {
        __proto__: { admin: true },
        constructor: { evil: true },
        prototype: { hacked: true },
        validKey: 'allowed',
      };
      const cleaned = cleanInput(pollutionPayload);

      expect(cleaned.__proto__.admin).toBeUndefined();
      expect(cleaned.constructor.evil).toBeUndefined();
      expect(cleaned.prototype).toBeUndefined();
      expect(cleaned.validKey).toBe('allowed');
    });

    it('strips null bytes from string inputs', () => {
      const nullByteInput = 'admin\0.js';
      const cleaned = cleanInput(nullByteInput);
      expect(cleaned).toBe('admin.js');
    });
  });

  describe('2. ReDoS Protection & Regex Metacharacter Escaping', () => {
    it('safely escapes special regex metacharacters', () => {
      const dirtySearch = '.*+?^${}()|[]\\test@example.com';
      const safe = escapeRegex(dirtySearch);

      expect(safe).not.toContain('.*+?');
      expect(() => new RegExp(safe)).not.toThrow();
      expect(new RegExp(safe).test(dirtySearch)).toBe(true);
    });
  });

  describe('3. PII Scrubbing & DPDP Act Log Sanitization', () => {
    it('masks Indian 10-digit mobile numbers', () => {
      const log1 = 'Member phone is 9876543210 registered';
      const log2 = 'Calling +91 9822012345 for onboarding';

      expect(maskPii(log1)).toContain('******3210');
      expect(maskPii(log1)).not.toContain('9876543210');

      expect(maskPii(log2)).toContain('******2345');
      expect(maskPii(log2)).not.toContain('9822012345');
    });

    it('masks email addresses', () => {
      const log = 'User registered with rahul.sharma@example.com';
      const masked = maskPii(log);

      expect(masked).toContain('r***a@example.com');
      expect(masked).not.toContain('rahul.sharma@example.com');
    });

    it('redacts JWT tokens and Bearer headers', () => {
      const rawToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.signature1234567890';
      const log = `Authorization header: Bearer ${rawToken}`;
      const masked = maskPii(log);

      expect(masked).toContain('Bearer [REDACTED_TOKEN]');
      expect(masked).not.toContain(rawToken);
    });

    it('redacts 128-dimensional face biometric descriptor vectors', () => {
      const mockVector = new Array(128).fill(0.12345);
      const scrubbed = scrubObject({ faceDescriptor: mockVector, memberId: 'ROAR-M-001' });

      expect(scrubbed.faceDescriptor).toBe('[REDACTED]');
    });
  });

  describe('4. Security Headers & Permissions Policy', () => {
    it('returns strict Content-Security-Policy and Permissions-Policy on HTTP requests', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('content-security-policy');
      expect(res.headers['content-security-policy']).toContain("default-src 'self'");
      expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");

      expect(res.headers).toHaveProperty('permissions-policy');
      // Crucial: Kiosk camera permission is enabled, microphone and geolocation blocked
      expect(res.headers['permissions-policy']).toContain('camera=(self)');
      expect(res.headers['permissions-policy']).toContain('microphone=()');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('5. Authentication ASVS Level 2 Token Handling', () => {
    it('rejects authentication token passed purely as URL query string parameter', async () => {
      // Tokens must only be passed in HTTP-only Cookies or Authorization Bearer header
      const res = await request(app)
        .get('/api/members?token=some_fake_jwt_token_in_url');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No token provided');
    });
  });

  describe('6. DPDP Right to Erasure Endpoint', () => {
    it('supports DPDP Right to Erasure via DELETE /api/preferences?sessionId=...', async () => {
      const sessionId = 'sec_test_session_999';

      // 1. Save a preference
      await request(app)
        .post('/api/preferences')
        .send({
          sessionId,
          preferenceKey: 'fitnessGoal',
          preferenceValue: 'strength',
        });

      // 2. Erase via standard DELETE /api/preferences?sessionId=...
      const delRes = await request(app)
        .delete(`/api/preferences?sessionId=${sessionId}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
      expect(delRes.body.message).toContain('cleared');

      // 3. Verify preferences are completely erased
      const getRes = await request(app)
        .get(`/api/preferences?sessionId=${sessionId}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.preferences).toEqual([]);
    });
  });
});

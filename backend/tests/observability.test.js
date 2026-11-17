import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { metricsCollector } from '../src/utils/metricsCollector.js';

describe('Phase E: Observability, Request Telemetry & Metrics', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/roar_extreme_test';
      await mongoose.connect(uri);
    }
  });

  describe('1. Request Telemetry & X-Request-Id Header Correlation', () => {
    it('injects X-Request-Id header on all HTTP responses', async () => {
      const res = await request(app).get('/health/live');

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('x-request-id');
      expect(res.headers['x-request-id']).toMatch(/^req_/);
    });

    it('propagates incoming client X-Request-Id header for distributed tracing', async () => {
      const customTraceId = 'client_trace_uuid_98765';
      const res = await request(app)
        .get('/health/live')
        .set('x-request-id', customTraceId);

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBe(customTraceId);
    });
  });

  describe('2. Metrics Collector Percentiles & Telemetry Engine', () => {
    it('records and computes accurate p50, p95, p99 percentiles', () => {
      // Feed simulated latencies into access verify bucket
      for (let i = 1; i <= 100; i++) {
        metricsCollector.recordRequest({
          route: '/api/access/verify',
          statusCode: 200,
          durationMs: i * 2, // 2ms to 200ms
        });
      }

      const snapshot = metricsCollector.getSnapshot();
      const p = snapshot.latency.doorAccessVerifyMs;

      expect(p.count).toBeGreaterThanOrEqual(100);
      expect(p.p50).toBeGreaterThanOrEqual(90);
      expect(p.p50).toBeLessThanOrEqual(115);
      expect(p.p95).toBeGreaterThanOrEqual(180);
      expect(p.p99).toBeGreaterThanOrEqual(190);
    });

    it('records AI turns and tracks provider distribution', () => {
      metricsCollector.recordAiTurn({ provider: 'intent_router' });
      metricsCollector.recordAiTurn({ provider: 'faq_cache' });
      metricsCollector.recordAiTurn({ provider: 'gemini', promptTokens: 100, completionTokens: 50 });

      const snapshot = metricsCollector.getSnapshot();
      expect(snapshot.aiChatbot.intentRouterHits).toBeGreaterThanOrEqual(1);
      expect(snapshot.aiChatbot.cacheHits).toBeGreaterThanOrEqual(1);
      expect(snapshot.aiChatbot.geminiCalls).toBeGreaterThanOrEqual(1);
      expect(snapshot.aiChatbot.totalPromptTokens).toBeGreaterThanOrEqual(100);
    });
  });

  describe('3. Production /metrics HTTP Endpoint', () => {
    it('GET /metrics returns JSON snapshot with operational SLA metrics', async () => {
      const res = await request(app).get('/metrics');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics).toHaveProperty('uptimeSeconds');
      expect(res.body.metrics).toHaveProperty('latency');
      expect(res.body.metrics.latency).toHaveProperty('doorAccessVerifyMs');
      expect(res.body.metrics.latency).toHaveProperty('chatStreamMs');
      expect(res.body.metrics.latency).toHaveProperty('generalApiMs');
      expect(res.body.metrics).toHaveProperty('hardware');
      expect(res.body.metrics.hardware).toHaveProperty('devicesTotal');
      expect(res.body.metrics.hardware).toHaveProperty('devicesOnline');
      expect(res.body.metrics).toHaveProperty('system');
      expect(res.body.metrics.system).toHaveProperty('memoryHeapUsedMb');
    });

    it('GET /metrics with Accept: text/plain returns Prometheus exposition format', async () => {
      const res = await request(app)
        .get('/metrics')
        .set('Accept', 'text/plain');

      expect(res.status).toBe(200);
      expect(res.text).toContain('http_requests_total');
      expect(res.text).toContain('door_access_verify_p95_ms');
      expect(res.text).toContain('chat_stream_p95_ms');
      expect(res.text).toContain('hardware_devices_online');
    });
  });
});

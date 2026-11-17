import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom Prometheus/k6 Metrics
export const errorRate = new Rate('errors');
export const chatLatency = new Trend('chat_duration_ms');
export const doorLatency = new Trend('door_verify_duration_ms');

// Configurable target host (default local staging, override via TARGET_URL)
const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:5000';

export const options = {
  stages: [
    { duration: '30s', target: 50 },    // Stage 1: Warmup to normal load (50 VUs)
    { duration: '1m', target: 150 },    // Stage 2: Peak gym traffic (150 VUs)
    { duration: '1m', target: 300 },    // Stage 3: Stress concurrency (300 VUs)
    { duration: '30s', target: 0 },     // Stage 4: Rampdown
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],             // Less than 1% failure
    http_req_duration: ['p(95)<300'],           // p95 latency under 300ms for non-AI routes
    'chat_duration_ms': ['p(95)<2500'],        // p95 AI chat under 2.5s
    'door_verify_duration_ms': ['p(95)<150'],   // p95 door access under 150ms
  },
};

export default function () {
  const ip = `192.168.1.${(__VU % 250) + 1}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Forwarded-For': ip,
  };

  // Scenario 1: Health & Readiness Check (20% of traffic)
  const healthRes = http.get(`${TARGET_URL}/health/ready`, { headers });
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Scenario 2: Public Gym Catalogs (30% of traffic)
  const catalogRes = http.get(`${TARGET_URL}/api/fitness-plans/catalog/exercises`, { headers });
  check(catalogRes, {
    'catalog status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Scenario 3: AI Intent Router (<15ms, 30% of traffic)
  const startChat = Date.now();
  const chatPayload = JSON.stringify({
    message: 'What are gym timings?',
    sessionId: `vu_${__VU}_${__ITER}`,
    language: 'en',
  });
  const chatRes = http.post(`${TARGET_URL}/api/chat`, chatPayload, { headers });
  chatLatency.add(Date.now() - startChat);
  check(chatRes, {
    'chat status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Scenario 4: Door Access Bulkhead Verification (20% of traffic)
  const startDoor = Date.now();
  const doorPayload = JSON.stringify({
    descriptor: new Array(128).fill(0.05),
  });
  const doorRes = http.post(`${TARGET_URL}/api/access/verify`, doorPayload, {
    headers: { ...headers, 'x-device-key': 'kiosk-main' },
  });
  doorLatency.add(Date.now() - startDoor);
  check(doorRes, {
    'door response status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  }) || errorRate.add(1);

  sleep(1);
}

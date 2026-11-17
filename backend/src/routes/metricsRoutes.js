/**
 * ROAR EXTREME — SRE METRICS ROUTE
 *
 * Exposes live performance percentiles (p50, p95, p99), error rates,
 * AI token consumption, and door hardware status.
 */

import { Router } from 'express';
import { metricsCollector } from '../utils/metricsCollector.js';
import { Device } from '../models/Device.js';
import { Door } from '../models/Door.js';

const router = Router();

router.get(['/', '/metrics'], async (req, res) => {
  const snapshot = metricsCollector.getSnapshot();

  // Query live hardware door state
  let hardwareState = {
    devicesTotal: 0,
    devicesOnline: 0,
    doorsLockedDown: 0,
  };

  try {
    const [devicesTotal, devicesOnline, doorsLockedDown] = await Promise.all([
      Device.countDocuments(),
      Device.countDocuments({ status: 'online' }),
      Door.countDocuments({ isLockedDown: true }),
    ]);
    hardwareState = { devicesTotal, devicesOnline, doorsLockedDown };
  } catch {
    // If DB read fails during metrics pull, keep default zeroes
  }

  const responsePayload = {
    ...snapshot,
    hardware: hardwareState,
    service: 'roar-extreme-api',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  };

  // Plaintext Prometheus exposition format if requested
  const acceptsPrometheus = req.headers.accept?.includes('text/plain') && !req.query.format;
  if (acceptsPrometheus) {
    const lines = [
      '# HELP http_requests_total Total HTTP requests handled',
      '# TYPE http_requests_total counter',
      `http_requests_total ${snapshot.totalRequests}`,
      `http_requests_status{code="2xx"} ${snapshot.statusCodes['2xx']}`,
      `http_requests_status{code="4xx"} ${snapshot.statusCodes['4xx']}`,
      `http_requests_status{code="5xx"} ${snapshot.statusCodes['5xx']}`,
      '# HELP door_access_verify_p95_ms P95 latency for biometric door access',
      '# TYPE door_access_verify_p95_ms gauge',
      `door_access_verify_p95_ms ${snapshot.latency.doorAccessVerifyMs.p95}`,
      '# HELP chat_stream_p95_ms P95 latency for streaming chatbot',
      '# TYPE chat_stream_p95_ms gauge',
      `chat_stream_p95_ms ${snapshot.latency.chatStreamMs.p95}`,
      '# HELP hardware_devices_online Number of hardware devices online',
      '# TYPE hardware_devices_online gauge',
      `hardware_devices_online ${hardwareState.devicesOnline}`,
    ];
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    return res.send(lines.join('\n'));
  }

  res.json({
    success: true,
    metrics: responsePayload,
  });
});

export default router;

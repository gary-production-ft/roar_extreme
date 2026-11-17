/**
 * ROAR EXTREME — REQUEST TELEMETRY & ID CORRELATION MIDDLEWARE
 *
 * Injects X-Request-Id header on all requests, computes request latency,
 * records operational percentiles, and emits structured logs without PII.
 */

import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { metricsCollector } from '../utils/metricsCollector.js';

export function requestTelemetry(req, res, next) {
  const start = performance.now();
  const requestId = req.headers['x-request-id'] || `req_${crypto.randomBytes(6).toString('hex')}`;

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - start);
    const route = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;

    // Record into rolling metrics collector
    metricsCollector.recordRequest({
      route,
      statusCode: res.statusCode,
      durationMs,
    });

    // Skip verbose logging on frequent health checks or during silent load benchmark
    if ((route.startsWith('/health') || process.env.SILENT_TELEMETRY === 'true') && res.statusCode === 200) {
      return;
    }

    const logEntry = {
      requestId,
      method: req.method,
      path: route,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    };

    if (res.statusCode >= 500) {
      logger.error(`[HTTP] ${req.method} ${route} -> ${res.statusCode} (${durationMs}ms)`, logEntry);
    } else if (res.statusCode >= 400) {
      logger.warn(`[HTTP] ${req.method} ${route} -> ${res.statusCode} (${durationMs}ms)`, logEntry);
    } else {
      logger.info(`[HTTP] ${req.method} ${route} -> ${res.statusCode} (${durationMs}ms)`, logEntry);
    }
  });

  next();
}

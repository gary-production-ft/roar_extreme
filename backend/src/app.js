import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { env } from './config/environment.js';
import { lastDbError } from './config/database.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sanitizeInputs } from './middleware/sanitize.js';
import { requestTelemetry } from './middleware/requestTelemetry.js';
import metricsRoutes from './routes/metricsRoutes.js';

import leadRoutes from './routes/leadRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import knowledgeRoutes from './routes/knowledgeRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import preferenceRoutes from './routes/preferenceRoutes.js';
import accessRoutes from './routes/accessRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import planRoutes from './routes/planRoutes.js';
import logsRoutes from './routes/logsRoutes.js';
import doorRoutes from './routes/doorRoutes.js';
import fitnessPlanRoutes from './routes/fitnessPlanRoutes.js';

export const app = express();

// Security Headers & Content Security Policy (OWASP ASVS Compliant)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
        mediaSrc: ["'self'", 'blob:', 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// Feature & Permissions Policy Header (Allows Camera for /kiosk biometric scanning, blocks audio/geo)
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(), payment=()'
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Hardened Production CORS Configuration
const explicitAllowedOrigins = new Set([
  'https://roarextreme.vercel.app',
  'https://roar-extreme.vercel.app',
  ...(env.clientUrl ? [env.clientUrl.replace(/\/$/, '')] : []),
  ...(env.nodeEnv !== 'production'
    ? ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173']
    : []),
]);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g., server-to-server, health checks, cron)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');
    if (explicitAllowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin denied: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsers & cookies
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Request Telemetry, ID Correlation & Latency Profiling
app.use(requestTelemetry);

// NoSQL Injection, Prototype Pollution & Input Sanitization
app.use(sanitizeInputs);

// Global Rate Limiter
app.use('/api', globalLimiter);

// Liveness Probe (Is the process alive?)
app.get(['/health/live', '/api/health/live'], (_req, res) => {
  res.status(200).json({
    status: 'alive',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'roar-extreme-api',
  });
});

// Readiness Probe (Are database and dependencies ready to serve traffic?)
app.get(['/health/ready', '/api/health/ready'], (_req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  const isConnecting = mongoose.connection.readyState === 2;

  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = dbStates[mongoose.connection.readyState] || 'unknown';

  const statusCode = isDbReady ? 200 : 503;

  res.status(statusCode).json({
    status: isDbReady ? 'ready' : isConnecting ? 'degraded' : 'unready',
    database: {
      connected: isDbReady,
      state,
      ...(lastDbError ? { error: lastDbError } : {}),
    },
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'roar-extreme-api',
  });
});

// General Health Check (Backward compatibility)
app.get(['/health', '/api/health'], (_req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = dbStates[mongoose.connection.readyState] || 'unknown';
  res.json({
    status: 'healthy',
    database: state,
    ...(state !== 'connected' && lastDbError ? { dbError: lastDbError } : {}),
    timestamp: new Date().toISOString(),
    service: 'roar-extreme-api',
  });
});

// Mount Routes
app.use(['/metrics', '/api/metrics'], metricsRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/fitness-plans', fitnessPlanRoutes);
app.use('/api/admin', logsRoutes);
app.use('/api/admin', doorRoutes);

// Serve static client assets in production if built
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);


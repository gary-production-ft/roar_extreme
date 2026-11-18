import { app } from './app.js';
import { env, validateEnvironment } from './config/environment.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  const envCheck = validateEnvironment(logger);
  if (!envCheck.isValid && env.nodeEnv === 'production') {
    logger.warn(`[CONFIG WARNING] Missing configuration keys: ${envCheck.missing.join(', ')}. Proceeding with safe defaults.`);
  }

  const server = app.listen(env.port, '0.0.0.0', () => {
    logger.info(`ROAR EXTREME Backend running on port ${env.port} [${env.nodeEnv}]`);
  });

  try {
    await connectDatabase();
    // Run initial expired membership check and schedule periodic sweep
    import('./services/membershipCron.js').then(({ updateExpiredMemberships }) => {
      updateExpiredMemberships().catch((err) => logger.error('Initial membership sweep error:', err));
      setInterval(() => {
        updateExpiredMemberships().catch((err) => logger.error('Periodic membership sweep error:', err));
      }, 6 * 60 * 60 * 1000); // Sweep every 6 hours
    });

    // Initialize Phase 2 Hardware Door Transport and provision default door/devices
    const { initDoorTransport, getDoorTransport } = await import('./services/doorTransport/index.js');
    const { ensureDefaultDoorAndDevices, handleInboundDeviceEvent, sweepOfflineDevices } = await import('./services/doorService.js');

    await ensureDefaultDoorAndDevices();
    const transport = await initDoorTransport();
    transport.on('device_event', (event) => {
      handleInboundDeviceEvent(event).catch((err) => logger.error('Error handling device event:', err));
    });

    // Periodic sweep for offline devices every 30s
    setInterval(() => {
      sweepOfflineDevices().catch((err) => logger.error('Error sweeping offline devices:', err));
    }, 30000);

    // Warm AI caches: knowledge base, active plans, Gemini connection
    const { warmKnowledgeCache } = await import('./services/knowledgeService.js');
    const { warmGeminiConnection, getActivePlansCached } = await import('./services/aiService.js');
    Promise.all([
      warmKnowledgeCache(),
      getActivePlansCached(),
      warmGeminiConnection(),
    ]).catch((err) => logger.warn('[WARMUP] Non-fatal warmup error:', err.message));
  } catch (err) {
    logger.error('Failed to connect to database during startup:', err);
  }

  const shutdown = async () => {
    logger.info('Shutting down server gracefully...');
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});


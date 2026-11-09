import { app } from './app.js';
import { env } from './config/environment.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  const server = app.listen(env.port, '0.0.0.0', () => {
    logger.info(`ROAR EXTREME Backend running on port ${env.port} [${env.nodeEnv}]`);
  });

  try {
    await connectDatabase();
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


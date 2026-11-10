import mongoose from 'mongoose';
import { env } from './environment.js';
import { logger } from '../utils/logger.js';

export let lastDbError = null;

export async function connectDatabase() {
  if (!env.mongoUri || (env.mongoUri.includes('127.0.0.1') && env.nodeEnv === 'production')) {
    lastDbError = 'MONGO_URI is missing or pointing to localhost (127.0.0.1)';
    logger.warn('[DATABASE] MONGO_URI is missing or pointing to localhost (127.0.0.1) in production.');
    logger.warn('[DATABASE] To persist leads and chat history, set MONGO_URI in your Render Environment Variables with your MongoDB Atlas connection string.');
  }

  try {
    const conn = await mongoose.connect(env.mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    lastDbError = null;
    logger.info(`[DATABASE] MongoDB Connected: ${conn.connection.host} / DB: ${conn.connection.name}`);
    return conn;
  } catch (err) {
    lastDbError = err.message;
    logger.error(`[DATABASE] MongoDB Connection Error: ${err.message}`);
    logger.error('[DATABASE] Verify MONGO_URI on Render and ensure MongoDB Atlas IP Access List allows 0.0.0.0/0 (anywhere).');
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}


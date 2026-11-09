import mongoose from 'mongoose';
import { env } from './environment.js';
import { logger } from '../utils/logger.js';

export async function connectDatabase() {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host} / DB: ${conn.connection.name}`);
    return conn;
  } catch (err) {
    logger.error(`MongoDB Connection Error: ${err.message}`);
    if (env.nodeEnv === 'production') {
      process.exit(1);
    }
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}


/**
 * ROAR EXTREME — SHARED REDIS CLIENT & CACHE ABSTRACTION
 *
 * Stateless Architecture for Horizontal Scaling:
 * - Automatically connects to Redis if REDIS_URL or REDIS_TLS_URL is set.
 * - Graceful fallback to in-memory store if Redis is unavailable or unconfigured.
 * - Zero hard crashes on network partition or Redis downtime.
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

let redisClient = null;
let isConnected = false;

let resolvedRedisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL || '';

if (!resolvedRedisUrl && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const host = new URL(process.env.UPSTASH_REDIS_REST_URL).hostname;
    resolvedRedisUrl = `rediss://default:${process.env.UPSTASH_REDIS_REST_TOKEN}@${host}:6379`;
  } catch (err) {
    logger.warn(`[REDIS] Failed to resolve UPSTASH_REDIS_REST_URL: ${err.message}`);
  }
}

if (resolvedRedisUrl && resolvedRedisUrl !== 'memory' && resolvedRedisUrl !== 'disabled') {
  try {
    redisClient = new Redis(resolvedRedisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 5) {
          logger.warn('[REDIS] Max connection retries reached. Operating in memory fallback mode.');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('connect', () => {
      isConnected = true;
      logger.info('[REDIS] Connected to shared Redis store successfully.');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      logger.warn(`[REDIS] Connection warning: ${err.message}. Using fallback cache.`);
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    // Initiate connection asynchronously
    redisClient.connect().catch((err) => {
      logger.warn(`[REDIS] Initial connection failed: ${err.message}. Defaulting to in-memory fallback.`);
    });
  } catch (err) {
    logger.warn(`[REDIS] Failed to initialize Redis client: ${err.message}. Using memory fallback.`);
    redisClient = null;
    isConnected = false;
  }
} else {
  logger.info('[REDIS] REDIS_URL not configured. Running in stateless memory fallback mode.');
}

// Local in-memory fallback cache
const memoryCache = new Map();

export const sharedCache = {
  async get(key) {
    if (isConnected && redisClient) {
      try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        logger.warn(`[REDIS] GET failed for key "${key}": ${err.message}`);
      }
    }
    const memEntry = memoryCache.get(key);
    if (!memEntry) return null;
    if (memEntry.expiresAt && Date.now() > memEntry.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return memEntry.value;
  },

  async set(key, value, ttlSeconds = 300) {
    if (isConnected && redisClient) {
      try {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return true;
      } catch (err) {
        logger.warn(`[REDIS] SET failed for key "${key}": ${err.message}`);
      }
    }
    memoryCache.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
    return true;
  },

  async del(key) {
    if (isConnected && redisClient) {
      try {
        await redisClient.del(key);
      } catch (err) {
        logger.warn(`[REDIS] DEL failed for key "${key}": ${err.message}`);
      }
    }
    memoryCache.delete(key);
    return true;
  },

  async clearPrefix(prefix) {
    if (isConnected && redisClient) {
      try {
        const keys = await redisClient.keys(`${prefix}:*`);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } catch (err) {
        logger.warn(`[REDIS] ClearPrefix failed: ${err.message}`);
      }
    }
    for (const key of memoryCache.keys()) {
      if (key.startsWith(`${prefix}:`)) {
        memoryCache.delete(key);
      }
    }
    return true;
  },

  isShared() {
    return isConnected;
  },
};

export function getRedisClient() {
  return redisClient;
}

export function isRedisConnected() {
  return isConnected;
}

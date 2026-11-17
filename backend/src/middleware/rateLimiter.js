import rateLimit from 'express-rate-limit';
import { getRedisClient, isRedisConnected } from '../config/redis.js';

/**
 * Lightweight native RedisStore adapter for express-rate-limit
 */
class RedisRateLimitStore {
  constructor(prefix = 'rl:') {
    this.prefix = prefix;
  }

  init(options) {
    this.windowMs = options.windowMs || 60000;
  }

  async increment(key) {
    const client = getRedisClient();
    if (!client || !isRedisConnected()) {
      // Fallback: pass-through if redis temporarily disconnected
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }

    const fullKey = `${this.prefix}${key}`;
    try {
      const multi = client.multi();
      multi.incr(fullKey);
      multi.pttl(fullKey);
      const results = await multi.exec();

      const hits = results[0][1];
      let pttl = results[1][1];

      if (pttl === -1 || pttl === -2) {
        await client.pexpire(fullKey, this.windowMs);
        pttl = this.windowMs;
      }

      return {
        totalHits: hits,
        resetTime: new Date(Date.now() + Math.max(0, pttl)),
      };
    } catch {
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  async decrement(key) {
    const client = getRedisClient();
    if (client && isRedisConnected()) {
      try {
        await client.decr(`${this.prefix}${key}`);
      } catch {
        // Ignore
      }
    }
  }

  async resetKey(key) {
    const client = getRedisClient();
    if (client && isRedisConnected()) {
      try {
        await client.del(`${this.prefix}${key}`);
      } catch {
        // Ignore
      }
    }
  }
}

function createLimiter(options, prefix) {
  const redis = getRedisClient();
  const config = {
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
  };

  if (redis && isRedisConnected()) {
    config.store = new RedisRateLimitStore(prefix);
  }

  return rateLimit(config);
}

export const globalLimiter = createLimiter(
  {
    windowMs: 15 * 60 * 1000,
    max: 300,
    // Bulkhead isolation: bypass global limiter for door access and health monitoring
    skip: (req) =>
      req.baseUrl === '/api/access' ||
      req.originalUrl?.includes('/api/access') ||
      req.path?.startsWith('/access') ||
      req.path?.startsWith('/health') ||
      req.originalUrl?.includes('/health'),
    message: {
      success: false,
      message: 'Too many requests from this IP address. Please try again after 15 minutes.',
    },
  },
  'rl:global:'
);

export const leadLimiter = createLimiter(
  {
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
      success: false,
      message: 'Too many lead submissions from this network. Please try again later or visit the gym.',
    },
  },
  'rl:lead:'
);

export const authLimiter = createLimiter(
  {
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
      success: false,
      message: 'Too many login attempts. Please wait 15 minutes before trying again.',
    },
  },
  'rl:auth:'
);

export const chatLimiter = createLimiter(
  {
    windowMs: 60 * 1000,
    max: 30,
    message: {
      success: false,
      message: 'You are chatting too fast! Please pause a moment before sending another message.',
    },
  },
  'rl:chat:'
);

export const accessLimiter = createLimiter(
  {
    windowMs: 60 * 1000,
    max: 120, // 2 requests/sec max for kiosk device
    message: {
      decision: 'denied',
      reason: 'rate_limited',
      memberName: null,
      daysRemaining: 0,
    },
  },
  'rl:access:'
);

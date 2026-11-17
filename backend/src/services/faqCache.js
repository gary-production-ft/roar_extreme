import { logger } from '../utils/logger.js';

class LruCache {
  constructor(max = 200, ttlMs = 3600000) {
    this.max = max;
    this.ttlMs = ttlMs;
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  normalizeKey(key) {
    return (key || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\u0900-\u097F\s]/g, '')
      .replace(/\s+/g, ' ');
  }

  get(rawKey) {
    const key = this.normalizeKey(rawKey);
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, item);
    this.hits++;
    return item.value;
  }

  set(rawKey, value, customTtlMs = null) {
    const key = this.normalizeKey(rawKey);
    if (!key) return;

    if (this.cache.size >= this.max) {
      // Remove oldest (first item in Map iteration)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const ttl = customTtlMs !== null ? customTtlMs : this.ttlMs;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  clear() {
    this.cache.clear();
    logger.info('[CACHE] FAQ LRU cache cleared.');
  }

  getStats() {
    return {
      size: this.cache.size,
      max: this.max,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)).toFixed(3) : 0,
    };
  }
}

export const faqCache = new LruCache(300, 3600000); // 300 entries, 1-hour TTL

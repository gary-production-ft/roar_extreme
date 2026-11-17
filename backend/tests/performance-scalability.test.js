import { describe, it, expect } from 'vitest';
import { sharedCache } from '../src/config/redis.js';
import { geminiCircuitBreaker } from '../src/services/aiService.js';

describe('Phase C: Performance & Scalability Verification', () => {
  describe('1. Shared Cache / Redis Fallback Layer', () => {
    it('sets and gets cached items with TTL', async () => {
      await sharedCache.set('test_perf_key_1', { data: 'fitness_plan_cached' }, 60);
      const val = await sharedCache.get('test_perf_key_1');

      expect(val).toEqual({ data: 'fitness_plan_cached' });
    });

    it('deletes cached items correctly', async () => {
      await sharedCache.set('test_perf_key_2', 'temp_val', 60);
      await sharedCache.del('test_perf_key_2');
      const val = await sharedCache.get('test_perf_key_2');

      expect(val).toBeNull();
    });

    it('clears prefix entries correctly', async () => {
      await sharedCache.set('faq:q1', 'ans1', 60);
      await sharedCache.set('faq:q2', 'ans2', 60);
      await sharedCache.clearPrefix('faq');

      const val1 = await sharedCache.get('faq:q1');
      const val2 = await sharedCache.get('faq:q2');

      expect(val1).toBeNull();
      expect(val2).toBeNull();
    });
  });

  describe('2. Gemini Circuit Breaker', () => {
    it('starts in CLOSED state and allows requests', () => {
      geminiCircuitBreaker.recordSuccess(); // Reset
      expect(geminiCircuitBreaker.state).toBe('CLOSED');
      expect(geminiCircuitBreaker.canAttempt()).toBe(true);
    });

    it('trips immediately to OPEN upon 429 rate limit error', () => {
      geminiCircuitBreaker.recordFailure(true); // isRateLimit = true
      expect(geminiCircuitBreaker.state).toBe('OPEN');
      expect(geminiCircuitBreaker.canAttempt()).toBe(false);
    });

    it('resets to CLOSED when successful request completes', () => {
      geminiCircuitBreaker.recordSuccess();
      expect(geminiCircuitBreaker.state).toBe('CLOSED');
      expect(geminiCircuitBreaker.canAttempt()).toBe(true);
    });
  });
});

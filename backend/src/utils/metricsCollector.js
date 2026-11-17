/**
 * ROAR EXTREME — SRE METRICS COLLECTOR
 *
 * Collects production runtime telemetry:
 * - Request counts by route and HTTP status code
 * - Rolling latency percentiles (p50, p95, p99) for critical SLAs (/api/access/verify, /api/chat, REST)
 * - AI token usage and fallback provider distributions
 * - Process memory and active uptime
 */

class MetricsCollector {
  constructor() {
    this.startTime = Date.now();
    this.totalRequests = 0;
    this.statusCodes = {
      '2xx': 0,
      '3xx': 0,
      '4xx': 0,
      '5xx': 0,
    };
    this.routeCounts = new Map();

    // Rolling latency windows (last 1,000 samples per critical bucket)
    this.latencies = {
      accessVerify: [],
      chat: [],
      generalApi: [],
    };
    this.maxSamples = 1000;

    // AI Chatbot metrics
    this.aiMetrics = {
      intentRouterHits: 0,
      cacheHits: 0,
      geminiCalls: 0,
      openaiFallbacks: 0,
      ruleFallbacks: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
    };
  }

  recordRequest({ route, statusCode, durationMs }) {
    this.totalRequests++;

    const category = `${Math.floor(statusCode / 100)}xx`;
    if (this.statusCodes[category] !== undefined) {
      this.statusCodes[category]++;
    }

    const currentCount = this.routeCounts.get(route) || 0;
    this.routeCounts.set(route, currentCount + 1);

    // Record into specific latency bucket
    let bucket = this.latencies.generalApi;
    if (route.includes('/api/access/verify')) {
      bucket = this.latencies.accessVerify;
    } else if (route.includes('/api/chat')) {
      bucket = this.latencies.chat;
    }

    bucket.push(durationMs);
    if (bucket.length > this.maxSamples) {
      bucket.shift(); // Maintain fixed-size rolling window
    }
  }

  recordAiTurn({ provider, promptTokens = 0, completionTokens = 0 }) {
    if (provider === 'intent_router') this.aiMetrics.intentRouterHits++;
    else if (provider === 'faq_cache') this.aiMetrics.cacheHits++;
    else if (provider === 'gemini') this.aiMetrics.geminiCalls++;
    else if (provider === 'openai') this.aiMetrics.openaiFallbacks++;
    else if (provider === 'grounded_knowledge_fallback') this.aiMetrics.ruleFallbacks++;

    this.aiMetrics.totalPromptTokens += promptTokens;
    this.aiMetrics.totalCompletionTokens += completionTokens;
  }

  calculatePercentiles(samples) {
    if (!samples || samples.length === 0) {
      return { p50: 0, p95: 0, p99: 0, count: 0 };
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const getIndex = (p) => Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1);

    return {
      p50: sorted[getIndex(50)],
      p95: sorted[getIndex(95)],
      p99: sorted[getIndex(99)],
      count: sorted.length,
    };
  }

  getSnapshot() {
    const memory = process.memoryUsage();

    return {
      uptimeSeconds: Math.round(process.uptime()),
      totalRequests: this.totalRequests,
      statusCodes: this.statusCodes,
      latency: {
        doorAccessVerifyMs: this.calculatePercentiles(this.latencies.accessVerify),
        chatStreamMs: this.calculatePercentiles(this.latencies.chat),
        generalApiMs: this.calculatePercentiles(this.latencies.generalApi),
      },
      aiChatbot: {
        ...this.aiMetrics,
        cacheOffloadRatio:
          this.totalRequests > 0
            ? +(
                (this.aiMetrics.intentRouterHits + this.aiMetrics.cacheHits) /
                Math.max(1, this.aiMetrics.geminiCalls + this.aiMetrics.openaiFallbacks + this.aiMetrics.ruleFallbacks + this.aiMetrics.intentRouterHits + this.aiMetrics.cacheHits)
              ).toFixed(3)
            : 0,
      },
      system: {
        memoryHeapUsedMb: +(memory.heapUsed / 1024 / 1024).toFixed(2),
        memoryRssMb: +(memory.rss / 1024 / 1024).toFixed(2),
      },
    };
  }
}

export const metricsCollector = new MetricsCollector();

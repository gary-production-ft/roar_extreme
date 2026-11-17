import mongoose from 'mongoose';
import { BENCHMARK_QUESTIONS } from './questions.js';
import { processUserMessage, getOrCreateSession } from '../src/services/chatService.js';
import { env } from '../src/config/environment.js';

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function runBenchmark(suiteName = 'Baseline') {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.mongoUri);
  }

  console.log(`\n============================================================`);
  console.log(`⚡ RUNNING BENCHMARK: ${suiteName.toUpperCase()} (${BENCHMARK_QUESTIONS.length} Questions)`);
  console.log(`============================================================\n`);

  const results = [];
  const sessionId = `bench_${Date.now()}`;
  await getOrCreateSession(sessionId);

  for (let i = 0; i < BENCHMARK_QUESTIONS.length; i++) {
    const q = BENCHMARK_QUESTIONS[i];
    const startTime = performance.now();
    let ttfb = null;
    let ttft = null;
    let totalText = '';
    let provider = 'unknown';

    const onEvent = (event) => {
      const now = performance.now();
      if (!ttfb) {
        ttfb = Math.round(now - startTime);
      }
      if ((event.type === 'text_delta' || event.type === 'text-delta') && !ttft) {
        ttft = Math.round(now - startTime);
      }
      if (event.content || event.text) {
        totalText += (event.content || event.text);
      }
      if (event.provider) {
        provider = event.provider;
      }
    };

    try {
      await processUserMessage({
        sessionId,
        content: q.query,
        onEvent,
      });

      const totalTime = Math.round(performance.now() - startTime);
      ttfb = ttfb || totalTime;
      ttft = ttft || totalTime;

      results.push({
        id: q.id,
        category: q.category,
        query: q.query,
        ttfb,
        ttft,
        totalTime,
        provider,
        responsePreview: totalText.slice(0, 75).replace(/\n/g, ' '),
      });

      console.log(`[${String(i + 1).padStart(2, '0')}/${BENCHMARK_QUESTIONS.length}] ${q.id.padEnd(8)} | TTFT: ${String(ttft).padStart(5)}ms | Total: ${String(totalTime).padStart(5)}ms | Prov: ${provider.padEnd(16)} | "${q.query.slice(0, 30)}"`);
    } catch (err) {
      console.error(`[${q.id}] Error:`, err.message);
      results.push({
        id: q.id,
        category: q.category,
        query: q.query,
        ttfb: null,
        ttft: null,
        totalTime: null,
        error: err.message,
      });
    }
  }

  // Calculate statistics
  const validTTFTs = results.filter((r) => r.ttft !== null).map((r) => r.ttft);
  const validTotals = results.filter((r) => r.totalTime !== null).map((r) => r.totalTime);

  const stats = {
    count: results.length,
    ttft: {
      p50: percentile(validTTFTs, 50),
      p90: percentile(validTTFTs, 90),
      p95: percentile(validTTFTs, 95),
      min: Math.min(...validTTFTs),
      max: Math.max(...validTTFTs),
      avg: Math.round(validTTFTs.reduce((a, b) => a + b, 0) / validTTFTs.length),
    },
    total: {
      p50: percentile(validTotals, 50),
      p90: percentile(validTotals, 90),
      p95: percentile(validTotals, 95),
      min: Math.min(...validTotals),
      max: Math.max(...validTotals),
      avg: Math.round(validTotals.reduce((a, b) => a + b, 0) / validTotals.length),
    },
  };

  console.log(`\n============================================================`);
  console.log(`📊 BENCHMARK SUMMARY: ${suiteName.toUpperCase()}`);
  console.log(`============================================================`);
  console.log(`Time to First Token (TTFT):`);
  console.log(`  p50: ${stats.ttft.p50} ms | p90: ${stats.ttft.p90} ms | p95: ${stats.ttft.p95} ms | avg: ${stats.ttft.avg} ms`);
  console.log(`Total Response Time:`);
  console.log(`  p50: ${stats.total.p50} ms | p90: ${stats.total.p90} ms | p95: ${stats.total.p95} ms | avg: ${stats.total.avg} ms`);
  console.log(`============================================================\n`);

  await mongoose.disconnect();
  return { stats, results };
}

runBenchmark(process.argv[2] || 'Baseline');

import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { buildSystemPrompt } from '../ai/systemPrompt.js';
import { searchRelevantKnowledge } from './knowledgeService.js';
import { getPreferences, extractPotentialPreferences } from './memoryService.js';
import { resolveDirectIntent } from '../ai/intentRouter.js';
import { faqCache } from './faqCache.js';
import { MembershipPlan } from '../models/MembershipPlan.js';
import { metricsCollector } from '../utils/metricsCollector.js';

let geminiClient = null;
let openaiClient = null;
let warmedActivePlans = null;
let lastPlanTime = 0;

// Gemini API Resilience Circuit Breaker
export const geminiCircuitBreaker = {
  state: 'CLOSED', // CLOSED | OPEN | HALF_OPEN
  consecutiveFailures: 0,
  lastFailureTime: 0,
  cooldownPeriodMs: 30000, // 30-second circuit trip on 429 quota exhaustion

  canAttempt() {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.cooldownPeriodMs) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false; // Bypass instantly during outage
    }
    return true; // In HALF_OPEN, probe with one trial request
  },

  recordSuccess() {
    this.consecutiveFailures = 0;
    this.state = 'CLOSED';
  },

  recordFailure(isRateLimit = false) {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    if (isRateLimit || this.consecutiveFailures >= 3) {
      this.state = 'OPEN';
      logger.warn(`[CIRCUIT_BREAKER] Gemini circuit tripped to OPEN (Failures: ${this.consecutiveFailures}, RateLimit: ${isRateLimit}). Bypassing Gemini for 30s.`);
    }
  },

  getStatus() {
    return {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
    };
  },
};

export async function getActivePlansCached() {
  if (warmedActivePlans && Date.now() - lastPlanTime < 300000) {
    return warmedActivePlans;
  }
  try {
    const plans = await MembershipPlan.find({ active: true }).sort({ durationDays: 1 }).lean();
    warmedActivePlans = plans;
    lastPlanTime = Date.now();
    return plans;
  } catch (err) {
    return [];
  }
}

function getGeminiClient() {
  if (!geminiClient && env.geminiApiKey) {
    geminiClient = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }
  return geminiClient;
}

function getOpenAIClient() {
  if (!openaiClient && env.openaiApiKey) {
    openaiClient = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return openaiClient;
}

/**
 * Startup warm-up: pre-connects and tests Gemini model to warm DNS & TLS
 */
export async function warmGeminiConnection() {
  const gemini = getGeminiClient();
  if (!gemini) return;
  try {
    logger.info(`[WARMUP] Warming Gemini API connection for model: ${env.geminiModel}...`);
    const stream = await gemini.models.generateContentStream({
      model: env.geminiModel,
      contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
      config: { maxOutputTokens: 2 },
    });
    for await (const chunk of stream) {
      // consume warm-up token
      break;
    }
    logger.info('[WARMUP] Gemini API connection and socket warmed successfully.');
  } catch (err) {
    logger.warn(`[WARMUP] Gemini warmup notice: ${err.message}`);
  }
}

/**
 * Format conversation history into strictly alternating user/model turns for Gemini
 */
function sanitizeGeminiTurns(rawMessages, currentMessage) {
  const turns = [];

  for (const m of rawMessages) {
    const role = m.role === 'assistant' ? 'model' : 'user';
    const text = (m.content || '').trim();
    if (!text) continue;

    if (turns.length > 0 && turns[turns.length - 1].role === role) {
      turns[turns.length - 1].parts[0].text += '\n' + text;
    } else {
      turns.push({ role, parts: [{ text }] });
    }
  }

  if (currentMessage) {
    const curText = currentMessage.trim();
    if (turns.length > 0 && turns[turns.length - 1].role === 'user') {
      turns[turns.length - 1].parts[0].text = curText;
    } else {
      turns.push({ role: 'user', parts: [{ text: curText }] });
    }
  }

  while (turns.length > 0 && turns[0].role !== 'user') turns.shift();
  while (turns.length > 0 && turns[turns.length - 1].role !== 'user') turns.pop();

  return turns;
}

/**
 * Stream text chunks word-by-word with small interval to simulate fluid typing
 */
async function streamWords(text, onEvent) {
  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) {
    const delta = (i === 0 ? '' : ' ') + words[i];
    onEvent({ type: 'text_delta', content: delta, text: delta });
    if (i < 8) {
      await new Promise((r) => setTimeout(r, 6)); // First few words ultra fast
    }
  }
}

/**
 * Main Chat Streaming Engine
 */
export async function generateChatStream({
  sessionId,
  messages = [],
  currentMessage = '',
  visitorId = '',
  preferredLanguage = 'en',
  onEvent,
}) {
  const reqStart = performance.now();
  onEvent({ type: 'message_start' });

  const rawUserQuery = (currentMessage || messages[messages.length - 1]?.content || '').trim();
  // Input length defense: enforce max 500 characters
  const userQuery = rawUserQuery.length > 500 ? rawUserQuery.slice(0, 500) : rawUserQuery;

  // Retrieve cached membership plans
  const activePlans = await getActivePlansCached();

  // ──────────────────────────────────────────────────────────
  // 1. FAST PATH A: Instant Intent Router (Zero LLM, < 15ms)
  // ──────────────────────────────────────────────────────────
  const routerMatch = resolveDirectIntent({
    query: userQuery,
    language: preferredLanguage,
    activePlans,
  });

  if (routerMatch.matched) {
    metricsCollector.recordAiTurn({ provider: 'intent_router' });
    const routerDuration = Math.round(performance.now() - reqStart);
    logger.info(`[CHAT:ROUTER] Intercepted intent [${routerMatch.intent}] in ${routerDuration}ms (Zero LLM round trips).`);

    // Stream out words smoothly
    await streamWords(routerMatch.response, onEvent);

    if (routerMatch.action) {
      onEvent({
        type: 'tool_result',
        tool: routerMatch.action,
        result: { action: routerMatch.action, intent: routerMatch.intent },
      });
    }

    onEvent({
      type: 'message_complete',
      fullResponse: routerMatch.response,
      content: routerMatch.response,
      provider: 'intent_router',
      intent: routerMatch.intent,
      ttft: routerDuration,
      totalDuration: Math.round(performance.now() - reqStart),
    });

    return routerMatch.response;
  }

  // ──────────────────────────────────────────────────────────
  // 2. FAST PATH B: In-Memory LRU FAQ Cache (Zero LLM, < 5ms)
  // ──────────────────────────────────────────────────────────
  const cachedAnswer = faqCache.get(userQuery);
  if (cachedAnswer) {
    metricsCollector.recordAiTurn({ provider: 'faq_cache' });
    const cacheDuration = Math.round(performance.now() - reqStart);
    logger.info(`[CHAT:CACHE] Cache HIT for "${userQuery.slice(0, 30)}" in ${cacheDuration}ms.`);

    await streamWords(cachedAnswer, onEvent);

    onEvent({
      type: 'message_complete',
      fullResponse: cachedAnswer,
      content: cachedAnswer,
      provider: 'faq_cache',
      ttft: cacheDuration,
      totalDuration: Math.round(performance.now() - reqStart),
    });

    return cachedAnswer;
  }

  // ──────────────────────────────────────────────────────────
  // 3. PARALLEL CONTEXT GATHERING: DB reads in parallel (< 25ms)
  // ──────────────────────────────────────────────────────────
  const dbStart = performance.now();
  const [prefsArray, relevantDocs] = await Promise.all([
    getPreferences(sessionId),
    searchRelevantKnowledge(userQuery),
  ]);
  const dbTime = Math.round(performance.now() - dbStart);

  const userPreferences = {};
  prefsArray.forEach((p) => {
    userPreferences[p.preferenceKey] = p.preferenceValue;
  });

  const knowledgeContext = relevantDocs
    .map((d) => `[${d.category.toUpperCase()}] ${d.title}: ${d.content}`)
    .join('\n\n');

  const potentialMemory = extractPotentialPreferences(userQuery);

  const systemPrompt = buildSystemPrompt({
    knowledgeContext,
    userPreferences,
    language: preferredLanguage,
    activePlans,
  });

  // Limit conversation history to the most recent 6 messages to minimize token processing
  const recentHistory = messages.slice(-6);
  const contents = sanitizeGeminiTurns(recentHistory, userQuery);

  // ──────────────────────────────────────────────────────────
  // 4. PRIMARY PROVIDER: Google Gemini with Circuit Breaker & 3.5s TTFT Timeout
  // ──────────────────────────────────────────────────────────
  const gemini = getGeminiClient();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  if (gemini && geminiCircuitBreaker.canAttempt()) {
    let ttft = null;
    let geminiResponse = '';
    const geminiStart = performance.now();

    try {
      logger.info(`[CHAT] [${requestId}] Dispatching to Gemini (${env.geminiModel}) [DB: ${dbTime}ms]`);

      // Race Gemini stream against a 3,500ms TTFT deadline
      const streamPromise = gemini.models.generateContentStream({
        model: env.geminiModel,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.6,
          maxOutputTokens: 250, // Enforce crisp, compact answers
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('GEMINI_TTFT_TIMEOUT')), 3500)
      );

      const stream = await Promise.race([streamPromise, timeoutPromise]);

      for await (const chunk of stream) {
        const text = chunk.text || '';
        if (text) {
          if (!ttft) {
            ttft = Math.round(performance.now() - reqStart);
          }
          geminiResponse += text;
          onEvent({ type: 'text_delta', content: text, text });
        }
      }

      if (geminiResponse.trim()) {
        const totalDuration = Math.round(performance.now() - reqStart);
        logger.info(`[CHAT] [${requestId}] Gemini stream completed. TTFT: ${ttft}ms, Total: ${totalDuration}ms`);

        // Record success in circuit breaker
        geminiCircuitBreaker.recordSuccess();
        metricsCollector.recordAiTurn({
          provider: 'gemini',
          completionTokens: Math.max(1, Math.round(geminiResponse.length / 4)),
        });

        // Cache successful response in LRU cache
        faqCache.set(userQuery, geminiResponse);

        onEvent({
          type: 'message_complete',
          fullResponse: geminiResponse,
          content: geminiResponse,
          provider: 'gemini',
          ttft,
          totalDuration,
          dbTime,
          potentialMemory: Object.keys(potentialMemory).length > 0 ? potentialMemory : null,
        });

        return geminiResponse;
      }
    } catch (err) {
      const elapsed = Math.round(performance.now() - geminiStart);
      const is429 = Boolean(
        err.message?.includes('429') ||
        err.message?.toLowerCase().includes('quota') ||
        err.message?.includes('RESOURCE_EXHAUSTED')
      );
      geminiCircuitBreaker.recordFailure(is429);
      logger.warn(`[CHAT] [${requestId}] Gemini aborted (${err.message}) after ${elapsed}ms. Initiating instant failover.`);
    }
  } else if (gemini) {
    logger.warn(`[CHAT] [${requestId}] Gemini Circuit Breaker is ${geminiCircuitBreaker.state}. Fast-failing directly to secondary provider.`);
  }

  // ──────────────────────────────────────────────────────────
  // 5. SECONDARY PROVIDER: OpenAI Fallback (gpt-4o-mini)
  // ──────────────────────────────────────────────────────────
  const openai = getOpenAIClient();
  if (openai) {
    try {
      logger.info(`[CHAT] [${requestId}] Routing failover to OpenAI (${env.openaiModel})`);
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userQuery },
      ];

      const stream = await openai.chat.completions.create({
        model: env.openaiModel,
        messages: formattedMessages,
        stream: true,
        temperature: 0.6,
        max_tokens: 250,
      });

      let fullResponse = '';
      let ttft = null;
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          if (!ttft) ttft = Math.round(performance.now() - reqStart);
          fullResponse += delta;
          onEvent({ type: 'text_delta', content: delta, text: delta });
        }
      }

      if (fullResponse.trim()) {
        faqCache.set(userQuery, fullResponse);
        metricsCollector.recordAiTurn({
          provider: 'openai',
          completionTokens: Math.max(1, Math.round(fullResponse.length / 4)),
        });
        onEvent({
          type: 'message_complete',
          fullResponse,
          content: fullResponse,
          provider: 'openai',
          ttft,
          totalDuration: Math.round(performance.now() - reqStart),
        });
        return fullResponse;
      }
    } catch (err) {
      logger.warn(`[CHAT] OpenAI fallback failed: ${err.message}`);
    }
  }

  // ──────────────────────────────────────────────────────────
  // 6. TERTIARY FALLBACK: Grounded Knowledge Engine (Always Succeeds)
  // ──────────────────────────────────────────────────────────
  logger.info(`[CHAT] Using Deterministic Grounded Fallback for "${userQuery.slice(0, 30)}"`);
  const firstDoc = relevantDocs[0]?.content || '';
  let fallbackAnswer = `At ROAR EXTREME Nashik, we offer 8 disciplines including Strength, CrossFit, and Boxing. ${firstDoc ? firstDoc.slice(0, 180) + '.' : ''} Please check with our front-desk reception or book your Free Trial Pass at /register!`;

  if (preferredLanguage === 'hi') {
    fallbackAnswer = `रोअर एक्सट्रीम नाशिक में आपका स्वागत है! हमारे यहाँ स्ट्रेंथ ट्रेनिंग, कार्डियो और क्रॉसफिट सहित ८ ट्रेनिंग प्रोग्राम्स हैं। अधिक जानकारी के लिए रिसेप्शन पर आएं या /register पर फ्री ट्रायल पास बुक करें।`;
  } else if (preferredLanguage === 'mr') {
    fallbackAnswer = `रोअर एक्स्ट्रीम नाशिक मध्ये आपले स्वागत आहे! आमच्याकडे स्ट्रेंथ, कार्डिओ आणि झुम्बासह ८ वर्कआउट प्रकार आहेत. रिसेप्शनला भेट द्या किंवा /register वरून फ्री ट्रायल पास मिळवा.`;
  }

  metricsCollector.recordAiTurn({ provider: 'grounded_knowledge_fallback' });
  await streamWords(fallbackAnswer, onEvent);

  onEvent({
    type: 'message_complete',
    fullResponse: fallbackAnswer,
    content: fallbackAnswer,
    provider: 'grounded_knowledge_fallback',
    isFallback: true,
    totalDuration: Math.round(performance.now() - reqStart),
  });

  return fallbackAnswer;
}

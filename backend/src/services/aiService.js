import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { buildSystemPrompt } from '../ai/systemPrompt.js';
import { searchRelevantKnowledge } from './knowledgeService.js';
import { getPreferences, extractPotentialPreferences } from './memoryService.js';

let geminiClient = null;
let openaiClient = null;

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
 * Detect tool action intents from user query to trigger interactive UI widgets.
 */
function detectActionTriggers(query) {
  const lower = query.toLowerCase();
  const triggers = [];

  // Only trigger free pass card if the user asks for a pass or booking
  if (/\b(free\s*(pass|trial|session)|claim|book\s*session|apply|trial\s*pass|register)\b/.test(lower)) {
    triggers.push({
      name: 'open_lead_form',
      arguments: { source: 'chat_recommendation' },
    });
  }

  // Only trigger location card if user specifically asks for location/directions/map
  if (/\b(where|location|address|map|reach|directions|circle|road)\b/.test(lower) && !/\b(workout|training|chest|exercise|bicep)\b/.test(lower)) {
    triggers.push({
      name: 'get_gym_location',
      arguments: {},
    });
  }

  return triggers;
}

/**
 * Format and sanitize conversation turns for Google Gemini API.
 * Guarantees:
 * 1. Strict alternating sequence: user -> model -> user -> model -> user
 * 2. Starts with role 'user'
 * 3. Ends with role 'user' (containing the current prompt)
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

  // Ensure current query is the final 'user' turn
  if (currentMessage) {
    const curText = currentMessage.trim();
    if (turns.length > 0 && turns[turns.length - 1].role === 'user') {
      turns[turns.length - 1].parts[0].text = curText;
    } else {
      turns.push({ role: 'user', parts: [{ text: curText }] });
    }
  }

  // Gemini requires starting with user
  while (turns.length > 0 && turns[0].role !== 'user') {
    turns.shift();
  }

  // Gemini requires ending with user
  while (turns.length > 0 && turns[turns.length - 1].role !== 'user') {
    turns.pop();
  }

  return turns;
}

/**
 * Intelligent Grounded Fallback Engine when neither Gemini nor OpenAI is available.
 */
async function generateGroundedResponse({ query, language }) {
  const lower = query.toLowerCase();
  const relevantDocs = await searchRelevantKnowledge(query);
  const context = relevantDocs.map((d) => d.content).join('\n');

  const isHindi = language === 'hi' || /[\u0900-\u097F]/.test(query) || /\b(namaste|kaise|kya|samay|jagah)\b/.test(lower);
  const isMarathi = language === 'mr' || /\b(namaskar|kiti|kuthe|vel|vyayam)\b/.test(lower);

  // Intent: Free Session / Trial Pass
  if (/\b(free|trial|session|pass|demo|register|join|apply)\b/.test(lower)) {
    if (isMarathi) {
      return `रोअर फिटनेस नाशिक मध्ये आपले स्वागत आहे! तुम्ही आमच्या **फ्री सिंगल सेशन पास** साठी अर्ज करू शकता. यात ६० मिनिटांचा वर्कआउट आणि हेड कोच सोबत १-ऑन-१ कन्सल्टेशन समाविष्ट आहे. अर्ज करण्यासाठी आमच्या [Registration Page](/register) ला भेट द्या.`;
    }
    if (isHindi) {
      return `रोअर फिटनेस नाशिक में आपका स्वागत है! आप हमारे **फ्री सिंगल सेशन पास** के लिए आवेदन कर सकते हैं। इसमें ६० मिनट का वर्कआउट और हेड कोच के साथ १-ऑन-१ कंसल्टेशन शामिल है। आवेदन करने के लिए [Registration Page](/register) पर जाएं।`;
    }
    return `Welcome to Roar Extreme! You can claim a complimentary **Free Single Session Pass** right now. This includes a full rooftop arena tour, a 60-minute guided trial workout, and a 1-on-1 consultation with our head coach. Click the Free Pass button below to apply!`;
  }

  // Intent: Timing / Hours
  if (/\b(time|timing|hours|open|close|sunday|schedule)\b/.test(lower)) {
    if (isMarathi) {
      return `रोअर फिटनेसचे कामाचे तास: **सोमवार ते शनिवार सकाळी ६:०० ते रात्री १०:००**. रविवार हा रिकव्हरीचा दिवस असतो. आमची जिम ६ व्या मजल्यावर (टेरेस), रुशिराज रीजन्सी, विद्या विकास सर्कल, गंगापूर रोड येथे आहे.`;
    }
    if (isHindi) {
      return `रोअर फिटनेस का समय: **सोमवार से शनिवार सुबह ६:०० से रात १०:०० बजे तक**। रविवार रिकवरी डे है। हमारी जिम छठवीं मंजिल (टेरेस), रुशिराज रीजेंसी, विद्या विकास सर्कल, गंगापुर रोड, नाशिक पर स्थित है।`;
    }
    return `Roar Extreme operates **Monday through Saturday from 6:00 AM to 10:00 PM**. Sunday is dedicated to physical recovery and maintenance. We are located on the 6th Floor Terrace at Rushiraj Regency, Vidya Vikas Circle, Gangapur Road, Nashik.`;
  }

  // Intent: Location / Address
  if (/\b(location|address|where|place|map|reach|directions|circle|road)\b/.test(lower)) {
    if (isMarathi) {
      return `आमचा पत्ता: **६ वा मजला टेरेस, रुशिराज रीजन्सी, विद्या विकास सर्कल, गंगापूर रोड, नाशिक, महाराष्ट्र**। ५ व्या मजल्यापर्यंत लिफ्ट घ्या आणि नंतर टेरेससाठी पायऱ्या वापरा.`;
    }
    if (isHindi) {
      return `हमारा पता: **६०१/६०२, रुशिराज रीजेंसी, विद्या विकास सर्कल, एक्सिस बैंक के ऊपर, पाटिल कॉलोनी, कनाडा कॉर्नर, नाशिक, महाराष्ट्र ४२२००५**। ५वीं मंजिल तक लिफ्ट लें और फिर टेरेस तक सीढ़ियों का उपयोग करें।`;
    }
    return `Our official training facility is located at:\n**601/602 Rushiraj Regency, Vidya Vikas Circle, above Axis Bank, Patil Colony, Canada Corner, Nashik, Maharashtra 422005.**\nTake the elevator to the 5th floor, then take the dedicated staircase up to the rooftop terrace arena!`;
  }

  // Intent: Training Disciplines
  if (/\b(training|program|zumba|crossfit|kickboxing|strength|cardio|coach|trainer|muscle|weight)\b/.test(lower)) {
    return `At Roar Extreme Nashik, we offer 8 verified disciplines:\n1. **General Gym Training** — Resistance machinery & floor coaching\n2. **Strength Training** — Calibrated barbells, dumbbells & power platforms\n3. **Cardio Fitness** — Treadmills, ellipticals & endurance gear\n4. **Weight Management** — Metabolic fat-loss circuits\n5. **Zumba** — High-energy group aerobic dance\n6. **CrossFit** — Functional multi-joint rig workouts\n7. **Kickboxing** — Combat agility & striking\n8. **Personal Coaching** — 1-on-1 tailored biomechanics.\nWould you like to book a free session to try any of these?`;
  }

  // Intent: Pricing / Fees
  if (/\b(price|pricing|fees|cost|package|membership|charges|month|year)\b/.test(lower)) {
    return `Directory catalog plans start from ₹6,500/month (with 3-month and annual options available). Because seasonal offers and personalized goal packages are verified directly by management, we strongly recommend claiming your **Free Single Session Pass** first to tour the rooftop and speak with our head coach!`;
  }

  if (context) {
    return `Here is verified information from Roar Fitness Nashik:\n\n${context.slice(0, 500)}\n\nIs there anything specific you would like to know about our rooftop training arena, timings, or free pass?`;
  }

  return `Welcome to Roar Extreme Nashik! Train harder, move stronger, and unleash your inner beast. I can help you with our 8 training disciplines, rooftop facility address on Gangapur Road, operating hours (6 AM - 10 PM), or claiming your Free Session Pass. How can I assist your fitness journey today?`;
}

export async function generateChatStream({
  sessionId,
  messages,
  currentMessage = '',
  visitorId = '',
  preferredLanguage = 'en',
  onEvent,
}) {
  onEvent({ type: 'message_start' });

  // 1. Consented user preferences
  const prefsArray = await getPreferences(sessionId);
  const userPreferences = {};
  prefsArray.forEach((p) => {
    userPreferences[p.preferenceKey] = p.preferenceValue;
  });

  // 2. Grounded knowledge retrieval
  const lastUserMsg = currentMessage || messages[messages.length - 1]?.content || '';
  const relevantDocs = await searchRelevantKnowledge(lastUserMsg);
  const knowledgeContext = relevantDocs
    .map((d) => `[${d.category.toUpperCase()}] ${d.title}: ${d.content}`)
    .join('\n\n');

  // 3. Potential memory extraction
  const potentialMemory = extractPotentialPreferences(lastUserMsg);

  // 4. Trigger tool action events if specifically requested
  const detectedTools = detectActionTriggers(lastUserMsg);
  detectedTools.forEach((tool) => {
    onEvent({ type: 'tool_result', tool: tool.name, result: tool.arguments });
  });

  // 5. System prompt
  const systemPrompt = buildSystemPrompt({
    knowledgeContext,
    userPreferences,
    language: preferredLanguage,
  });

  // 6. Primary Provider: Google Gemini API (Google AI Studio)
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      logger.info(`Routing chat to Google Gemini (${env.geminiModel}) for session [${sessionId}]`);

      // Strictly alternating sanitized history for Gemini
      const contents = sanitizeGeminiTurns(messages, lastUserMsg);

      const stream = await gemini.models.generateContentStream({
        model: env.geminiModel,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const textChunk = chunk.text || '';
        if (textChunk) {
          fullResponse += textChunk;
          onEvent({ type: 'text_delta', content: textChunk, text: textChunk });
        }
      }

      onEvent({
        type: 'message_complete',
        fullResponse,
        content: fullResponse,
        potentialMemory: Object.keys(potentialMemory).length > 0 ? potentialMemory : null,
      });

      return fullResponse;
    } catch (err) {
      logger.warn(`Google Gemini streaming failed: ${err.message}. Checking fallbacks...`);
    }
  }

  // 7. Secondary Provider: OpenAI (if configured)
  const openai = getOpenAIClient();
  if (openai) {
    try {
      logger.info(`Routing chat to OpenAI (${env.aiModel})`);
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      const stream = await openai.chat.completions.create({
        model: env.aiModel,
        messages: formattedMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 600,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullResponse += delta.content;
          onEvent({ type: 'text_delta', content: delta.content });
        }
      }

      onEvent({
        type: 'message_complete',
        fullResponse,
        potentialMemory: Object.keys(potentialMemory).length > 0 ? potentialMemory : null,
      });

      return fullResponse;
    } catch (err) {
      logger.warn(`OpenAI streaming failed: ${err.message}`);
    }
  }

  // 8. Grounded Knowledge Fallback Engine
  logger.info(`Using Grounded Local Knowledge Engine for session [${sessionId}]`);
  const fallbackAnswer = await generateGroundedResponse({
    query: lastUserMsg,
    sessionId,
    language: preferredLanguage,
    preferences: userPreferences,
  });

  const words = fallbackAnswer.split(' ');
  for (let i = 0; i < words.length; i++) {
    const word = (i === 0 ? '' : ' ') + words[i];
    onEvent({ type: 'text_delta', content: word, text: word });
    await new Promise((r) => setTimeout(r, 18));
  }

  onEvent({
    type: 'message_complete',
    fullResponse: fallbackAnswer,
    content: fallbackAnswer,
    potentialMemory: Object.keys(potentialMemory).length > 0 ? potentialMemory : null,
  });

  return fallbackAnswer;
}

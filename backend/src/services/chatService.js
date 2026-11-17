import crypto from 'crypto';
import { ChatSession } from '../models/ChatSession.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateChatStream } from './aiService.js';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

export async function getOrCreateSession(sessionId, visitorId = null) {
  const effectiveVisitorId = visitorId || `vis_${crypto.randomBytes(8).toString('hex')}`;
  const effectiveSessionId = sessionId || `sess_${crypto.randomBytes(12).toString('hex')}`;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.chatHistoryRetentionDays);

  let session = await ChatSession.findOne({ sessionId: effectiveSessionId });

  if (!session) {
    session = new ChatSession({
      sessionId: effectiveSessionId,
      anonymousVisitorId: effectiveVisitorId,
      expiresAt,
    });
    await session.save();
  } else {
    // Non-blocking update of lastActiveAt
    session.lastActiveAt = new Date();
    session.save().catch((err) => logger.warn('[SESSION] Non-blocking update error:', err.message));
  }

  return session;
}

export async function getSessionHistory(sessionId) {
  return ChatMessage.find({ sessionId }).sort({ createdAt: 1 }).limit(50).lean();
}

export async function deleteSessionHistory(sessionId) {
  await ChatMessage.deleteMany({ sessionId });
  return { success: true };
}

export async function processUserMessage({ sessionId, visitorId, content, onEvent }) {
  const cleanContent = content.trim();

  // Run session check and recent history lookup in parallel (< 15ms)
  const [session, recentMessages] = await Promise.all([
    getOrCreateSession(sessionId, visitorId),
    ChatMessage.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
  ]);

  const history = recentMessages.reverse();

  // Non-blocking background save of incoming user message
  new ChatMessage({
    sessionId: session.sessionId,
    role: 'user',
    content: cleanContent,
  })
    .save()
    .catch((err) => logger.error('[CHAT] Error saving user message in background:', err.message));

  // Generate and stream AI response (SSE)
  const assistantResponse = await generateChatStream({
    sessionId: session.sessionId,
    messages: history,
    currentMessage: cleanContent,
    visitorId: session.anonymousVisitorId,
    preferredLanguage: session.preferredLanguage,
    onEvent,
  });

  // Non-blocking background save of assistant message
  new ChatMessage({
    sessionId: session.sessionId,
    role: 'assistant',
    content: assistantResponse,
  })
    .save()
    .catch((err) => logger.error('[CHAT] Error saving assistant message in background:', err.message));

  return {
    sessionId: session.sessionId,
    response: assistantResponse,
  };
}

export async function recordHandoff({ sessionId, visitorId, fullName, phone, message }) {
  return AuditLog.create({
    action: 'CHAT_HUMAN_HANDOFF',
    actorType: 'visitor',
    actorId: phone,
    targetResource: `Session:${sessionId}`,
    details: { fullName, phone, message, visitorId },
  });
}

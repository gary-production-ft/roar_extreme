import crypto from 'crypto';
import { ChatSession } from '../models/ChatSession.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateChatStream } from './aiService.js';
import { env } from '../config/environment.js';

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
    session.lastActiveAt = new Date();
    await session.save();
  }

  return session;
}

export async function getSessionHistory(sessionId) {
  return ChatMessage.find({ sessionId }).sort({ createdAt: 1 }).limit(50);
}

export async function deleteSessionHistory(sessionId) {
  await ChatMessage.deleteMany({ sessionId });
  return { success: true };
}

export async function processUserMessage({ sessionId, visitorId, content, onEvent }) {
  const session = await getOrCreateSession(sessionId, visitorId);

  // Save incoming user message
  const userMsg = new ChatMessage({
    sessionId: session.sessionId,
    role: 'user',
    content: content.trim(),
  });
  await userMsg.save();

  // Load the MOST RECENT history for context (sorted descending, then reversed)
  const recentMessages = await ChatMessage.find({ sessionId: session.sessionId })
    .sort({ createdAt: -1 })
    .limit(12);
  const history = recentMessages.reverse();

  // Generate and stream AI response
  const assistantResponse = await generateChatStream({
    sessionId: session.sessionId,
    messages: history,
    currentMessage: content.trim(),
    visitorId: session.anonymousVisitorId,
    preferredLanguage: session.preferredLanguage,
    onEvent,
  });

  // Save assistant message
  const assistantMsg = new ChatMessage({
    sessionId: session.sessionId,
    role: 'assistant',
    content: assistantResponse,
  });
  await assistantMsg.save();

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


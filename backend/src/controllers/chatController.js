import { z } from 'zod';
import {
  getOrCreateSession,
  getSessionHistory,
  deleteSessionHistory,
  processUserMessage,
  recordHandoff,
} from '../services/chatService.js';
import { ChatSession } from '../models/ChatSession.js';

export const sessionSchema = z.object({
  body: z.object({
    sessionId: z.string().optional(),
    visitorId: z.string().optional(),
    language: z.enum(['en', 'hi', 'mr']).optional(),
  }),
});

export const messageSchema = z.object({
  body: z.object({
    sessionId: z.string().min(5),
    visitorId: z.string().optional(),
    content: z.string().optional(),
    message: z.string().optional(),
    language: z.enum(['en', 'hi', 'mr']).optional(),
  }).refine((data) => data.content || data.message, {
    message: 'Either content or message must be provided',
    path: ['content'],
  }),
});

export const handoffSchema = z.object({
  body: z.object({
    sessionId: z.string().min(5),
    fullName: z.string().min(2),
    phone: z.string().regex(/^[6-9]\d{9}$/),
    message: z.string().optional(),
  }),
});

export async function createOrResumeSession(req, res, next) {
  try {
    const { sessionId, visitorId, language } = req.validatedData.body;
    const session = await getOrCreateSession(sessionId, visitorId);

    if (language) {
      session.preferredLanguage = language;
      await session.save();
    }

    res.json({
      success: true,
      sessionId: session.sessionId,
      visitorId: session.anonymousVisitorId,
      consentStatus: session.consentStatus,
      preferredLanguage: session.preferredLanguage,
    });
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const { sessionId, visitorId } = req.validatedData.body;
    const content = req.validatedData.body.content || req.validatedData.body.message;

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering

    const sendEvent = (eventData) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(eventData)}\n\n`);
      }
    };

    // Keep-alive heartbeat
    const interval = setInterval(() => {
      if (!res.writableEnded) {
        res.write(': heartbeat\n\n');
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(interval);
    });

    await processUserMessage({
      sessionId,
      visitorId,
      content,
      onEvent: sendEvent,
    });

    clearInterval(interval);
    if (!res.writableEnded) {
      res.end();
    }
  } catch (err) {
    if (res.headersSent) {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
        res.end();
      }
    } else {
      next(err);
    }
  }
}

export async function getHistory(req, res, next) {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const history = await getSessionHistory(sessionId);
    res.json({
      success: true,
      history,
    });
  } catch (err) {
    next(err);
  }
}

export async function clearHistory(req, res, next) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    await deleteSessionHistory(sessionId);
    res.json({
      success: true,
      message: 'Conversation history cleared.',
    });
  } catch (err) {
    next(err);
  }
}

export async function submitHandoff(req, res, next) {
  try {
    const { sessionId, fullName, phone, message } = req.validatedData.body;
    await recordHandoff({ sessionId, fullName, phone, message });

    res.json({
      success: true,
      message: 'Assistance request received. A coach will contact you on WhatsApp or call.',
    });
  } catch (err) {
    next(err);
  }
}

export async function updateConsent(req, res, next) {
  try {
    const { sessionId, consentStatus } = req.body;
    if (!['pending', 'granted', 'denied'].includes(consentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid consent status' });
    }

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.consentStatus = consentStatus;
    await session.save();

    res.json({
      success: true,
      consentStatus: session.consentStatus,
      message: `Memory consent updated to ${consentStatus}`,
    });
  } catch (err) {
    next(err);
  }
}


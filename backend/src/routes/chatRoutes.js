import { Router } from 'express';
import { env } from '../config/environment.js';
import {
  createOrResumeSession,
  sendMessage,
  getHistory,
  clearHistory,
  submitHandoff,
  updateConsent,
  submitFeedback,
  sessionSchema,
  messageSchema,
  handoffSchema,
  feedbackSchema,
} from '../controllers/chatController.js';
import { validate } from '../middleware/validate.js';
import { chatLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Kill-switch middleware
router.use((req, res, next) => {
  if (!env.enableChatbot) {
    return res.status(503).json({
      success: false,
      message: 'Chatbot service is temporarily disabled for maintenance.',
    });
  }
  next();
});

router.post('/session', validate(sessionSchema), createOrResumeSession);
router.post('/message', chatLimiter, validate(messageSchema), sendMessage);
router.get('/history', getHistory);
router.delete('/history', clearHistory);
router.post('/handoff', validate(handoffSchema), submitHandoff);
router.post('/consent', updateConsent);
router.post('/feedback', validate(feedbackSchema), submitFeedback);

export default router;


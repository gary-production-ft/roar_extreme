import { Router } from 'express';
import {
  createOrResumeSession,
  sendMessage,
  getHistory,
  clearHistory,
  submitHandoff,
  updateConsent,
  sessionSchema,
  messageSchema,
  handoffSchema,
} from '../controllers/chatController.js';
import { validate } from '../middleware/validate.js';
import { chatLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/session', validate(sessionSchema), createOrResumeSession);
router.post('/message', chatLimiter, validate(messageSchema), sendMessage);
router.get('/history', getHistory);
router.delete('/history', clearHistory);
router.post('/handoff', validate(handoffSchema), submitHandoff);
router.post('/consent', updateConsent);

export default router;


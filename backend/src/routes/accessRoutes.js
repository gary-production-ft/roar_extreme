import { Router } from 'express';
import { handleVerifyAccess, verifyAccessSchema } from '../controllers/accessController.js';
import { validate } from '../middleware/validate.js';
import { authenticateDevice } from '../middleware/deviceAuth.js';
import { accessLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Device-facing verification endpoint
router.post('/verify', accessLimiter, authenticateDevice, validate(verifyAccessSchema), handleVerifyAccess);

export default router;

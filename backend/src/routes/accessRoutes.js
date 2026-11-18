import { Router } from 'express';
import { handleVerifyAccess, verifyAccessSchema } from '../controllers/accessController.js';
import { validate } from '../middleware/validate.js';
import { authenticateDevice } from '../middleware/deviceAuth.js';
import { accessLimiter } from '../middleware/rateLimiter.js';
import { env } from '../config/environment.js';

const router = Router();

// Device-facing verification endpoint (guarded by feature flag)
router.post(
  '/verify',
  (req, res, next) => {
    if (!env.enableFaceAccess) {
      return res.status(503).json({
        success: false,
        decision: 'denied',
        reason: 'Biometric face access is disabled pending physical commissioning and legal sign-off.',
      });
    }
    next();
  },
  accessLimiter,
  authenticateDevice,
  validate(verifyAccessSchema),
  handleVerifyAccess
);

export default router;

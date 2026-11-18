import { Router } from 'express';
import { env } from '../config/environment.js';
import {
  createFitnessPlan,
  getFitnessPlan,
  rateFitnessPlan,
  requestTrainerReview,
  getExerciseCatalog,
  getFoodCatalog,
  planIntakeSchema,
} from '../controllers/fitnessPlanController.js';
import { validate } from '../middleware/validate.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Kill-switch middleware
router.use((req, res, next) => {
  if (!env.enablePlanEngine) {
    return res.status(503).json({
      success: false,
      message: 'Fitness plan generation is temporarily disabled for maintenance.',
    });
  }
  next();
});

// Dedicated rate limiter: 10 plan generations per 15 minutes per IP
const planGenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Plan generation rate limit reached. Please wait a few minutes before designing another plan.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Generation
router.post('/generate', planGenLimiter, validate(planIntakeSchema), createFitnessPlan);

// Retrieval & Interaction
router.get('/:planId', getFitnessPlan);
router.post('/:planId/rating', rateFitnessPlan);
router.post('/:planId/trainer-review', requestTrainerReview);

// Catalogs
router.get('/catalog/exercises', getExerciseCatalog);
router.get('/catalog/foods', getFoodCatalog);

export default router;

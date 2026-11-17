import { Router } from 'express';
import { listPlans, createPlan, updatePlan, planSchema } from '../controllers/planController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Public / Authenticated plan retrieval
router.get('/', listPlans);

// Plan configuration (Owner only)
router.post('/', authenticate, authorize('owner'), validate(planSchema), createPlan);
router.patch('/:id', authenticate, authorize('owner'), updatePlan);

export default router;

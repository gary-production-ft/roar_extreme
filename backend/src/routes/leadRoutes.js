import { Router } from 'express';
import { submitLead, listLeads, updateLead, deleteLead, exportLeads, leadValidationSchema } from '../controllers/leadController.js';
import { validate } from '../middleware/validate.js';
import { leadLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// Public lead submission
router.post('/', leadLimiter, validate(leadValidationSchema), submitLead);

// Protected admin lead management with role-based authorization
router.get('/', authenticate, authorize('owner', 'receptionist', 'trainer'), listLeads);
router.get('/export/csv', authenticate, authorize('owner', 'receptionist'), exportLeads);
router.patch('/:id', authenticate, authorize('owner', 'receptionist'), updateLead);
router.delete('/:id', authenticate, authorize('owner'), deleteLead);

export default router;

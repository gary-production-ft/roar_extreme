import { Router } from 'express';
import { submitLead, listLeads, updateLead, deleteLead, exportLeads, leadValidationSchema } from '../controllers/leadController.js';
import { validate } from '../middleware/validate.js';
import { leadLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Public lead submission
router.post('/', leadLimiter, validate(leadValidationSchema), submitLead);

// Protected admin lead management
router.get('/', authenticate, listLeads);
router.get('/export/csv', authenticate, exportLeads);
router.patch('/:id', authenticate, updateLead);
router.delete('/:id', authenticate, deleteLead);

export default router;


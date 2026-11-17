import { Router } from 'express';
import {
  listMembers,
  getMemberDetails,
  createMemberHandler,
  enrolFaceHandler,
  deleteBiometricsHandler,
  renewMemberHandler,
  recordPaymentHandler,
  freezeMemberHandler,
  unfreezeMemberHandler,
  blockMemberHandler,
  unblockMemberHandler,
  exportMembersCsv,
  convertLeadHandler,
  createMemberSchema,
  enrolFaceSchema,
  renewMemberSchema,
  recordPaymentSchema,
  convertLeadSchema,
} from '../controllers/memberController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Member search and listing
router.get('/', authenticate, authorize('owner', 'receptionist', 'trainer'), listMembers);
router.get('/export/csv', authenticate, authorize('owner', 'receptionist'), exportMembersCsv);
router.get('/:id', authenticate, authorize('owner', 'receptionist', 'trainer'), getMemberDetails);

// Member lifecycle
router.post('/', authenticate, authorize('owner', 'receptionist'), validate(createMemberSchema), createMemberHandler);
router.post('/convert-lead/:id', authenticate, authorize('owner', 'receptionist'), validate(convertLeadSchema), convertLeadHandler);

// Biometric enrollment & compliance
router.post('/:id/enrol-face', authenticate, authorize('owner', 'receptionist'), validate(enrolFaceSchema), enrolFaceHandler);
router.delete('/:id/face', authenticate, authorize('owner'), deleteBiometricsHandler);

// Membership renewal & financial actions
router.post('/:id/renew', authenticate, authorize('owner', 'receptionist'), validate(renewMemberSchema), renewMemberHandler);
router.post('/:id/payment', authenticate, authorize('owner', 'receptionist'), validate(recordPaymentSchema), recordPaymentHandler);

// Status controls
router.post('/:id/freeze', authenticate, authorize('owner'), freezeMemberHandler);
router.post('/:id/unfreeze', authenticate, authorize('owner'), unfreezeMemberHandler);
router.post('/:id/block', authenticate, authorize('owner'), blockMemberHandler);
router.post('/:id/unblock', authenticate, authorize('owner'), unblockMemberHandler);

export default router;

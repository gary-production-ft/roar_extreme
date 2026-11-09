import { Router } from 'express';
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  documentSchema,
} from '../controllers/knowledgeController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/', authenticate, getDocuments);
router.post('/', authenticate, validate(documentSchema), createDocument);
router.patch('/:id', authenticate, updateDocument);
router.delete('/:id', authenticate, deleteDocument);

export default router;


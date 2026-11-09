import { Router } from 'express';
import {
  getUserPreferences,
  storePreference,
  removePreference,
  clearPreferences,
  savePreferenceSchema,
} from '../controllers/preferenceController.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', getUserPreferences);
router.post('/', validate(savePreferenceSchema), storePreference);
router.delete('/:key', removePreference);
router.post('/clear', clearPreferences);

export default router;


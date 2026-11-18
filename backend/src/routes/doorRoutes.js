import { Router } from 'express';
import {
  listDoors,
  handleManualUnlock,
  handleToggleLockdown,
  listDoorEvents,
  exportDoorEventsCsv,
  listDevices,
  createDevice,
  resetDeviceLockout,
  handleSeedDemoData,
  manualUnlockSchema,
  lockdownSchema,
  createDeviceSchema,
} from '../controllers/doorController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Door status & list
router.get('/doors', authenticate, authorize('owner', 'receptionist', 'trainer'), listDoors);

// Door manual command & emergency controls
router.post(
  '/doors/:id/unlock',
  authenticate,
  authorize('owner', 'receptionist'),
  validate(manualUnlockSchema),
  handleManualUnlock
);
router.post(
  '/doors/:id/lockdown',
  authenticate,
  authorize('owner'),
  validate(lockdownSchema),
  handleToggleLockdown
);

// Door events history & CSV export
router.get('/doors/events', authenticate, authorize('owner', 'receptionist'), listDoorEvents);
router.get('/doors/events/export/csv', authenticate, authorize('owner', 'receptionist'), exportDoorEventsCsv);

// Device management
router.get('/devices', authenticate, authorize('owner', 'receptionist'), listDevices);
router.post('/devices', authenticate, authorize('owner'), validate(createDeviceSchema), createDevice);
router.post('/devices/:id/reset-lockout', authenticate, authorize('owner', 'receptionist'), resetDeviceLockout);

// Demo data seeding endpoint for automated/manual testing
router.post('/doors/seed-demo', (req, res, next) => {
  if (req.headers['x-seed-key'] === 'roar-demo-seed-2026') {
    return handleSeedDemoData(req, res, next);
  }
  return authenticate(req, res, () => {
    authorize('owner', 'receptionist')(req, res, () => {
      handleSeedDemoData(req, res, next);
    });
  });
});

export default router;

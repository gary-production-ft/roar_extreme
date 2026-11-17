import { Router } from 'express';
import {
  listAccessLogs,
  exportAccessLogsCsv,
  listAttendance,
  exportAttendanceCsv,
  recordManualAttendance,
} from '../controllers/logsController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// Access audit logs
router.get('/access-logs', authenticate, authorize('owner', 'receptionist'), listAccessLogs);
router.get('/access-logs/export/csv', authenticate, authorize('owner', 'receptionist'), exportAccessLogsCsv);

// Attendance logs
router.get('/attendance', authenticate, authorize('owner', 'receptionist', 'trainer'), listAttendance);
router.get('/attendance/export/csv', authenticate, authorize('owner', 'receptionist'), exportAttendanceCsv);
router.post('/attendance/manual', authenticate, authorize('owner', 'receptionist'), recordManualAttendance);

export default router;

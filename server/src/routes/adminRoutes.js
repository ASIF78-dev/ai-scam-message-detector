import { Router } from 'express';
import {
  getAnalytics,
  getUsers,
  updateUserRole,
  deleteUser,
  getAllSystemScans,
  exportReport,
  seedDemoIntelligence,
} from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateRoleUpdateInput } from '../middleware/validator.js';

const router = Router();

// All admin routes require authentication and admin privileges
router.use(requireAuth, requireAdmin);

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.patch('/users/:id/role', validateRoleUpdateInput, updateUserRole);

router.delete('/users/:id', deleteUser);
router.get('/scans', getAllSystemScans);
router.get('/export/report', exportReport);
router.post('/seed-demo', seedDemoIntelligence);

export default router;

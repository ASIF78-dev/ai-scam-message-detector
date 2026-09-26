import { Router } from 'express';
import { analyze, getHistory, getScanById, deleteScan } from '../controllers/scanController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validateScanInput } from '../middleware/validator.js';

const router = Router();

// Scan analysis route (supports both anonymous and logged-in users)
router.post('/analyze', optionalAuth, validateScanInput, analyze);


// History routes for logged-in users
router.get('/history', requireAuth, getHistory);
router.get('/', requireAuth, getHistory);

// Single scan details and deletion
router.get('/:id', requireAuth, getScanById);
router.delete('/:id', requireAuth, deleteScan);

export default router;

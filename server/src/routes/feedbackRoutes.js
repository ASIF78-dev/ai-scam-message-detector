import { Router } from 'express';
import {
  submitFeedback,
  getFeedbackStats,
  getAllFeedback,
  deleteFeedback,
} from '../controllers/feedbackController.js';
import { optionalAuth, requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateFeedbackInput } from '../middleware/validator.js';

const router = Router();

// Public / Authenticated user endpoint to submit feedback on predictions
router.post('/', optionalAuth, validateFeedbackInput, submitFeedback);


// Admin-only endpoints for reviewing model accuracy, user feedback, and training corrections
router.get('/stats', requireAuth, requireAdmin, getFeedbackStats);
router.get('/', requireAuth, requireAdmin, getAllFeedback);
router.delete('/:id', requireAuth, requireAdmin, deleteFeedback);

export default router;

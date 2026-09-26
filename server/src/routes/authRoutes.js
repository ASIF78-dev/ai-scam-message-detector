import { Router } from 'express';
import { register, login, getMe, elevateDemoAdmin } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRegisterInput, validateLoginInput } from '../middleware/validator.js';

const router = Router();

router.post('/register', validateRegisterInput, register);
router.post('/login', validateLoginInput, login);
router.get('/me', requireAuth, getMe);
router.post('/elevate-demo-admin', requireAuth, elevateDemoAdmin);


export default router;


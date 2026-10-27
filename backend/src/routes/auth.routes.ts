import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Public registration (rate-limited, validated, strictly creates Student)
router.post('/register', authLimiter, validateBody(registerSchema), AuthController.register);

// Login (rate-limited, generic failure message)
router.post('/login', authLimiter, validateBody(loginSchema), AuthController.login);

// Refresh token rotation (reads HttpOnly cookie, returns new access token)
router.post('/refresh', AuthController.refresh);

// Logout (revokes session hash, clears cookie)
router.post('/logout', AuthController.logout);

// Current user profile
router.get('/me', authenticate, AuthController.getCurrentUser);

// Password change
router.post('/change-password', authenticate, AuthController.changePassword);

export default router;

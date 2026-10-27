import { Router } from 'express';
import { ResultController } from '../controllers/result.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { requireOrganizerOrAdmin } from '../middleware/rbac.middleware.js';

const router = Router();

// Student can view their personal published results
router.get('/me', authenticate, ResultController.getMyResults);

export default router;

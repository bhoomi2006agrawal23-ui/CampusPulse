import { Router } from 'express';
import { JudgeController } from '../controllers/judge.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireOrganizerOrAdmin } from '../middleware/rbac.middleware.js';

const router = Router();

// /api/judges/me - current judge's assigned events
router.get('/me', authenticate, JudgeController.getMyJudgeAssignments);

// /api/judges/:id - remove judge assignment
router.delete('/:id', authenticate, requireOrganizerOrAdmin, JudgeController.removeJudgeAssignment);

export default router;

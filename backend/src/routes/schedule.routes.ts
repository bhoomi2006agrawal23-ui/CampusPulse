import { Router } from 'express';
import { ScheduleController } from '../controllers/schedule.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { requireOrganizerOrAdmin } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createScheduleSchema, updateScheduleSchema } from '../validators/phase4.validator.js';

const router = Router({ mergeParams: true });

// Event-nested schedule routes: /api/events/:eventId/schedules
router.get('/', optionalAuth, ScheduleController.getEventSchedules);
router.post(
  '/',
  authenticate,
  requireOrganizerOrAdmin,
  validateBody(createScheduleSchema),
  ScheduleController.createSchedule
);

export default router;

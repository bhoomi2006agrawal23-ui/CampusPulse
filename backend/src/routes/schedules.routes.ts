import { Router } from 'express';
import { ScheduleController } from '../controllers/schedule.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireOrganizerOrAdmin } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateScheduleSchema } from '../validators/phase4.validator.js';

const router = Router();

router.patch(
  '/:id',
  authenticate,
  requireOrganizerOrAdmin,
  validateBody(updateScheduleSchema),
  ScheduleController.updateSchedule
);

router.delete('/:id', authenticate, requireOrganizerOrAdmin, ScheduleController.deleteSchedule);

export default router;

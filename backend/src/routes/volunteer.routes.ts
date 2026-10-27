import { Router } from 'express';
import { VolunteerController } from '../controllers/volunteer.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireOrganizerOrAdmin } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { assignVolunteerSchema, updateVolunteerDutySchema } from '../validators/phase4.validator.js';

const router = Router();

// /api/volunteers/me - current volunteer's duties
router.get('/me', authenticate, VolunteerController.getMyVolunteerDuties);

// /api/volunteers/:id - update duty details
router.patch(
  '/:id',
  authenticate,
  requireOrganizerOrAdmin,
  validateBody(updateVolunteerDutySchema),
  VolunteerController.updateVolunteerDuty
);

// /api/volunteers/:id/check-in - duty check-in
router.post('/:id/check-in', authenticate, VolunteerController.checkInVolunteer);

// /api/volunteers/:id - remove assignment
router.delete('/:id', authenticate, requireOrganizerOrAdmin, VolunteerController.removeVolunteerAssignment);

export default router;

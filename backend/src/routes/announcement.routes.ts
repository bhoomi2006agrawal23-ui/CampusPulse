import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcement.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { requireOrganizerOrAdmin } from '../middleware/rbac.middleware.js';

const router = Router();

// Public / Students can view published announcements
router.get('/', optionalAuth, AnnouncementController.getAnnouncements);

// Organizers / Admins can create and manage announcements
router.post('/', authenticate, requireOrganizerOrAdmin, AnnouncementController.createAnnouncement);
router.patch('/:id', authenticate, requireOrganizerOrAdmin, AnnouncementController.updateAnnouncement);
router.delete('/:id', authenticate, requireOrganizerOrAdmin, AnnouncementController.deleteAnnouncement);

export default router;

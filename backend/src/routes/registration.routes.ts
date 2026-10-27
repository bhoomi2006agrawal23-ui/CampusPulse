import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Get current student's registrations
router.get('/me', authenticate, EventController.getMyRegistrations);

export default router;

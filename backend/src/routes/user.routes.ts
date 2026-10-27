import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';

const router = Router();

// List users (Admin only)
router.get('/', authenticate, requireAdmin, UserController.getUsers);

// Get specific user (Admin only)
router.get('/:id', authenticate, requireAdmin, UserController.getUserById);

// Update user role (Admin only - promote to Organizer, Judge, Volunteer, Admin)
router.patch('/:id/role', authenticate, requireAdmin, UserController.updateUserRole);

// Update self profile
router.put('/profile', authenticate, UserController.updateProfile);

export default router;

import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';

const router = Router();

// List users (Admin only)
router.get('/', authenticate, requireAdmin, UserController.getUsers);

// Create user (Admin only - Student, Organizer, Judge, Volunteer, Admin)
router.post('/', authenticate, requireAdmin, UserController.createUser);

// Get specific user (Admin only)
router.get('/:id', authenticate, requireAdmin, UserController.getUserById);

// Update user details (Admin only)
router.patch('/:id', authenticate, requireAdmin, UserController.updateUser);
router.put('/:id', authenticate, requireAdmin, UserController.updateUser);

// Update user role (Admin only - promote to Organizer, Judge, Volunteer, Admin)
router.patch('/:id/role', authenticate, requireAdmin, UserController.updateUserRole);

// Delete user account with safeguards (Admin only)
router.delete('/:id', authenticate, requireAdmin, UserController.deleteUser);

// Update self profile
router.put('/profile', authenticate, UserController.updateProfile);

export default router;

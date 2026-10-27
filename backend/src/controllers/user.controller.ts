import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { ROLES, UserRole, VALID_ROLES } from '../constants/roles.js';
import { isDbConnected } from '../config/db.js';
import { memoryStore, toSafeUser } from '../services/auth.service.js';
import { AuditLogService } from '../services/audit.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class UserController {
  /**
   * List all users (Admin only)
   * GET /api/users
   */
  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (isDbConnected()) {
        const users = await User.find().sort({ createdAt: -1 });
        sendSuccess(res, { users: users.map(toSafeUser) }, 200);
      } else {
        const users = Array.from(memoryStore.users.values()).map(toSafeUser);
        sendSuccess(res, { users }, 200);
      }
    } catch (err: unknown) {
      next(err);
    }
  }

  /**
   * Get specific user profile by ID
   * GET /api/users/:id
   */
  static async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (isDbConnected()) {
        const user = await User.findById(id);
        if (!user) {
          sendError(res, 'USER_NOT_FOUND', 'User does not exist', 404);
          return;
        }
        sendSuccess(res, { user: toSafeUser(user) }, 200);
      } else {
        const user = memoryStore.users.get(id);
        if (!user) {
          sendError(res, 'USER_NOT_FOUND', 'User does not exist', 404);
          return;
        }
        sendSuccess(res, { user: toSafeUser(user) }, 200);
      }
    } catch (err: unknown) {
      next(err);
    }
  }

  /**
   * Promote or reassign user role (Admin only)
   * PATCH /api/users/:id/role
   */
  static async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!VALID_ROLES.includes(role)) {
        sendError(res, 'INVALID_ROLE', `Role must be one of: ${VALID_ROLES.join(', ')}`, 400);
        return;
      }

      if (isDbConnected()) {
        const user = await User.findByIdAndUpdate(id, { role }, { new: true });
        if (!user) {
          sendError(res, 'USER_NOT_FOUND', 'User does not exist', 404);
          return;
        }
        await AuditLogService.log({
          actorId: req.user?.id,
          actorRole: req.user?.role,
          action: 'USER_ROLE_PROMOTION',
          resourceType: 'User',
          resourceId: id,
          metadata: { newRole: role },
        });
        sendSuccess(res, { user: toSafeUser(user) }, 200, `User role updated to ${role}`);
      } else {
        const user = memoryStore.users.get(id);
        if (!user) {
          sendError(res, 'USER_NOT_FOUND', 'User does not exist', 404);
          return;
        }
        user.role = role as UserRole;
        user.updatedAt = new Date();
        await AuditLogService.log({
          actorId: req.user?.id,
          actorRole: req.user?.role,
          action: 'USER_ROLE_PROMOTION',
          resourceType: 'User',
          resourceId: id,
          metadata: { newRole: role },
        });
        sendSuccess(res, { user: toSafeUser(user) }, 200, `User role updated to ${role}`);
      }
    } catch (err: unknown) {
      next(err);
    }
  }

  /**
   * Update personal profile (Self)
   * PUT /api/users/profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const { name, phoneNumber, bio } = req.body;
      const updateData: any = {};
      if (name) updateData.name = name.trim();
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber.trim();
      if (bio !== undefined) updateData.bio = bio.trim();

      if (isDbConnected()) {
        const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
        if (!user) {
          sendError(res, 'USER_NOT_FOUND', 'User record not found', 404);
          return;
        }
        sendSuccess(res, { user: toSafeUser(user) }, 200, 'Profile updated successfully');
      } else {
        const user = memoryStore.users.get(req.user.id);
        if (!user) {
          sendError(res, 'USER_NOT_FOUND', 'User record not found', 404);
          return;
        }
        if (name) user.name = name.trim();
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
        if (bio !== undefined) user.bio = bio.trim();
        user.updatedAt = new Date();
        sendSuccess(res, { user: toSafeUser(user) }, 200, 'Profile updated successfully');
      }
    } catch (err: unknown) {
      next(err);
    }
  }
}

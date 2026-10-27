import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { ROLES, UserRole, VALID_ROLES } from '../constants/roles.js';
import { isDbConnected } from '../config/db.js';
import { memoryStore, toSafeUser } from '../services/auth.service.js';
import { memoryEvents } from '../services/venue.service.js';
import { memoryRegistrations } from '../services/venue.service.js';
import { AuditLogService } from '../services/audit.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { hashPassword } from '../utils/crypto.js';

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
   * Create account directly with specified role (Admin only)
   * POST /api/users
   */
  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role, phoneNumber, collegeName, loginId } = req.body;

      if (!name || !email || !password || !role) {
        sendError(res, 'BAD_REQUEST', 'Name, email, password, and role are required', 400);
        return;
      }

      if (!VALID_ROLES.includes(role)) {
        sendError(res, 'INVALID_ROLE', `Role must be one of: ${VALID_ROLES.join(', ')}`, 400);
        return;
      }

      if (password.length < 8) {
        sendError(res, 'BAD_REQUEST', 'Password must be at least 8 characters long', 400);
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const trimmedLoginId = loginId ? loginId.toLowerCase().trim() : undefined;

      if (isDbConnected()) {
        const query: any = [{ email: normalizedEmail }];
        if (trimmedLoginId) query.push({ loginId: trimmedLoginId });
        const existing = await User.findOne({ $or: query });
        if (existing) {
          sendError(res, 'DUPLICATE_USER', 'A user with this email or Login ID already exists', 409);
          return;
        }

        const passwordHash = await hashPassword(password);
        const newUser = await User.create({
          name: name.trim(),
          email: normalizedEmail,
          loginId: trimmedLoginId,
          passwordHash,
          role,
          collegeName: collegeName?.trim() || undefined,
          phoneNumber: phoneNumber?.trim() || undefined,
          profileInfo: {
            collegeName: collegeName?.trim() || undefined,
          },
          status: 'Active',
        });

        await AuditLogService.log({
          actorId: req.user?.id,
          actorRole: req.user?.role,
          action: 'USER_CREATE_BY_ADMIN',
          resourceType: 'User',
          resourceId: newUser._id.toString(),
          metadata: { createdRole: role, email: normalizedEmail },
        });

        sendSuccess(res, { user: toSafeUser(newUser) }, 201, `${role} account created successfully`);
      } else {
        for (const u of memoryStore.users.values()) {
          if (
            u.email.toLowerCase() === normalizedEmail ||
            (trimmedLoginId && u.loginId?.toLowerCase() === trimmedLoginId)
          ) {
            sendError(res, 'DUPLICATE_USER', 'A user with this email or Login ID already exists', 409);
            return;
          }
        }

        const passwordHash = await hashPassword(password);
        const newId = new mongoose.Types.ObjectId().toString();
        const memUser = {
          _id: newId,
          name: name.trim(),
          email: normalizedEmail,
          loginId: trimmedLoginId,
          passwordHash,
          role,
          collegeName: collegeName?.trim() || undefined,
          phoneNumber: phoneNumber?.trim() || undefined,
          profileInfo: {
            collegeName: collegeName?.trim() || undefined,
          },
          status: 'Active' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        memoryStore.users.set(newId, memUser);

        await AuditLogService.log({
          actorId: req.user?.id,
          actorRole: req.user?.role,
          action: 'USER_CREATE_BY_ADMIN',
          resourceType: 'User',
          resourceId: newId,
          metadata: { createdRole: role, email: normalizedEmail },
        });

        sendSuccess(res, { user: toSafeUser(memUser) }, 201, `${role} account created successfully`);
      }
    } catch (err: unknown) {
      next(err);
    }
  }

  /**
   * Update user details and role (Admin only)
   * PATCH /api/users/:id or PUT /api/users/:id
   */
  static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, role, status, phoneNumber, collegeName } = req.body;

      if (role && !VALID_ROLES.includes(role)) {
        sendError(res, 'INVALID_ROLE', `Role must be one of: ${VALID_ROLES.join(', ')}`, 400);
        return;
      }

      if (status && !['Active', 'Suspended', 'Pending'].includes(status)) {
        sendError(res, 'INVALID_STATUS', 'Status must be Active, Suspended, or Pending', 400);
        return;
      }

      // Safeguard: Prevent demoting or deactivating the last active Admin
      if (isDbConnected()) {
        const target = await User.findById(id);
        if (!target) {
          sendError(res, 'USER_NOT_FOUND', 'User does not exist', 404);
          return;
        }

        if (target.role === ROLES.ADMIN) {
          const willDemote = role && role !== ROLES.ADMIN;
          const willDeactivate = status && status !== 'Active';

          if (willDemote || willDeactivate) {
            const activeAdminCount = await User.countDocuments({ role: ROLES.ADMIN, status: 'Active' });
            if (activeAdminCount <= 1) {
              sendError(
                res,
                'FORBIDDEN',
                'Operation blocked: Cannot demote or suspend the last active administrator account.',
                403
              );
              return;
            }
          }
        }

        const updateData: any = {};
        if (name) updateData.name = name.trim();
        if (role) updateData.role = role;
        if (status) updateData.status = status;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber.trim();
        if (collegeName !== undefined) {
          updateData.collegeName = collegeName.trim();
          updateData['profileInfo.collegeName'] = collegeName.trim();
        }

        const updated = await User.findByIdAndUpdate(id, updateData, { new: true });

        await AuditLogService.log({
          actorId: req.user?.id,
          actorRole: req.user?.role,
          action: 'USER_UPDATE_BY_ADMIN',
          resourceType: 'User',
          resourceId: id,
          metadata: updateData,
        });

        sendSuccess(res, { user: toSafeUser(updated) }, 200, 'User updated successfully');
      } else {
        const target = memoryStore.users.get(id);
        if (!target) {
          sendError(res, 'USER_NOT_FOUND', 'User does not exist', 404);
          return;
        }

        if (target.role === ROLES.ADMIN) {
          const willDemote = role && role !== ROLES.ADMIN;
          const willDeactivate = status && status !== 'Active';

          if (willDemote || willDeactivate) {
            const activeAdmins = Array.from(memoryStore.users.values()).filter(
              (u) => u.role === ROLES.ADMIN && u.status === 'Active'
            );
            if (activeAdmins.length <= 1) {
              sendError(
                res,
                'FORBIDDEN',
                'Operation blocked: Cannot demote or suspend the last active administrator account.',
                403
              );
              return;
            }
          }
        }

        if (name) target.name = name.trim();
        if (role) target.role = role as UserRole;
        if (status) target.status = status as any;
        if (phoneNumber !== undefined) target.phoneNumber = phoneNumber.trim();
        if (collegeName !== undefined) {
          target.collegeName = collegeName.trim();
          if (target.profileInfo) target.profileInfo.collegeName = collegeName.trim();
        }
        target.updatedAt = new Date();

        await AuditLogService.log({
          actorId: req.user?.id,
          actorRole: req.user?.role,
          action: 'USER_UPDATE_BY_ADMIN',
          resourceType: 'User',
          resourceId: id,
          metadata: { role, status, name },
        });

        sendSuccess(res, { user: toSafeUser(target) }, 200, 'User updated successfully');
      }
    } catch (err: unknown) {
      next(err);
    }
  }

  /**
   * Delete user account with comprehensive safety checks (Admin only)
   * DELETE /api/users/:id
   */
  static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Safeguard 1: Admin cannot delete their own account
      if (req.user?.id === id) {
        sendError(res, 'FORBIDDEN', 'You cannot delete your own administrator account while logged in.', 403);
        return;
      }

      if (isDbConnected()) {
        const target = await User.findById(id);
        if (!target) {
          sendError(res, 'USER_NOT_FOUND', 'User does not exist', 404);
          return;
        }

        // Safeguard 2: Cannot delete the last active Admin
        if (target.role === ROLES.ADMIN) {
          const activeAdminCount = await User.countDocuments({ role: ROLES.ADMIN, status: 'Active' });
          if (activeAdminCount <= 1) {
            sendError(
              res,
              'FORBIDDEN',
              'Operation blocked: Cannot delete the last active administrator account.',
              403
            );
            return;
          }
        }

        // Safeguard 3: Check related records
        const hasEvents = await Event.exists({ organizerId: new mongoose.Types.ObjectId(id) });
        if (hasEvents) {
          sendError(
            res,
            'CONFLICT',
            'Cannot delete account because this organizer has existing events. Deactivate the user instead to maintain event integrity.',
            409
          );
          return;
        }

        const hasRegistrations = await Registration.exists({ studentId: new mongoose.Types.ObjectId(id) });
        if (hasRegistrations) {
          sendError(
            res,
            'CONFLICT',
            'Cannot delete account because this student has existing event registrations. Deactivate the account instead to preserve records.',
            409
          );
          return;
        }

        await User.findByIdAndDelete(id);

        await AuditLogService.log({
          actorId: req.user?.id,
          actorRole: req.user?.role,
          action: 'USER_DELETE_BY_ADMIN',
          resourceType: 'User',
          resourceId: id,
          metadata: { deletedName: target.name, deletedEmail: target.email, deletedRole: target.role },
        });

        sendSuccess(res, { deleted: true }, 200, `User ${target.name} has been deleted.`);
      } else {
        const target = memoryStore.users.get(id);
        if (!target) {
          sendError(res, 'USER_NOT_FOUND', 'User does not exist', 404);
          return;
        }

        if (target.role === ROLES.ADMIN) {
          const activeAdmins = Array.from(memoryStore.users.values()).filter(
            (u) => u.role === ROLES.ADMIN && u.status === 'Active'
          );
          if (activeAdmins.length <= 1) {
            sendError(
              res,
              'FORBIDDEN',
              'Operation blocked: Cannot delete the last active administrator account.',
              403
            );
            return;
          }
        }

        const hasEvents = Array.from(memoryEvents.values()).some((e) => e.organizerId === id);
        if (hasEvents) {
          sendError(
            res,
            'CONFLICT',
            'Cannot delete account because this organizer has existing events. Deactivate the user instead to maintain event integrity.',
            409
          );
          return;
        }

        const hasRegistrations = Array.from(memoryRegistrations.values()).some((r) => r.studentId === id);
        if (hasRegistrations) {
          sendError(
            res,
            'CONFLICT',
            'Cannot delete account because this student has existing event registrations. Deactivate the account instead to preserve records.',
            409
          );
          return;
        }

        memoryStore.users.delete(id);

        await AuditLogService.log({
          actorId: req.user?.id,
          actorRole: req.user?.role,
          action: 'USER_DELETE_BY_ADMIN',
          resourceType: 'User',
          resourceId: id,
          metadata: { deletedName: target.name, deletedEmail: target.email, deletedRole: target.role },
        });

        sendSuccess(res, { deleted: true }, 200, `User ${target.name} has been deleted.`);
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

      req.body = { role };
      return UserController.updateUser(req, res, next);
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

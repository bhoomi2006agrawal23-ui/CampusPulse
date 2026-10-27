import { Request, Response, NextFunction } from 'express';
import { ROLES, UserRole } from '../constants/roles.js';
import { sendError } from '../utils/response.js';

/**
 * Reusable backend authorization middleware enforcing Role-Based Access Control.
 * Admins possess universal operational access.
 * Returns 403 Forbidden for authenticated but unauthorized roles.
 */
export function requireRoles(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    // Admin has global institutional permission
    if (req.user.role === ROLES.ADMIN || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    sendError(
      res,
      'FORBIDDEN',
      `Insufficient permissions. Required role: [${allowedRoles.join(', ')}]. Current role: [${req.user.role}].`,
      403
    );
  };
}

export const requireAdmin = requireRoles([ROLES.ADMIN]);
export const requireOrganizerOrAdmin = requireRoles([ROLES.ORGANIZER, ROLES.ADMIN]);
export const requireJudgeOrAdmin = requireRoles([ROLES.JUDGE, ROLES.ADMIN]);
export const requireVolunteerOrAdmin = requireRoles([ROLES.VOLUNTEER, ROLES.ADMIN]);

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { config } from '../config/env.js';

const REFRESH_COOKIE_NAME = 'campus_pulse_rt';

// Helper to set locked HttpOnly refresh cookie
function setRefreshCookie(req: Request, res: Response, refreshToken: string) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || config.IS_PRODUCTION;
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    maxAge: config.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',
    ...(config.COOKIE_DOMAIN ? { domain: config.COOKIE_DOMAIN } : {}),
  });
}

function clearRefreshCookie(req: Request, res: Response) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || config.IS_PRODUCTION;
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/api/auth',
    ...(config.COOKIE_DOMAIN ? { domain: config.COOKIE_DOMAIN } : {}),
  });
}

export class AuthController {
  /**
   * Public Student Registration
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, collegeName, phoneNumber, bio } = req.body;
      const result = await AuthService.registerStudent({
        name,
        email,
        password,
        collegeName,
        phoneNumber,
        bio,
      });

      // Locked requirement: Refresh token strictly in HttpOnly cookie, NEVER in JSON response
      setRefreshCookie(req, res, result.refreshToken);

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        201,
        'Student account registered successfully'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('DUPLICATE_EMAIL')) {
        sendError(res, 'DUPLICATE_EMAIL', 'An account with this email address already exists', 409);
        return;
      }
      next(err);
    }
  }

  /**
   * User Login
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, role, collegeName } = req.body;
      const metadata = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.socket.remoteAddress,
      };

      const result = await AuthService.login(email, password, metadata, role, collegeName);

      setRefreshCookie(req, res, result.refreshToken);

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        200,
        'Authentication successful'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('INVALID_CREDENTIALS')) {
        // Locked rule: Generic failure message prevents account enumeration
        sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
        return;
      }
      if (message.includes('ROLE_MISMATCH')) {
        sendError(
          res,
          'ROLE_MISMATCH',
          message.replace(/^ROLE_MISMATCH:\s*/, ''),
          403
        );
        return;
      }
      if (message.includes('COLLEGE_MISMATCH')) {
        sendError(
          res,
          'COLLEGE_MISMATCH',
          message.replace(/^COLLEGE_MISMATCH:\s*/, ''),
          403
        );
        return;
      }
      if (message.includes('ACCOUNT_INACTIVE')) {
        sendError(res, 'ACCOUNT_INACTIVE', 'This account has been deactivated or suspended', 403);
        return;
      }
      next(err);
    }
  }

  /**
   * Refresh Access Token
   * POST /api/auth/refresh
   */
  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

      if (!refreshToken) {
        sendError(res, 'MISSING_REFRESH_TOKEN', 'No refresh token cookie found in request', 401);
        return;
      }

      const metadata = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.socket.remoteAddress,
      };

      const result = await AuthService.rotateRefreshToken(refreshToken, metadata);

      // Rotate cookie
      setRefreshCookie(req, res, result.newRefreshToken);

      sendSuccess(
        res,
        {
          accessToken: result.accessToken,
          user: result.user,
        },
        200,
        'Session token refreshed successfully'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      clearRefreshCookie(req, res);

      if (message.includes('TOKEN_REUSE_DETECTED')) {
        sendError(
          res,
          'TOKEN_REUSE_DETECTED',
          'Security alert: Refresh token reuse detected. All sessions revoked.',
          401
        );
        return;
      }
      if (message.includes('SESSION_EXPIRED')) {
        sendError(res, 'SESSION_EXPIRED', 'Refresh token expired. Please login again.', 401);
        return;
      }
      sendError(res, 'INVALID_SESSION', 'Invalid refresh session', 401);
    }
  }

  /**
   * User Logout
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
      clearRefreshCookie(req, res);
      sendSuccess(res, { loggedOut: true }, 200, 'Logged out successfully');
    } catch (err: unknown) {
      next(err);
    }
  }

  /**
   * Get Current Authenticated User Profile
   * GET /api/auth/me
   */
  static async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const user = await AuthService.getUserById(req.user.id);
      if (!user) {
        sendError(res, 'USER_NOT_FOUND', 'User record no longer exists', 404);
        return;
      }

      sendSuccess(res, { user }, 200);
    } catch (err: unknown) {
      next(err);
    }
  }

  /**
   * Change Password
   * POST /api/auth/change-password
   */
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        sendError(res, 'BAD_REQUEST', 'Current password and new password are required', 400);
        return;
      }

      const result = await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      sendSuccess(res, { user: result.user }, 200, 'Password changed successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('INVALID_CREDENTIALS')) {
        sendError(res, 'INVALID_CREDENTIALS', 'Current password is incorrect', 401);
        return;
      }
      if (message.startsWith('BAD_REQUEST')) {
        sendError(res, 'BAD_REQUEST', message.replace(/^BAD_REQUEST:\s*/, ''), 400);
        return;
      }
      next(err);
    }
  }
}

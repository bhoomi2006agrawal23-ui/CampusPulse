import mongoose from 'mongoose';
import { User, IUser } from '../models/User.js';
import { Session, ISession } from '../models/Session.js';
import { ROLES, UserRole } from '../constants/roles.js';
import {
  hashPassword,
  comparePassword,
  generateSecureToken,
  hashToken,
} from '../utils/crypto.js';
import { generateAccessToken } from '../utils/tokens.js';
import { config } from '../config/env.js';
import { isDbConnected } from '../config/db.js';
import { AuditLogService } from './audit.service.js';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  loginId?: string;
  mustChangePassword?: boolean;
  role: UserRole;
  collegeName?: string;
  phoneNumber?: string;
  bio?: string;
  profileInfo?: {
    collegeName?: string;
    department?: string;
    studentId?: string;
    year?: number;
    avatarUrl?: string;
  };
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeUser(user: any): SafeUser {
  const college = user.collegeName || user.profileInfo?.collegeName || '';
  return {
    id: user._id ? user._id.toString() : user.id,
    name: user.name,
    email: user.email,
    loginId: user.loginId || undefined,
    mustChangePassword: Boolean(user.mustChangePassword),
    role: user.role,
    collegeName: college || undefined,
    phoneNumber: user.phoneNumber,
    bio: user.bio,
    profileInfo: {
      ...user.profileInfo,
      ...(college ? { collegeName: college } : {}),
    },
    status: user.status,
    createdAt: user.createdAt || new Date(),
    updatedAt: user.updatedAt || new Date(),
  };
}

// In-memory data store for local evaluation when MongoDB Atlas URI is unconfigured
interface MemoryUser {
  _id: string;
  name: string;
  email: string;
  loginId?: string;
  mustChangePassword?: boolean;
  passwordHash: string;
  role: UserRole;
  collegeName?: string;
  phoneNumber?: string;
  bio?: string;
  profileInfo?: any;
  status: 'Active' | 'Suspended' | 'Pending';
  createdAt: Date;
  updatedAt: Date;
}

interface MemorySession {
  _id: string;
  userId: string;
  tokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const memoryStore = {
  users: new Map<string, MemoryUser>(),
  sessions: new Map<string, MemorySession>(),
};

export class AuthService {
  /**
   * Registers a new Student account.
   * Locked rule: Public signup strictly assigns role 'Student'.
   */
  static async registerStudent(data: {
    name: string;
    email: string;
    password: string;
    collegeName?: string;
    phoneNumber?: string;
    bio?: string;
  }): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    const normalizedEmail = data.email.toLowerCase().trim();
    const college = data.collegeName?.trim() || undefined;

    // Check duplicate email
    if (isDbConnected()) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        throw new Error('DUPLICATE_EMAIL: An account with this email address already exists');
      }

      const passwordHash = await hashPassword(data.password);
      const user = await User.create({
        name: data.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: ROLES.STUDENT, // Strictly Student
        collegeName: college,
        phoneNumber: data.phoneNumber?.trim(),
        bio: data.bio?.trim(),
        profileInfo: {
          collegeName: college,
        },
        status: 'Active',
      });

      const safeUser = toSafeUser(user);
      const accessToken = generateAccessToken({
        sub: safeUser.id,
        email: safeUser.email,
        role: safeUser.role,
        name: safeUser.name,
      });

      const refreshToken = await this.createRefreshSession(user._id.toString());

      await AuditLogService.log({
        actorId: safeUser.id,
        actorRole: safeUser.role,
        action: 'AUTH_REGISTER_SUCCESS',
        resourceType: 'User',
        resourceId: safeUser.id,
      });

      return { user: safeUser, accessToken, refreshToken };
    } else {
      // Memory store fallback
      for (const u of memoryStore.users.values()) {
        if (u.email === normalizedEmail) {
          throw new Error('DUPLICATE_EMAIL: An account with this email address already exists');
        }
      }

      const passwordHash = await hashPassword(data.password);
      const id = new mongoose.Types.ObjectId().toString();
      const user: MemoryUser = {
        _id: id,
        name: data.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: ROLES.STUDENT,
        collegeName: college,
        phoneNumber: data.phoneNumber?.trim(),
        bio: data.bio?.trim(),
        profileInfo: {
          collegeName: college,
        },
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.users.set(id, user);

      const safeUser = toSafeUser(user);
      const accessToken = generateAccessToken({
        sub: safeUser.id,
        email: safeUser.email,
        role: safeUser.role,
        name: safeUser.name,
      });

      const refreshToken = await this.createRefreshSession(id);

      await AuditLogService.log({
        actorId: safeUser.id,
        actorRole: safeUser.role,
        action: 'AUTH_REGISTER_SUCCESS',
        resourceType: 'User',
        resourceId: safeUser.id,
      });

      return { user: safeUser, accessToken, refreshToken };
    }
  }

  /**
   * Authenticates user with email and password.
   * Locked rule: Generic failure message prevents user enumeration.
   */
  static async login(
    email: string,
    password: string,
    metadata?: { userAgent?: string; ipAddress?: string },
    expectedRole?: UserRole,
    expectedCollegeName?: string
  ): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    const rawIdentifier = email.trim();
    const normalizedIdentifier = rawIdentifier.toLowerCase();
    let userRecord: any = null;

    if (isDbConnected()) {
      userRecord = await User.findOne({
        $or: [
          { email: normalizedIdentifier },
          { loginId: normalizedIdentifier },
          { loginId: rawIdentifier },
        ],
      }).select('+passwordHash');
    } else {
      for (const u of memoryStore.users.values()) {
        if (
          u.email.toLowerCase() === normalizedIdentifier ||
          (u.loginId && u.loginId.toLowerCase() === normalizedIdentifier) ||
          u.loginId === rawIdentifier
        ) {
          userRecord = u;
          break;
        }
      }
    }

    if (!userRecord) {
      await AuditLogService.log({
        action: 'AUTH_LOGIN_FAILURE',
        resourceType: 'User',
        success: false,
        metadata: { attemptedIdentifier: normalizedIdentifier },
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });
      throw new Error('INVALID_CREDENTIALS: Invalid email or password');
    }

    if (userRecord.status !== 'Active') {
      await AuditLogService.log({
        actorId: userRecord._id ? userRecord._id.toString() : userRecord.id,
        actorRole: userRecord.role,
        action: 'AUTH_LOGIN_FAILURE',
        resourceType: 'User',
        resourceId: userRecord._id ? userRecord._id.toString() : userRecord.id,
        success: false,
        metadata: { reason: 'ACCOUNT_INACTIVE' },
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });
      throw new Error('ACCOUNT_INACTIVE: This account has been suspended or deactivated');
    }

    const isMatch = await comparePassword(password, userRecord.passwordHash);
    if (!isMatch) {
      await AuditLogService.log({
        actorId: userRecord._id ? userRecord._id.toString() : userRecord.id,
        actorRole: userRecord.role,
        action: 'AUTH_LOGIN_FAILURE',
        resourceType: 'User',
        resourceId: userRecord._id ? userRecord._id.toString() : userRecord.id,
        success: false,
        metadata: { reason: 'PASSWORD_MISMATCH' },
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });
      throw new Error('INVALID_CREDENTIALS: Invalid email or password');
    }

    if (expectedRole && userRecord.role !== expectedRole) {
      await AuditLogService.log({
        actorId: userRecord._id ? userRecord._id.toString() : userRecord.id,
        actorRole: userRecord.role,
        action: 'AUTH_LOGIN_FAILURE',
        resourceType: 'User',
        resourceId: userRecord._id ? userRecord._id.toString() : userRecord.id,
        success: false,
        metadata: { reason: 'ROLE_MISMATCH', expectedRole, actualRole: userRecord.role },
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });
      throw new Error(
        `ROLE_MISMATCH: Account role mismatch. This account is registered as a ${userRecord.role}, not ${expectedRole}. Please select ${userRecord.role} to continue.`
      );
    }

    if (expectedCollegeName && expectedCollegeName.trim()) {
      const inputCollege = expectedCollegeName.trim();
      const actualCollege = (userRecord.collegeName || userRecord.profileInfo?.collegeName || '').trim();

      if (actualCollege && actualCollege.toLowerCase() !== inputCollege.toLowerCase()) {
        await AuditLogService.log({
          actorId: userRecord._id ? userRecord._id.toString() : userRecord.id,
          actorRole: userRecord.role,
          action: 'AUTH_LOGIN_FAILURE',
          resourceType: 'User',
          resourceId: userRecord._id ? userRecord._id.toString() : userRecord.id,
          success: false,
          metadata: {
            reason: 'COLLEGE_MISMATCH',
            expectedCollege: inputCollege,
            actualCollege,
          },
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        });
        throw new Error(
          `COLLEGE_MISMATCH: College affiliation mismatch. This account is registered under "${actualCollege}", not "${inputCollege}".`
        );
      }
    }

    const safeUser = toSafeUser(userRecord);
    const accessToken = generateAccessToken({
      sub: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      name: safeUser.name,
    });

    const refreshToken = await this.createRefreshSession(
      userRecord._id ? userRecord._id.toString() : userRecord.id,
      metadata
    );

    await AuditLogService.log({
      actorId: safeUser.id,
      actorRole: safeUser.role,
      action: 'AUTH_LOGIN_SUCCESS',
      resourceType: 'User',
      resourceId: safeUser.id,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    return { user: safeUser, accessToken, refreshToken };
  }

  /**
   * Creates a cryptographically random refresh token session
   */
  static async createRefreshSession(
    userId: string,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<string> {
    const rawRefreshToken = generateSecureToken(64); // 64-byte random value
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(
      Date.now() + config.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
    );

    if (isDbConnected()) {
      await Session.create({
        userId: new mongoose.Types.ObjectId(userId),
        tokenHash,
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
        isRevoked: false,
        expiresAt,
      });
    } else {
      const sessionId = new mongoose.Types.ObjectId().toString();
      memoryStore.sessions.set(sessionId, {
        _id: sessionId,
        userId,
        tokenHash,
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
        isRevoked: false,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return rawRefreshToken;
  }

  /**
   * Rotates refresh token and issues fresh access token.
   * Locked rule: Replay/reuse detection immediately revokes all user sessions.
   */
  static async rotateRefreshToken(
    rawRefreshToken: string,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ accessToken: string; newRefreshToken: string; user: SafeUser }> {
    const presentedHash = hashToken(rawRefreshToken);
    let sessionRecord: any = null;

    if (isDbConnected()) {
      sessionRecord = await Session.findOne({ tokenHash: presentedHash });
    } else {
      for (const s of memoryStore.sessions.values()) {
        if (s.tokenHash === presentedHash) {
          sessionRecord = s;
          break;
        }
      }
    }

    if (!sessionRecord) {
      throw new Error('INVALID_SESSION: Invalid or unassigned refresh token');
    }

    const userIdStr = sessionRecord.userId.toString();

    // Check if previously revoked (Reuse Detection)
    if (sessionRecord.isRevoked) {
      // SUSPICIOUS TOKEN REUSE DETECTED!
      console.warn(`[Security Alert] Refresh token reuse detected for user ${userIdStr}! Invalidating all user sessions.`);
      await this.revokeAllUserSessions(userIdStr);
      await AuditLogService.log({
        actorId: userIdStr,
        action: 'AUTH_TOKEN_REUSE_DETECTED',
        resourceType: 'Session',
        success: false,
        metadata: { reason: 'Refresh token replay attempt detected' },
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });
      throw new Error('TOKEN_REUSE_DETECTED: Suspicious token reuse. All sessions have been terminated.');
    }

    // Check expiry
    if (new Date() > new Date(sessionRecord.expiresAt)) {
      throw new Error('SESSION_EXPIRED: Refresh session has expired. Please sign in again.');
    }

    // Invalidate the old session
    if (isDbConnected()) {
      sessionRecord.isRevoked = true;
      await sessionRecord.save();
    } else {
      sessionRecord.isRevoked = true;
      sessionRecord.updatedAt = new Date();
    }

    // Retrieve user
    const user = await this.getUserById(userIdStr);
    if (!user || user.status !== 'Active') {
      throw new Error('ACCOUNT_UNAVAILABLE: User profile is inactive or not found');
    }

    // Issue new rotated refresh token
    const newRefreshToken = await this.createRefreshSession(userIdStr, metadata);

    // Issue new access token
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return { accessToken, newRefreshToken, user };
  }

  /**
   * Revokes the current refresh token session on logout.
   */
  static async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;

    const presentedHash = hashToken(rawRefreshToken);
    let sessionUserId: string | undefined;

    if (isDbConnected()) {
      const session = await Session.findOne({ tokenHash: presentedHash });
      if (session) {
        sessionUserId = session.userId.toString();
      }
      await Session.updateOne({ tokenHash: presentedHash }, { isRevoked: true });
    } else {
      for (const s of memoryStore.sessions.values()) {
        if (s.tokenHash === presentedHash) {
          sessionUserId = s.userId;
          s.isRevoked = true;
          s.updatedAt = new Date();
          break;
        }
      }
    }

    await AuditLogService.log({
      actorId: sessionUserId,
      action: 'AUTH_LOGOUT',
      resourceType: 'Session',
      success: true,
    });
  }

  /**
   * Revokes all sessions belonging to a user (used during reuse detection or security reset).
   */
  static async revokeAllUserSessions(userId: string): Promise<void> {
    if (isDbConnected()) {
      await Session.updateMany({ userId: new mongoose.Types.ObjectId(userId) }, { isRevoked: true });
    } else {
      for (const s of memoryStore.sessions.values()) {
        if (s.userId === userId) {
          s.isRevoked = true;
          s.updatedAt = new Date();
        }
      }
    }
  }

  /**
   * Retrieves user by ID safely without returning passwordHash
   */
  static async getUserById(userId: string): Promise<SafeUser | null> {
    if (isDbConnected()) {
      try {
        const user = await User.findById(userId);
        return user ? toSafeUser(user) : null;
      } catch {
        return null;
      }
    } else {
      const user = memoryStore.users.get(userId);
      return user ? toSafeUser(user) : null;
    }
  }

  /**
   * Securely change user password, clearing mustChangePassword flag.
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; user: SafeUser }> {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('BAD_REQUEST: New password must be at least 8 characters');
    }

    let userRecord: any = null;
    if (isDbConnected()) {
      userRecord = await User.findById(userId).select('+passwordHash');
    } else {
      userRecord = memoryStore.users.get(userId);
    }

    if (!userRecord) {
      throw new Error('USER_NOT_FOUND: User not found');
    }

    const matches = await comparePassword(currentPassword, userRecord.passwordHash);
    if (!matches) {
      throw new Error('INVALID_CREDENTIALS: Current password is incorrect');
    }

    const newHash = await hashPassword(newPassword);

    if (isDbConnected()) {
      userRecord.passwordHash = newHash;
      userRecord.mustChangePassword = false;
      await userRecord.save();
    } else {
      userRecord.passwordHash = newHash;
      userRecord.mustChangePassword = false;
      userRecord.updatedAt = new Date();
    }

    await AuditLogService.log({
      actorId: userId,
      actorRole: userRecord.role,
      action: 'USER_PASSWORD_CHANGE',
      resourceType: 'User',
      resourceId: userId,
      success: true,
    });

    return { success: true, user: toSafeUser(userRecord) };
  }
}

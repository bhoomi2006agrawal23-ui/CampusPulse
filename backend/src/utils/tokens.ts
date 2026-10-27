import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UserRole } from '../constants/roles.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
}

/**
 * Issues short-lived JWT access token (approximately 15 minutes)
 * Payload contains user identity and role for stateless authorization checks.
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN as any,
  });
}

/**
 * Verifies JWT signature and expiry.
 * Throws on invalid or expired token.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

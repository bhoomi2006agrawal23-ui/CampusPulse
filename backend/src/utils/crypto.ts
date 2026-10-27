import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Locked requirement: bcrypt 12 salt rounds
const BCRYPT_SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a cryptographically random 64-byte token string
 * Locked requirement: 64-byte random value
 */
export function generateSecureToken(bytes: number = 64): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Computes a SHA-256 one-way hash of the token for secure session storage.
 * Raw refresh tokens are never persisted in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

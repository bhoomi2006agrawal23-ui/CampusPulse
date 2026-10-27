import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
  code?: string;
}) {
  const ipMap = new Map<string, RateLimitRecord>();

  // Periodic cleanup to avoid memory leak
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipMap.entries()) {
      if (now > record.resetTime) {
        ipMap.delete(ip);
      }
    }
  }, options.windowMs);

  if (typeof interval.unref === 'function') {
    interval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, skip throttling
    if (process.env.NODE_ENV === 'test') {
      next();
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();
    const existing = ipMap.get(ip);

    if (!existing || now > existing.resetTime) {
      ipMap.set(ip, { count: 1, resetTime: now + options.windowMs });
      next();
      return;
    }

    if (existing.count >= options.maxRequests) {
      sendError(
        res,
        options.code || 'RATE_LIMIT_EXCEEDED',
        options.message || 'Too many requests. Please try again later.',
        429
      );
      return;
    }

    existing.count += 1;
    next();
  };
}

// General API Rate Limiter: 150 requests per 15 minutes
export const generalApiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 150,
  message: 'API request limit exceeded. Please throttle requests.',
});

// Stricter Auth Endpoint Limiter: 20 requests per 15 minutes (protects against brute-force)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 25,
  message: 'Too many authentication attempts. Please wait 15 minutes.',
  code: 'AUTH_THROTTLED',
});

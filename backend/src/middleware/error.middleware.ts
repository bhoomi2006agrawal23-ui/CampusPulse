import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { config } from '../config/env.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Mongoose CastError / Invalid ObjectId
  if (err.name === 'CastError' || err.kind === 'ObjectId') {
    sendError(res, 'MALFORMED_ID', 'Invalid resource identifier format', 400);
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal error occurred';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  if (!config.IS_PRODUCTION) {
    console.error('[CampusPulse Error Handler]', err);
  }

  sendError(
    res,
    code,
    config.IS_PRODUCTION && statusCode === 500
      ? 'An unexpected error occurred. Please contact institutional support.'
      : message,
    statusCode,
    !config.IS_PRODUCTION ? err.details : undefined
  );
}

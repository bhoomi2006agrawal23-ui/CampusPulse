import { Router, Request, Response } from 'express';
import { isDbConnected } from '../config/db.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'ok',
    service: 'CampusPulse API Gateway',
    timestamp: new Date().toISOString(),
    database: isDbConnected() ? 'connected' : 'memory-fallback',
  });
});

export default router;

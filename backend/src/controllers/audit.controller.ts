import { Request, Response } from 'express';
import { AuditLogService } from '../services/audit.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AuditController {
  /**
   * GET /api/audit-logs
   * Admin-only paginated endpoint to query system audit logs.
   */
  static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const query = {
        actorId: req.query.actorId as string,
        action: req.query.action as string,
        resourceType: req.query.resourceType as string,
        eventId: req.query.eventId as string,
        success: req.query.success !== undefined ? req.query.success === 'true' : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };

      const result = await AuditLogService.getAuditLogs(query, req.user);
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('FORBIDDEN')) {
        sendError(res, 'FORBIDDEN', msg, 403);
      } else {
        sendError(res, 'INTERNAL_ERROR', msg, 500);
      }
    }
  }
}

import { Request, Response } from 'express';
import { ReportService } from '../services/report.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ReportController {
  /**
   * POST /api/events/:eventId/reports - Generate summary report
   */
  static async generateEventReport(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const report = await ReportService.generateEventSummaryReport(eventId, req.user);
      sendSuccess(res, { report }, 201, 'Event summary report generated successfully');
    } catch (err: any) {
      const status = err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED') ? 403 : 400;
      sendError(res, 'REPORT_ERROR', err.message || 'Failed to generate report', status);
    }
  }

  /**
   * GET /api/events/:eventId/reports - List event reports
   */
  static async getEventReports(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const reports = await ReportService.getEventReports(eventId, req.user);
      sendSuccess(res, { reports });
    } catch (err: any) {
      const status = err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED') ? 403 : 400;
      sendError(res, 'REPORT_ERROR', err.message || 'Failed to fetch reports', status);
    }
  }

  /**
   * GET /api/reports/system-overview or GET /api/admin/metrics
   */
  static async getSystemMetrics(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const metrics = await ReportService.getSystemMetrics(req.user);
      sendSuccess(res, { metrics });
    } catch (err: any) {
      const status = err.message.includes('FORBIDDEN') ? 403 : 400;
      sendError(res, 'REPORT_ERROR', err.message || 'Failed to fetch metrics', status);
    }
  }
}

import { Request, Response } from 'express';
import { ResultService } from '../services/result.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ResultController {
  /**
   * GET /api/events/:eventId/results
   */
  static async getEventResults(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const results = await ResultService.getEventResults(eventId, req.user);
      sendSuccess(res, { results });
    } catch (err: any) {
      sendError(res, 'RESULT_ERROR', err.message || 'Failed to fetch results', 400);
    }
  }

  /**
   * GET /api/results/me - Authenticated student results
   */
  static async getMyResults(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const results = await ResultService.getStudentResults(req.user.id);
      sendSuccess(res, { results });
    } catch (err: any) {
      sendError(res, 'RESULT_ERROR', err.message || 'Failed to fetch student results', 400);
    }
  }

  /**
   * POST /api/events/:eventId/results - Create or update evaluation result
   */
  static async createOrUpdateResult(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const result = await ResultService.createOrUpdateResult(eventId, req.body, req.user);
      sendSuccess(res, { result }, 200, 'Result saved successfully');
    } catch (err: any) {
      const status = err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED')
        ? 403
        : err.message.includes('LOCKED')
        ? 409
        : 400;
      sendError(res, 'RESULT_ERROR', err.message, status);
    }
  }

  /**
   * POST /api/events/:eventId/results/finalize - Finalize results
   */
  static async finalizeResults(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const data = await ResultService.finalizeResults(eventId, req.user);
      sendSuccess(res, data, 200, 'Results finalized and locked');
    } catch (err: any) {
      const status = err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED') ? 403 : 400;
      sendError(res, 'RESULT_ERROR', err.message, status);
    }
  }

  /**
   * POST /api/events/:eventId/results/publish or PATCH /api/events/:eventId/results/publish
   */
  static async publishResults(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const data = await ResultService.publishResults(eventId, req.user);
      sendSuccess(res, data, 200, 'Results published to participants and public');
    } catch (err: any) {
      const status = err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED') ? 403 : 400;
      sendError(res, 'RESULT_ERROR', err.message, status);
    }
  }
}

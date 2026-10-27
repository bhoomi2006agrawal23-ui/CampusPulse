import { Request, Response, NextFunction } from 'express';
import { EvaluationService } from '../services/evaluation.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class EvaluationController {
  static async submitEvaluation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const result = await EvaluationService.submitEvaluation(eventId, req.body, req.user);
      sendSuccess(res, { result }, 200, 'Evaluation score recorded successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('JUDGE_NOT_ASSIGNED') || message.startsWith('FORBIDDEN')) {
        sendError(res, 'FORBIDDEN', message, 403);
        return;
      }
      if (message.startsWith('EVALUATION_LOCKED') || message.startsWith('INVALID_SCORE') || message.startsWith('PARTICIPANT_NOT_REGISTERED')) {
        sendError(res, 'BAD_REQUEST', message, 400);
        return;
      }
      if (message.startsWith('EVENT_NOT_FOUND')) {
        sendError(res, 'NOT_FOUND', message, 404);
        return;
      }
      next(err);
    }
  }

  static async getEventEvaluations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const evaluations = await EvaluationService.getEventEvaluations(eventId, req.user);
      sendSuccess(res, { evaluations }, 200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('JUDGE_NOT_ASSIGNED') || message.startsWith('UNAUTHORIZED_EVENT_ACCESS') || message.startsWith('FORBIDDEN')) {
        sendError(res, 'FORBIDDEN', message, 403);
        return;
      }
      next(err);
    }
  }
}

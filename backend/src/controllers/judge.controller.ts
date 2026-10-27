import { Request, Response, NextFunction } from 'express';
import { JudgeService } from '../services/judge.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class JudgeController {
  static async assignJudge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const judge = await JudgeService.assignJudge(eventId, req.body, req.user);
      sendSuccess(res, { judge }, 201, 'Judge assigned to event successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('JUDGE_ALREADY_ASSIGNED')) {
        sendError(res, 'JUDGE_ALREADY_ASSIGNED', message, 409);
        return;
      }
      if (message.startsWith('INVALID_ROLE')) {
        sendError(res, 'BAD_REQUEST', message, 400);
        return;
      }
      if (message.startsWith('UNAUTHORIZED_EVENT_ACCESS')) {
        sendError(res, 'FORBIDDEN', message, 403);
        return;
      }
      if (message.startsWith('EVENT_NOT_FOUND') || message.startsWith('USER_NOT_FOUND')) {
        sendError(res, 'NOT_FOUND', message, 404);
        return;
      }
      next(err);
    }
  }

  static async getEventJudges(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const judges = await JudgeService.getEventJudges(eventId, req.user);
      sendSuccess(res, { judges }, 200);
    } catch (err: unknown) {
      next(err);
    }
  }

  static async getMyJudgeAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const assignments = await JudgeService.getMyJudgeAssignments(req.user.id);
      sendSuccess(res, { assignments }, 200);
    } catch (err: unknown) {
      next(err);
    }
  }

  static async getJudgeEventParticipants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const participants = await JudgeService.getJudgeEventParticipants(eventId, req.user);
      sendSuccess(res, { participants }, 200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('JUDGE_NOT_ASSIGNED') || message.startsWith('UNAUTHORIZED_EVENT_ACCESS') || message.startsWith('FORBIDDEN')) {
        sendError(res, 'FORBIDDEN', message, 403);
        return;
      }
      next(err);
    }
  }

  static async removeJudgeAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { id } = req.params;
      await JudgeService.removeJudgeAssignment(id, req.user);
      sendSuccess(res, { deleted: true }, 200, 'Judge assignment removed');
    } catch (err: unknown) {
      next(err);
    }
  }
}

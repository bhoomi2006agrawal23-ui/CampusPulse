import { Request, Response, NextFunction } from 'express';
import { ScheduleService } from '../services/schedule.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ScheduleController {
  static async createSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const schedule = await ScheduleService.createSchedule(eventId, req.body, req.user);
      sendSuccess(res, { schedule }, 201, 'Schedule session created successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('SCHEDULE_CONFLICT')) {
        sendError(res, 'SCHEDULE_CONFLICT', message, 409);
        return;
      }
      if (message.startsWith('INVALID_SCHEDULE_TIME')) {
        sendError(res, 'INVALID_SCHEDULE_TIME', message, 400);
        return;
      }
      if (message.startsWith('UNAUTHORIZED_EVENT_ACCESS')) {
        sendError(res, 'FORBIDDEN', message, 403);
        return;
      }
      if (message.startsWith('EVENT_NOT_FOUND')) {
        sendError(res, 'EVENT_NOT_FOUND', message, 404);
        return;
      }
      next(err);
    }
  }

  static async getEventSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const schedules = await ScheduleService.getEventSchedules(eventId);
      sendSuccess(res, { schedules }, 200);
    } catch (err: unknown) {
      next(err);
    }
  }

  static async updateSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { id } = req.params;
      const schedule = await ScheduleService.updateSchedule(id, req.body, req.user);
      sendSuccess(res, { schedule }, 200, 'Schedule session updated');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('SCHEDULE_CONFLICT')) {
        sendError(res, 'SCHEDULE_CONFLICT', message, 409);
        return;
      }
      if (message.startsWith('UNAUTHORIZED_EVENT_ACCESS')) {
        sendError(res, 'FORBIDDEN', message, 403);
        return;
      }
      if (message.startsWith('SCHEDULE_NOT_FOUND')) {
        sendError(res, 'SCHEDULE_NOT_FOUND', message, 404);
        return;
      }
      next(err);
    }
  }

  static async deleteSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { id } = req.params;
      await ScheduleService.deleteSchedule(id, req.user);
      sendSuccess(res, { deleted: true }, 200, 'Schedule session deleted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('UNAUTHORIZED_EVENT_ACCESS')) {
        sendError(res, 'FORBIDDEN', message, 403);
        return;
      }
      if (message.startsWith('SCHEDULE_NOT_FOUND')) {
        sendError(res, 'SCHEDULE_NOT_FOUND', message, 404);
        return;
      }
      next(err);
    }
  }
}

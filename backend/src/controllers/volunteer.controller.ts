import { Request, Response, NextFunction } from 'express';
import { VolunteerService } from '../services/volunteer.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class VolunteerController {
  static async assignVolunteer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const volunteer = await VolunteerService.assignVolunteer(eventId, req.body, req.user);
      sendSuccess(res, { volunteer }, 201, 'Volunteer assigned to event successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('VOLUNTEER_ALREADY_ASSIGNED')) {
        sendError(res, 'VOLUNTEER_ALREADY_ASSIGNED', message, 409);
        return;
      }
      if (message.startsWith('VOLUNTEER_SHIFT_CONFLICT')) {
        sendError(res, 'VOLUNTEER_SHIFT_CONFLICT', message, 409);
        return;
      }
      if (message.startsWith('INVALID_ROLE') || message.startsWith('INVALID_SHIFT_TIME')) {
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

  static async getEventVolunteers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const volunteers = await VolunteerService.getEventVolunteers(eventId, req.user);
      sendSuccess(res, { volunteers }, 200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('UNAUTHORIZED_EVENT_ACCESS')) {
        sendError(res, 'FORBIDDEN', message, 403);
        return;
      }
      next(err);
    }
  }

  static async getMyVolunteerDuties(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const duties = await VolunteerService.getMyVolunteerDuties(req.user.id);
      sendSuccess(res, { duties }, 200);
    } catch (err: unknown) {
      next(err);
    }
  }

  static async updateVolunteerDuty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { id } = req.params;
      const volunteer = await VolunteerService.updateVolunteerDuty(id, req.body, req.user);
      sendSuccess(res, { volunteer }, 200, 'Volunteer duty updated');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('VOLUNTEER_SHIFT_CONFLICT')) {
        sendError(res, 'VOLUNTEER_SHIFT_CONFLICT', message, 409);
        return;
      }
      if (message.startsWith('UNAUTHORIZED_EVENT_ACCESS')) {
        sendError(res, 'FORBIDDEN', message, 403);
        return;
      }
      next(err);
    }
  }

  static async checkInVolunteer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { id } = req.params;
      const volunteer = await VolunteerService.checkInVolunteer(id, req.user);
      sendSuccess(res, { volunteer }, 200, 'Volunteer checked in successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('VOLUNTEER_ALREADY_CHECKED_IN')) {
        sendError(res, 'VOLUNTEER_ALREADY_CHECKED_IN', message, 409);
        return;
      }
      if (message.startsWith('FORBIDDEN')) {
        sendError(res, 'FORBIDDEN', message, 403);
        return;
      }
      next(err);
    }
  }

  static async removeVolunteerAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { id } = req.params;
      await VolunteerService.removeVolunteerAssignment(id, req.user);
      sendSuccess(res, { deleted: true }, 200, 'Volunteer assignment removed');
    } catch (err: unknown) {
      next(err);
    }
  }
}

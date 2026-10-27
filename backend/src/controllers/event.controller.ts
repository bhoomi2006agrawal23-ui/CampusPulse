import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { EventService } from '../services/event.service.js';
import { RegistrationService } from '../services/registration.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { UserRole } from '../constants/roles.js';

export class EventController {
  /**
   * POST /api/events
   * Create Event (Organizer or Admin)
   */
  static async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const event = await EventService.createEvent(req.body, req.user.id);
      sendSuccess(res, { event }, 201, 'Event created successfully in Draft status');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('VENUE_CONFLICT')) {
        sendError(res, 'VENUE_CONFLICT', message, 409);
        return;
      }
      if (message.startsWith('MISSING_COLLEGE_NAME') || message.startsWith('INVALID_DATES')) {
        sendError(res, 'BAD_REQUEST', message, 400);
        return;
      }
      if (message.startsWith('VENUE_MISMATCH')) {
        sendError(res, 'VENUE_MISMATCH', message, 400);
        return;
      }
      next(err);
    }
  }

  /**
   * PATCH /api/events/:id or PUT /api/events/:id
   * Edit Event (Owner Organizer or Admin)
   */
  static async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const { id } = req.params;
      const event = await EventService.updateEvent(id, req.body, req.user);
      sendSuccess(res, { event }, 200, 'Event updated successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('VENUE_CONFLICT')) {
        sendError(res, 'VENUE_CONFLICT', message, 409);
        return;
      }
      if (message.startsWith('MISSING_COLLEGE_NAME') || message.startsWith('INVALID_DATES')) {
        sendError(res, 'BAD_REQUEST', message, 400);
        return;
      }
      if (message.startsWith('VENUE_MISMATCH')) {
        sendError(res, 'VENUE_MISMATCH', message, 400);
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

  /**
   * PATCH /api/events/:id/status
   * Controlled Lifecycle State Transition (Owner Organizer or Admin)
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const { id } = req.params;
      const { status, reason } = req.body;

      const event = await EventService.updateEventStatus(id, status, req.user, reason);
      sendSuccess(res, { event }, 200, `Event status updated to ${status}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('INVALID_STATUS_TRANSITION') || message.startsWith('EVENT_INCOMPLETE')) {
        sendError(res, 'INVALID_STATUS_TRANSITION', message, 400);
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

  /**
   * GET /api/events/:id
   * Get Event Details
   */
  static async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        sendError(res, 'MALFORMED_ID', 'Invalid resource identifier format', 400);
        return;
      }
      const event = await EventService.getEventById(id, req.user);
      sendSuccess(res, { event }, 200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('EVENT_NOT_FOUND')) {
        sendError(res, 'EVENT_NOT_FOUND', 'Event not found or not published', 404);
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/events
   * Query & Filter Public/Authorized Events
   */
  static async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, venue, status, search, organizerId, page, limit } = req.query;

      const result = await EventService.getEvents(
        {
          categoryId: category as string,
          venueId: venue as string,
          status: status as string,
          search: search as string,
          organizerId: organizerId as string,
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : 12,
        },
        req.user
      );

      sendSuccess(res, { events: result.events }, 200, undefined, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (err: unknown) {
      next(err);
    }
  }

  /**
   * POST /api/events/:id/register
   * Student Registration
   */
  static async registerStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required to register', 401);
        return;
      }

      const { id } = req.params;
      const { notes } = req.body || {};

      const result = await RegistrationService.registerStudent(id, req.user.id, notes);
      sendSuccess(
        res,
        {
          registration: result.registration,
          event: result.event,
        },
        201,
        'Successfully registered for event'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('EVENT_FULL')) {
        sendError(res, 'EVENT_FULL', 'This event is currently full. Capacity reached.', 409);
        return;
      }
      if (message.startsWith('ALREADY_REGISTERED')) {
        sendError(res, 'ALREADY_REGISTERED', 'You are already registered for this event', 409);
        return;
      }
      if (message.startsWith('REGISTRATION_NOT_OPEN') || message.startsWith('REGISTRATION_CLOSED')) {
        sendError(res, 'REGISTRATION_UNAVAILABLE', message, 400);
        return;
      }
      if (message.startsWith('EVENT_NOT_FOUND') || message.startsWith('EVENT_CANCELLED')) {
        sendError(res, 'EVENT_UNAVAILABLE', message, 404);
        return;
      }
      next(err);
    }
  }

  /**
   * DELETE /api/events/:id/register or POST /api/events/:id/cancel-registration
   * Student Registration Cancellation
   */
  static async cancelRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const { id } = req.params;
      const result = await RegistrationService.cancelRegistration(id, req.user.id);
      sendSuccess(res, result, 200, 'Registration cancelled successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith('REGISTRATION_NOT_FOUND')) {
        sendError(res, 'REGISTRATION_NOT_FOUND', message, 404);
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/events/:id/registrations
   * View Registered Participants (Organizer/Admin)
   */
  static async getEventRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const { id } = req.params;
      const participants = await RegistrationService.getEventParticipants(id, req.user);
      sendSuccess(res, { participants }, 200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
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

  /**
   * GET /api/registrations/me
   * Get Current Student's Registrations
   */
  static async getMyRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const registrations = await RegistrationService.getStudentRegistrations(req.user.id);
      sendSuccess(res, { registrations }, 200);
    } catch (err: unknown) {
      next(err);
    }
  }
}

import { Request, Response } from 'express';
import { AnnouncementService } from '../services/announcement.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AnnouncementController {
  /**
   * GET /api/announcements - Get announcements
   */
  static async getAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      const eventId = (req.query.eventId as string) || req.params.eventId;
      const list = await AnnouncementService.getAnnouncements(eventId);
      sendSuccess(res, { announcements: list });
    } catch (err: any) {
      sendError(res, 'ANNOUNCEMENT_ERROR', err.message || 'Failed to fetch announcements', 400);
    }
  }

  /**
   * POST /api/announcements or POST /api/events/:eventId/announcements
   */
  static async createAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const eventId = req.params.eventId || req.body.eventId;
      const { title, content, priority, isPinned } = req.body;

      const created = await AnnouncementService.createAnnouncement(
        { eventId, title, content, priority, isPinned },
        req.user
      );
      sendSuccess(res, { announcement: created }, 201, 'Announcement created successfully');
    } catch (err: any) {
      const status = err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED') ? 403 : 400;
      sendError(res, 'ANNOUNCEMENT_ERROR', err.message, status);
    }
  }

  /**
   * PATCH /api/announcements/:id
   */
  static async updateAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { id } = req.params;
      const updated = await AnnouncementService.updateAnnouncement(id, req.body, req.user);
      sendSuccess(res, { announcement: updated }, 200, 'Announcement updated successfully');
    } catch (err: any) {
      const status = err.message.includes('UNAUTHORIZED') ? 403 : err.message.includes('NOT_FOUND') ? 404 : 400;
      sendError(res, 'ANNOUNCEMENT_ERROR', err.message, status);
    }
  }

  /**
   * DELETE /api/announcements/:id
   */
  static async deleteAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { id } = req.params;
      await AnnouncementService.deleteAnnouncement(id, req.user);
      sendSuccess(res, { deleted: true }, 200, 'Announcement deleted');
    } catch (err: any) {
      const status = err.message.includes('UNAUTHORIZED') ? 403 : err.message.includes('NOT_FOUND') ? 404 : 400;
      sendError(res, 'ANNOUNCEMENT_ERROR', err.message, status);
    }
  }
}

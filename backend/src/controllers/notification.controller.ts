import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class NotificationController {
  /**
   * GET /api/notifications - Get current user notifications
   */
  static async getMyNotifications(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const notifs = await NotificationService.getUserNotifications(req.user.id);
      sendSuccess(res, { notifications: notifs });
    } catch (err: any) {
      sendError(res, 'NOTIFICATION_ERROR', err.message || 'Failed to fetch notifications', 400);
    }
  }

  /**
   * PATCH /api/notifications/:id/read - Mark notification as read
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { id } = req.params;
      const notif = await NotificationService.markAsRead(id, req.user.id);
      sendSuccess(res, { notification: notif }, 200, 'Notification marked as read');
    } catch (err: any) {
      const status = err.message.includes('UNAUTHORIZED') ? 403 : err.message.includes('NOT_FOUND') ? 404 : 400;
      sendError(res, 'NOTIFICATION_ERROR', err.message, status);
    }
  }

  /**
   * PATCH /api/notifications/read-all - Mark all as read
   */
  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const result = await NotificationService.markAllAsRead(req.user.id);
      sendSuccess(res, result, 200, 'All notifications marked as read');
    } catch (err: any) {
      sendError(res, 'NOTIFICATION_ERROR', err.message || 'Failed to mark all as read', 400);
    }
  }

  /**
   * DELETE /api/notifications/:id - Delete notification
   */
  static async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { id } = req.params;
      await NotificationService.deleteNotification(id, req.user.id);
      sendSuccess(res, { deleted: true }, 200, 'Notification deleted');
    } catch (err: any) {
      const status = err.message.includes('UNAUTHORIZED') ? 403 : err.message.includes('NOT_FOUND') ? 404 : 400;
      sendError(res, 'NOTIFICATION_ERROR', err.message, status);
    }
  }
}

import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AttendanceController {
  /**
   * GET /api/events/:eventId/attendance
   */
  static async getEventAttendance(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const data = await AttendanceService.getEventAttendance(eventId, req.user);
      sendSuccess(res, data);
    } catch (err: any) {
      const status = err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED') ? 403 : 400;
      sendError(res, 'ATTENDANCE_ERROR', err.message || 'Failed to fetch attendance', status);
    }
  }

  /**
   * PATCH /api/events/:eventId/attendance/:registrationId
   */
  static async updateAttendance(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId, registrationId } = req.params;
      const { status, notes } = req.body;

      const record = await AttendanceService.updateAttendance(
        eventId,
        registrationId,
        status,
        notes,
        req.user
      );
      sendSuccess(res, { registration: record }, 200, 'Attendance status updated successfully');
    } catch (err: any) {
      const status =
        err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED')
          ? 403
          : err.message.includes('NOT_FOUND')
          ? 404
          : 400;
      sendError(res, 'ATTENDANCE_ERROR', err.message, status);
    }
  }
}

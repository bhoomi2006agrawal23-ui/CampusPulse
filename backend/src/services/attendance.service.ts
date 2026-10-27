import mongoose from 'mongoose';
import { Registration, IRegistration } from '../models/Registration.js';
import { Event } from '../models/Event.js';
import { ROLES, UserRole } from '../constants/roles.js';
import { isDbConnected } from '../config/db.js';
import { memoryEvents, memoryRegistrations, MemoryRegistration } from './venue.service.js';
import { AuditLogService } from './audit.service.js';
import { memoryStore } from './auth.service.js';

export class AttendanceService {
  /**
   * Helper to verify organizer ownership or admin role.
   */
  private static async verifyEventOwnership(eventId: string, requestUser: { id: string; role: UserRole }): Promise<any> {
    if (requestUser.role === ROLES.ADMIN) return true;
    if (requestUser.role !== ROLES.ORGANIZER) {
      throw new Error('FORBIDDEN: Only event organizers or administrators can manage attendance');
    }

    if (isDbConnected()) {
      const event = await Event.findById(eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');
      if (event.organizerId.toString() !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS: You do not own this event');
      }
      return event;
    } else {
      const event = memoryEvents.get(eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');
      if (event.organizerId !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS: You do not own this event');
      }
      return event;
    }
  }

  /**
   * Updates attendance status for a registered participant.
   */
  static async updateAttendance(
    eventId: string,
    registrationId: string,
    status: 'Unmarked' | 'Attended' | 'Absent' | 'Excused',
    notes: string | undefined,
    requestUser: { id: string; role: UserRole }
  ): Promise<any> {
    await this.verifyEventOwnership(eventId, requestUser);

    const validStatuses = ['Unmarked', 'Attended', 'Absent', 'Excused'];
    if (!validStatuses.includes(status)) {
      throw new Error(`INVALID_ATTENDANCE_STATUS: Status must be one of ${validStatuses.join(', ')}`);
    }

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(registrationId)) {
        throw new Error('REGISTRATION_NOT_FOUND');
      }

      const reg = await Registration.findById(registrationId);
      if (!reg) throw new Error('REGISTRATION_NOT_FOUND');

      if (reg.eventId.toString() !== eventId) {
        throw new Error('CROSS_EVENT_ERROR: Registration does not belong to this event');
      }

      reg.attendanceStatus = status;
      if (notes) reg.notes = notes.trim();
      if (status === 'Attended') {
        reg.checkedInAt = new Date();
        reg.checkedInBy = new mongoose.Types.ObjectId(requestUser.id);
      }

      await reg.save();

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'ATTENDANCE_UPDATED',
        resourceType: 'Registration',
        resourceId: reg._id.toString(),
        eventId,
        metadata: { attendanceStatus: status },
      });

      return reg;
    } else {
      const reg = memoryRegistrations.get(registrationId);
      if (!reg) throw new Error('REGISTRATION_NOT_FOUND');

      if (reg.eventId !== eventId) {
        throw new Error('CROSS_EVENT_ERROR: Registration does not belong to this event');
      }

      reg.attendanceStatus = status;
      if (notes) reg.notes = notes.trim();
      if (status === 'Attended') {
        reg.checkedInAt = new Date();
        reg.checkedInBy = requestUser.id;
      }
      reg.updatedAt = new Date();

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'ATTENDANCE_UPDATED',
        resourceType: 'Registration',
        resourceId: reg._id,
        eventId,
        metadata: { attendanceStatus: status },
      });

      return reg;
    }
  }

  /**
   * Retrieves all registrations for an event with comprehensive attendance metrics.
   */
  static async getEventAttendance(
    eventId: string,
    requestUser: { id: string; role: UserRole }
  ): Promise<{
    summary: {
      total: number;
      attended: number;
      absent: number;
      excused: number;
      unmarked: number;
      attendancePercentage: number;
    };
    records: any[];
  }> {
    await this.verifyEventOwnership(eventId, requestUser);

    if (isDbConnected()) {
      const records = await Registration.find({
        eventId: new mongoose.Types.ObjectId(eventId),
        status: 'Confirmed',
      })
        .populate('studentId', 'name email profileInfo phoneNumber')
        .populate('checkedInBy', 'name')
        .sort({ registeredAt: 1 });

      let attended = 0;
      let absent = 0;
      let excused = 0;
      let unmarked = 0;

      for (const r of records) {
        if (r.attendanceStatus === 'Attended') attended++;
        else if (r.attendanceStatus === 'Absent') absent++;
        else if (r.attendanceStatus === 'Excused') excused++;
        else unmarked++;
      }

      const total = records.length;
      const attendancePercentage = total > 0 ? Math.round((attended / total) * 100) : 0;

      return {
        summary: {
          total,
          attended,
          absent,
          excused,
          unmarked,
          attendancePercentage,
        },
        records,
      };
    } else {
      const records = Array.from(memoryRegistrations.values())
        .filter((r) => r.eventId === eventId && r.status === 'Confirmed')
        .map((r) => {
          const user = memoryStore.users.get(r.studentId);
          const checkedInByUser = r.checkedInBy ? memoryStore.users.get(r.checkedInBy) : null;
          return {
            ...r,
            id: r._id,
            studentId: user
              ? { id: user._id, name: user.name, email: user.email, profileInfo: user.profileInfo, phoneNumber: user.phoneNumber }
              : r.studentId,
            checkedInBy: checkedInByUser ? { id: checkedInByUser._id, name: checkedInByUser.name } : r.checkedInBy,
          };
        });

      let attended = 0;
      let absent = 0;
      let excused = 0;
      let unmarked = 0;

      for (const r of records) {
        if (r.attendanceStatus === 'Attended') attended++;
        else if (r.attendanceStatus === 'Absent') absent++;
        else if (r.attendanceStatus === 'Excused') excused++;
        else unmarked++;
      }

      const total = records.length;
      const attendancePercentage = total > 0 ? Math.round((attended / total) * 100) : 0;

      return {
        summary: {
          total,
          attended,
          absent,
          excused,
          unmarked,
          attendancePercentage,
        },
        records,
      };
    }
  }
}

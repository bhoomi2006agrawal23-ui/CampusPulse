import mongoose from 'mongoose';
import { Schedule, ISchedule } from '../models/Schedule.js';
import { Event } from '../models/Event.js';
import { ROLES, UserRole } from '../constants/roles.js';
import { isDbConnected } from '../config/db.js';
import { memorySchedules, memoryEvents, MemorySchedule } from './venue.service.js';
import { AuditLogService } from './audit.service.js';

export class ScheduleService {
  /**
   * Check if a schedule overlaps with another schedule on the same venue.
   * Formula: newStart < existingEnd AND newEnd > existingStart
   */
  static async checkScheduleVenueConflict(
    venueId: string,
    startDateTime: Date,
    endDateTime: Date,
    excludeScheduleId?: string
  ): Promise<{ hasConflict: boolean; conflictingSchedule?: any }> {
    const newStart = new Date(startDateTime);
    const newEnd = new Date(endDateTime);

    if (isDbConnected()) {
      const query: any = {
        venueId: new mongoose.Types.ObjectId(venueId),
        startDateTime: { $lt: newEnd },
        endDateTime: { $gt: newStart },
      };

      if (excludeScheduleId && mongoose.Types.ObjectId.isValid(excludeScheduleId)) {
        query._id = { $ne: new mongoose.Types.ObjectId(excludeScheduleId) };
      }

      const conflicting = await Schedule.findOne(query);
      if (conflicting) {
        return {
          hasConflict: true,
          conflictingSchedule: {
            id: conflicting._id.toString(),
            title: conflicting.title,
            startDateTime: conflicting.startDateTime,
            endDateTime: conflicting.endDateTime,
          },
        };
      }
      return { hasConflict: false };
    } else {
      for (const s of memorySchedules.values()) {
        if (s.venueId === venueId) {
          if (excludeScheduleId && s._id === excludeScheduleId) continue;
          const existingStart = new Date(s.startDateTime);
          const existingEnd = new Date(s.endDateTime);

          if (newStart < existingEnd && newEnd > existingStart) {
            return {
              hasConflict: true,
              conflictingSchedule: {
                id: s._id,
                title: s.title,
                startDateTime: s.startDateTime,
                endDateTime: s.endDateTime,
              },
            };
          }
        }
      }
      return { hasConflict: false };
    }
  }

  /**
   * Create a new schedule/session for an event.
   */
  static async createSchedule(
    eventId: string,
    data: {
      title: string;
      description?: string;
      startDateTime: string;
      endDateTime: string;
      venueId?: string;
      trackName?: string;
      speakerOrLead?: string;
    },
    requestUser: { id: string; role: UserRole }
  ): Promise<any> {
    const start = new Date(data.startDateTime);
    const end = new Date(data.endDateTime);

    if (start >= end) {
      throw new Error('INVALID_SCHEDULE_TIME: Schedule start time must be strictly before end time');
    }

    // Verify event existence & ownership
    if (isDbConnected()) {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('EVENT_NOT_FOUND: Target event does not exist');
      }
      if (requestUser.role !== ROLES.ADMIN && event.organizerId.toString() !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS: You do not have permission to manage schedules for this event');
      }

      // Check venue conflict if venue assigned
      if (data.venueId && mongoose.Types.ObjectId.isValid(data.venueId)) {
        const conflict = await this.checkScheduleVenueConflict(data.venueId, start, end);
        if (conflict.hasConflict) {
          throw new Error(
            `SCHEDULE_CONFLICT: The selected venue is already booked for another session ("${conflict.conflictingSchedule?.title}") during this time interval.`
          );
        }
      }

      const schedule = await Schedule.create({
        eventId: new mongoose.Types.ObjectId(eventId),
        title: data.title.trim(),
        description: data.description?.trim(),
        startDateTime: start,
        endDateTime: end,
        venueId: data.venueId && mongoose.Types.ObjectId.isValid(data.venueId) ? new mongoose.Types.ObjectId(data.venueId) : undefined,
        trackName: data.trackName?.trim() || 'Main Track',
        speakerOrLead: data.speakerOrLead?.trim(),
      });

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'SCHEDULE_CREATED',
        resourceType: 'Schedule',
        resourceId: schedule._id.toString(),
        eventId,
        metadata: { title: schedule.title, trackName: schedule.trackName },
      });

      return schedule;
    } else {
      const event = memoryEvents.get(eventId);
      if (!event) {
        throw new Error('EVENT_NOT_FOUND: Target event does not exist');
      }
      if (requestUser.role !== ROLES.ADMIN && event.organizerId !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS: You do not have permission to manage schedules for this event');
      }

      if (data.venueId) {
        const conflict = await this.checkScheduleVenueConflict(data.venueId, start, end);
        if (conflict.hasConflict) {
          throw new Error(
            `SCHEDULE_CONFLICT: The selected venue is already booked for another session ("${conflict.conflictingSchedule?.title}") during this time interval.`
          );
        }
      }

      const id = new mongoose.Types.ObjectId().toString();
      const schedule: MemorySchedule = {
        _id: id,
        eventId,
        title: data.title.trim(),
        description: data.description?.trim(),
        startDateTime: start,
        endDateTime: end,
        venueId: data.venueId,
        trackName: data.trackName?.trim() || 'Main Track',
        speakerOrLead: data.speakerOrLead?.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memorySchedules.set(id, schedule);

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'SCHEDULE_CREATED',
        resourceType: 'Schedule',
        resourceId: id,
        eventId,
        metadata: { title: schedule.title, trackName: schedule.trackName },
      });

      return schedule;
    }
  }

  /**
   * Get all schedules for an event.
   */
  static async getEventSchedules(eventId: string): Promise<any[]> {
    if (isDbConnected()) {
      const schedules = await Schedule.find({ eventId: new mongoose.Types.ObjectId(eventId) })
        .populate('venueId', 'name building capacity')
        .sort({ startDateTime: 1 });
      return schedules;
    } else {
      return Array.from(memorySchedules.values())
        .filter((s) => s.eventId === eventId)
        .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    }
  }

  /**
   * Update a schedule session.
   */
  static async updateSchedule(
    scheduleId: string,
    data: Partial<{
      title: string;
      description?: string;
      startDateTime: string;
      endDateTime: string;
      venueId?: string;
      trackName?: string;
      speakerOrLead?: string;
    }>,
    requestUser: { id: string; role: UserRole }
  ): Promise<any> {
    if (isDbConnected()) {
      const existing = await Schedule.findById(scheduleId);
      if (!existing) throw new Error('SCHEDULE_NOT_FOUND');

      const event = await Event.findById(existing.eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && event.organizerId.toString() !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS: You cannot edit this schedule');
      }

      const mergedStart = data.startDateTime ? new Date(data.startDateTime) : existing.startDateTime;
      const mergedEnd = data.endDateTime ? new Date(data.endDateTime) : existing.endDateTime;
      const mergedVenueId = data.venueId !== undefined ? data.venueId : existing.venueId?.toString();

      if (mergedStart >= mergedEnd) {
        throw new Error('INVALID_SCHEDULE_TIME: Schedule start time must be before end time');
      }

      if (mergedVenueId && mongoose.Types.ObjectId.isValid(mergedVenueId)) {
        const conflict = await this.checkScheduleVenueConflict(
          mergedVenueId,
          mergedStart,
          mergedEnd,
          scheduleId
        );
        if (conflict.hasConflict) {
          throw new Error(`SCHEDULE_CONFLICT: Overlapping session at same venue`);
        }
      }

      const updated = await Schedule.findByIdAndUpdate(
        scheduleId,
        {
          ...(data.title ? { title: data.title.trim() } : {}),
          ...(data.description !== undefined ? { description: data.description.trim() } : {}),
          ...(data.startDateTime ? { startDateTime: mergedStart } : {}),
          ...(data.endDateTime ? { endDateTime: mergedEnd } : {}),
          ...(data.venueId !== undefined ? { venueId: data.venueId && mongoose.Types.ObjectId.isValid(data.venueId) ? new mongoose.Types.ObjectId(data.venueId) : undefined } : {}),
          ...(data.trackName !== undefined ? { trackName: data.trackName.trim() } : {}),
          ...(data.speakerOrLead !== undefined ? { speakerOrLead: data.speakerOrLead.trim() } : {}),
        },
        { new: true }
      );
      return updated;
    } else {
      const s = memorySchedules.get(scheduleId);
      if (!s) throw new Error('SCHEDULE_NOT_FOUND');

      const event = memoryEvents.get(s.eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && event.organizerId !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS: You cannot edit this schedule');
      }

      const mergedStart = data.startDateTime ? new Date(data.startDateTime) : new Date(s.startDateTime);
      const mergedEnd = data.endDateTime ? new Date(data.endDateTime) : new Date(s.endDateTime);
      const mergedVenueId = data.venueId !== undefined ? data.venueId : s.venueId;

      if (mergedStart >= mergedEnd) {
        throw new Error('INVALID_SCHEDULE_TIME: Schedule start time must be before end time');
      }

      if (mergedVenueId) {
        const conflict = await this.checkScheduleVenueConflict(mergedVenueId, mergedStart, mergedEnd, scheduleId);
        if (conflict.hasConflict) {
          throw new Error('SCHEDULE_CONFLICT: Overlapping session at same venue');
        }
      }

      if (data.title) s.title = data.title.trim();
      if (data.description !== undefined) s.description = data.description.trim();
      if (data.startDateTime) s.startDateTime = mergedStart;
      if (data.endDateTime) s.endDateTime = mergedEnd;
      if (data.venueId !== undefined) s.venueId = data.venueId;
      if (data.trackName !== undefined) s.trackName = data.trackName.trim();
      if (data.speakerOrLead !== undefined) s.speakerOrLead = data.speakerOrLead.trim();
      s.updatedAt = new Date();

      return s;
    }
  }

  /**
   * Delete a schedule session.
   */
  static async deleteSchedule(
    scheduleId: string,
    requestUser: { id: string; role: UserRole }
  ): Promise<boolean> {
    if (isDbConnected()) {
      const existing = await Schedule.findById(scheduleId);
      if (!existing) throw new Error('SCHEDULE_NOT_FOUND');

      const event = await Event.findById(existing.eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && event.organizerId.toString() !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS: You cannot delete this schedule');
      }

      await Schedule.findByIdAndDelete(scheduleId);
      return true;
    } else {
      const s = memorySchedules.get(scheduleId);
      if (!s) throw new Error('SCHEDULE_NOT_FOUND');

      const event = memoryEvents.get(s.eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && event.organizerId !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS: You cannot delete this schedule');
      }

      memorySchedules.delete(scheduleId);
      return true;
    }
  }
}

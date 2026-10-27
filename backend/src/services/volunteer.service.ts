import mongoose from 'mongoose';
import { Volunteer, IVolunteer } from '../models/Volunteer.js';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import { ROLES, UserRole } from '../constants/roles.js';
import { isDbConnected } from '../config/db.js';
import { memoryVolunteers, memoryEvents, MemoryVolunteer } from './venue.service.js';
import { AuditLogService } from './audit.service.js';
import { memoryStore } from './auth.service.js';

export class VolunteerService {
  /**
   * Checks if a volunteer has an overlapping shift on any active event assignment.
   * Formula: newStart < existingEnd AND newEnd > existingStart
   */
  static async checkVolunteerShiftConflict(
    userId: string,
    shiftStart: Date,
    shiftEnd: Date,
    excludeAssignmentId?: string
  ): Promise<{ hasConflict: boolean; conflictingDuty?: any }> {
    const newStart = new Date(shiftStart);
    const newEnd = new Date(shiftEnd);

    if (isDbConnected()) {
      const query: any = {
        userId: new mongoose.Types.ObjectId(userId),
        status: { $ne: 'Declined' },
        shiftStart: { $lt: newEnd },
        shiftEnd: { $gt: newStart },
      };

      if (excludeAssignmentId && mongoose.Types.ObjectId.isValid(excludeAssignmentId)) {
        query._id = { $ne: new mongoose.Types.ObjectId(excludeAssignmentId) };
      }

      const conflicting = await Volunteer.findOne(query).populate('eventId', 'title');
      if (conflicting) {
        return {
          hasConflict: true,
          conflictingDuty: {
            id: conflicting._id.toString(),
            assignedRole: conflicting.assignedRole,
            eventTitle: (conflicting.eventId as any)?.title,
            shiftStart: conflicting.shiftStart,
            shiftEnd: conflicting.shiftEnd,
          },
        };
      }
      return { hasConflict: false };
    } else {
      for (const v of memoryVolunteers.values()) {
        if (v.userId === userId && v.status !== 'Declined' && v.shiftStart && v.shiftEnd) {
          if (excludeAssignmentId && v._id === excludeAssignmentId) continue;
          const existingStart = new Date(v.shiftStart);
          const existingEnd = new Date(v.shiftEnd);

          if (newStart < existingEnd && newEnd > existingStart) {
            const ev = memoryEvents.get(v.eventId);
            return {
              hasConflict: true,
              conflictingDuty: {
                id: v._id,
                assignedRole: v.assignedRole,
                eventTitle: ev?.title,
                shiftStart: v.shiftStart,
                shiftEnd: v.shiftEnd,
              },
            };
          }
        }
      }
      return { hasConflict: false };
    }
  }

  /**
   * Assign a volunteer to an event.
   */
  static async assignVolunteer(
    eventId: string,
    data: {
      userId: string;
      assignedRole: string;
      shiftStart?: string;
      shiftEnd?: string;
      location?: string;
      notes?: string;
    },
    requestUser: { id: string; role: UserRole }
  ): Promise<any> {
    // 1. Verify Event & Ownership
    if (isDbConnected()) {
      const event = await Event.findById(eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND: Event does not exist');
      if (requestUser.role !== ROLES.ADMIN && event.organizerId.toString() !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS: You cannot assign volunteers to this event');
      }

      // 2. Verify User exists and is Volunteer role
      const targetUser = await User.findById(data.userId);
      if (!targetUser) throw new Error('USER_NOT_FOUND: Volunteer user record not found');
      if (targetUser.role !== ROLES.VOLUNTEER) {
        throw new Error(`INVALID_ROLE: User "${targetUser.name}" has role "${targetUser.role}". Only users with role "Volunteer" can be assigned as volunteers.`);
      }

      // 3. Duplicate check
      const existing = await Volunteer.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        userId: new mongoose.Types.ObjectId(data.userId),
      });
      if (existing) {
        throw new Error('VOLUNTEER_ALREADY_ASSIGNED: This volunteer is already assigned to this event');
      }

      // 4. Shift timing & Conflict check
      let startD: Date | undefined;
      let endD: Date | undefined;
      if (data.shiftStart && data.shiftEnd) {
        startD = new Date(data.shiftStart);
        endD = new Date(data.shiftEnd);
        if (startD >= endD) {
          throw new Error('INVALID_SHIFT_TIME: Volunteer shift start time must be before end time');
        }

        const conflict = await this.checkVolunteerShiftConflict(data.userId, startD, endD);
        if (conflict.hasConflict) {
          throw new Error(`VOLUNTEER_SHIFT_CONFLICT: Volunteer already has an overlapping shift for role "${conflict.conflictingDuty?.assignedRole}".`);
        }
      }

      const assignment = await Volunteer.create({
        eventId: new mongoose.Types.ObjectId(eventId),
        userId: new mongoose.Types.ObjectId(data.userId),
        assignedRole: data.assignedRole.trim(),
        shiftStart: startD,
        shiftEnd: endD,
        location: data.location?.trim(),
        notes: data.notes?.trim(),
        status: 'Assigned',
      });

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'VOLUNTEER_ASSIGNED',
        resourceType: 'Volunteer',
        resourceId: assignment._id.toString(),
        eventId,
        metadata: { userId: data.userId, assignedRole: data.assignedRole },
      });

      return assignment;
    } else {
      const event = memoryEvents.get(eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND: Event does not exist');
      if (requestUser.role !== ROLES.ADMIN && event.organizerId !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS: You cannot assign volunteers to this event');
      }

      const targetUser = memoryStore.users.get(data.userId);
      if (!targetUser) throw new Error('USER_NOT_FOUND');
      if (targetUser.role !== ROLES.VOLUNTEER) {
        throw new Error(`INVALID_ROLE: Only users with role "Volunteer" can be assigned as volunteers.`);
      }

      const existing = Array.from(memoryVolunteers.values()).find(
        (v) => v.eventId === eventId && v.userId === data.userId
      );
      if (existing) {
        throw new Error('VOLUNTEER_ALREADY_ASSIGNED: This volunteer is already assigned to this event');
      }

      let startD: Date | undefined;
      let endD: Date | undefined;
      if (data.shiftStart && data.shiftEnd) {
        startD = new Date(data.shiftStart);
        endD = new Date(data.shiftEnd);
        if (startD >= endD) {
          throw new Error('INVALID_SHIFT_TIME: Volunteer shift start time must be before end time');
        }

        const conflict = await this.checkVolunteerShiftConflict(data.userId, startD, endD);
        if (conflict.hasConflict) {
          throw new Error('VOLUNTEER_SHIFT_CONFLICT: Overlapping duty shift detected');
        }
      }

      const id = new mongoose.Types.ObjectId().toString();
      const assignment: MemoryVolunteer = {
        _id: id,
        eventId,
        userId: data.userId,
        assignedRole: data.assignedRole.trim(),
        shiftStart: startD,
        shiftEnd: endD,
        location: data.location?.trim(),
        notes: data.notes?.trim(),
        isCheckedIn: false,
        status: 'Assigned',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryVolunteers.set(id, assignment);

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'VOLUNTEER_ASSIGNED',
        resourceType: 'Volunteer',
        resourceId: id,
        eventId,
        metadata: { userId: data.userId, assignedRole: data.assignedRole },
      });

      return assignment;
    }
  }

  /**
   * Get all volunteers assigned to an event.
   */
  static async getEventVolunteers(
    eventId: string,
    requestUser: { id: string; role: UserRole }
  ): Promise<any[]> {
    if (isDbConnected()) {
      const event = await Event.findById(eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');
      if (requestUser.role !== ROLES.ADMIN && event.organizerId.toString() !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS');
      }

      const volunteers = await Volunteer.find({ eventId: new mongoose.Types.ObjectId(eventId) })
        .populate('userId', 'name email phoneNumber profileInfo')
        .sort({ createdAt: -1 });

      return volunteers;
    } else {
      const event = memoryEvents.get(eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');
      if (requestUser.role !== ROLES.ADMIN && event.organizerId !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS');
      }

      return Array.from(memoryVolunteers.values())
        .filter((v) => v.eventId === eventId)
        .map((v) => {
          const u = memoryStore.users.get(v.userId);
          return {
            ...v,
            id: v._id,
            userId: u ? { id: u._id, name: u.name, email: u.email, profileInfo: u.profileInfo } : v.userId,
          };
        });
    }
  }

  /**
   * Get duty assignments for a specific volunteer user.
   */
  static async getMyVolunteerDuties(volunteerUserId: string): Promise<any[]> {
    if (isDbConnected()) {
      const duties = await Volunteer.find({
        userId: new mongoose.Types.ObjectId(volunteerUserId),
      })
        .populate({
          path: 'eventId',
          select: 'title eventCode slug startDateTime endDateTime primaryVenueId status',
          populate: { path: 'primaryVenueId', select: 'name building' },
        })
        .sort({ shiftStart: 1 });

      return duties;
    } else {
      return Array.from(memoryVolunteers.values())
        .filter((v) => v.userId === volunteerUserId)
        .map((v) => {
          const ev = memoryEvents.get(v.eventId);
          return {
            ...v,
            id: v._id,
            eventId: ev ? { ...ev, id: ev._id } : v.eventId,
          };
        });
    }
  }

  /**
   * Update volunteer duty details / status.
   */
  static async updateVolunteerDuty(
    assignmentId: string,
    data: Partial<{
      assignedRole: string;
      shiftStart?: string;
      shiftEnd?: string;
      location?: string;
      notes?: string;
      status: 'Assigned' | 'Confirmed' | 'Completed' | 'Declined';
    }>,
    requestUser: { id: string; role: UserRole }
  ): Promise<any> {
    if (isDbConnected()) {
      const existing = await Volunteer.findById(assignmentId);
      if (!existing) throw new Error('VOLUNTEER_ASSIGNMENT_NOT_FOUND');

      const event = await Event.findById(existing.eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && event.organizerId.toString() !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS');
      }

      let startD = data.shiftStart ? new Date(data.shiftStart) : existing.shiftStart;
      let endD = data.shiftEnd ? new Date(data.shiftEnd) : existing.shiftEnd;

      if (startD && endD) {
        if (startD >= endD) {
          throw new Error('INVALID_SHIFT_TIME: Shift start time must be before end time');
        }

        const conflict = await this.checkVolunteerShiftConflict(
          existing.userId.toString(),
          startD,
          endD,
          assignmentId
        );
        if (conflict.hasConflict) {
          throw new Error('VOLUNTEER_SHIFT_CONFLICT: Overlapping duty shift detected');
        }
      }

      const updated = await Volunteer.findByIdAndUpdate(
        assignmentId,
        {
          ...(data.assignedRole ? { assignedRole: data.assignedRole.trim() } : {}),
          ...(data.shiftStart !== undefined ? { shiftStart: startD } : {}),
          ...(data.shiftEnd !== undefined ? { shiftEnd: endD } : {}),
          ...(data.location !== undefined ? { location: data.location.trim() } : {}),
          ...(data.notes !== undefined ? { notes: data.notes.trim() } : {}),
          ...(data.status ? { status: data.status } : {}),
        },
        { new: true }
      );

      return updated;
    } else {
      const v = memoryVolunteers.get(assignmentId);
      if (!v) throw new Error('VOLUNTEER_ASSIGNMENT_NOT_FOUND');

      const event = memoryEvents.get(v.eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && event.organizerId !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS');
      }

      if (data.assignedRole) v.assignedRole = data.assignedRole.trim();
      if (data.shiftStart) v.shiftStart = new Date(data.shiftStart);
      if (data.shiftEnd) v.shiftEnd = new Date(data.shiftEnd);
      if (data.location !== undefined) v.location = data.location.trim();
      if (data.notes !== undefined) v.notes = data.notes.trim();
      if (data.status) v.status = data.status;
      v.updatedAt = new Date();

      return v;
    }
  }

  /**
   * Check in a volunteer for their duty.
   */
  static async checkInVolunteer(
    assignmentId: string,
    requestUser: { id: string; role: UserRole }
  ): Promise<any> {
    if (isDbConnected()) {
      const assignment = await Volunteer.findById(assignmentId);
      if (!assignment) throw new Error('VOLUNTEER_ASSIGNMENT_NOT_FOUND');

      // Check authorization: Volunteer checking into own duty, or Organizer/Admin
      const isSelf = assignment.userId.toString() === requestUser.id;
      const isAdmin = requestUser.role === ROLES.ADMIN;
      if (!isSelf && !isAdmin) {
        const event = await Event.findById(assignment.eventId);
        if (!event || event.organizerId.toString() !== requestUser.id) {
          throw new Error('FORBIDDEN: You cannot check in this volunteer');
        }
      }

      if (assignment.isCheckedIn) {
        throw new Error('VOLUNTEER_ALREADY_CHECKED_IN: This volunteer has already checked in for this duty');
      }

      assignment.isCheckedIn = true;
      assignment.checkedInAt = new Date();
      assignment.status = 'Confirmed';
      await assignment.save();

      return assignment;
    } else {
      const v = memoryVolunteers.get(assignmentId);
      if (!v) throw new Error('VOLUNTEER_ASSIGNMENT_NOT_FOUND');

      const isSelf = v.userId === requestUser.id;
      const isAdmin = requestUser.role === ROLES.ADMIN;
      if (!isSelf && !isAdmin) {
        const event = memoryEvents.get(v.eventId);
        if (!event || event.organizerId !== requestUser.id) {
          throw new Error('FORBIDDEN: You cannot check in this volunteer');
        }
      }

      if (v.isCheckedIn) {
        throw new Error('VOLUNTEER_ALREADY_CHECKED_IN: Already checked in');
      }

      v.isCheckedIn = true;
      v.checkedInAt = new Date();
      v.status = 'Confirmed';
      v.updatedAt = new Date();

      return v;
    }
  }

  /**
   * Remove volunteer assignment.
   */
  static async removeVolunteerAssignment(
    assignmentId: string,
    requestUser: { id: string; role: UserRole }
  ): Promise<boolean> {
    if (isDbConnected()) {
      const assignment = await Volunteer.findById(assignmentId);
      if (!assignment) throw new Error('VOLUNTEER_ASSIGNMENT_NOT_FOUND');

      const event = await Event.findById(assignment.eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && event.organizerId.toString() !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS');
      }

      await Volunteer.findByIdAndDelete(assignmentId);
      return true;
    } else {
      const v = memoryVolunteers.get(assignmentId);
      if (!v) throw new Error('VOLUNTEER_ASSIGNMENT_NOT_FOUND');

      const event = memoryEvents.get(v.eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && event.organizerId !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS');
      }

      memoryVolunteers.delete(assignmentId);
      return true;
    }
  }
}

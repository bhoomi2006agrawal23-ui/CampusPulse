import mongoose from 'mongoose';
import { Judge, IJudge } from '../models/Judge.js';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import { Registration } from '../models/Registration.js';
import { ROLES, UserRole } from '../constants/roles.js';
import { isDbConnected } from '../config/db.js';
import { memoryJudges, memoryEvents, memoryRegistrations, MemoryJudge } from './venue.service.js';
import { AuditLogService } from './audit.service.js';
import { memoryStore } from './auth.service.js';

export class JudgeService {
  /**
   * Assign a judge to an event.
   */
  static async assignJudge(
    eventId: string,
    data: {
      userId: string;
      roleDescription?: string;
    },
    requestUser: { id: string; role: UserRole }
  ): Promise<any> {
    if (isDbConnected()) {
      // 1. Verify Event & Ownership
      const event = await Event.findById(eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND: Target event not found');
      if (requestUser.role !== ROLES.ADMIN && event.organizerId.toString() !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS: You cannot assign judges to this event');
      }

      // 2. Verify User & Role
      const targetUser = await User.findById(data.userId);
      if (!targetUser) throw new Error('USER_NOT_FOUND: Judge user record not found');
      if (targetUser.role !== ROLES.JUDGE) {
        throw new Error(`INVALID_ROLE: User "${targetUser.name}" has role "${targetUser.role}". Only users with role "Judge" can be assigned as judges.`);
      }

      // 3. Duplicate check
      const existing = await Judge.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        userId: new mongoose.Types.ObjectId(data.userId),
      });
      if (existing) {
        throw new Error('JUDGE_ALREADY_ASSIGNED: This judge is already assigned to this event');
      }

      const assignment = await Judge.create({
        eventId: new mongoose.Types.ObjectId(eventId),
        userId: new mongoose.Types.ObjectId(data.userId),
        roleDescription: data.roleDescription?.trim(),
        assignedAt: new Date(),
        isFinalized: false,
      });

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'JUDGE_ASSIGNED',
        resourceType: 'Judge',
        resourceId: assignment._id.toString(),
        eventId,
        metadata: { userId: data.userId },
      });

      return assignment;
    } else {
      const event = memoryEvents.get(eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');
      if (requestUser.role !== ROLES.ADMIN && event.organizerId !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS');
      }

      const targetUser = memoryStore.users.get(data.userId);
      if (!targetUser) throw new Error('USER_NOT_FOUND');
      if (targetUser.role !== ROLES.JUDGE) {
        throw new Error(`INVALID_ROLE: Only users with role "Judge" can be assigned as judges.`);
      }

      const existing = Array.from(memoryJudges.values()).find(
        (j) => j.eventId === eventId && j.userId === data.userId
      );
      if (existing) {
        throw new Error('JUDGE_ALREADY_ASSIGNED: This judge is already assigned to this event');
      }

      const id = new mongoose.Types.ObjectId().toString();
      const assignment: MemoryJudge = {
        _id: id,
        eventId,
        userId: data.userId,
        roleDescription: data.roleDescription?.trim(),
        assignedAt: new Date(),
        isFinalized: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryJudges.set(id, assignment);

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'JUDGE_ASSIGNED',
        resourceType: 'Judge',
        resourceId: id,
        eventId,
        metadata: { userId: data.userId },
      });

      return assignment;
    }
  }

  /**
   * Get all judges assigned to an event.
   */
  static async getEventJudges(
    eventId: string,
    requestUser: { id: string; role: UserRole }
  ): Promise<any[]> {
    if (isDbConnected()) {
      const judges = await Judge.find({ eventId: new mongoose.Types.ObjectId(eventId) })
        .populate('userId', 'name email phoneNumber bio profileInfo')
        .sort({ assignedAt: 1 });
      return judges;
    } else {
      return Array.from(memoryJudges.values())
        .filter((j) => j.eventId === eventId)
        .map((j) => {
          const u = memoryStore.users.get(j.userId);
          return {
            ...j,
            id: j._id,
            userId: u ? { id: u._id, name: u.name, email: u.email, bio: u.bio, profileInfo: u.profileInfo } : j.userId,
          };
        });
    }
  }

  /**
   * Get event assignments for a specific judge user.
   */
  static async getMyJudgeAssignments(judgeUserId: string): Promise<any[]> {
    if (isDbConnected()) {
      const assignments = await Judge.find({
        userId: new mongoose.Types.ObjectId(judgeUserId),
      })
        .populate({
          path: 'eventId',
          select: 'title eventCode slug startDateTime endDateTime primaryVenueId status eligibility instructions',
          populate: { path: 'primaryVenueId', select: 'name building' },
        })
        .sort({ assignedAt: -1 });
      return assignments;
    } else {
      return Array.from(memoryJudges.values())
        .filter((j) => j.userId === judgeUserId)
        .map((j) => {
          const ev = memoryEvents.get(j.eventId);
          return {
            ...j,
            id: j._id,
            eventId: ev ? { ...ev, id: ev._id } : j.eventId,
          };
        });
    }
  }

  /**
   * Judge authorization verification: Ensures judge is assigned to this specific event.
   */
  static async isJudgeAssignedToEvent(judgeUserId: string, eventId: string): Promise<boolean> {
    if (isDbConnected()) {
      const assignment = await Judge.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        userId: new mongoose.Types.ObjectId(judgeUserId),
      });
      return Boolean(assignment);
    } else {
      return Array.from(memoryJudges.values()).some(
        (j) => j.eventId === eventId && j.userId === judgeUserId
      );
    }
  }

  /**
   * Get participants for evaluation, strictly restricted to authorized judges, organizers, or admins.
   */
  static async getJudgeEventParticipants(
    eventId: string,
    requestUser: { id: string; role: UserRole }
  ): Promise<any[]> {
    if (requestUser.role === ROLES.JUDGE) {
      const isAssigned = await this.isJudgeAssignedToEvent(requestUser.id, eventId);
      if (!isAssigned) {
        throw new Error('JUDGE_NOT_ASSIGNED: You are not an assigned evaluator for this event');
      }
    } else if (requestUser.role === ROLES.ORGANIZER) {
      const ev = isDbConnected() ? await Event.findById(eventId) : memoryEvents.get(eventId);
      const orgId = isDbConnected() ? (ev as any)?.organizerId?.toString() : (ev as any)?.organizerId;
      if (orgId !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS');
      }
    } else if (requestUser.role !== ROLES.ADMIN) {
      throw new Error('FORBIDDEN: You do not have permission to view participant evaluation rosters');
    }

    if (isDbConnected()) {
      const participants = await Registration.find({
        eventId: new mongoose.Types.ObjectId(eventId),
        status: 'Confirmed',
      })
        .populate('studentId', 'name email phoneNumber profileInfo')
        .sort({ registeredAt: 1 });

      return participants;
    } else {
      return Array.from(memoryRegistrations.values())
        .filter((r) => r.eventId === eventId && r.status === 'Confirmed')
        .map((r) => {
          const u = memoryStore.users.get(r.studentId);
          return {
            ...r,
            id: r._id,
            studentId: u ? { id: u._id, name: u.name, email: u.email, profileInfo: u.profileInfo } : r.studentId,
          };
        });
    }
  }

  /**
   * Remove judge assignment from event.
   */
  static async removeJudgeAssignment(
    judgeAssignmentId: string,
    requestUser: { id: string; role: UserRole }
  ): Promise<boolean> {
    if (isDbConnected()) {
      const assignment = await Judge.findById(judgeAssignmentId);
      if (!assignment) throw new Error('JUDGE_ASSIGNMENT_NOT_FOUND');

      const event = await Event.findById(assignment.eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && event.organizerId.toString() !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS');
      }

      await Judge.findByIdAndDelete(judgeAssignmentId);
      return true;
    } else {
      const j = memoryJudges.get(judgeAssignmentId);
      if (!j) throw new Error('JUDGE_ASSIGNMENT_NOT_FOUND');

      const event = memoryEvents.get(j.eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && event.organizerId !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS');
      }

      memoryJudges.delete(judgeAssignmentId);
      return true;
    }
  }
}

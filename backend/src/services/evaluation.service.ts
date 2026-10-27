import mongoose from 'mongoose';
import { Result, IResult } from '../models/Result.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { JudgeService } from './judge.service.js';
import { ROLES, UserRole } from '../constants/roles.js';
import { isDbConnected } from '../config/db.js';
import { memoryResults, memoryEvents, memoryRegistrations, MemoryResult } from './venue.service.js';
import { AuditLogService } from './audit.service.js';
import { memoryStore } from './auth.service.js';

export class EvaluationService {
  /**
   * Submit or update a participant evaluation score.
   */
  static async submitEvaluation(
    eventId: string,
    data: {
      participantId: string;
      score: number;
      criteriaScores?: {
        innovation?: number;
        technical?: number;
        impact?: number;
        presentation?: number;
      };
      awardTitle?: string;
      judgeFeedback?: string;
    },
    requestUser: { id: string; role: UserRole }
  ): Promise<any> {
    // 1. Authorization: Judge must be assigned to event; Admin has universal access
    if (requestUser.role === ROLES.JUDGE) {
      const isAssigned = await JudgeService.isJudgeAssignedToEvent(requestUser.id, eventId);
      if (!isAssigned) {
        throw new Error('JUDGE_NOT_ASSIGNED: You are not authorized to score this event');
      }
    } else if (requestUser.role !== ROLES.ADMIN) {
      throw new Error('FORBIDDEN: Only assigned judges or administrators can evaluate participants');
    }

    // 2. Validate Event State (Cannot score cancelled/archived events)
    if (isDbConnected()) {
      const event = await Event.findById(eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');
      if (event.status === 'Cancelled' || event.status === 'Archived') {
        throw new Error(`EVALUATION_LOCKED: Scoring is locked because the event status is "${event.status}"`);
      }

      // 3. Validate participant registration for this event
      const registration = await Registration.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        studentId: new mongoose.Types.ObjectId(data.participantId),
        status: 'Confirmed',
      });
      if (!registration) {
        throw new Error('PARTICIPANT_NOT_REGISTERED: The specified student is not registered for this event');
      }

      // 4. Validate score range
      if (typeof data.score !== 'number' || isNaN(data.score) || data.score < 0 || data.score > 1000) {
        throw new Error('INVALID_SCORE: Total score must be a number between 0 and 1000');
      }

      // 5. Upsert Result record
      const result = await Result.findOneAndUpdate(
        {
          eventId: new mongoose.Types.ObjectId(eventId),
          participantId: new mongoose.Types.ObjectId(data.participantId),
        },
        {
          registrationId: registration._id,
          judgeId: new mongoose.Types.ObjectId(requestUser.id),
          score: data.score,
          criteriaScores: data.criteriaScores,
          awardTitle: data.awardTitle?.trim(),
          judgeFeedback: data.judgeFeedback?.trim(),
          isPublished: false,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'EVALUATION_SUBMITTED',
        resourceType: 'Result',
        resourceId: result._id.toString(),
        eventId,
        metadata: { participantId: data.participantId, score: data.score },
      });

      return result;
    } else {
      const event = memoryEvents.get(eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');
      if (event.status === 'Cancelled' || event.status === 'Archived') {
        throw new Error(`EVALUATION_LOCKED: Scoring is locked (Status: ${event.status})`);
      }

      const reg = Array.from(memoryRegistrations.values()).find(
        (r) => r.eventId === eventId && r.studentId === data.participantId && r.status === 'Confirmed'
      );
      if (!reg) {
        throw new Error('PARTICIPANT_NOT_REGISTERED: Student is not registered for this event');
      }

      if (typeof data.score !== 'number' || isNaN(data.score) || data.score < 0 || data.score > 1000) {
        throw new Error('INVALID_SCORE: Score must be between 0 and 1000');
      }

      // Search existing
      let result = Array.from(memoryResults.values()).find(
        (r) => r.eventId === eventId && r.participantId === data.participantId
      );

      if (result) {
        result.score = data.score;
        result.judgeId = requestUser.id;
        result.criteriaScores = data.criteriaScores;
        result.awardTitle = data.awardTitle?.trim();
        result.judgeFeedback = data.judgeFeedback?.trim();
        result.updatedAt = new Date();
      } else {
        const id = new mongoose.Types.ObjectId().toString();
        result = {
          _id: id,
          eventId,
          participantId: data.participantId,
          registrationId: reg._id,
          judgeId: requestUser.id,
          score: data.score,
          criteriaScores: data.criteriaScores,
          awardTitle: data.awardTitle?.trim(),
          judgeFeedback: data.judgeFeedback?.trim(),
          isPublished: false,
          isFinalized: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryResults.set(id, result);
      }

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'EVALUATION_SUBMITTED',
        resourceType: 'Result',
        resourceId: result._id,
        eventId,
        metadata: { participantId: data.participantId, score: data.score },
      });

      return result;
    }
  }

  /**
   * Get all evaluations for an event.
   */
  static async getEventEvaluations(
    eventId: string,
    requestUser: { id: string; role: UserRole }
  ): Promise<any[]> {
    if (requestUser.role === ROLES.JUDGE) {
      const isAssigned = await JudgeService.isJudgeAssignedToEvent(requestUser.id, eventId);
      if (!isAssigned) throw new Error('JUDGE_NOT_ASSIGNED');
    } else if (requestUser.role === ROLES.ORGANIZER) {
      const ev = isDbConnected() ? await Event.findById(eventId) : memoryEvents.get(eventId);
      const orgId = isDbConnected() ? (ev as any)?.organizerId?.toString() : (ev as any)?.organizerId;
      if (orgId !== requestUser.id) throw new Error('UNAUTHORIZED_EVENT_ACCESS');
    } else if (requestUser.role !== ROLES.ADMIN) {
      throw new Error('FORBIDDEN');
    }

    if (isDbConnected()) {
      const results = await Result.find({ eventId: new mongoose.Types.ObjectId(eventId) })
        .populate('participantId', 'name email profileInfo')
        .populate('judgeId', 'name email')
        .sort({ score: -1 });
      return results;
    } else {
      return Array.from(memoryResults.values())
        .filter((r) => r.eventId === eventId)
        .map((r) => {
          const participant = memoryStore.users.get(r.participantId);
          const judge = r.judgeId ? memoryStore.users.get(r.judgeId) : null;
          return {
            ...r,
            id: r._id,
            participantId: participant ? { id: participant._id, name: participant.name, email: participant.email, profileInfo: participant.profileInfo } : r.participantId,
            judgeId: judge ? { id: judge._id, name: judge.name, email: judge.email } : r.judgeId,
          };
        })
        .sort((a, b) => b.score - a.score);
    }
  }
}

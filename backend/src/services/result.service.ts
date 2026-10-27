import mongoose from 'mongoose';
import { Result, IResult } from '../models/Result.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { ROLES, UserRole } from '../constants/roles.js';
import { isDbConnected } from '../config/db.js';
import { memoryResults, memoryEvents, memoryRegistrations, MemoryResult } from './venue.service.js';
import { NotificationService } from './notification.service.js';
import { memoryStore } from './auth.service.js';
import { AuditLogService } from './audit.service.js';

export class ResultService {
  /**
   * Helper to verify organizer ownership or admin role.
   */
  private static async verifyEventOwnership(eventId: string, requestUser: { id: string; role: UserRole }): Promise<any> {
    if (requestUser.role === ROLES.ADMIN) return true;
    if (requestUser.role !== ROLES.ORGANIZER) {
      throw new Error('FORBIDDEN: Only event organizers or administrators can manage results');
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
   * Organizer / Admin creates or updates a participant result.
   */
  static async createOrUpdateResult(
    eventId: string,
    data: {
      participantId: string;
      score: number;
      rank?: number;
      awardTitle?: string;
      judgeFeedback?: string;
      criteriaScores?: {
        innovation?: number;
        technical?: number;
        impact?: number;
        presentation?: number;
      };
    },
    requestUser: { id: string; role: UserRole }
  ): Promise<any> {
    await this.verifyEventOwnership(eventId, requestUser);

    if (typeof data.score !== 'number' || isNaN(data.score) || data.score < 0 || data.score > 1000) {
      throw new Error('INVALID_SCORE: Score must be a number between 0 and 1000');
    }

    if (isDbConnected()) {
      const reg = await Registration.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        studentId: new mongoose.Types.ObjectId(data.participantId),
        status: 'Confirmed',
      });
      if (!reg) {
        throw new Error('PARTICIPANT_NOT_REGISTERED: The student is not registered for this event');
      }

      const existingResult = await Result.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        participantId: new mongoose.Types.ObjectId(data.participantId),
      });

      if (existingResult && existingResult.isFinalized && requestUser.role !== ROLES.ADMIN) {
        throw new Error('RESULT_LOCKED: Cannot modify finalized results without admin override');
      }

      const result = await Result.findOneAndUpdate(
        {
          eventId: new mongoose.Types.ObjectId(eventId),
          participantId: new mongoose.Types.ObjectId(data.participantId),
        },
        {
          registrationId: reg._id,
          score: data.score,
          rank: data.rank,
          awardTitle: data.awardTitle?.trim(),
          judgeFeedback: data.judgeFeedback?.trim(),
          criteriaScores: data.criteriaScores,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return result;
    } else {
      const reg = Array.from(memoryRegistrations.values()).find(
        (r) => r.eventId === eventId && r.studentId === data.participantId && r.status === 'Confirmed'
      );
      if (!reg) {
        throw new Error('PARTICIPANT_NOT_REGISTERED: Student is not registered for this event');
      }

      let result = Array.from(memoryResults.values()).find(
        (r) => r.eventId === eventId && r.participantId === data.participantId
      );

      if (result) {
        if (result.isFinalized && requestUser.role !== ROLES.ADMIN) {
          throw new Error('RESULT_LOCKED: Cannot modify finalized results without admin override');
        }
        result.score = data.score;
        result.rank = data.rank;
        result.awardTitle = data.awardTitle?.trim();
        result.judgeFeedback = data.judgeFeedback?.trim();
        result.criteriaScores = data.criteriaScores;
        result.updatedAt = new Date();
      } else {
        const id = new mongoose.Types.ObjectId().toString();
        result = {
          _id: id,
          eventId,
          participantId: data.participantId,
          registrationId: reg._id,
          score: data.score,
          rank: data.rank,
          awardTitle: data.awardTitle?.trim(),
          judgeFeedback: data.judgeFeedback?.trim(),
          criteriaScores: data.criteriaScores,
          isPublished: false,
          isFinalized: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryResults.set(id, result);
      }

      return result;
    }
  }

  /**
   * Finalizes all results for an event (locks them against unauthorized edits).
   */
  static async finalizeResults(eventId: string, requestUser: { id: string; role: UserRole }): Promise<{ finalizedCount: number }> {
    await this.verifyEventOwnership(eventId, requestUser);

    if (isDbConnected()) {
      const results = await Result.find({ eventId: new mongoose.Types.ObjectId(eventId) }).sort({ score: -1 });
      if (results.length === 0) {
        throw new Error('NO_RESULTS_FOUND: No evaluation records to finalize');
      }

      // Assign ranks deterministically if not already manually set
      for (let i = 0; i < results.length; i++) {
        if (!results[i].rank) {
          results[i].rank = i + 1;
        }
        results[i].isFinalized = true;
        await results[i].save();
      }

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'RESULT_FINALIZE',
        resourceType: 'Result',
        eventId,
        metadata: { count: results.length },
      });

      return { finalizedCount: results.length };
    } else {
      const results = Array.from(memoryResults.values())
        .filter((r) => r.eventId === eventId)
        .sort((a, b) => b.score - a.score);

      if (results.length === 0) {
        throw new Error('NO_RESULTS_FOUND: No evaluation records to finalize');
      }

      results.forEach((r, idx) => {
        if (!r.rank) r.rank = idx + 1;
        r.isFinalized = true;
        r.updatedAt = new Date();
      });

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'RESULT_FINALIZE',
        resourceType: 'Result',
        eventId,
        metadata: { count: results.length },
      });

      return { finalizedCount: results.length };
    }
  }

  /**
   * Publishes all finalized results for an event.
   */
  static async publishResults(eventId: string, requestUser: { id: string; role: UserRole }): Promise<{ publishedCount: number }> {
    const event = await this.verifyEventOwnership(eventId, requestUser);

    if (isDbConnected()) {
      const results = await Result.find({ eventId: new mongoose.Types.ObjectId(eventId) });
      if (results.length === 0) {
        throw new Error('NO_RESULTS_FOUND: Cannot publish empty results');
      }

      await Result.updateMany(
        { eventId: new mongoose.Types.ObjectId(eventId) },
        { $set: { isPublished: true, isFinalized: true } }
      );

      // Transition event lifecycle state to ResultsPublished if valid
      const ev = await Event.findById(eventId);
      if (ev && (ev.status === 'EventCompleted' || ev.status === 'EventOngoing')) {
        ev.status = 'ResultsPublished';
        await ev.save();
      }

      // Notify all participants about published results
      for (const res of results) {
        await NotificationService.sendNotification({
          userId: res.participantId.toString(),
          title: `Results Published: ${ev ? ev.title : 'Event'}`,
          message: res.rank
            ? `Official standings are out! You achieved Rank #${res.rank} with a score of ${res.score}/1000.`
            : `Official results for your event have been published.`,
          type: 'ResultPublished',
          linkUrl: `/events/${eventId}/results`,
        });
      }

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'RESULT_PUBLISH',
        resourceType: 'Result',
        eventId,
        metadata: { count: results.length },
      });

      return { publishedCount: results.length };
    } else {
      const results = Array.from(memoryResults.values()).filter((r) => r.eventId === eventId);
      if (results.length === 0) {
        throw new Error('NO_RESULTS_FOUND: Cannot publish empty results');
      }

      const ev = memoryEvents.get(eventId);
      if (ev && (ev.status === 'EventCompleted' || ev.status === 'EventOngoing')) {
        ev.status = 'ResultsPublished';
        ev.updatedAt = new Date();
      }

      results.forEach((r) => {
        r.isPublished = true;
        r.isFinalized = true;
        r.updatedAt = new Date();

        NotificationService.sendNotification({
          userId: r.participantId,
          title: `Results Published: ${ev ? ev.title : 'Event'}`,
          message: r.rank
            ? `Official standings are out! You achieved Rank #${r.rank} with a score of ${r.score}/1000.`
            : `Official results for your event have been published.`,
          type: 'ResultPublished',
          linkUrl: `/events/${eventId}/results`,
        });
      });

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'RESULT_PUBLISH',
        resourceType: 'Result',
        eventId,
        metadata: { count: results.length },
      });

      return { publishedCount: results.length };
    }
  }

  /**
   * Retrieves results for an event with strict visibility rules.
   * Students/Public ONLY see published results.
   * Organizers/Admins can see draft/finalized results.
   */
  static async getEventResults(
    eventId: string,
    requestUser?: { id: string; role: UserRole }
  ): Promise<any[]> {
    const isPrivileged =
      requestUser &&
      (requestUser.role === ROLES.ADMIN ||
        requestUser.role === ROLES.ORGANIZER ||
        requestUser.role === ROLES.JUDGE);

    if (isDbConnected()) {
      const query: any = { eventId: new mongoose.Types.ObjectId(eventId) };
      if (!isPrivileged) {
        query.isPublished = true;
      }

      const results = await Result.find(query)
        .populate('participantId', 'name email profileInfo')
        .populate('judgeId', 'name')
        .sort({ rank: 1, score: -1 });

      return results;
    } else {
      let list = Array.from(memoryResults.values()).filter((r) => r.eventId === eventId);
      if (!isPrivileged) {
        list = list.filter((r) => r.isPublished);
      }

      return list
        .map((r) => {
          const participant = memoryStore.users.get(r.participantId);
          const judge = r.judgeId ? memoryStore.users.get(r.judgeId) : null;
          return {
            ...r,
            id: r._id,
            participantId: participant
              ? { id: participant._id, name: participant.name, email: participant.email, profileInfo: participant.profileInfo }
              : r.participantId,
            judgeId: judge ? { id: judge._id, name: judge.name } : r.judgeId,
          };
        })
        .sort((a, b) => {
          if (a.rank && b.rank) return a.rank - b.rank;
          return b.score - a.score;
        });
    }
  }

  /**
   * Retrieves all published results for a specific student.
   */
  static async getStudentResults(studentId: string): Promise<any[]> {
    if (isDbConnected()) {
      const results = await Result.find({
        participantId: new mongoose.Types.ObjectId(studentId),
        isPublished: true,
      })
        .populate('eventId', 'title eventCode startDateTime endDateTime status')
        .sort({ createdAt: -1 });
      return results;
    } else {
      return Array.from(memoryResults.values())
        .filter((r) => r.participantId === studentId && r.isPublished)
        .map((r) => {
          const ev = memoryEvents.get(r.eventId);
          return {
            ...r,
            id: r._id,
            eventId: ev ? { id: ev._id, title: ev.title, eventCode: ev.eventCode, startDateTime: ev.startDateTime, status: ev.status } : r.eventId,
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }
}

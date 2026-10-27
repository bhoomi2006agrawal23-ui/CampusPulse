import mongoose from 'mongoose';
import { Report, IReport } from '../models/Report.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { Volunteer } from '../models/Volunteer.js';
import { Judge } from '../models/Judge.js';
import { Result } from '../models/Result.js';
import { Certificate } from '../models/Certificate.js';
import { User } from '../models/User.js';
import { ROLES, UserRole } from '../constants/roles.js';
import { isDbConnected } from '../config/db.js';
import {
  memoryEvents,
  memoryRegistrations,
  memoryVolunteers,
  memoryJudges,
  memoryResults,
  memoryCertificates,
  memoryReports,
  MemoryReport,
} from './venue.service.js';
import { memoryStore } from './auth.service.js';
import { AuditLogService } from './audit.service.js';

export class ReportService {
  /**
   * Helper to verify organizer ownership or admin role.
   */
  private static async verifyEventOwnership(eventId: string, requestUser: { id: string; role: UserRole }): Promise<any> {
    if (requestUser.role === ROLES.ADMIN) return true;
    if (requestUser.role !== ROLES.ORGANIZER) {
      throw new Error('FORBIDDEN: Only event organizers or administrators can access event reports');
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
   * Generates a comprehensive summary report for a specific event.
   */
  static async generateEventSummaryReport(
    eventId: string,
    requestUser: { id: string; role: UserRole }
  ): Promise<any> {
    await this.verifyEventOwnership(eventId, requestUser);

    if (isDbConnected()) {
      const event = await Event.findById(eventId).populate('categoryId', 'name').populate('primaryVenueId', 'name capacity');
      if (!event) throw new Error('EVENT_NOT_FOUND');

      const registrations = await Registration.find({ eventId: new mongoose.Types.ObjectId(eventId) });
      const volunteers = await Volunteer.find({ eventId: new mongoose.Types.ObjectId(eventId) });
      const judges = await Judge.find({ eventId: new mongoose.Types.ObjectId(eventId) });
      const results = await Result.find({ eventId: new mongoose.Types.ObjectId(eventId) });
      const certificates = await Certificate.find({ eventId: new mongoose.Types.ObjectId(eventId) });

      let attended = 0;
      let absent = 0;
      let excused = 0;
      let unmarked = 0;

      for (const r of registrations) {
        if (r.attendanceStatus === 'Attended') attended++;
        else if (r.attendanceStatus === 'Absent') absent++;
        else if (r.attendanceStatus === 'Excused') excused++;
        else unmarked++;
      }

      const totalRegs = registrations.length;
      const attendanceRate = totalRegs > 0 ? Math.round((attended / totalRegs) * 100) : 0;

      const dataSummary = {
        eventDetails: {
          id: event._id,
          title: event.title,
          status: event.status,
          category: (event.categoryId as any)?.name || 'General',
          venue: (event.primaryVenueId as any)?.name || 'Campus Venue',
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
        },
        registrations: {
          total: totalRegs,
          capacity: event.capacity,
          utilizationPercentage: event.capacity > 0 ? Math.round((totalRegs / event.capacity) * 100) : 0,
        },
        attendance: {
          attended,
          absent,
          excused,
          unmarked,
          attendanceRate,
        },
        staffing: {
          volunteersAssigned: volunteers.length,
          judgesAssigned: judges.length,
        },
        evaluations: {
          totalEvaluations: results.length,
          resultsPublished: results.some((r) => r.isPublished),
          topScorer: results.length > 0 ? results.sort((a, b) => b.score - a.score)[0].score : null,
        },
        certificates: {
          totalIssued: certificates.length,
        },
        generatedAt: new Date(),
      };

      const report = await Report.create({
        reportType: 'EventSummary',
        eventId: new mongoose.Types.ObjectId(eventId),
        generatedById: new mongoose.Types.ObjectId(requestUser.id),
        dataSummary,
      });

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'REPORT_GENERATED',
        resourceType: 'Report',
        resourceId: report._id.toString(),
        eventId,
      });

      return report;
    } else {
      const event = memoryEvents.get(eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');

      const registrations = Array.from(memoryRegistrations.values()).filter((r) => r.eventId === eventId);
      const volunteers = Array.from(memoryVolunteers.values()).filter((v) => v.eventId === eventId);
      const judges = Array.from(memoryJudges.values()).filter((j) => j.eventId === eventId);
      const results = Array.from(memoryResults.values()).filter((r) => r.eventId === eventId);
      const certificates = Array.from(memoryCertificates.values()).filter((c) => c.eventId === eventId);

      let attended = 0;
      let absent = 0;
      let excused = 0;
      let unmarked = 0;

      for (const r of registrations) {
        if (r.attendanceStatus === 'Attended') attended++;
        else if (r.attendanceStatus === 'Absent') absent++;
        else if (r.attendanceStatus === 'Excused') excused++;
        else unmarked++;
      }

      const totalRegs = registrations.length;
      const attendanceRate = totalRegs > 0 ? Math.round((attended / totalRegs) * 100) : 0;

      const dataSummary = {
        eventDetails: {
          id: event._id,
          title: event.title,
          status: event.status,
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
        },
        registrations: {
          total: totalRegs,
          capacity: event.capacity,
          utilizationPercentage: event.capacity > 0 ? Math.round((totalRegs / event.capacity) * 100) : 0,
        },
        attendance: {
          attended,
          absent,
          excused,
          unmarked,
          attendanceRate,
        },
        staffing: {
          volunteersAssigned: volunteers.length,
          judgesAssigned: judges.length,
        },
        evaluations: {
          totalEvaluations: results.length,
          resultsPublished: results.some((r) => r.isPublished),
          topScorer: results.length > 0 ? results.sort((a, b) => b.score - a.score)[0].score : null,
        },
        certificates: {
          totalIssued: certificates.length,
        },
        generatedAt: new Date(),
      };

      const id = new mongoose.Types.ObjectId().toString();
      const report: MemoryReport = {
        _id: id,
        reportType: 'EventSummary',
        eventId,
        generatedById: requestUser.id,
        dataSummary,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryReports.set(id, report);

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'REPORT_GENERATED',
        resourceType: 'Report',
        resourceId: id,
        eventId,
      });

      return report;
    }
  }

  /**
   * Retrieves reports for an event.
   */
  static async getEventReports(eventId: string, requestUser: { id: string; role: UserRole }): Promise<any[]> {
    await this.verifyEventOwnership(eventId, requestUser);

    if (isDbConnected()) {
      return await Report.find({ eventId: new mongoose.Types.ObjectId(eventId) })
        .populate('generatedById', 'name email')
        .sort({ createdAt: -1 });
    } else {
      return Array.from(memoryReports.values())
        .filter((r) => r.eventId === eventId)
        .map((r) => {
          const author = memoryStore.users.get(r.generatedById);
          return {
            ...r,
            id: r._id,
            generatedById: author ? { id: author._id, name: author.name } : r.generatedById,
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  /**
   * Universal Administrator Metrics Engine.
   */
  static async getSystemMetrics(requestUser: { id: string; role: UserRole }): Promise<any> {
    if (requestUser.role !== ROLES.ADMIN) {
      throw new Error('FORBIDDEN: Only administrators can view universal system metrics');
    }

    if (isDbConnected()) {
      const totalUsers = await User.countDocuments();
      const studentCount = await User.countDocuments({ role: ROLES.STUDENT });
      const organizerCount = await User.countDocuments({ role: ROLES.ORGANIZER });
      const judgeCount = await User.countDocuments({ role: ROLES.JUDGE });
      const volunteerCount = await User.countDocuments({ role: ROLES.VOLUNTEER });
      const adminCount = await User.countDocuments({ role: ROLES.ADMIN });

      const totalEvents = await Event.countDocuments();
      const publishedEvents = await Event.countDocuments({ status: { $in: ['Published', 'RegistrationOpen', 'RegistrationClosed', 'EventUpcoming', 'EventOngoing', 'EventCompleted', 'ResultsPublished'] } });
      const completedEvents = await Event.countDocuments({ status: { $in: ['EventCompleted', 'ResultsPublished'] } });

      const totalRegistrations = await Registration.countDocuments({ status: 'Confirmed' });
      const totalAttended = await Registration.countDocuments({ attendanceStatus: 'Attended' });
      const totalResults = await Result.countDocuments();
      const totalCertificates = await Certificate.countDocuments();

      return {
        users: {
          total: totalUsers,
          students: studentCount,
          organizers: organizerCount,
          judges: judgeCount,
          volunteers: volunteerCount,
          admins: adminCount,
        },
        events: {
          total: totalEvents,
          published: publishedEvents,
          completed: completedEvents,
        },
        engagement: {
          registrations: totalRegistrations,
          attended: totalAttended,
          attendanceRate: totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0,
          resultsPublished: totalResults,
          certificatesIssued: totalCertificates,
        },
        collectionsActive: 14,
        auditLogsStatus: 'Deferred to Phase 6',
      };
    } else {
      const users = Array.from(memoryStore.users.values());
      const events = Array.from(memoryEvents.values());
      const registrations = Array.from(memoryRegistrations.values()).filter((r) => r.status === 'Confirmed');
      const attended = registrations.filter((r) => r.attendanceStatus === 'Attended');

      return {
        users: {
          total: users.length,
          students: users.filter((u) => u.role === ROLES.STUDENT).length,
          organizers: users.filter((u) => u.role === ROLES.ORGANIZER).length,
          judges: users.filter((u) => u.role === ROLES.JUDGE).length,
          volunteers: users.filter((u) => u.role === ROLES.VOLUNTEER).length,
          admins: users.filter((u) => u.role === ROLES.ADMIN).length,
        },
        events: {
          total: events.length,
          published: events.filter((e) => e.status !== 'Draft' && e.status !== 'Cancelled').length,
          completed: events.filter((e) => e.status === 'EventCompleted' || e.status === 'ResultsPublished').length,
        },
        engagement: {
          registrations: registrations.length,
          attended: attended.length,
          attendanceRate: registrations.length > 0 ? Math.round((attended.length / registrations.length) * 100) : 0,
          resultsPublished: memoryResults.size,
          certificatesIssued: memoryCertificates.size,
        },
        collectionsActive: 14,
        auditLogsStatus: 'Deferred to Phase 6',
      };
    }
  }
}

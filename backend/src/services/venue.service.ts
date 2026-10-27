import mongoose from 'mongoose';
import { Event, IEvent } from '../models/Event.js';
import { Venue } from '../models/Venue.js';
import { isDbConnected } from '../config/db.js';
import { memoryStore } from './auth.service.js';

// Extend memoryStore for events and registrations
export interface MemoryEvent {
  _id: string;
  title: string;
  eventCode: string;
  slug: string;
  description: string;
  collegeName?: string;
  categoryId: string;
  organizerId: string;
  primaryVenueId: string;
  startDateTime: Date;
  endDateTime: Date;
  registrationStart: Date;
  registrationEnd: Date;
  capacity: number;
  registeredCount: number;
  status: string;
  bannerUrl?: string;
  eligibility?: string;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryRegistration {
  _id: string;
  eventId: string;
  studentId: string;
  registrationCode: string;
  status: 'Confirmed' | 'Cancelled' | 'Waitlisted';
  registeredAt: Date;
  attendanceStatus: 'Unmarked' | 'Attended' | 'Absent' | 'Excused';
  checkedInAt?: Date;
  checkedInBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemorySchedule {
  _id: string;
  eventId: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  venueId?: string;
  trackName?: string;
  speakerOrLead?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryVolunteer {
  _id: string;
  eventId: string;
  userId: string;
  assignedRole: string;
  shiftStart?: Date;
  shiftEnd?: Date;
  location?: string;
  isCheckedIn?: boolean;
  checkedInAt?: Date;
  notes?: string;
  status: 'Assigned' | 'Confirmed' | 'Completed' | 'Declined';
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryJudge {
  _id: string;
  eventId: string;
  userId: string;
  roleDescription?: string;
  assignedAt: Date;
  isFinalized: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryResult {
  _id: string;
  eventId: string;
  participantId: string;
  registrationId: string;
  judgeId?: string;
  rank?: number;
  score: number;
  criteriaScores?: {
    innovation?: number;
    technical?: number;
    impact?: number;
    presentation?: number;
  };
  awardTitle?: string;
  judgeFeedback?: string;
  isPublished: boolean;
  isFinalized?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryCertificate {
  _id: string;
  certificateId: string;
  eventId: string;
  recipientId: string;
  recipientName: string;
  certificateType: 'Participation' | 'Merit' | 'Appreciation' | 'Organizer';
  issueDate: Date;
  verificationHash: string;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryAnnouncement {
  _id: string;
  eventId?: string;
  authorId: string;
  title: string;
  content: string;
  priority: 'Normal' | 'High' | 'Urgent';
  isPinned: boolean;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'EventUpdate' | 'Registration' | 'ScheduleChange' | 'ResultPublished' | 'System';
  linkUrl?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryReport {
  _id: string;
  reportType: 'EventSummary' | 'AttendanceAudit' | 'RegistrationDemographics' | 'SystemMetrics';
  eventId?: string;
  generatedById: string;
  parameters?: Record<string, unknown>;
  dataSummary: Record<string, unknown>;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryAuditLog {
  _id: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  eventId?: string;
  success: boolean;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

declare module './auth.service.js' {
  interface MemoryStoreType {
    events: Map<string, MemoryEvent>;
    registrations: Map<string, MemoryRegistration>;
    schedules: Map<string, MemorySchedule>;
    volunteers: Map<string, MemoryVolunteer>;
    judges: Map<string, MemoryJudge>;
    results: Map<string, MemoryResult>;
    certificates: Map<string, MemoryCertificate>;
    announcements: Map<string, MemoryAnnouncement>;
    notifications: Map<string, MemoryNotification>;
    reports: Map<string, MemoryReport>;
    auditLogs: Map<string, MemoryAuditLog>;
  }
}

// Global singleton store attached to globalThis to eliminate module evaluation TDZ issues
const gStore = (globalThis as any).__campusPulseStore || ((globalThis as any).__campusPulseStore = {
  events: new Map<string, MemoryEvent>(),
  registrations: new Map<string, MemoryRegistration>(),
  schedules: new Map<string, MemorySchedule>(),
  volunteers: new Map<string, MemoryVolunteer>(),
  judges: new Map<string, MemoryJudge>(),
  results: new Map<string, MemoryResult>(),
  certificates: new Map<string, MemoryCertificate>(),
  announcements: new Map<string, MemoryAnnouncement>(),
  notifications: new Map<string, MemoryNotification>(),
  reports: new Map<string, MemoryReport>(),
  auditLogs: new Map<string, MemoryAuditLog>(),
});

export const memoryEvents = gStore.events as Map<string, MemoryEvent>;
export const memoryRegistrations = gStore.registrations as Map<string, MemoryRegistration>;
export const memorySchedules = gStore.schedules as Map<string, MemorySchedule>;
export const memoryVolunteers = gStore.volunteers as Map<string, MemoryVolunteer>;
export const memoryJudges = gStore.judges as Map<string, MemoryJudge>;
export const memoryResults = gStore.results as Map<string, MemoryResult>;
export const memoryCertificates = gStore.certificates as Map<string, MemoryCertificate>;
export const memoryAnnouncements = gStore.announcements as Map<string, MemoryAnnouncement>;
export const memoryNotifications = gStore.notifications as Map<string, MemoryNotification>;
export const memoryReports = gStore.reports as Map<string, MemoryReport>;
export const memoryAuditLogs = gStore.auditLogs as Map<string, MemoryAuditLog>;

export class VenueService {
  /**
   * Checks if a target venue is already booked for an overlapping time interval.
   * Locked overlap formula: newStart < existingEnd AND newEnd > existingStart
   * Conditions:
   *  - venueId = targetVenue
   *  - status != 'Cancelled'
   *  - _id != excludeEventId
   */
  static async checkVenueConflict(
    venueId: string,
    startDateTime: Date,
    endDateTime: Date,
    excludeEventId?: string
  ): Promise<{ hasConflict: boolean; conflictingEvent?: any }> {
    const newStart = new Date(startDateTime);
    const newEnd = new Date(endDateTime);

    if (isDbConnected()) {
      const query: any = {
        primaryVenueId: new mongoose.Types.ObjectId(venueId),
        status: { $ne: 'Cancelled' },
        startDateTime: { $lt: newEnd },
        endDateTime: { $gt: newStart },
      };

      if (excludeEventId && mongoose.Types.ObjectId.isValid(excludeEventId)) {
        query._id = { $ne: new mongoose.Types.ObjectId(excludeEventId) };
      }

      const conflictingEvent = await Event.findOne(query);
      if (conflictingEvent) {
        return {
          hasConflict: true,
          conflictingEvent: {
            id: conflictingEvent._id.toString(),
            title: conflictingEvent.title,
            startDateTime: conflictingEvent.startDateTime,
            endDateTime: conflictingEvent.endDateTime,
            status: conflictingEvent.status,
          },
        };
      }
      return { hasConflict: false };
    } else {
      // Memory Store fallback
      for (const ev of memoryEvents.values()) {
        if (ev.primaryVenueId === venueId && ev.status !== 'Cancelled') {
          if (excludeEventId && ev._id === excludeEventId) {
            continue;
          }

          const existingStart = new Date(ev.startDateTime);
          const existingEnd = new Date(ev.endDateTime);

          // Overlap formula: newStart < existingEnd && newEnd > existingStart
          if (newStart < existingEnd && newEnd > existingStart) {
            return {
              hasConflict: true,
              conflictingEvent: {
                id: ev._id,
                title: ev.title,
                startDateTime: ev.startDateTime,
                endDateTime: ev.endDateTime,
                status: ev.status,
              },
            };
          }
        }
      }
      return { hasConflict: false };
    }
  }

  /**
   * Validates whether a venue exists and is currently active.
   */
  static async validateVenueExists(venueId: string): Promise<boolean> {
    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(venueId)) return false;
      const venue = await Venue.findById(venueId);
      return Boolean(venue && venue.isActive);
    } else {
      // Always valid if matching seed venues
      return true;
    }
  }
}

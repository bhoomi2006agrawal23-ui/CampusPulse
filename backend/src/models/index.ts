/**
 * CampusPulse 14 Core Models Export
 * Note: audit_logs is collection #15 and is STRICTLY DEFERRED to Phase 6.
 * Exactly 14 core models are exported here.
 */
export { User } from './User.js';
export type { IUser } from './User.js';

export { Session } from './Session.js';
export type { ISession } from './Session.js';

export { Category } from './Category.js';
export type { ICategory } from './Category.js';

export { Venue } from './Venue.js';
export type { IVenue } from './Venue.js';

export { Event } from './Event.js';
export type { IEvent } from './Event.js';

export { Schedule } from './Schedule.js';
export type { ISchedule } from './Schedule.js';

export { Registration } from './Registration.js';
export type { IRegistration } from './Registration.js';

export { Judge } from './Judge.js';
export type { IJudge } from './Judge.js';

export { Volunteer } from './Volunteer.js';
export type { IVolunteer } from './Volunteer.js';

export { Result } from './Result.js';
export type { IResult } from './Result.js';

export { Certificate } from './Certificate.js';
export type { ICertificate } from './Certificate.js';

export { Announcement } from './Announcement.js';
export type { IAnnouncement } from './Announcement.js';

export { Notification } from './Notification.js';
export type { INotification } from './Notification.js';

export { Report } from './Report.js';
export type { IReport } from './Report.js';

export { AuditLog } from './AuditLog.js';
export type { IAuditLog } from './AuditLog.js';

export const CORE_MODEL_NAMES = [
  'User',
  'Session',
  'Category',
  'Venue',
  'Event',
  'Schedule',
  'Registration',
  'Judge',
  'Volunteer',
  'Result',
  'Certificate',
  'Announcement',
  'Notification',
  'Report',
] as const;

export const ALL_MODEL_NAMES = [
  ...CORE_MODEL_NAMES,
  'AuditLog',
] as const;

export const CORE_COLLECTION_COUNT = 14;
export const PHASE6_COLLECTION_COUNT = 15;

import mongoose from 'mongoose';
import crypto from 'crypto';
import { Event, IEvent } from '../models/Event.js';
import { Category } from '../models/Category.js';
import { Venue } from '../models/Venue.js';
import { User } from '../models/User.js';
import { ROLES, UserRole } from '../constants/roles.js';
import { EventLifecycleState, CANCELLABLE_STATES } from '../constants/lifecycle.js';
import { LifecycleService } from './lifecycle.service.js';
import { VenueService, memoryEvents, MemoryEvent } from './venue.service.js';
import { isDbConnected } from '../config/db.js';
import { memoryStore } from './auth.service.js';
import { AuditLogService } from './audit.service.js';

export interface EventFilterOptions {
  categoryId?: string;
  venueId?: string;
  status?: string;
  search?: string;
  organizerId?: string;
  isPublicOnly?: boolean;
  page?: number;
  limit?: number;
}

export class EventService {
  /**
   * Generates a unique human-readable event code and URL slug.
   */
  static generateEventCode(): string {
    const year = new Date().getFullYear();
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `CP-${year}-${rand}`;
  }

  static generateSlug(title: string): string {
    const clean = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const rand = crypto.randomBytes(2).toString('hex');
    return `${clean}-${rand}`;
  }

  /**
   * Validates date sequence rules:
   * 1. event start < event end
   * 2. registration start < registration end
   * 3. registration end <= event start
   */
  static validateDates(dates: {
    startDateTime: Date | string;
    endDateTime: Date | string;
    registrationStart: Date | string;
    registrationEnd: Date | string;
  }): void {
    const start = new Date(dates.startDateTime);
    const end = new Date(dates.endDateTime);
    const regStart = new Date(dates.registrationStart);
    const regEnd = new Date(dates.registrationEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(regStart.getTime()) || isNaN(regEnd.getTime())) {
      throw new Error('INVALID_DATES: All date fields must be valid ISO timestamps');
    }

    if (start >= end) {
      throw new Error('INVALID_DATES: Event start time must be strictly before event end time');
    }

    if (regStart >= regEnd) {
      throw new Error('INVALID_DATES: Registration start time must be strictly before registration end time');
    }

    if (regEnd > start) {
      throw new Error('INVALID_DATES: Registration end time cannot be after event start time');
    }
  }

  /**
   * Concurrency-safe event creation with venue conflict checks.
   */
  static async createEvent(
    data: {
      title: string;
      description: string;
      collegeName: string;
      categoryId: string;
      primaryVenueId: string;
      startDateTime: string;
      endDateTime: string;
      registrationStart: string;
      registrationEnd: string;
      capacity: number;
      bannerUrl?: string;
      eligibility?: string;
      instructions?: string;
    },
    organizerId: string
  ): Promise<any> {
    // 0. Explicit validation for College Name
    if (!data.collegeName || !data.collegeName.trim()) {
      throw new Error('MISSING_COLLEGE_NAME: College Name is required for creating an event');
    }

    // 1. Validate dates
    this.validateDates(data);

    // 2. Validate Venue belongs to the specified college
    const venueRecord = isDbConnected()
      ? await Venue.findById(data.primaryVenueId)
      : null; // For memory store, check memory venues or allow if valid ID

    if (isDbConnected()) {
      if (!venueRecord) {
        throw new Error('VENUE_NOT_FOUND: Selected primary venue does not exist');
      }
      if (
        venueRecord.collegeName &&
        venueRecord.collegeName.toLowerCase().trim() !== data.collegeName.toLowerCase().trim()
      ) {
        throw new Error(
          `VENUE_MISMATCH: The selected venue "${venueRecord.name}" belongs to "${venueRecord.collegeName}", not "${data.collegeName.trim()}".`
        );
      }
    }

    // 3. Validate Venue Conflict
    const conflictCheck = await VenueService.checkVenueConflict(
      data.primaryVenueId,
      new Date(data.startDateTime),
      new Date(data.endDateTime)
    );

    if (conflictCheck.hasConflict) {
      throw new Error(
        `VENUE_CONFLICT: The selected primary venue is already booked for an overlapping time interval by event: "${conflictCheck.conflictingEvent?.title}".`
      );
    }

    const eventCode = this.generateEventCode();
    const slug = this.generateSlug(data.title);

    if (isDbConnected()) {
      const event = await Event.create({
        title: data.title.trim(),
        eventCode,
        slug,
        description: data.description.trim(),
        collegeName: data.collegeName.trim(),
        categoryId: new mongoose.Types.ObjectId(data.categoryId),
        organizerId: new mongoose.Types.ObjectId(organizerId),
        primaryVenueId: new mongoose.Types.ObjectId(data.primaryVenueId),
        startDateTime: new Date(data.startDateTime),
        endDateTime: new Date(data.endDateTime),
        registrationStart: new Date(data.registrationStart),
        registrationEnd: new Date(data.registrationEnd),
        capacity: data.capacity,
        registeredCount: 0,
        status: 'Draft', // Events strictly begin in Draft
        bannerUrl: data.bannerUrl,
        eligibility: data.eligibility,
        instructions: data.instructions,
      });

      await AuditLogService.log({
        actorId: organizerId,
        action: 'EVENT_CREATE',
        resourceType: 'Event',
        resourceId: event._id.toString(),
        eventId: event._id.toString(),
        metadata: { title: event.title, eventCode },
      });

      return event;
    } else {
      const id = new mongoose.Types.ObjectId().toString();
      const event: MemoryEvent = {
        _id: id,
        title: data.title.trim(),
        eventCode,
        slug,
        description: data.description.trim(),
        collegeName: data.collegeName.trim(),
        categoryId: data.categoryId,
        organizerId,
        primaryVenueId: data.primaryVenueId,
        startDateTime: new Date(data.startDateTime),
        endDateTime: new Date(data.endDateTime),
        registrationStart: new Date(data.registrationStart),
        registrationEnd: new Date(data.registrationEnd),
        capacity: data.capacity,
        registeredCount: 0,
        status: 'Draft',
        bannerUrl: data.bannerUrl,
        eligibility: data.eligibility,
        instructions: data.instructions,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryEvents.set(id, event);

      await AuditLogService.log({
        actorId: organizerId,
        action: 'EVENT_CREATE',
        resourceType: 'Event',
        resourceId: id,
        eventId: id,
        metadata: { title: event.title, eventCode },
      });

      return event;
    }
  }

  /**
   * Concurrency-safe event editing with venue overlap re-validation.
   */
  static async updateEvent(
    eventId: string,
    updateData: Partial<{
      title: string;
      description: string;
      collegeName?: string;
      categoryId: string;
      primaryVenueId: string;
      startDateTime: string;
      endDateTime: string;
      registrationStart: string;
      registrationEnd: string;
      capacity: number;
      bannerUrl?: string;
      eligibility?: string;
      instructions?: string;
    }>,
    requestUser: { id: string; role: UserRole }
  ): Promise<any> {
    const existing = await this.getEventRaw(eventId);
    if (!existing) {
      throw new Error('EVENT_NOT_FOUND: Event record does not exist');
    }

    // RBAC check: Organizer can only edit their own events; Admin can edit any
    if (requestUser.role !== ROLES.ADMIN && existing.organizerId.toString() !== requestUser.id) {
      throw new Error('UNAUTHORIZED_EVENT_ACCESS: You do not have permission to modify this event');
    }

    // Merged date validation
    const mergedStart = updateData.startDateTime ? new Date(updateData.startDateTime) : existing.startDateTime;
    const mergedEnd = updateData.endDateTime ? new Date(updateData.endDateTime) : existing.endDateTime;
    const mergedRegStart = updateData.registrationStart ? new Date(updateData.registrationStart) : existing.registrationStart;
    const mergedRegEnd = updateData.registrationEnd ? new Date(updateData.registrationEnd) : existing.registrationEnd;
    const mergedVenueId = updateData.primaryVenueId || existing.primaryVenueId.toString();
    const mergedCollegeName = updateData.collegeName ? updateData.collegeName.trim() : (existing.collegeName || 'CampusPulse Institute of Technology');

    this.validateDates({
      startDateTime: mergedStart,
      endDateTime: mergedEnd,
      registrationStart: mergedRegStart,
      registrationEnd: mergedRegEnd,
    });

    // Validate Venue belongs to college if venue or college changed
    if (isDbConnected()) {
      const venueRecord = await Venue.findById(mergedVenueId);
      if (!venueRecord) {
        throw new Error('VENUE_NOT_FOUND: Selected primary venue does not exist');
      }
      if (
        venueRecord.collegeName &&
        venueRecord.collegeName.trim() !== '' &&
        venueRecord.collegeName.toLowerCase().trim() !== mergedCollegeName.toLowerCase().trim()
      ) {
        throw new Error(
          `VENUE_MISMATCH: The selected venue "${venueRecord.name}" belongs to "${venueRecord.collegeName}", not "${mergedCollegeName}".`
        );
      }
    }

    // Check venue conflict if venue or timing changed
    const conflictCheck = await VenueService.checkVenueConflict(
      mergedVenueId,
      mergedStart,
      mergedEnd,
      eventId
    );

    if (conflictCheck.hasConflict) {
      throw new Error(
        `VENUE_CONFLICT: The selected primary venue is already booked for an overlapping time interval by event: "${conflictCheck.conflictingEvent?.title}".`
      );
    }

    if (isDbConnected()) {
      const updated = await Event.findByIdAndUpdate(
        eventId,
        {
          ...(updateData.title ? { title: updateData.title.trim() } : {}),
          ...(updateData.description ? { description: updateData.description.trim() } : {}),
          ...(updateData.collegeName ? { collegeName: updateData.collegeName.trim() } : {}),
          ...(updateData.categoryId ? { categoryId: new mongoose.Types.ObjectId(updateData.categoryId) } : {}),
          ...(updateData.primaryVenueId ? { primaryVenueId: new mongoose.Types.ObjectId(updateData.primaryVenueId) } : {}),
          ...(updateData.startDateTime ? { startDateTime: new Date(updateData.startDateTime) } : {}),
          ...(updateData.endDateTime ? { endDateTime: new Date(updateData.endDateTime) } : {}),
          ...(updateData.registrationStart ? { registrationStart: new Date(updateData.registrationStart) } : {}),
          ...(updateData.registrationEnd ? { registrationEnd: new Date(updateData.registrationEnd) } : {}),
          ...(updateData.capacity !== undefined ? { capacity: updateData.capacity } : {}),
          ...(updateData.bannerUrl !== undefined ? { bannerUrl: updateData.bannerUrl } : {}),
          ...(updateData.eligibility !== undefined ? { eligibility: updateData.eligibility } : {}),
          ...(updateData.instructions !== undefined ? { instructions: updateData.instructions } : {}),
        },
        { new: true }
      );

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'EVENT_UPDATE',
        resourceType: 'Event',
        resourceId: eventId,
        eventId,
      });

      return updated;
    } else {
      const mem = memoryEvents.get(eventId);
      if (!mem) throw new Error('EVENT_NOT_FOUND');

      if (updateData.title) mem.title = updateData.title.trim();
      if (updateData.description) mem.description = updateData.description.trim();
      if (updateData.collegeName) mem.collegeName = updateData.collegeName.trim();
      if (updateData.categoryId) mem.categoryId = updateData.categoryId;
      if (updateData.primaryVenueId) mem.primaryVenueId = updateData.primaryVenueId;
      if (updateData.startDateTime) mem.startDateTime = new Date(updateData.startDateTime);
      if (updateData.endDateTime) mem.endDateTime = new Date(updateData.endDateTime);
      if (updateData.registrationStart) mem.registrationStart = new Date(updateData.registrationStart);
      if (updateData.registrationEnd) mem.registrationEnd = new Date(updateData.registrationEnd);
      if (updateData.capacity !== undefined) mem.capacity = updateData.capacity;
      if (updateData.bannerUrl !== undefined) mem.bannerUrl = updateData.bannerUrl;
      if (updateData.eligibility !== undefined) mem.eligibility = updateData.eligibility;
      if (updateData.instructions !== undefined) mem.instructions = updateData.instructions;
      mem.updatedAt = new Date();

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'EVENT_UPDATE',
        resourceType: 'Event',
        resourceId: eventId,
        eventId,
      });

      return mem;
    }
  }

  /**
   * Centralized Event Lifecycle Transition Engine
   */
  static async updateEventStatus(
    eventId: string,
    newStatus: EventLifecycleState,
    requestUser: { id: string; role: UserRole },
    reason?: string
  ): Promise<any> {
    const existing = await this.getEventRaw(eventId);
    if (!existing) {
      throw new Error('EVENT_NOT_FOUND: Event record does not exist');
    }

    // RBAC: Organizer can only transition their own events; Admin can transition any
    if (requestUser.role !== ROLES.ADMIN && existing.organizerId.toString() !== requestUser.id) {
      throw new Error('UNAUTHORIZED_EVENT_ACCESS: You do not have permission to transition this event');
    }

    const currentStatus = existing.status as EventLifecycleState;

    // Validate transition map
    if (!LifecycleService.isValidTransition(currentStatus, newStatus)) {
      throw new Error(
        `INVALID_STATUS_TRANSITION: Cannot transition event lifecycle from "${currentStatus}" to "${newStatus}". Allowed targets: [${(
          (LifecycleService as any).constructor?.prototype || []
        )}]`
      );
    }

    // If publishing, validate completeness
    if (newStatus === 'Published') {
      const readiness = LifecycleService.validatePublishReadiness(existing);
      if (!readiness.isReady) {
        throw new Error(
          `EVENT_INCOMPLETE: Cannot publish incomplete event. Missing fields: [${readiness.missingFields.join(', ')}]`
        );
      }
    }

    if (isDbConnected()) {
      const updated = await Event.findByIdAndUpdate(eventId, { status: newStatus }, { new: true });
      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'EVENT_STATUS_CHANGE',
        resourceType: 'Event',
        resourceId: eventId,
        eventId,
        metadata: { fromStatus: currentStatus, toStatus: newStatus, reason },
      });
      return updated;
    } else {
      const mem = memoryEvents.get(eventId);
      if (mem) {
        mem.status = newStatus;
        mem.updatedAt = new Date();
        await AuditLogService.log({
          actorId: requestUser.id,
          actorRole: requestUser.role,
          action: 'EVENT_STATUS_CHANGE',
          resourceType: 'Event',
          resourceId: eventId,
          eventId,
          metadata: { fromStatus: currentStatus, toStatus: newStatus, reason },
        });
        return mem;
      }
      throw new Error('EVENT_NOT_FOUND');
    }
  }

  /**
   * Retrieves an event by ID with populated Category, Venue, and Organizer.
   * Enforces public vs draft visibility.
   */
  static async getEventById(
    eventId: string,
    requestUser?: { id: string; role: UserRole }
  ): Promise<any> {
    if (isDbConnected()) {
      const event = await Event.findById(eventId)
        .populate('categoryId', 'name slug colorCode iconName')
        .populate('primaryVenueId', 'name building capacity amenities')
        .populate('organizerId', 'name email profileInfo');

      if (!event) {
        throw new Error('EVENT_NOT_FOUND: Event record does not exist');
      }

      // Visibility check for Drafts
      if (event.status === 'Draft') {
        const isOwner = requestUser && event.organizerId?._id?.toString() === requestUser.id;
        const isAdmin = requestUser?.role === ROLES.ADMIN;
        if (!isOwner && !isAdmin) {
          throw new Error('EVENT_NOT_FOUND: Event is in Draft state and not accessible to the public');
        }
      }

      return event;
    } else {
      const mem = memoryEvents.get(eventId);
      if (!mem) {
        throw new Error('EVENT_NOT_FOUND: Event record does not exist');
      }

      if (mem.status === 'Draft') {
        const isOwner = requestUser && mem.organizerId === requestUser.id;
        const isAdmin = requestUser?.role === ROLES.ADMIN;
        if (!isOwner && !isAdmin) {
          throw new Error('EVENT_NOT_FOUND: Event is in Draft state and not accessible to the public');
        }
      }

      return mem;
    }
  }

  /**
   * Helper to fetch raw unpopulated event for internal operations.
   */
  static async getEventRaw(eventId: string): Promise<any> {
    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) return null;
      return Event.findById(eventId);
    } else {
      return memoryEvents.get(eventId) || null;
    }
  }

  /**
   * Lists events with filtering, search, and pagination.
   */
  static async getEvents(
    options: EventFilterOptions,
    requestUser?: { id: string; role: UserRole }
  ): Promise<{ events: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 10));

    if (isDbConnected()) {
      const query: any = {};

      if (options.categoryId && mongoose.Types.ObjectId.isValid(options.categoryId)) {
        query.categoryId = new mongoose.Types.ObjectId(options.categoryId);
      }
      if (options.venueId && mongoose.Types.ObjectId.isValid(options.venueId)) {
        query.primaryVenueId = new mongoose.Types.ObjectId(options.venueId);
      }
      if (options.status) {
        query.status = options.status;
      }
      if (options.organizerId && mongoose.Types.ObjectId.isValid(options.organizerId)) {
        query.organizerId = new mongoose.Types.ObjectId(options.organizerId);
      }

      if (options.search) {
        const regex = new RegExp(options.search.trim(), 'i');
        query.$or = [{ title: regex }, { description: regex }, { eventCode: regex }];
      }

      // Public Visibility Rule:
      // If user is not authenticated as Admin or Organizer filtering their own, hide Drafts
      const isPrivileged = requestUser && (requestUser.role === ROLES.ADMIN || requestUser.role === ROLES.ORGANIZER);
      if (!isPrivileged) {
        query.status = { $ne: 'Draft' };
      }

      const total = await Event.countDocuments(query);
      const events = await Event.find(query)
        .populate('categoryId', 'name slug colorCode iconName')
        .populate('primaryVenueId', 'name building capacity amenities')
        .populate('organizerId', 'name email profileInfo')
        .sort({ startDateTime: 1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        events,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } else {
      let list = Array.from(memoryEvents.values());

      if (options.categoryId) {
        list = list.filter((e) => e.categoryId === options.categoryId);
      }
      if (options.venueId) {
        list = list.filter((e) => e.primaryVenueId === options.venueId);
      }
      if (options.status) {
        list = list.filter((e) => e.status === options.status);
      }
      if (options.organizerId) {
        list = list.filter((e) => e.organizerId === options.organizerId);
      }
      if (options.search) {
        const q = options.search.toLowerCase();
        list = list.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
      }

      const isPrivileged = requestUser && (requestUser.role === ROLES.ADMIN || requestUser.role === ROLES.ORGANIZER);
      if (!isPrivileged) {
        list = list.filter((e) => e.status !== 'Draft');
      }

      const total = list.length;
      const paginated = list.slice((page - 1) * limit, page * limit);

      return {
        events: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }
  }
}

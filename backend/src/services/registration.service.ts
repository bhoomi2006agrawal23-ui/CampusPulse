import mongoose from 'mongoose';
import crypto from 'crypto';
import { Registration, IRegistration } from '../models/Registration.js';
import { Event } from '../models/Event.js';
import { ROLES, UserRole } from '../constants/roles.js';
import { isDbConnected } from '../config/db.js';
import { memoryRegistrations, memoryEvents, MemoryRegistration } from './venue.service.js';
import { memoryStore } from './auth.service.js';
import { AuditLogService } from './audit.service.js';

export class RegistrationService {
  /**
   * Generates a secure unique ticket registration code.
   */
  static generateRegistrationCode(eventCode?: string): string {
    const prefix = eventCode ? eventCode.split('-').slice(0, 2).join('-') : 'CP';
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${rand}`;
  }

  /**
   * Concurrency-safe student event registration.
   * Atomically verifies capacity, registration window, and unique participation.
   */
  static async registerStudent(
    eventId: string,
    studentId: string,
    notes?: string
  ): Promise<{ registration: any; event: any }> {
    const now = new Date();

    if (isDbConnected()) {
      const eventRecord = await Event.findById(eventId);
      if (!eventRecord) {
        throw new Error('EVENT_NOT_FOUND: The requested event does not exist');
      }

      // 1. Check event lifecycle status
      if (eventRecord.status !== 'RegistrationOpen') {
        if (eventRecord.status === 'Draft' || eventRecord.status === 'Published') {
          throw new Error('REGISTRATION_NOT_OPEN: Registration has not officially opened yet for this event');
        }
        if (eventRecord.status === 'Cancelled') {
          throw new Error('EVENT_CANCELLED: This event has been cancelled and cannot accept registrations');
        }
        throw new Error(`REGISTRATION_CLOSED: Registration is closed for this event (Current state: ${eventRecord.status})`);
      }

      // 2. Check registration window
      if (now < new Date(eventRecord.registrationStart)) {
        throw new Error(
          `REGISTRATION_NOT_OPEN: Registration window opens on ${eventRecord.registrationStart.toISOString()}`
        );
      }
      if (now > new Date(eventRecord.registrationEnd)) {
        throw new Error(
          `REGISTRATION_CLOSED: Registration window closed on ${eventRecord.registrationEnd.toISOString()}`
        );
      }

      // 3. Pre-check existing registration for friendly message
      const existingReg = await Registration.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        studentId: new mongoose.Types.ObjectId(studentId),
      });

      if (existingReg && existingReg.status === 'Confirmed') {
        throw new Error('ALREADY_REGISTERED: You are already registered for this event');
      }

      // 4. Concurrency-Safe Atomic Capacity Increment
      // Only increments if registeredCount is strictly less than capacity
      const updatedEvent = await Event.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(eventId),
          status: 'RegistrationOpen',
          $expr: { $lt: ['$registeredCount', '$capacity'] },
        },
        { $inc: { registeredCount: 1 } },
        { new: true }
      );

      if (!updatedEvent) {
        throw new Error('EVENT_FULL: This event has reached maximum capacity. No seats remain.');
      }

      // 5. Create or reactivate Registration Document
      const registrationCode = this.generateRegistrationCode(eventRecord.eventCode);
      try {
        let registrationDoc;
        if (existingReg && existingReg.status === 'Cancelled') {
          existingReg.status = 'Confirmed';
          existingReg.registrationCode = registrationCode;
          existingReg.registeredAt = now;
          existingReg.notes = notes;
          registrationDoc = await existingReg.save();
        } else {
          registrationDoc = await Registration.create({
            eventId: new mongoose.Types.ObjectId(eventId),
            studentId: new mongoose.Types.ObjectId(studentId),
            registrationCode,
            status: 'Confirmed',
            registeredAt: now,
            attendanceStatus: 'Unmarked',
            notes,
          });
        }

        await AuditLogService.log({
          actorId: studentId,
          action: 'REGISTRATION_CREATE',
          resourceType: 'Registration',
          resourceId: registrationDoc._id.toString(),
          eventId,
          metadata: { registrationCode },
        });

        return {
          registration: registrationDoc,
          event: updatedEvent,
        };
      } catch (err: any) {
        // Rollback capacity increment if duplicate compound index tripped
        await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });
        if (err.code === 11000) {
          throw new Error('ALREADY_REGISTERED: You are already registered for this event');
        }
        throw err;
      }
    } else {
      // Memory Store Fallback
      const eventRecord = memoryEvents.get(eventId);
      if (!eventRecord) {
        throw new Error('EVENT_NOT_FOUND: The requested event does not exist');
      }

      if (eventRecord.status !== 'RegistrationOpen') {
        if (eventRecord.status === 'Draft' || eventRecord.status === 'Published') {
          throw new Error('REGISTRATION_NOT_OPEN: Registration has not opened yet');
        }
        if (eventRecord.status === 'Cancelled') {
          throw new Error('EVENT_CANCELLED: This event has been cancelled');
        }
        throw new Error(`REGISTRATION_CLOSED: Registration is closed (State: ${eventRecord.status})`);
      }

      if (now < new Date(eventRecord.registrationStart)) {
        throw new Error('REGISTRATION_NOT_OPEN: Registration window has not opened yet');
      }
      if (now > new Date(eventRecord.registrationEnd)) {
        throw new Error('REGISTRATION_CLOSED: Registration window has ended');
      }

      // Check duplicate
      const existing = Array.from(memoryRegistrations.values()).find(
        (r) => r.eventId === eventId && r.studentId === studentId && r.status === 'Confirmed'
      );
      if (existing) {
        throw new Error('ALREADY_REGISTERED: You are already registered for this event');
      }

      // Atomic capacity check
      if (eventRecord.registeredCount >= eventRecord.capacity) {
        throw new Error('EVENT_FULL: This event has reached maximum capacity');
      }

      eventRecord.registeredCount += 1;
      const regId = new mongoose.Types.ObjectId().toString();
      const registrationCode = this.generateRegistrationCode(eventRecord.eventCode);

      const reg: MemoryRegistration = {
        _id: regId,
        eventId,
        studentId,
        registrationCode,
        status: 'Confirmed',
        registeredAt: now,
        attendanceStatus: 'Unmarked',
        notes,
        createdAt: now,
        updatedAt: now,
      };

      memoryRegistrations.set(regId, reg);

      await AuditLogService.log({
        actorId: studentId,
        action: 'REGISTRATION_CREATE',
        resourceType: 'Registration',
        resourceId: regId,
        eventId,
        metadata: { registrationCode },
      });

      return { registration: reg, event: eventRecord };
    }
  }

  /**
   * Cancels a student registration and frees up event capacity.
   */
  static async cancelRegistration(
    eventId: string,
    studentId: string
  ): Promise<{ cancelled: boolean; eventId: string }> {
    if (isDbConnected()) {
      const reg = await Registration.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        studentId: new mongoose.Types.ObjectId(studentId),
        status: 'Confirmed',
      });

      if (!reg) {
        throw new Error('REGISTRATION_NOT_FOUND: No active confirmed registration found for this event');
      }

      reg.status = 'Cancelled';
      await reg.save();

      // Decrement event registered count safely
      await Event.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(eventId), registeredCount: { $gt: 0 } },
        { $inc: { registeredCount: -1 } }
      );

      await AuditLogService.log({
        actorId: studentId,
        action: 'REGISTRATION_CANCEL',
        resourceType: 'Registration',
        resourceId: reg._id.toString(),
        eventId,
      });

      return { cancelled: true, eventId };
    } else {
      const reg = Array.from(memoryRegistrations.values()).find(
        (r) => r.eventId === eventId && r.studentId === studentId && r.status === 'Confirmed'
      );

      if (!reg) {
        throw new Error('REGISTRATION_NOT_FOUND: No active confirmed registration found for this event');
      }

      reg.status = 'Cancelled';
      reg.updatedAt = new Date();

      const ev = memoryEvents.get(eventId);
      if (ev && ev.registeredCount > 0) {
        ev.registeredCount -= 1;
      }

      await AuditLogService.log({
        actorId: studentId,
        action: 'REGISTRATION_CANCEL',
        resourceType: 'Registration',
        resourceId: reg._id,
        eventId,
      });

      return { cancelled: true, eventId };
    }
  }

  /**
   * Retrieves all registrations for a student.
   */
  static async getStudentRegistrations(studentId: string): Promise<any[]> {
    if (isDbConnected()) {
      const registrations = await Registration.find({
        studentId: new mongoose.Types.ObjectId(studentId),
        status: 'Confirmed',
      })
        .populate({
          path: 'eventId',
          populate: [
            { path: 'categoryId', select: 'name slug colorCode iconName' },
            { path: 'primaryVenueId', select: 'name building capacity' },
          ],
        })
        .sort({ registeredAt: -1 });

      return registrations;
    } else {
      const list = Array.from(memoryRegistrations.values()).filter(
        (r) => r.studentId === studentId && r.status === 'Confirmed'
      );

      return list.map((r) => {
        const ev = memoryEvents.get(r.eventId);
        return {
          ...r,
          id: r._id,
          eventId: ev ? { ...ev, id: ev._id } : r.eventId,
        };
      });
    }
  }

  /**
   * Retrieves participants roster for an event (Organizer/Admin only).
   */
  static async getEventParticipants(
    eventId: string,
    requestUser: { id: string; role: UserRole }
  ): Promise<any[]> {
    if (isDbConnected()) {
      const event = await Event.findById(eventId);
      if (!event) throw new Error('EVENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && event.organizerId.toString() !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS: You do not have permission to view participants for this event');
      }

      const participants = await Registration.find({
        eventId: new mongoose.Types.ObjectId(eventId),
      })
        .populate('studentId', 'name email phoneNumber profileInfo')
        .sort({ registeredAt: 1 });

      return participants;
    } else {
      const ev = memoryEvents.get(eventId);
      if (!ev) throw new Error('EVENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && ev.organizerId !== requestUser.id) {
        throw new Error('UNAUTHORIZED_EVENT_ACCESS: You do not have permission to view participants');
      }

      const list = Array.from(memoryRegistrations.values()).filter((r) => r.eventId === eventId);
      return list.map((r) => {
        const user = memoryStore.users.get(r.studentId);
        return {
          ...r,
          id: r._id,
          studentId: user ? { id: user._id, name: user.name, email: user.email, profileInfo: user.profileInfo } : r.studentId,
        };
      });
    }
  }
}

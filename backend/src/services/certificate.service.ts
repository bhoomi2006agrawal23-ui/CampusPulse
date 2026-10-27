import mongoose from 'mongoose';
import crypto from 'crypto';
import { Certificate, ICertificate } from '../models/Certificate.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { User } from '../models/User.js';
import { ROLES, UserRole } from '../constants/roles.js';
import { isDbConnected } from '../config/db.js';
import { memoryCertificates, memoryEvents, memoryRegistrations, MemoryCertificate } from './venue.service.js';
import { AuditLogService } from './audit.service.js';
import { NotificationService } from './notification.service.js';
import { memoryStore } from './auth.service.js';

export class CertificateService {
  /**
   * Helper to generate unique certificate identifier.
   */
  private static generateCertificateId(): string {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const year = new Date().getFullYear();
    return `CP-CERT-${year}-${randomHex}`;
  }

  /**
   * Helper to generate verification hash.
   */
  private static generateVerificationHash(certificateId: string, recipientId: string, eventId: string, type: string): string {
    return crypto
      .createHash('sha256')
      .update(`${certificateId}:${recipientId}:${eventId}:${type}:CAMPUSPULSE_VERIFIED`)
      .digest('hex');
  }

  /**
   * Helper to check ownership of event.
   */
  private static async verifyEventOwnership(eventId: string, requestUser: { id: string; role: UserRole }): Promise<any> {
    if (requestUser.role === ROLES.ADMIN) return true;
    if (requestUser.role !== ROLES.ORGANIZER) {
      throw new Error('FORBIDDEN: Only event organizers or administrators can generate certificates');
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
   * Generates an individual certificate for a participant.
   */
  static async generateCertificate(
    eventId: string,
    data: {
      recipientId: string;
      certificateType: 'Participation' | 'Merit' | 'Appreciation' | 'Organizer';
    },
    requestUser: { id: string; role: UserRole }
  ): Promise<any> {
    const event = await this.verifyEventOwnership(eventId, requestUser);

    if (isDbConnected()) {
      const ev = await Event.findById(eventId);
      if (ev && ev.status === 'Cancelled') {
        throw new Error('CERTIFICATE_NOT_ELIGIBLE: Cannot issue certificates for cancelled events');
      }

      // Check recipient user exists
      const user = await User.findById(data.recipientId);
      if (!user) throw new Error('USER_NOT_FOUND: Recipient does not exist');

      // Check registration
      const reg = await Registration.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        studentId: new mongoose.Types.ObjectId(data.recipientId),
      });

      if (data.certificateType === 'Participation' && (!reg || reg.status !== 'Confirmed')) {
        throw new Error('CERTIFICATE_NOT_ELIGIBLE: Student was not registered or confirmed for this event');
      }

      // Check for duplicate certificate
      const existing = await Certificate.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        recipientId: new mongoose.Types.ObjectId(data.recipientId),
        certificateType: data.certificateType,
      });

      if (existing) {
        throw new Error('CERTIFICATE_ALREADY_EXISTS: Certificate of this type already issued to participant for this event');
      }

      const certificateId = this.generateCertificateId();
      const verificationHash = this.generateVerificationHash(
        certificateId,
        data.recipientId,
        eventId,
        data.certificateType
      );

      const cert = await Certificate.create({
        certificateId,
        eventId: new mongoose.Types.ObjectId(eventId),
        recipientId: new mongoose.Types.ObjectId(data.recipientId),
        recipientName: user.name,
        certificateType: data.certificateType,
        issueDate: new Date(),
        verificationHash,
      });

      // Dispatch notification
      await NotificationService.sendNotification({
        userId: data.recipientId,
        title: `Certificate Issued: ${ev ? ev.title : 'Event'}`,
        message: `Your ${data.certificateType} Certificate (ID: ${certificateId}) is now available in your Student Dashboard.`,
        type: 'System',
        linkUrl: `/dashboard/certificates`,
      });

      await AuditLogService.log({
        actorId: requestUser.id,
        actorRole: requestUser.role,
        action: 'CERTIFICATE_ISSUED',
        resourceType: 'Certificate',
        resourceId: cert._id.toString(),
        eventId,
        metadata: { recipientId: data.recipientId, certificateType: data.certificateType, certificateId },
      });

      return cert;
    } else {
      const ev = memoryEvents.get(eventId);
      if (ev && ev.status === 'Cancelled') {
        throw new Error('CERTIFICATE_NOT_ELIGIBLE: Cannot issue certificates for cancelled events');
      }

      const user = memoryStore.users.get(data.recipientId);
      if (!user) throw new Error('USER_NOT_FOUND: Recipient does not exist');

      const reg = Array.from(memoryRegistrations.values()).find(
        (r) => r.eventId === eventId && r.studentId === data.recipientId
      );

      if (data.certificateType === 'Participation' && (!reg || reg.status !== 'Confirmed')) {
        throw new Error('CERTIFICATE_NOT_ELIGIBLE: Student was not registered for this event');
      }

      // Check duplicate in memory
      const existing = Array.from(memoryCertificates.values()).find(
        (c) => c.eventId === eventId && c.recipientId === data.recipientId && c.certificateType === data.certificateType
      );

      if (existing) {
        throw new Error('CERTIFICATE_ALREADY_EXISTS: Certificate already issued');
      }

      const certificateId = this.generateCertificateId();
      const verificationHash = this.generateVerificationHash(
        certificateId,
        data.recipientId,
        eventId,
        data.certificateType
      );

      const id = new mongoose.Types.ObjectId().toString();
      const cert: MemoryCertificate = {
        _id: id,
        certificateId,
        eventId,
        recipientId: data.recipientId,
        recipientName: user.name,
        certificateType: data.certificateType,
        issueDate: new Date(),
        verificationHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memoryCertificates.set(id, cert);

      NotificationService.sendNotification({
        userId: data.recipientId,
        title: `Certificate Issued: ${ev ? ev.title : 'Event'}`,
        message: `Your ${data.certificateType} Certificate (ID: ${certificateId}) is ready.`,
        type: 'System',
        linkUrl: `/dashboard/certificates`,
      });

      return cert;
    }
  }

  /**
   * Bulk generate certificates for all attended participants in an event.
   */
  static async bulkGenerateCertificates(
    eventId: string,
    certificateType: 'Participation' | 'Merit' | 'Appreciation',
    requestUser: { id: string; role: UserRole }
  ): Promise<{ generatedCount: number }> {
    await this.verifyEventOwnership(eventId, requestUser);

    if (isDbConnected()) {
      const regs = await Registration.find({
        eventId: new mongoose.Types.ObjectId(eventId),
        status: 'Confirmed',
      }).populate('studentId', 'name');

      let count = 0;
      for (const reg of regs) {
        const studentId = (reg.studentId as any)?._id?.toString() || reg.studentId.toString();
        const studentName = (reg.studentId as any)?.name || 'Participant';

        const existing = await Certificate.findOne({
          eventId: new mongoose.Types.ObjectId(eventId),
          recipientId: new mongoose.Types.ObjectId(studentId),
          certificateType,
        });

        if (!existing) {
          const certificateId = this.generateCertificateId();
          const verificationHash = this.generateVerificationHash(certificateId, studentId, eventId, certificateType);

          await Certificate.create({
            certificateId,
            eventId: new mongoose.Types.ObjectId(eventId),
            recipientId: new mongoose.Types.ObjectId(studentId),
            recipientName: studentName,
            certificateType,
            issueDate: new Date(),
            verificationHash,
          });

          await NotificationService.sendNotification({
            userId: studentId,
            title: `Certificate Issued`,
            message: `Your ${certificateType} Certificate (${certificateId}) is ready in your portal.`,
            type: 'System',
          });

          count++;
        }
      }
      return { generatedCount: count };
    } else {
      const regs = Array.from(memoryRegistrations.values()).filter((r) => r.eventId === eventId && r.status === 'Confirmed');

      let count = 0;
      for (const reg of regs) {
        const user = memoryStore.users.get(reg.studentId);
        const studentName = user?.name || 'Participant';

        const existing = Array.from(memoryCertificates.values()).find(
          (c) => c.eventId === eventId && c.recipientId === reg.studentId && c.certificateType === certificateType
        );

        if (!existing) {
          const certificateId = this.generateCertificateId();
          const verificationHash = this.generateVerificationHash(certificateId, reg.studentId, eventId, certificateType);
          const id = new mongoose.Types.ObjectId().toString();

          memoryCertificates.set(id, {
            _id: id,
            certificateId,
            eventId,
            recipientId: reg.studentId,
            recipientName: studentName,
            certificateType,
            issueDate: new Date(),
            verificationHash,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          NotificationService.sendNotification({
            userId: reg.studentId,
            title: `Certificate Issued`,
            message: `Your ${certificateType} Certificate (${certificateId}) is ready.`,
            type: 'System',
          });

          count++;
        }
      }
      return { generatedCount: count };
    }
  }

  /**
   * Public safe certificate verification.
   * Returns ONLY public verification data without sensitive details.
   */
  static async verifyCertificate(certificateId: string): Promise<any> {
    const cleanId = certificateId.trim().toUpperCase();

    if (isDbConnected()) {
      const cert = await Certificate.findOne({ certificateId: cleanId }).populate('eventId', 'title startDateTime endDateTime');
      if (!cert) {
        throw new Error('CERTIFICATE_NOT_FOUND: No authentic certificate found matching this verification code');
      }

      return {
        valid: true,
        certificateId: cert.certificateId,
        recipientName: cert.recipientName,
        eventName: (cert.eventId as any)?.title || 'CampusPulse Event',
        certificateType: cert.certificateType,
        issueDate: cert.issueDate,
        verificationHash: cert.verificationHash,
        verifiedAt: new Date().toISOString(),
      };
    } else {
      const cert = Array.from(memoryCertificates.values()).find((c) => c.certificateId.toUpperCase() === cleanId);
      if (!cert) {
        throw new Error('CERTIFICATE_NOT_FOUND: No authentic certificate found matching this verification code');
      }

      const ev = memoryEvents.get(cert.eventId);
      return {
        valid: true,
        certificateId: cert.certificateId,
        recipientName: cert.recipientName,
        eventName: ev ? ev.title : 'CampusPulse Event',
        certificateType: cert.certificateType,
        issueDate: cert.issueDate,
        verificationHash: cert.verificationHash,
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Retrieves all certificates for an authenticated student (IDOR Protected).
   */
  static async getStudentCertificates(studentId: string): Promise<any[]> {
    if (isDbConnected()) {
      return await Certificate.find({ recipientId: new mongoose.Types.ObjectId(studentId) })
        .populate('eventId', 'title eventCode startDateTime endDateTime')
        .sort({ issueDate: -1 });
    } else {
      return Array.from(memoryCertificates.values())
        .filter((c) => c.recipientId === studentId)
        .map((c) => {
          const ev = memoryEvents.get(c.eventId);
          return {
            ...c,
            id: c._id,
            eventId: ev ? { id: ev._id, title: ev.title, eventCode: ev.eventCode, startDateTime: ev.startDateTime } : c.eventId,
          };
        })
        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    }
  }

  /**
   * Retrieves all certificates for an event (Organizer/Admin only).
   */
  static async getEventCertificates(eventId: string, requestUser: { id: string; role: UserRole }): Promise<any[]> {
    await this.verifyEventOwnership(eventId, requestUser);

    if (isDbConnected()) {
      return await Certificate.find({ eventId: new mongoose.Types.ObjectId(eventId) })
        .populate('recipientId', 'name email profileInfo')
        .sort({ issueDate: -1 });
    } else {
      return Array.from(memoryCertificates.values())
        .filter((c) => c.eventId === eventId)
        .map((c) => {
          const user = memoryStore.users.get(c.recipientId);
          return {
            ...c,
            id: c._id,
            recipientId: user ? { id: user._id, name: user.name, email: user.email } : c.recipientId,
          };
        })
        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    }
  }
}

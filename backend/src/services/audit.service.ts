import mongoose from 'mongoose';
import { AuditLog, IAuditLog } from '../models/AuditLog.js';
import { ROLES, UserRole } from '../constants/roles.js';
import { isDbConnected } from '../config/db.js';
import { memoryAuditLogs, memoryEvents, MemoryAuditLog } from './venue.service.js';
import { memoryStore } from './auth.service.js';

export interface AuditEventData {
  actorId?: string;
  actorRole?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  eventId?: string;
  success?: boolean;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogQueryParams {
  actorId?: string;
  action?: string;
  resourceType?: string;
  eventId?: string;
  success?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class AuditLogService {
  /**
   * Sanitizes metadata to strictly strip any sensitive keys.
   */
  private static sanitizeMetadata(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data || typeof data !== 'object') return undefined;

    const sensitiveKeyPattern = /password|hash|token|secret|authorization|cookie|key/i;
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeyPattern.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeMetadata(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Records an immutable audit log entry.
   * Resilient: Does not crash calling operations if an audit write encounters an issue.
   */
  static async log(event: AuditEventData): Promise<void> {
    try {
      const sanitizedMeta = this.sanitizeMetadata(event.metadata);
      const isSuccess = event.success !== undefined ? Boolean(event.success) : true;

      if (isDbConnected()) {
        await AuditLog.create({
          actorId: event.actorId && mongoose.Types.ObjectId.isValid(event.actorId)
            ? new mongoose.Types.ObjectId(event.actorId)
            : undefined,
          actorRole: event.actorRole,
          action: event.action.trim(),
          resourceType: event.resourceType?.trim(),
          resourceId: event.resourceId?.trim(),
          eventId: event.eventId && mongoose.Types.ObjectId.isValid(event.eventId)
            ? new mongoose.Types.ObjectId(event.eventId)
            : undefined,
          success: isSuccess,
          metadata: sanitizedMeta,
          ipAddress: event.ipAddress?.trim(),
          userAgent: event.userAgent?.trim(),
        });
      } else {
        const id = new mongoose.Types.ObjectId().toString();
        const entry: MemoryAuditLog = {
          _id: id,
          actorId: event.actorId,
          actorRole: event.actorRole,
          action: event.action.trim(),
          resourceType: event.resourceType?.trim(),
          resourceId: event.resourceId?.trim(),
          eventId: event.eventId,
          success: isSuccess,
          metadata: sanitizedMeta,
          ipAddress: event.ipAddress?.trim(),
          userAgent: event.userAgent?.trim(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryAuditLogs.set(id, entry);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[CampusPulse AuditLog] Notice: could not record audit log: ${msg}`);
    }
  }

  /**
   * Retrieves paginated audit logs.
   * Access Control: Strictly ADMIN ONLY.
   */
  static async getAuditLogs(
    query: AuditLogQueryParams,
    requestUser: { id: string; role: UserRole }
  ): Promise<{
    logs: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    if (requestUser.role !== ROLES.ADMIN) {
      throw new Error('FORBIDDEN: Only administrators can access system audit logs');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    if (isDbConnected()) {
      const filter: any = {};

      if (query.actorId && mongoose.Types.ObjectId.isValid(query.actorId)) {
        filter.actorId = new mongoose.Types.ObjectId(query.actorId);
      }
      if (query.action) {
        filter.action = query.action.trim();
      }
      if (query.resourceType) {
        filter.resourceType = query.resourceType.trim();
      }
      if (query.eventId && mongoose.Types.ObjectId.isValid(query.eventId)) {
        filter.eventId = new mongoose.Types.ObjectId(query.eventId);
      }
      if (query.success !== undefined) {
        filter.success = String(query.success) === 'true';
      }
      if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate && !isNaN(new Date(query.startDate).getTime())) {
          filter.createdAt.$gte = new Date(query.startDate);
        }
        if (query.endDate && !isNaN(new Date(query.endDate).getTime())) {
          filter.createdAt.$lte = new Date(query.endDate);
        }
      }

      const [total, docs] = await Promise.all([
        AuditLog.countDocuments(filter),
        AuditLog.find(filter)
          .populate('actorId', 'name email role')
          .populate('eventId', 'title eventCode')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
      ]);

      return {
        logs: docs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    } else {
      let entries = Array.from(memoryAuditLogs.values());

      if (query.actorId) {
        entries = entries.filter((e) => e.actorId === query.actorId);
      }
      if (query.action) {
        entries = entries.filter((e) => e.action.toLowerCase() === query.action?.toLowerCase().trim());
      }
      if (query.resourceType) {
        entries = entries.filter((e) => e.resourceType?.toLowerCase() === query.resourceType?.toLowerCase().trim());
      }
      if (query.eventId) {
        entries = entries.filter((e) => e.eventId === query.eventId);
      }
      if (query.success !== undefined) {
        const boolVal = String(query.success) === 'true';
        entries = entries.filter((e) => e.success === boolVal);
      }

      entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = entries.length;
      const paginated = entries.slice(skip, skip + limit).map((e) => {
        const actor = e.actorId ? memoryStore.users.get(e.actorId) : null;
        const ev = e.eventId ? memoryEvents.get(e.eventId) : null;
        return {
          ...e,
          id: e._id,
          actorId: actor ? { id: actor._id, name: actor.name, email: actor.email, role: actor.role } : e.actorId,
          eventId: ev ? { id: ev._id, title: ev.title, eventCode: ev.eventCode } : e.eventId,
        };
      });

      return {
        logs: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }
  }
}

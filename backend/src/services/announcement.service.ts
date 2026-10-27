import mongoose from 'mongoose';
import { Announcement, IAnnouncement } from '../models/Announcement.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { ROLES, UserRole } from '../constants/roles.js';
import { isDbConnected } from '../config/db.js';
import { memoryAnnouncements, memoryEvents, memoryRegistrations, MemoryAnnouncement } from './venue.service.js';
import { AuditLogService } from './audit.service.js';
import { NotificationService } from './notification.service.js';
import { memoryStore } from './auth.service.js';

export class AnnouncementService {
  /**
   * Creates a new announcement for an event or globally.
   */
  static async createAnnouncement(
    data: {
      eventId?: string;
      title: string;
      content: string;
      priority?: 'Normal' | 'High' | 'Urgent';
      isPinned?: boolean;
    },
    requestUser: { id: string; role: UserRole }
  ): Promise<any> {
    if (requestUser.role !== ROLES.ADMIN && requestUser.role !== ROLES.ORGANIZER) {
      throw new Error('FORBIDDEN: Only organizers or administrators can create announcements');
    }

    if (data.eventId) {
      if (isDbConnected()) {
        const event = await Event.findById(data.eventId);
        if (!event) throw new Error('EVENT_NOT_FOUND');
        if (requestUser.role === ROLES.ORGANIZER && event.organizerId.toString() !== requestUser.id) {
          throw new Error('UNAUTHORIZED_EVENT_ACCESS: You can only create announcements for your own events');
        }
      } else {
        const event = memoryEvents.get(data.eventId);
        if (!event) throw new Error('EVENT_NOT_FOUND');
        if (requestUser.role === ROLES.ORGANIZER && event.organizerId !== requestUser.id) {
          throw new Error('UNAUTHORIZED_EVENT_ACCESS: You can only create announcements for your own events');
        }
      }
    } else if (requestUser.role !== ROLES.ADMIN) {
      throw new Error('FORBIDDEN: Global announcements can only be created by administrators');
    }

    if (!data.title || data.title.trim().length < 3) {
      throw new Error('INVALID_TITLE: Title must be at least 3 characters');
    }
    if (!data.content || data.content.trim().length < 5) {
      throw new Error('INVALID_CONTENT: Content must be at least 5 characters');
    }

    let announcement: any;
    if (isDbConnected()) {
      announcement = await Announcement.create({
        eventId: data.eventId ? new mongoose.Types.ObjectId(data.eventId) : undefined,
        authorId: new mongoose.Types.ObjectId(requestUser.id),
        title: data.title.trim(),
        content: data.content.trim(),
        priority: data.priority || 'Normal',
        isPinned: Boolean(data.isPinned),
        publishedAt: new Date(),
      });
    } else {
      const id = new mongoose.Types.ObjectId().toString();
      announcement = {
        _id: id,
        eventId: data.eventId,
        authorId: requestUser.id,
        title: data.title.trim(),
        content: data.content.trim(),
        priority: data.priority || 'Normal',
        isPinned: Boolean(data.isPinned),
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryAnnouncements.set(id, announcement);
    }

    // Trigger notification to registered participants if event-specific
    if (data.eventId) {
      try {
        let recipientIds: string[] = [];
        if (isDbConnected()) {
          const regs = await Registration.find({
            eventId: new mongoose.Types.ObjectId(data.eventId),
            status: 'Confirmed',
          }).select('studentId');
          recipientIds = regs.map((r) => r.studentId.toString());
        } else {
          recipientIds = Array.from(memoryRegistrations.values())
            .filter((r) => r.eventId === data.eventId && r.status === 'Confirmed')
            .map((r) => r.studentId);
        }

        if (recipientIds.length > 0) {
          await NotificationService.broadcastNotification(recipientIds, {
            title: `New Announcement: ${data.title.trim()}`,
            message: data.content.trim().substring(0, 100) + '...',
            type: 'EventUpdate',
            linkUrl: `/events/${data.eventId}`,
          });
        }
      } catch (err) {
        console.error('Failed to dispatch announcement notifications:', err);
      }
    }

    await AuditLogService.log({
      actorId: requestUser.id,
      actorRole: requestUser.role,
      action: 'ANNOUNCEMENT_CREATED',
      resourceType: 'Announcement',
      resourceId: announcement._id ? announcement._id.toString() : announcement.id,
      eventId: data.eventId,
      metadata: { title: announcement.title, priority: announcement.priority },
    });

    return announcement;
  }

  /**
   * Retrieves announcements with filtering and RBAC.
   */
  static async getAnnouncements(eventId?: string): Promise<any[]> {
    if (isDbConnected()) {
      const query: any = {};
      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        query.$or = [{ eventId: new mongoose.Types.ObjectId(eventId) }, { eventId: { $exists: false } }, { eventId: null }];
      }
      return await Announcement.find(query)
        .populate('authorId', 'name email role')
        .populate('eventId', 'title')
        .sort({ isPinned: -1, publishedAt: -1 });
    } else {
      let list = Array.from(memoryAnnouncements.values());
      if (eventId) {
        list = list.filter((a) => !a.eventId || a.eventId === eventId);
      }
      return list
        .map((a) => {
          const author = memoryStore.users.get(a.authorId);
          const event = a.eventId ? memoryEvents.get(a.eventId) : null;
          return {
            ...a,
            id: a._id,
            authorId: author ? { id: author._id, name: author.name, role: author.role } : a.authorId,
            eventId: event ? { id: event._id, title: event.title } : a.eventId,
          };
        })
        .sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });
    }
  }

  /**
   * Updates an announcement with strict ownership validation.
   */
  static async updateAnnouncement(
    id: string,
    data: {
      title?: string;
      content?: string;
      priority?: 'Normal' | 'High' | 'Urgent';
      isPinned?: boolean;
    },
    requestUser: { id: string; role: UserRole }
  ): Promise<any> {
    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('ANNOUNCEMENT_NOT_FOUND');
      const announcement = await Announcement.findById(id);
      if (!announcement) throw new Error('ANNOUNCEMENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && announcement.authorId.toString() !== requestUser.id) {
        throw new Error('UNAUTHORIZED_ANNOUNCEMENT_ACCESS: You cannot edit another user\'s announcement');
      }

      if (data.title) announcement.title = data.title.trim();
      if (data.content) announcement.content = data.content.trim();
      if (data.priority) announcement.priority = data.priority;
      if (data.isPinned !== undefined) announcement.isPinned = data.isPinned;

      await announcement.save();
      return announcement;
    } else {
      const announcement = memoryAnnouncements.get(id);
      if (!announcement) throw new Error('ANNOUNCEMENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && announcement.authorId !== requestUser.id) {
        throw new Error('UNAUTHORIZED_ANNOUNCEMENT_ACCESS: You cannot edit another user\'s announcement');
      }

      if (data.title) announcement.title = data.title.trim();
      if (data.content) announcement.content = data.content.trim();
      if (data.priority) announcement.priority = data.priority;
      if (data.isPinned !== undefined) announcement.isPinned = data.isPinned;
      announcement.updatedAt = new Date();

      return announcement;
    }
  }

  /**
   * Deletes an announcement with strict ownership validation.
   */
  static async deleteAnnouncement(id: string, requestUser: { id: string; role: UserRole }): Promise<boolean> {
    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('ANNOUNCEMENT_NOT_FOUND');
      const announcement = await Announcement.findById(id);
      if (!announcement) throw new Error('ANNOUNCEMENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && announcement.authorId.toString() !== requestUser.id) {
        throw new Error('UNAUTHORIZED_ANNOUNCEMENT_ACCESS: You cannot delete another user\'s announcement');
      }

      await Announcement.deleteOne({ _id: announcement._id });
      return true;
    } else {
      const announcement = memoryAnnouncements.get(id);
      if (!announcement) throw new Error('ANNOUNCEMENT_NOT_FOUND');

      if (requestUser.role !== ROLES.ADMIN && announcement.authorId !== requestUser.id) {
        throw new Error('UNAUTHORIZED_ANNOUNCEMENT_ACCESS: You cannot delete another user\'s announcement');
      }

      memoryAnnouncements.delete(id);
      return true;
    }
  }
}

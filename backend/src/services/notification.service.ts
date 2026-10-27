import mongoose from 'mongoose';
import { Notification, INotification } from '../models/Notification.js';
import { isDbConnected } from '../config/db.js';
import { memoryNotifications, MemoryNotification } from './venue.service.js';

export class NotificationService {
  /**
   * Dispatches an in-app notification to a specific user.
   */
  static async sendNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: 'EventUpdate' | 'Registration' | 'ScheduleChange' | 'ResultPublished' | 'System';
    linkUrl?: string;
  }): Promise<any> {
    if (isDbConnected()) {
      const notif = await Notification.create({
        userId: new mongoose.Types.ObjectId(data.userId),
        title: data.title.trim(),
        message: data.message.trim(),
        type: data.type,
        linkUrl: data.linkUrl?.trim(),
        isRead: false,
      });
      return notif;
    } else {
      const id = new mongoose.Types.ObjectId().toString();
      const notif: MemoryNotification = {
        _id: id,
        userId: data.userId,
        title: data.title.trim(),
        message: data.message.trim(),
        type: data.type,
        linkUrl: data.linkUrl?.trim(),
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryNotifications.set(id, notif);
      return notif;
    }
  }

  /**
   * Broadcast notification to multiple users.
   */
  static async broadcastNotification(
    userIds: string[],
    data: {
      title: string;
      message: string;
      type: 'EventUpdate' | 'Registration' | 'ScheduleChange' | 'ResultPublished' | 'System';
      linkUrl?: string;
    }
  ): Promise<void> {
    for (const uId of userIds) {
      await this.sendNotification({ ...data, userId: uId });
    }
  }

  /**
   * Retrieves notifications for the authenticated user only (IDOR Protected).
   */
  static async getUserNotifications(userId: string): Promise<any[]> {
    if (isDbConnected()) {
      const notifs = await Notification.find({
        userId: new mongoose.Types.ObjectId(userId),
      })
        .sort({ createdAt: -1 })
        .limit(50);
      return notifs;
    } else {
      return Array.from(memoryNotifications.values())
        .filter((n) => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);
    }
  }

  /**
   * Marks a notification as read (Strictly verified against owner ID).
   */
  static async markAsRead(notificationId: string, userId: string): Promise<any> {
    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        throw new Error('NOTIFICATION_NOT_FOUND');
      }

      const notif = await Notification.findById(notificationId);
      if (!notif) {
        throw new Error('NOTIFICATION_NOT_FOUND');
      }

      if (notif.userId.toString() !== userId) {
        throw new Error('UNAUTHORIZED_NOTIFICATION_ACCESS: You cannot modify another user\'s notification');
      }

      notif.isRead = true;
      await notif.save();
      return notif;
    } else {
      const notif = memoryNotifications.get(notificationId);
      if (!notif) {
        throw new Error('NOTIFICATION_NOT_FOUND');
      }

      if (notif.userId !== userId) {
        throw new Error('UNAUTHORIZED_NOTIFICATION_ACCESS: You cannot modify another user\'s notification');
      }

      notif.isRead = true;
      notif.updatedAt = new Date();
      return notif;
    }
  }

  /**
   * Marks all notifications as read for the authenticated user.
   */
  static async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    if (isDbConnected()) {
      const res = await Notification.updateMany(
        { userId: new mongoose.Types.ObjectId(userId), isRead: false },
        { $set: { isRead: true } }
      );
      return { updatedCount: res.modifiedCount };
    } else {
      let count = 0;
      for (const notif of memoryNotifications.values()) {
        if (notif.userId === userId && !notif.isRead) {
          notif.isRead = true;
          notif.updatedAt = new Date();
          count++;
        }
      }
      return { updatedCount: count };
    }
  }

  /**
   * Deletes a notification (Strictly verified against owner ID).
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        throw new Error('NOTIFICATION_NOT_FOUND');
      }

      const notif = await Notification.findById(notificationId);
      if (!notif) {
        throw new Error('NOTIFICATION_NOT_FOUND');
      }

      if (notif.userId.toString() !== userId) {
        throw new Error('UNAUTHORIZED_NOTIFICATION_ACCESS');
      }

      await Notification.deleteOne({ _id: notif._id });
      return true;
    } else {
      const notif = memoryNotifications.get(notificationId);
      if (!notif) {
        throw new Error('NOTIFICATION_NOT_FOUND');
      }

      if (notif.userId !== userId) {
        throw new Error('UNAUTHORIZED_NOTIFICATION_ACCESS');
      }

      memoryNotifications.delete(notificationId);
      return true;
    }
  }
}

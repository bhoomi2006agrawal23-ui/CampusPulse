import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import healthRoutes from './health.routes.js';
import eventRoutes from './event.routes.js';
import registrationRoutes from './registration.routes.js';
import schedulesRoutes from './schedules.routes.js';
import volunteerRoutes from './volunteer.routes.js';
import judgeRoutes from './judge.routes.js';
import resultRoutes from './result.routes.js';
import certificateRoutes from './certificate.routes.js';
import announcementRoutes from './announcement.routes.js';
import notificationRoutes from './notification.routes.js';
import reportRoutes from './report.routes.js';
import auditRoutes from './audit.routes.js';
import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { Venue } from '../models/Venue.js';
import { isDbConnected } from '../config/db.js';
import { SEED_CATEGORIES, SEED_VENUES } from '../services/seed.service.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

// Core Phase 2, Phase 3, Phase 4 & Phase 5 Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/health', healthRoutes);
router.use('/events', eventRoutes);
router.use('/registrations', registrationRoutes);
router.use('/schedules', schedulesRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/judges', judgeRoutes);
router.use('/results', resultRoutes);
router.use('/certificates', certificateRoutes);
router.use('/announcements', announcementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditRoutes);

// Public Category Directory
router.get('/categories', async (_req: Request, res: Response) => {
  if (isDbConnected()) {
    const categories = await Category.find({ isActive: true });
    sendSuccess(res, { categories });
  } else {
    sendSuccess(res, { categories: SEED_CATEGORIES });
  }
});

// Public Venue Directory (with optional collegeName filter and creation)
router.get('/venues', async (req: Request, res: Response) => {
  const collegeName = req.query.collegeName as string | undefined;
  if (isDbConnected()) {
    const query: any = { isActive: true };
    if (collegeName && collegeName.trim()) {
      query.collegeName = { $regex: new RegExp(`^${collegeName.trim()}$`, 'i') };
    }
    const venues = await Venue.find(query);
    sendSuccess(res, { venues });
  } else {
    let venues = SEED_VENUES as any[];
    if (collegeName && collegeName.trim()) {
      venues = venues.filter(v => (v.collegeName || 'CampusPulse Institute of Technology').toLowerCase() === collegeName.trim().toLowerCase());
    }
    sendSuccess(res, { venues });
  }
});

// Add New Venue endpoint for organizers
router.post('/venues', async (req: Request, res: Response) => {
  try {
    const { name, collegeName, building, capacity, amenities, contactPerson } = req.body;
    if (!name || !collegeName || !building || !capacity) {
      res.status(400).json({ success: false, error: { message: 'Name, collegeName, building, and capacity are required' } });
      return;
    }

    if (isDbConnected()) {
      const newVenue = await Venue.create({
        name: name.trim(),
        collegeName: collegeName.trim(),
        building: building.trim(),
        capacity: Number(capacity),
        amenities: amenities || [],
        contactPerson: contactPerson?.trim(),
        isActive: true,
      });
      sendSuccess(res, { venue: newVenue }, 201, 'Venue created successfully');
    } else {
      const id = new mongoose.Types.ObjectId().toString();
      const newVenue = {
        _id: id,
        id,
        name: name.trim(),
        collegeName: collegeName.trim(),
        building: building.trim(),
        capacity: Number(capacity),
        amenities: amenities || [],
        contactPerson: contactPerson?.trim(),
        isActive: true,
      };
      SEED_VENUES.push(newVenue as any);
      sendSuccess(res, { venue: newVenue }, 201, 'Venue created successfully');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: { message: msg } });
  }
});

export default router;

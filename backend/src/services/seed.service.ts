import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Venue } from '../models/Venue.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { Schedule } from '../models/Schedule.js';
import { Volunteer } from '../models/Volunteer.js';
import { Judge } from '../models/Judge.js';
import { Result } from '../models/Result.js';
import { Certificate } from '../models/Certificate.js';
import { Announcement } from '../models/Announcement.js';
import { Notification } from '../models/Notification.js';
import { Report } from '../models/Report.js';
import { ROLES, UserRole } from '../constants/roles.js';
import { hashPassword } from '../utils/crypto.js';
import { isDbConnected } from '../config/db.js';
import { memoryStore } from './auth.service.js';
import {
  memoryEvents,
  memoryRegistrations,
  memorySchedules,
  memoryVolunteers,
  memoryJudges,
  memoryResults,
  memoryCertificates,
  memoryAnnouncements,
  memoryNotifications,
  memoryReports,
} from './venue.service.js';

export const SEED_USERS = [
  {
    id: '6ac25fb6e90fec98e2f56761',
    name: 'Eleanor Vance (Admin)',
    email: 'admin@campuspulse.edu',
    password: 'Password123!',
    role: ROLES.ADMIN as UserRole,
    collegeName: 'CampusPulse Institute of Technology',
    bio: 'CampusPulse Lead Administrator & Dean of Student Activities',
    phoneNumber: '+1-555-0100',
    profileInfo: { department: 'Administration', studentId: 'ADM-001', year: 2026, collegeName: 'CampusPulse Institute of Technology' },
  },
  {
    id: '6ac25fb6e90fec98e2f56762',
    name: 'Marcus Brody (Organizer)',
    email: 'organizer@campuspulse.edu',
    password: 'Password123!',
    role: ROLES.ORGANIZER as UserRole,
    collegeName: 'CampusPulse Institute of Technology',
    bio: 'Faculty Coordinator for ACM Student Chapter & Tech Fests',
    phoneNumber: '+1-555-0101',
    profileInfo: { department: 'Computer Science', studentId: 'ORG-102', year: 2026, collegeName: 'CampusPulse Institute of Technology' },
  },
  {
    id: '6ac25fb6e90fec98e2f56763',
    name: 'Dr. Sarah Lin (Judge)',
    email: 'judge@campuspulse.edu',
    password: 'Password123!',
    role: ROLES.JUDGE as UserRole,
    collegeName: 'CampusPulse Institute of Technology',
    bio: 'Senior Research Fellow in AI & Robotics; Hackathon Judge',
    phoneNumber: '+1-555-0102',
    profileInfo: { department: 'Robotics & AI', studentId: 'JDG-204', year: 2026, collegeName: 'CampusPulse Institute of Technology' },
  },
  {
    id: '6ac25fb6e90fec98e2f56764',
    name: 'Liam Chen (Volunteer)',
    email: 'volunteer@campuspulse.edu',
    password: 'Password123!',
    role: ROLES.VOLUNTEER as UserRole,
    collegeName: 'CampusPulse Institute of Technology',
    bio: 'Student Council Volunteer Lead & Event Desk Coordinator',
    phoneNumber: '+1-555-0103',
    profileInfo: { department: 'Information Systems', studentId: 'VOL-305', year: 2027, collegeName: 'CampusPulse Institute of Technology' },
  },
  {
    id: '6ac25fb6e90fec98e2f56765',
    name: 'Maya Patel (Student)',
    email: 'student@campuspulse.edu',
    password: 'Password123!',
    role: ROLES.STUDENT as UserRole,
    collegeName: 'CampusPulse Institute of Technology',
    bio: 'Junior CS Major enthusiastic about algorithmic challenges',
    phoneNumber: '+1-555-0104',
    profileInfo: { department: 'Computer Science', studentId: 'STU-408', year: 2027, collegeName: 'CampusPulse Institute of Technology' },
  },
];

export const SEED_CATEGORIES = [
  {
    id: '6ac25fa6e90fec98e2f56701',
    name: 'Hackathons & Coding',
    slug: 'hackathons',
    description: 'Competitive programming, software development sprints, and open-source challenges.',
    colorCode: '#B97868',
    iconName: 'Code2',
  },
  {
    id: '6ac25fa6e90fec98e2f56702',
    name: 'Workshops & Seminars',
    slug: 'workshops',
    description: 'Hands-on technical deep dives, industry lectures, and career masterclasses.',
    colorCode: '#6F8B73',
    iconName: 'BookOpen',
  },
  {
    id: '6ac25fa6e90fec98e2f56703',
    name: 'Cultural & Arts',
    slug: 'cultural',
    description: 'Musical performances, dance showcases, theater fests, and digital media exhibitions.',
    colorCode: '#B78A52',
    iconName: 'Palette',
  },
  {
    id: '6ac25fa6e90fec98e2f56704',
    name: 'Sports & Gaming',
    slug: 'sports',
    description: 'Inter-department athletics tournaments, esports invitationals, and team sports.',
    colorCode: '#8F5E52',
    iconName: 'Trophy',
  },
];

export const SEED_VENUES = [
  {
    id: '6ac25fa6e90fec98e2f56711',
    name: 'Main Campus Auditorium',
    collegeName: 'CampusPulse Institute of Technology',
    building: 'Dr. A.P.J. Abdul Kalam Academic Block',
    capacity: 650,
    amenities: ['Dolby Surround Audio', 'Dual 4K Projectors', 'Central Air Conditioning', 'Green Rooms'],
    contactPerson: 'Campus Operations Desk (+1-555-0199)',
  },
  {
    id: '6ac25fa6e90fec98e2f56712',
    name: 'Turing Computer Lab 3',
    collegeName: 'CampusPulse Institute of Technology',
    building: 'Turing Hall of Engineering',
    capacity: 120,
    amenities: ['120 Workstations (Ubuntu/Windows)', 'Gigabit Fiber Uplink', 'Interactive Smartboard'],
    contactPerson: 'Prof. Marcus Brody',
  },
  {
    id: '6ac25fa6e90fec98e2f56713',
    name: 'Open Air Amphitheatre',
    collegeName: 'CampusPulse Institute of Technology',
    building: 'Central Green Quadrangle',
    capacity: 1200,
    amenities: ['Tiered Stone Seating', 'Stage Lighting Rig', 'Outdoor Acoustic Baffles'],
    contactPerson: 'Student Affairs Office',
  },
];

export const SEED_EVENTS = [
  {
    id: '6ac25fa6e90fec98e2f56721',
    title: 'Annual Inter-College Hackathon 2026',
    eventCode: 'CP-2026-HACK',
    slug: 'annual-inter-college-hackathon-2026',
    description: '48 hours of intense hardware & software building with mentorship from leading cloud architects, industry workshops, and cash prizes for top innovators.',
    collegeName: 'CampusPulse Institute of Technology',
    categoryId: '6ac25fa6e90fec98e2f56701',
    organizerId: '6ac25fb6e90fec98e2f56762', // Marcus Brody
    primaryVenueId: '6ac25fa6e90fec98e2f56711', // Main Auditorium
    startDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // +10 days
    endDateTime: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),   // +12 days
    registrationStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // opened 5 days ago
    registrationEnd: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),   // closes in 8 days
    capacity: 200,
    registeredCount: 1,
    status: 'RegistrationOpen',
    eligibility: 'Open to all enrolled undergraduate and graduate students in engineering, design, and sciences.',
    instructions: 'Bring your student ID card, personal laptop, and charging equipment. Hardware kits will be distributed on-site.',
  },
  {
    id: '6ac25fa6e90fec98e2f56722',
    title: 'Distributed Cloud Architecture Masterclass',
    eventCode: 'CP-2026-ARCH',
    slug: 'distributed-cloud-architecture-masterclass',
    description: 'Hands-on seminar covering distributed event streaming, zero-trust architectures, database scalability, and fault-tolerant system design.',
    collegeName: 'CampusPulse Institute of Technology',
    categoryId: '6ac25fa6e90fec98e2f56702',
    organizerId: '6ac25fb6e90fec98e2f56762',
    primaryVenueId: '6ac25fa6e90fec98e2f56712', // Turing Lab 3
    startDateTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    endDateTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    registrationStart: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    registrationEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    capacity: 120,
    registeredCount: 0,
    status: 'RegistrationOpen',
    eligibility: 'Recommended for 2nd, 3rd, and 4th year computer science / IT students.',
    instructions: 'Lab workstations will be pre-configured with Linux and Docker environments.',
  },
  {
    id: '6ac25fa6e90fec98e2f56723',
    title: 'Spring Music & Theater Showcase 2026',
    eventCode: 'CP-2026-FEST',
    slug: 'spring-music-and-theater-showcase-2026',
    description: 'Annual inter-department cultural festival celebrating acoustic performances, drama, contemporary dance, and student art exhibitions.',
    collegeName: 'CampusPulse Institute of Technology',
    categoryId: '6ac25fa6e90fec98e2f56703',
    organizerId: '6ac25fb6e90fec98e2f56762',
    primaryVenueId: '6ac25fa6e90fec98e2f56713', // Amphitheatre
    startDateTime: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    endDateTime: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
    registrationStart: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    registrationEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    capacity: 600,
    registeredCount: 0,
    status: 'Draft',
    eligibility: 'All students and faculty members welcome.',
  },
];

export const SEED_SCHEDULES = [
  {
    id: '6ac25fa6e90fec98e2f56741',
    eventId: '6ac25fa6e90fec98e2f56721',
    title: 'Opening Ceremony & Keynote Address',
    description: 'Welcome address, problem statement release, and team formations.',
    startDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    endDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    venueId: '6ac25fa6e90fec98e2f56711',
    trackName: 'Main Stage Track',
    speakerOrLead: 'Dean Vance & Industry Guests',
  },
  {
    id: '6ac25fa6e90fec98e2f56742',
    eventId: '6ac25fa6e90fec98e2f56721',
    title: 'Distributed System Architecture Workshop',
    description: 'Technical deep dive into event-driven design and container orchestration.',
    startDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    endDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    venueId: '6ac25fa6e90fec98e2f56712',
    trackName: 'Technical Deep Dive',
    speakerOrLead: 'Prof. Marcus Brody',
  },
];

export const SEED_VOLUNTEERS = [
  {
    id: '6ac25fa6e90fec98e2f56751',
    eventId: '6ac25fa6e90fec98e2f56721',
    userId: '6ac25fb6e90fec98e2f56764', // Liam Chen
    assignedRole: 'Registration Desk & Attendee Check-in',
    shiftStart: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    shiftEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
    location: 'Main Auditorium Foyer Gate 1',
    notes: 'Oversee pass verification and student lanyard distribution.',
    isCheckedIn: false,
    status: 'Confirmed' as const,
  },
];

export const SEED_JUDGES = [
  {
    id: '6ac25fa6e90fec98e2f56755',
    eventId: '6ac25fa6e90fec98e2f56721',
    userId: '6ac25fb6e90fec98e2f56763', // Dr. Sarah Lin
    roleDescription: 'Lead Technical Evaluator & AI Architecture Judge',
    assignedAt: new Date(),
    isFinalized: false,
  },
];

export async function seedDevelopmentData(): Promise<void> {
  console.log('[CampusPulse Seed] Initializing development seed dataset...');

  // Always seed in-memory store
  for (const user of SEED_USERS) {
    const passwordHash = await hashPassword(user.password);
    const existing = memoryStore.users.get(user.id);
    if (!existing) {
      memoryStore.users.set(user.id, {
        _id: user.id,
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
        collegeName: user.collegeName,
        phoneNumber: user.phoneNumber,
        bio: user.bio,
        profileInfo: user.profileInfo,
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      existing.collegeName = user.collegeName;
      existing.profileInfo = { ...existing.profileInfo, collegeName: user.collegeName };
    }
  }

  // Seed memory events
  for (const ev of SEED_EVENTS) {
    if (!memoryEvents.has(ev.id)) {
      memoryEvents.set(ev.id, {
        _id: ev.id,
        title: ev.title,
        eventCode: ev.eventCode,
        slug: ev.slug,
        description: ev.description,
        collegeName: ev.collegeName,
        categoryId: ev.categoryId,
        organizerId: ev.organizerId,
        primaryVenueId: ev.primaryVenueId,
        startDateTime: ev.startDateTime,
        endDateTime: ev.endDateTime,
        registrationStart: ev.registrationStart,
        registrationEnd: ev.registrationEnd,
        capacity: ev.capacity,
        registeredCount: ev.registeredCount,
        status: ev.status,
        eligibility: ev.eligibility,
        instructions: ev.instructions,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // Seed sample registration for Maya Patel (Student) in Hackathon
  const sampleRegId = '6ac25fa6e90fec98e2f56731';
  if (!memoryRegistrations.has(sampleRegId)) {
    memoryRegistrations.set(sampleRegId, {
      _id: sampleRegId,
      eventId: '6ac25fa6e90fec98e2f56721',
      studentId: '6ac25fb6e90fec98e2f56765', // Maya Patel
      registrationCode: 'CP-HACK-84920A',
      status: 'Confirmed',
      registeredAt: new Date(),
      attendanceStatus: 'Unmarked',
      notes: 'Team Lead for Algorithmic Solutions',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Seed Phase 4 in-memory schedules, volunteers, judges
  for (const s of SEED_SCHEDULES) {
    if (!memorySchedules.has(s.id)) {
      memorySchedules.set(s.id, {
        _id: s.id,
        eventId: s.eventId,
        title: s.title,
        description: s.description,
        startDateTime: s.startDateTime,
        endDateTime: s.endDateTime,
        venueId: s.venueId,
        trackName: s.trackName,
        speakerOrLead: s.speakerOrLead,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  for (const v of SEED_VOLUNTEERS) {
    if (!memoryVolunteers.has(v.id)) {
      memoryVolunteers.set(v.id, {
        _id: v.id,
        eventId: v.eventId,
        userId: v.userId,
        assignedRole: v.assignedRole,
        shiftStart: v.shiftStart,
        shiftEnd: v.shiftEnd,
        location: v.location,
        notes: v.notes,
        isCheckedIn: v.isCheckedIn,
        status: v.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  for (const j of SEED_JUDGES) {
    if (!memoryJudges.has(j.id)) {
      memoryJudges.set(j.id, {
        _id: j.id,
        eventId: j.eventId,
        userId: j.userId,
        roleDescription: j.roleDescription,
        assignedAt: j.assignedAt,
        isFinalized: j.isFinalized,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // If MongoDB is connected, seed MongoDB collections
  if (isDbConnected()) {
    try {
      for (const u of SEED_USERS) {
        const exists = await User.findOne({ email: u.email });
        if (!exists) {
          const passwordHash = await hashPassword(u.password);
          await User.create({
            _id: new mongoose.Types.ObjectId(u.id),
            name: u.name,
            email: u.email,
            passwordHash,
            role: u.role,
            collegeName: u.collegeName,
            phoneNumber: u.phoneNumber,
            bio: u.bio,
            profileInfo: u.profileInfo,
            status: 'Active',
          });
        } else if (!exists.collegeName) {
          exists.collegeName = u.collegeName;
          if (exists.profileInfo) {
            exists.profileInfo.collegeName = u.collegeName;
          }
          await exists.save();
        }
      }

      for (const cat of SEED_CATEGORIES) {
        const exists = await Category.findOne({ slug: cat.slug });
        if (!exists) {
          await Category.create({
            _id: new mongoose.Types.ObjectId(cat.id),
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            colorCode: cat.colorCode,
            iconName: cat.iconName,
            isActive: true,
          });
        }
      }

      for (const v of SEED_VENUES) {
        const exists = await Venue.findOne({ name: v.name, collegeName: v.collegeName });
        if (!exists) {
          await Venue.create({
            _id: new mongoose.Types.ObjectId(v.id),
            name: v.name,
            collegeName: v.collegeName,
            building: v.building,
            capacity: v.capacity,
            amenities: v.amenities,
            contactPerson: v.contactPerson,
            isActive: true,
          });
        }
      }

      for (const ev of SEED_EVENTS) {
        const exists = await Event.findOne({ eventCode: ev.eventCode });
        if (!exists) {
          await Event.create({
            _id: new mongoose.Types.ObjectId(ev.id),
            title: ev.title,
            eventCode: ev.eventCode,
            slug: ev.slug,
            description: ev.description,
            collegeName: ev.collegeName,
            categoryId: new mongoose.Types.ObjectId(ev.categoryId),
            organizerId: new mongoose.Types.ObjectId(ev.organizerId),
            primaryVenueId: new mongoose.Types.ObjectId(ev.primaryVenueId),
            startDateTime: ev.startDateTime,
            endDateTime: ev.endDateTime,
            registrationStart: ev.registrationStart,
            registrationEnd: ev.registrationEnd,
            capacity: ev.capacity,
            registeredCount: (ev as any).registeredCount || 0,
            status: (ev as any).status || 'Published',
            eligibility: ev.eligibility,
            instructions: ev.instructions,
          });
        }
      }

      const regExists = await Registration.findOne({ registrationCode: 'CP-HACK-84920A' });
      if (!regExists) {
        await Registration.create({
          _id: new mongoose.Types.ObjectId(sampleRegId),
          eventId: new mongoose.Types.ObjectId('6ac25fa6e90fec98e2f56721'),
          studentId: new mongoose.Types.ObjectId('6ac25fb6e90fec98e2f56765'),
          registrationCode: 'CP-HACK-84920A',
          status: 'Confirmed',
          registeredAt: new Date(),
          attendanceStatus: 'Unmarked',
          notes: 'Team Lead for Algorithmic Solutions',
        });
      }

      for (const s of SEED_SCHEDULES) {
        const exists = await Schedule.findById(s.id);
        if (!exists) {
          await Schedule.create({
            _id: new mongoose.Types.ObjectId(s.id),
            eventId: new mongoose.Types.ObjectId(s.eventId),
            title: s.title,
            description: s.description,
            startDateTime: s.startDateTime,
            endDateTime: s.endDateTime,
            venueId: s.venueId ? new mongoose.Types.ObjectId(s.venueId) : undefined,
            trackName: s.trackName,
            speakerOrLead: s.speakerOrLead,
          });
        }
      }

      for (const v of SEED_VOLUNTEERS) {
        const exists = await Volunteer.findById(v.id);
        if (!exists) {
          await Volunteer.create({
            _id: new mongoose.Types.ObjectId(v.id),
            eventId: new mongoose.Types.ObjectId(v.eventId),
            userId: new mongoose.Types.ObjectId(v.userId),
            assignedRole: v.assignedRole,
            shiftStart: v.shiftStart,
            shiftEnd: v.shiftEnd,
            location: v.location,
            notes: v.notes,
            isCheckedIn: v.isCheckedIn,
            status: v.status,
          });
        }
      }

      for (const j of SEED_JUDGES) {
        const exists = await Judge.findById(j.id);
        if (!exists) {
          await Judge.create({
            _id: new mongoose.Types.ObjectId(j.id),
            eventId: new mongoose.Types.ObjectId(j.eventId),
            userId: new mongoose.Types.ObjectId(j.userId),
            roleDescription: j.roleDescription,
            assignedAt: j.assignedAt,
            isFinalized: j.isFinalized,
          });
        }
      }

      console.log('[CampusPulse Seed] MongoDB Atlas collections seeded successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[CampusPulse Seed] Notice during database seed: ${message}`);
    }
  }

  console.log('[CampusPulse Seed] Seed dataset ready (Users, Categories, Venues, Events, Registrations, Schedules, Volunteers, Judges)');
}

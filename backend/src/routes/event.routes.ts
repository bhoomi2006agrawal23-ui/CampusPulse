import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { ScheduleController } from '../controllers/schedule.controller.js';
import { VolunteerController } from '../controllers/volunteer.controller.js';
import { JudgeController } from '../controllers/judge.controller.js';
import { EvaluationController } from '../controllers/evaluation.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { requireOrganizerOrAdmin } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  createEventSchema,
  updateEventSchema,
  updateStatusSchema,
} from '../validators/event.validator.js';
import {
  createScheduleSchema,
  assignVolunteerSchema,
  assignJudgeSchema,
  submitEvaluationSchema,
} from '../validators/phase4.validator.js';

const router = Router();

// Public / Filtered Event Catalog
router.get('/', optionalAuth, EventController.getEvents);

// Event Details
router.get('/:id', optionalAuth, EventController.getEventById);

// Create Event (Organizer or Admin)
router.post(
  '/',
  authenticate,
  requireOrganizerOrAdmin,
  validateBody(createEventSchema),
  EventController.createEvent
);

// Edit Event Details (Organizer Owner or Admin)
router.patch(
  '/:id',
  authenticate,
  requireOrganizerOrAdmin,
  validateBody(updateEventSchema),
  EventController.updateEvent
);

// Controlled Lifecycle State Transition (Organizer Owner or Admin)
router.patch(
  '/:id/status',
  authenticate,
  requireOrganizerOrAdmin,
  validateBody(updateStatusSchema),
  EventController.updateStatus
);

// Student Event Registration
router.post('/:id/register', authenticate, EventController.registerStudent);

// Student Cancel Registration
router.delete('/:id/register', authenticate, EventController.cancelRegistration);
router.post('/:id/cancel-registration', authenticate, EventController.cancelRegistration);

// View Event Registered Participants (Organizer Owner or Admin)
router.get('/:id/registrations', authenticate, EventController.getEventRegistrations);

// ----------------------------------------------------
// Phase 4 Event-Nested Endpoints
// ----------------------------------------------------

// Schedules
router.get('/:eventId/schedules', optionalAuth, ScheduleController.getEventSchedules);
router.post(
  '/:eventId/schedules',
  authenticate,
  requireOrganizerOrAdmin,
  validateBody(createScheduleSchema),
  ScheduleController.createSchedule
);

// Volunteers
router.get('/:eventId/volunteers', authenticate, VolunteerController.getEventVolunteers);
router.post(
  '/:eventId/volunteers',
  authenticate,
  requireOrganizerOrAdmin,
  validateBody(assignVolunteerSchema),
  VolunteerController.assignVolunteer
);

// Judges
router.get('/:eventId/judges', authenticate, JudgeController.getEventJudges);
router.post(
  '/:eventId/judges',
  authenticate,
  requireOrganizerOrAdmin,
  validateBody(assignJudgeSchema),
  JudgeController.assignJudge
);
router.get('/:eventId/judge-participants', authenticate, JudgeController.getJudgeEventParticipants);

// Evaluations & Results
router.get('/:eventId/evaluations', authenticate, EvaluationController.getEventEvaluations);
router.post(
  '/:eventId/evaluations',
  authenticate,
  validateBody(submitEvaluationSchema),
  EvaluationController.submitEvaluation
);

// ----------------------------------------------------
// Phase 5 Event-Nested Endpoints
// ----------------------------------------------------

// Results
import { ResultController } from '../controllers/result.controller.js';
import { CertificateController } from '../controllers/certificate.controller.js';
import { AttendanceController } from '../controllers/attendance.controller.js';
import { AnnouncementController } from '../controllers/announcement.controller.js';
import { ReportController } from '../controllers/report.controller.js';

router.get('/:eventId/results', optionalAuth, ResultController.getEventResults);
router.post('/:eventId/results', authenticate, requireOrganizerOrAdmin, ResultController.createOrUpdateResult);
router.post('/:eventId/results/finalize', authenticate, requireOrganizerOrAdmin, ResultController.finalizeResults);
router.patch('/:eventId/results/finalize', authenticate, requireOrganizerOrAdmin, ResultController.finalizeResults);
router.post('/:eventId/results/publish', authenticate, requireOrganizerOrAdmin, ResultController.publishResults);
router.patch('/:eventId/results/publish', authenticate, requireOrganizerOrAdmin, ResultController.publishResults);

// Certificates
router.get('/:eventId/certificates', authenticate, requireOrganizerOrAdmin, CertificateController.getEventCertificates);
router.post('/:eventId/certificates/generate', authenticate, requireOrganizerOrAdmin, CertificateController.generateCertificate);
router.post('/:eventId/certificates/bulk', authenticate, requireOrganizerOrAdmin, CertificateController.bulkGenerateCertificates);

// Attendance
router.get('/:eventId/attendance', authenticate, requireOrganizerOrAdmin, AttendanceController.getEventAttendance);
router.patch('/:eventId/attendance/:registrationId', authenticate, requireOrganizerOrAdmin, AttendanceController.updateAttendance);

// Announcements
router.get('/:eventId/announcements', optionalAuth, AnnouncementController.getAnnouncements);
router.post('/:eventId/announcements', authenticate, requireOrganizerOrAdmin, AnnouncementController.createAnnouncement);

// Reports
router.get('/:eventId/reports', authenticate, requireOrganizerOrAdmin, ReportController.getEventReports);
router.post('/:eventId/reports', authenticate, requireOrganizerOrAdmin, ReportController.generateEventReport);

export default router;

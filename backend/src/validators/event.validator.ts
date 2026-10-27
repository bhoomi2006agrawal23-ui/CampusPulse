import { z } from 'zod';
import { EVENT_LIFECYCLE_STATES } from '../constants/lifecycle.js';

export const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Event title must be at least 3 characters')
    .max(150, 'Event title cannot exceed 150 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(5000, 'Description cannot exceed 5000 characters'),
  collegeName: z
    .string()
    .trim()
    .min(2, 'College name must be at least 2 characters')
    .max(150, 'College name cannot exceed 150 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  primaryVenueId: z.string().min(1, 'Primary venue is required'),
  startDateTime: z.string().datetime({ message: 'Invalid start date & time format' }),
  endDateTime: z.string().datetime({ message: 'Invalid end date & time format' }),
  registrationStart: z.string().datetime({ message: 'Invalid registration start date format' }),
  registrationEnd: z.string().datetime({ message: 'Invalid registration end date format' }),
  capacity: z.number().int().min(1, 'Capacity must be at least 1 attendee'),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  eligibility: z.string().max(500).optional(),
  instructions: z.string().max(2000).optional(),
  // Disallow direct status assignment during creation (always begins as Draft)
  status: z.never({ message: 'Status cannot be specified during creation' }).optional(),
});

export const updateEventSchema = z.object({
  title: z.string().trim().min(3).max(150).optional(),
  description: z.string().trim().min(1).max(5000).optional(),
  collegeName: z.string().trim().min(2).max(150).optional(),
  categoryId: z.string().min(1).optional(),
  primaryVenueId: z.string().min(1).optional(),
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
  registrationStart: z.string().datetime().optional(),
  registrationEnd: z.string().datetime().optional(),
  capacity: z.number().int().min(1).optional(),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  eligibility: z.string().max(500).optional(),
  instructions: z.string().max(2000).optional(),
  // Disallow direct status assignment in regular update payload
  status: z.never({ message: 'Status must be updated via the dedicated status transition endpoint' }).optional(),
});

export const updateStatusSchema = z.object({
  status: z.string().refine(
    (val): val is (typeof EVENT_LIFECYCLE_STATES)[number] =>
      (EVENT_LIFECYCLE_STATES as readonly string[]).includes(val),
    { message: 'Invalid event lifecycle state' }
  ),
  reason: z.string().max(500).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

import { z } from 'zod';

// Schedules
export const createScheduleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Schedule title must be at least 2 characters')
    .max(150, 'Schedule title cannot exceed 150 characters'),
  description: z.string().trim().max(500).optional(),
  startDateTime: z.string().datetime({ message: 'Invalid start date & time format' }),
  endDateTime: z.string().datetime({ message: 'Invalid end date & time format' }),
  venueId: z.string().optional().or(z.literal('')),
  trackName: z.string().trim().max(50).optional(),
  speakerOrLead: z.string().trim().max(100).optional(),
});

export const updateScheduleSchema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(500).optional(),
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
  venueId: z.string().optional().or(z.literal('')),
  trackName: z.string().trim().max(50).optional(),
  speakerOrLead: z.string().trim().max(100).optional(),
});

// Volunteers
export const assignVolunteerSchema = z.object({
  userId: z.string().min(1, 'Volunteer user ID is required'),
  assignedRole: z
    .string()
    .trim()
    .min(2, 'Assigned responsibility role is required')
    .max(100, 'Assigned role cannot exceed 100 characters'),
  shiftStart: z.string().datetime().optional(),
  shiftEnd: z.string().datetime().optional(),
  location: z.string().trim().max(150).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updateVolunteerDutySchema = z.object({
  assignedRole: z.string().trim().min(2).max(100).optional(),
  shiftStart: z.string().datetime().optional(),
  shiftEnd: z.string().datetime().optional(),
  location: z.string().trim().max(150).optional(),
  notes: z.string().trim().max(500).optional(),
  status: z.enum(['Assigned', 'Confirmed', 'Completed', 'Declined']).optional(),
});

// Judges
export const assignJudgeSchema = z.object({
  userId: z.string().min(1, 'Judge user ID is required'),
  roleDescription: z.string().trim().max(150).optional(),
});

// Evaluations & Results
export const submitEvaluationSchema = z.object({
  participantId: z.string().min(1, 'Participant user ID is required'),
  score: z.number().min(0, 'Score cannot be negative').max(1000, 'Score cannot exceed 1000'),
  criteriaScores: z
    .object({
      innovation: z.number().min(0).max(100).optional(),
      technical: z.number().min(0).max(100).optional(),
      impact: z.number().min(0).max(100).optional(),
      presentation: z.number().min(0).max(100).optional(),
    })
    .optional(),
  awardTitle: z.string().trim().max(100).optional(),
  judgeFeedback: z.string().trim().max(1000).optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type AssignVolunteerInput = z.infer<typeof assignVolunteerSchema>;
export type UpdateVolunteerDutyInput = z.infer<typeof updateVolunteerDutySchema>;
export type AssignJudgeInput = z.infer<typeof assignJudgeSchema>;
export type SubmitEvaluationInput = z.infer<typeof submitEvaluationSchema>;

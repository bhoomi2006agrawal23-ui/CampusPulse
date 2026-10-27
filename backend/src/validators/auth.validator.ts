import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phoneNumber: z.string().trim().optional(),
  collegeName: z
    .string()
    .trim()
    .min(2, 'College name must be at least 2 characters')
    .max(150, 'College name cannot exceed 150 characters')
    .optional(),
  bio: z.string().trim().max(300, 'Bio cannot exceed 300 characters').optional(),
  // Explicitly disallow role specification in public registration
  role: z.never({ message: 'Role cannot be specified during registration' }).optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['Admin', 'Organizer', 'Judge', 'Volunteer', 'Student']).optional(),
  collegeName: z.string().trim().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phoneNumber: z.string().trim().optional(),
  bio: z.string().trim().max(300, 'Bio cannot exceed 300 characters').optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

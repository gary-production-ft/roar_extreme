import { z } from 'zod';

export const leadSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(80, 'Name is too long')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Please enter a valid name'),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),

  email: z
    .string()
    .email('Enter a valid email address')
    .optional()
    .or(z.literal('')),

  preferredTime: z.enum(['morning', 'afternoon', 'evening']),

  fitnessGoal: z.enum(['weight-loss', 'muscle-building', 'strength', 'general-fitness']),

  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

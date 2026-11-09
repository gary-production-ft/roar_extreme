export interface Lead {
  fullName: string;
  phone: string;
  email?: string;
  preferredTime: 'morning' | 'afternoon' | 'evening';
  fitnessGoal: 'weight-loss' | 'muscle-building' | 'strength' | 'general-fitness';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  bookingReference?: string;
  status?: 'pending' | 'confirmed';
  createdAt?: string;
}

export type LeadFormData = Omit<Lead, 'bookingReference' | 'status' | 'createdAt'>;

export interface LeadSubmissionResult {
  success: boolean;
  bookingReference: string;
  lead: Lead;
  message: string;
}


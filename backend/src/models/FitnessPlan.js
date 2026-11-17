import mongoose from 'mongoose';

const fitnessPlanSchema = new mongoose.Schema(
  {
    planId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, index: true },
    memberId: { type: String, index: true }, // optional link to enrolled Member
    visitorId: { type: String, index: true },

    // Anonymized inputs (NO PII)
    profile: {
      age: Number,
      sexEquation: String,
      heightCm: Number,
      weightKg: Number,
      bmi: Number,
      bmiBand: String,
      fitnessGoal: String,
      dietPreference: String,
      activityLevel: String,
      trainingExperience: String,
      availableTrainingDays: Number,
      injuriesOrConditions: [String],
      foodAllergies: [String],
      language: { type: String, default: 'en' },
    },

    // Calculated deterministic targets
    targets: {
      bmr: Number,
      tdee: Number,
      targetCalories: Number,
      proteinGrams: Number,
      fatGrams: Number,
      carbGrams: Number,
    },

    // Workout plan content
    workoutPlan: {
      goal: String,
      weeklySchedule: mongoose.Schema.Types.Mixed, // Day by day breakdown
      sessionDurationMinutes: Number,
      progressionRule: String,
      warmup: String,
      recoveryDays: [String],
    },

    // Diet plan content
    dietPlan: {
      goal: String,
      totalCalories: Number,
      macros: {
        protein: Number,
        carbs: Number,
        fat: Number,
      },
      mealSchedule: mongoose.Schema.Types.Mixed, // breakfast, lunch, snack, dinner
      hydrationTips: String,
      substitutions: [String],
    },

    // Status and Trainer Review
    status: {
      type: String,
      enum: ['draft', 'approved', 'flagged_for_review', 'trainer_reviewed'],
      default: 'draft',
      index: true,
    },
    requiresTrainerApproval: { type: Boolean, default: false },
    trainerReviewRequested: { type: Boolean, default: false },
    trainerNotes: { type: String },

    // Feedback
    userRating: {
      type: String,
      enum: ['up', 'down', null],
      default: null,
    },

    disclaimer: {
      type: String,
      default: 'General fitness information, not medical advice. Consult a doctor or registered dietitian before starting any new diet or training program.',
    },
  },
  { timestamps: true }
);

export const FitnessPlan = mongoose.model('FitnessPlan', fitnessPlanSchema);

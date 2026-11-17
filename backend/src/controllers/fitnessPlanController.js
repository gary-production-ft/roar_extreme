import { z } from 'zod';
import { generateFitnessPlan } from '../services/fitnessPlanService.js';
import { FitnessPlan } from '../models/FitnessPlan.js';
import { VERIFIED_EXERCISES, VERIFIED_FOODS } from '../data/gymSeedData.js';
import { Exercise } from '../models/Exercise.js';
import { FoodItem } from '../models/FoodItem.js';
import { savePreference } from '../services/memoryService.js';
import { Lead } from '../models/Lead.js';
import { logger } from '../utils/logger.js';

// ─── Zod Schema for Intake Validation ─────────────────────────────────────────
export const planIntakeSchema = z.object({
  body: z.object({
    sessionId: z.string().optional(),
    visitorId: z.string().optional(),
    memberId: z.string().optional(),
    language: z.enum(['en', 'hi', 'mr']).default('en'),

    // Core required intake fields
    ageYears: z.number().int().min(10).max(100),
    heightCm: z.number().min(80).max(250),
    weightKg: z.number().min(25).max(300),
    fitnessGoal: z.enum([
      'weight_gain',
      'muscle_hypertrophy',
      'fat_loss',
      'body_recomposition',
      'weight_maintenance',
      'strength',
      'endurance',
      'general_fitness',
      'functional_fitness',
      'kickboxing_conditioning',
    ]),
    dietPreference: z.enum([
      'vegetarian',
      'lacto_vegetarian',
      'ovo_vegetarian',
      'vegan',
      'non_vegetarian',
      'eggetarian',
    ]),
    activityLevel: z.enum([
      'sedentary',
      'light',
      'moderate',
      'very_active',
      'extremely_active',
    ]).default('moderate'),
    trainingExperience: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    availableTrainingDays: z.number().int().min(1).max(7).default(3),

    // Optional fields
    sexForEnergyEquation: z.enum(['male_equation', 'female_equation', 'male', 'female', 'not_provided']).optional(),
    sessionDurationMinutes: z.number().int().min(20).max(180).optional(),
    foodAllergies: z.array(z.string()).optional().default([]),
    foodExclusions: z.array(z.string()).optional().default([]),
    medicalFlags: z.array(z.string()).optional().default([]),
    injuriesOrLimitations: z.array(z.string()).optional().default([]),
    symptoms: z.array(z.string()).optional().default([]),
  }),
});

// ─── POST /api/fitness-plans/generate ─────────────────────────────────────────
export async function createFitnessPlan(req, res, next) {
  try {
    const intake = req.validatedData.body;
    const { sessionId, visitorId, memberId } = intake;

    const result = await generateFitnessPlan({
      intake,
      sessionId,
      visitorId,
      memberId,
    });

    // If session or visitor ID present, save profile preferences non-blocking for returning users
    if (sessionId || visitorId) {
      const ownerId = visitorId || sessionId;
      const ownerType = visitorId ? 'visitor' : 'session';
      savePreference({
        ownerId,
        ownerType,
        key: 'fitnessProfile',
        value: {
          ageYears: intake.ageYears,
          heightCm: intake.heightCm,
          weightKg: intake.weightKg,
          fitnessGoal: intake.fitnessGoal,
          dietPreference: intake.dietPreference,
          activityLevel: intake.activityLevel,
          trainingExperience: intake.trainingExperience,
        },
        source: 'direct_input',
      }).catch((err) => logger.warn('[PREF] Could not persist fitnessProfile:', err.message));
    }

    res.status(result.status === 'rejected_safety_gate' ? 422 : 200).json(result);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/fitness-plans/:planId ───────────────────────────────────────────
export async function getFitnessPlan(req, res, next) {
  try {
    const { planId } = req.params;
    const plan = await FitnessPlan.findOne({ planId }).lean();
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Fitness plan not found' });
    }
    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/fitness-plans/:planId/rating ───────────────────────────────────
export async function rateFitnessPlan(req, res, next) {
  try {
    const { planId } = req.params;
    const { rating } = req.body;
    if (!['up', 'down'].includes(rating)) {
      return res.status(400).json({ success: false, message: 'Rating must be "up" or "down"' });
    }

    const plan = await FitnessPlan.findOneAndUpdate(
      { planId },
      { userRating: rating },
      { new: true }
    );
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({ success: true, planId, rating });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/fitness-plans/:planId/trainer-review ───────────────────────────
export async function requestTrainerReview(req, res, next) {
  try {
    const { planId } = req.params;
    const { fullName, phone, notes } = req.body;

    const plan = await FitnessPlan.findOne({ planId });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    plan.trainerReviewRequested = true;
    plan.status = 'flagged_for_review';
    if (notes) plan.trainerNotes = notes;
    await plan.save();

    // If contact details supplied, create a follow-up lead in the admin pipeline
    if (fullName && phone) {
      const refId = 'PLAN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const goalMap = {
        muscle_hypertrophy: 'muscle-building',
        weight_gain: 'muscle-building',
        fat_loss: 'weight-loss',
        strength: 'strength',
        body_recomposition: 'general-fitness',
        endurance: 'general-fitness',
        general_fitness: 'general-fitness',
        functional_fitness: 'general-fitness',
        kickboxing_conditioning: 'general-fitness',
      };
      const mappedGoal = goalMap[plan.profile?.fitnessGoal] || 'general-fitness';

      await Lead.create({
        fullName,
        phone,
        serviceInterest: 'personal_training',
        fitnessGoal: mappedGoal,
        experienceLevel: plan.profile?.trainingExperience || 'beginner',
        preferredTime: 'evening',
        bookingReference: refId,
        notes: `Fitness Plan Review Requested [Plan ID: ${planId}]. Goal: ${plan.profile?.fitnessGoal}. Notes: ${notes || 'None'}`,
        source: 'chatbot_plan_review',
      }).catch((err) => logger.warn('[LEAD] Could not auto-create lead for plan review:', err.message));
    }

    res.json({
      success: true,
      message: 'Trainer review requested. A ROAR coach will review your workout & nutrition draft.',
      planId,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/fitness-plans/catalog/exercises ─────────────────────────────────
export async function getExerciseCatalog(req, res, next) {
  try {
    let exercises = await Exercise.find({ isActive: true }).lean();
    if (!exercises || exercises.length === 0) {
      exercises = VERIFIED_EXERCISES;
    }
    res.json({ success: true, count: exercises.length, exercises });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/fitness-plans/catalog/foods ─────────────────────────────────────
export async function getFoodCatalog(req, res, next) {
  try {
    let foods = await FoodItem.find({ isActive: true }).lean();
    if (!foods || foods.length === 0) {
      foods = VERIFIED_FOODS;
    }
    res.json({ success: true, count: foods.length, foods });
  } catch (err) {
    next(err);
  }
}

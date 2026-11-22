import { describe, it, expect } from 'vitest';
import { fitnessPlanResponseSchema } from '../../src/schemas/fitnessPlanResponseSchema.js';
import { generateClientFallbackPlan } from '../../src/services/fitnessPlanClientFallback.js';

describe('D1: Plan Designer Crash Resilience & Schema Validation', () => {
  it('successfully generates client fallback with complete shape including macros.protein.grams', () => {
    const fallback = generateClientFallbackPlan({
      ageYears: 25,
      gender: 'male',
      heightCm: 175,
      weightKg: 75,
      fitnessGoal: 'muscle_hypertrophy',
      dietPreference: 'non_veg',
      trainingExperience: 'intermediate',
      availableTrainingDays: 4,
      medicalHistory: []
    });

    expect(fallback).toBeDefined();
    // Verify properties that previously caused TypeError in UI
    expect(fallback.targets).toBeDefined();
    expect(fallback.targets.targetCalories).toBeGreaterThan(1000);
    expect(fallback.targets.macros).toBeDefined();
    expect(fallback.targets.macros.protein).toBeDefined();
    expect(typeof fallback.targets.macros.protein.grams).toBe('number');
    expect(fallback.targets.macros.carbs).toBeDefined();
    expect(typeof fallback.targets.macros.carbs.grams).toBe('number');
    expect(fallback.targets.macros.fats).toBeDefined();
    expect(typeof fallback.targets.macros.fats.grams).toBe('number');
  });

  it('fitnessPlanResponseSchema normalizes fallback data without throwing', () => {
    const fallback = generateClientFallbackPlan({
      ageYears: 30,
      gender: 'female',
      heightCm: 162,
      weightKg: 60,
      fitnessGoal: 'fat_loss',
      dietPreference: 'vegetarian',
      trainingExperience: 'beginner',
      availableTrainingDays: 3,
      medicalHistory: []
    });

    const parsed = fitnessPlanResponseSchema.safeParse(fallback);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.targets.macros.protein.grams).toBeGreaterThan(0);
      expect(parsed.data.targets.targetCalories).toBeGreaterThan(0);
      expect(parsed.data.workoutPlan).toBeDefined();
      expect(parsed.data.workoutPlan.splitName).toBeDefined();
      expect(Object.keys(parsed.data.workoutPlan.weeklySchedule).length).toBeGreaterThan(0);
      expect(Array.isArray(parsed.data.dietPlan.meals)).toBe(true);
      expect(parsed.data.dietPlan.meals.length).toBeGreaterThan(0);
    }
  });

  it('fitnessPlanResponseSchema safely recovers from minimal or malformed responses', () => {
    const minimalData = {
      planId: 'plan_test_123',
      targets: {
        targetCalories: 2100
      }
    };

    const parsed = fitnessPlanResponseSchema.safeParse(minimalData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.targets.macros.protein.grams).toBeDefined();
      expect(parsed.data.targets.macros.carbs.grams).toBeDefined();
      expect(parsed.data.targets.macros.fats.grams).toBeDefined();
      expect(parsed.data.workoutPlan).toBeDefined();
      expect(Array.isArray(parsed.data.dietPlan.meals)).toBe(true);
    }
  });

  it('fitnessPlanResponseSchema handles completely empty object without crashing', () => {
    const parsed = fitnessPlanResponseSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.planId).toBeDefined();
      expect(parsed.data.targets.targetCalories).toBeGreaterThan(0);
      expect(parsed.data.targets.macros.protein.grams).toBeGreaterThan(0);
    }
  });
});

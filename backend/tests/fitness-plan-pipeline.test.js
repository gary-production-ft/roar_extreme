import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { FitnessPlan } from '../src/models/FitnessPlan.js';

describe('Fitness Plan Generation & Evaluation Pipeline', () => {
  let createdPlanId = null;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/roar-extreme-test');
    }
  });

  afterAll(async () => {
    if (createdPlanId) {
      await FitnessPlan.deleteOne({ planId: createdPlanId }).catch(() => {});
    }
  });

  describe('POST /api/fitness-plans/generate - Schema & Intake Validation', () => {
    it('rejects request with missing required fields with 400', async () => {
      const res = await request(app)
        .post('/api/fitness-plans/generate')
        .send({ ageYears: 25 }); // missing height, weight, goal, etc.

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects impossible heights or weights with 400', async () => {
      const res = await request(app)
        .post('/api/fitness-plans/generate')
        .send({
          ageYears: 25,
          heightCm: 10, // too short
          weightKg: 70,
          fitnessGoal: 'fat_loss',
          dietPreference: 'vegetarian',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/fitness-plans/generate - Safety Gate Enforcement', () => {
    it('redirects under-18 user safely with 422', async () => {
      const res = await request(app)
        .post('/api/fitness-plans/generate')
        .send({
          ageYears: 16,
          heightCm: 170,
          weightKg: 65,
          fitnessGoal: 'muscle_hypertrophy',
          dietPreference: 'vegetarian',
          trainingExperience: 'beginner',
          availableTrainingDays: 3,
        });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('rejected_safety_gate');
      expect(res.body.message).toContain('cannot generate a restrictive diet');
      expect(res.body.safety.hardStopFlags[0].flag).toBe('under_18_years');
    });

    it('redirects user with cardiovascular or acute medical flags with 422', async () => {
      const res = await request(app)
        .post('/api/fitness-plans/generate')
        .send({
          ageYears: 35,
          heightCm: 175,
          weightKg: 85,
          fitnessGoal: 'fat_loss',
          dietPreference: 'non_vegetarian',
          trainingExperience: 'beginner',
          availableTrainingDays: 4,
          medicalFlags: ['known_cardiovascular_disease_without_clearance'],
        });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('rejected_safety_gate');
    });
  });

  describe('POST /api/fitness-plans/generate - Successful Generation', () => {
    it('successfully generates personalized workout & diet plan for healthy adult', async () => {
      const res = await request(app)
        .post('/api/fitness-plans/generate')
        .send({
          ageYears: 28,
          heightCm: 178,
          weightKg: 75,
          sexForEnergyEquation: 'male',
          fitnessGoal: 'muscle_hypertrophy',
          dietPreference: 'vegetarian',
          activityLevel: 'moderate',
          trainingExperience: 'intermediate',
          availableTrainingDays: 4,
          foodAllergies: ['peanuts'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.planId).toMatch(/^PLAN-/);
      createdPlanId = res.body.planId;

      // Verify deterministic targets
      expect(res.body.targets.targetCalories).toBeGreaterThan(1500);
      expect(res.body.targets.macros.protein.grams).toBeGreaterThanOrEqual(100);

      // Verify workout plan
      expect(res.body.workoutPlan.splitName).toBeDefined();
      expect(res.body.workoutPlan.weeklySchedule).toBeDefined();
      expect(res.body.workoutPlan.progressionRule).toContain('Double Progression');

      // Verify diet plan
      expect(res.body.dietPlan.meals.length).toBeGreaterThanOrEqual(3);
      expect(res.body.disclaimer.toLowerCase()).toContain('not medical advice');
    }, 15000);
  });

  describe('GET /api/fitness-plans/:planId', () => {
    it('retrieves the generated plan by ID', async () => {
      expect(createdPlanId).toBeDefined();
      const res = await request(app).get(`/api/fitness-plans/${createdPlanId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plan.planId).toBe(createdPlanId);
      expect(res.body.plan.profile.fitnessGoal).toBe('muscle_hypertrophy');
    });
  });

  describe('POST /api/fitness-plans/:planId/rating', () => {
    it('records thumbs up user rating', async () => {
      const res = await request(app)
        .post(`/api/fitness-plans/${createdPlanId}/rating`)
        .send({ rating: 'up' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.rating).toBe('up');
    });
  });

  describe('POST /api/fitness-plans/:planId/trainer-review', () => {
    it('submits trainer review request and creates lead follow-up', async () => {
      const res = await request(app)
        .post(`/api/fitness-plans/${createdPlanId}/trainer-review`)
        .send({
          fullName: 'Aarav Sharma',
          phone: '9876543210',
          notes: 'Want coach to check my knee safety for squats',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Trainer review requested');
    });
  });

  describe('Catalogs: /api/fitness-plans/catalog', () => {
    it('returns verified exercises list', async () => {
      const res = await request(app).get('/api/fitness-plans/catalog/exercises');
      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(30);
    });

    it('returns verified food items list with IFCT 2017 nutrients', async () => {
      const res = await request(app).get('/api/fitness-plans/catalog/foods');
      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(20);
    });
  });
});

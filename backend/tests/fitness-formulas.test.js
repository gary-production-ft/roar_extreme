import { describe, it, expect } from 'vitest';
import {
  calculateBMI,
  calculateMifflinBMR,
  calculateTDEE,
  calculateDietTargets,
  screenMedicalSafety,
  NUTRITION_CONSTANTS,
} from '../src/config/fitnessFormulas.js';

describe('Deterministic Fitness Formulas & Calculations', () => {
  describe('calculateBMI()', () => {
    it('calculates BMI correctly for standard adult', () => {
      // 70kg, 175cm -> 70 / (1.75^2) = 22.86 -> 22.9
      const res = calculateBMI(70, 175);
      expect(res.bmi).toBe(22.9);
      expect(res.band).toBe('Normal screening range');
    });

    it('classifies Indian adult BMI thresholds correctly', () => {
      expect(calculateBMI(50, 170).band).toBe('Underweight'); // 17.3
      expect(calculateBMI(65, 170).band).toBe('Normal screening range'); // 22.5
      expect(calculateBMI(70, 170).band).toBe('Overweight screening range'); // 24.2
      expect(calculateBMI(78, 170).band).toBe('Obesity screening range'); // 27.0
      expect(calculateBMI(95, 170).band).toBe('Higher obesity screening range'); // 32.9
    });

    it('handles invalid inputs gracefully', () => {
      expect(calculateBMI(0, 170).bmi).toBeNull();
      expect(calculateBMI(70, 0).bmi).toBeNull();
    });
  });

  describe('calculateMifflinBMR()', () => {
    it('calculates male equation correctly: 10*W + 6.25*H - 5*A + 5', () => {
      // 75kg, 180cm, 25 years: 10*75 + 6.25*180 - 5*25 + 5 = 750 + 1125 - 125 + 5 = 1755
      const res = calculateMifflinBMR({ weightKg: 75, heightCm: 180, ageYears: 25, sexEquation: 'male' });
      expect(res.bmr).toBe(1755);
      expect(res.equation).toContain('Male');
    });

    it('calculates female equation correctly: 10*W + 6.25*H - 5*A - 161', () => {
      // 60kg, 165cm, 30 years: 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
      const res = calculateMifflinBMR({ weightKg: 60, heightCm: 165, ageYears: 30, sexEquation: 'female' });
      expect(res.bmr).toBe(1320);
      expect(res.equation).toContain('Female');
    });

    it('provides sex-neutral estimate when sex is not provided', () => {
      const res = calculateMifflinBMR({ weightKg: 70, heightCm: 170, ageYears: 28, sexEquation: 'not_provided' });
      expect(res.bmr).toBeGreaterThan(1000);
      expect(res.equation).toContain('Midpoint');
    });

    it('rejects under-18 users from adult equation', () => {
      const res = calculateMifflinBMR({ weightKg: 50, heightCm: 160, ageYears: 16 });
      expect(res.bmr).toBeNull();
      expect(res.error).toContain('Under-18');
    });
  });

  describe('calculateTDEE()', () => {
    it('applies activity multipliers accurately', () => {
      const bmr = 1600;
      expect(calculateTDEE({ bmr, activityLevel: 'sedentary' }).tdee).toBe(Math.round(1600 * 1.2));
      expect(calculateTDEE({ bmr, activityLevel: 'moderate' }).tdee).toBe(Math.round(1600 * 1.55));
      expect(calculateTDEE({ bmr, activityLevel: 'very_active' }).tdee).toBe(Math.round(1600 * 1.725));
    });
  });

  describe('calculateDietTargets()', () => {
    it('sets reasonable deficit for fat_loss within safety floors', () => {
      const res = calculateDietTargets({
        weightKg: 80,
        heightCm: 175,
        ageYears: 30,
        sexEquation: 'male',
        activityLevel: 'moderate',
        fitnessGoal: 'fat_loss',
        bmiValue: 26.1,
      });

      expect(res.targetCalories).toBeLessThan(res.tdee);
      expect(res.targetCalories).toBeGreaterThanOrEqual(NUTRITION_CONSTANTS.MALE_CALORIE_FLOOR);
      expect(res.macros.protein.grams).toBe(Math.round(80 * 1.8)); // 144g
      expect(res.macros.protein.kcal).toBe(144 * 4);
      expect(res.macros.fat.percent).toBeCloseTo(25, 1);
    });

    it('never assigns calorie deficit if member is underweight', () => {
      const res = calculateDietTargets({
        weightKg: 45,
        heightCm: 165,
        ageYears: 22,
        sexEquation: 'female',
        fitnessGoal: 'fat_loss',
        bmiValue: 16.5, // Underweight!
      });

      // Deficit should be neutralized to 0%
      expect(res.percentAdjustment).toBe(0);
      expect(res.targetCalories).toBeGreaterThanOrEqual(res.tdee);
    });

    it('enforces calorie floor for females at 1200 kcal', () => {
      const res = calculateDietTargets({
        weightKg: 40,
        heightCm: 145,
        ageYears: 50,
        sexEquation: 'female',
        activityLevel: 'sedentary',
        fitnessGoal: 'fat_loss',
      });
      expect(res.targetCalories).toBeGreaterThanOrEqual(1200);
    });
  });

  describe('screenMedicalSafety()', () => {
    it('passes healthy adult with no flags', () => {
      const res = screenMedicalSafety({ ageYears: 25, medicalFlags: [], bmi: 22 });
      expect(res.isSafe).toBe(true);
      expect(res.requiresTrainerApproval).toBe(false);
      expect(res.hardStopFlags).toHaveLength(0);
    });

    it('hard-stops under-18 user', () => {
      const res = screenMedicalSafety({ ageYears: 16 });
      expect(res.isSafe).toBe(false);
      expect(res.hardStopFlags[0].flag).toBe('under_18_years');
    });

    it('hard-stops users with cardiovascular or hypertension flags', () => {
      const res = screenMedicalSafety({ ageYears: 40, medicalFlags: ['uncontrolled_hypertension', 'kidney_disease'] });
      expect(res.isSafe).toBe(false);
      expect(res.hardStopFlags).toHaveLength(2);
      expect(res.redirectMessage).toContain('cannot generate a restrictive diet');
    });

    it('hard-stops urgent acute symptoms like chest pain', () => {
      const res = screenMedicalSafety({ ageYears: 30, symptoms: ['sharp chest pain during running'] });
      expect(res.isSafe).toBe(false);
      expect(res.urgentSymptoms).toHaveLength(1);
    });

    it('flags high obesity (BMI >= 30) for trainer/dietitian approval', () => {
      const res = screenMedicalSafety({ ageYears: 35, bmi: 32, medicalFlags: [] });
      expect(res.requiresTrainerApproval).toBe(true);
    });
  });
});

import { z } from 'zod';

/**
 * ROAR EXTREME — DETERMINISTIC FITNESS & NUTRITION FORMULAS
 *
 * Implements Mifflin-St Jeor REE, Indian BMI Screening, TDEE,
 * Calorie Goal Adjustments, Macro Splits, and Hard-Stop Medical Safety Checks.
 *
 * Grounded in:
 * - Mifflin et al. (1990)
 * - ICMR-NIN Dietary Guidelines for Indians (2024)
 * - ISSN Protein Position Stand (2017)
 * - ESI India BMI Guidelines
 *
 * ALL CALCULATIONS OCCUR IN DETERMINISTIC CODE — NEVER BY THE LLM.
 */

// ─── Constants ───────────────────────────────────────────────────────────────
export const NUTRITION_CONSTANTS = {
  KCAL_PER_G_PROTEIN: 4,
  KCAL_PER_G_CARB: 4,
  KCAL_PER_G_FAT: 9,

  // Absolute safety floors
  ABSOLUTE_CALORIE_FLOOR: 1200,
  MALE_CALORIE_FLOOR: 1500,
  FEMALE_CALORIE_FLOOR: 1200,
  MIN_FAT_ENERGY_PERCENT: 20,
  MAX_FAT_ENERGY_PERCENT: 35,

  // Protein targets (g/kg body weight)
  PROTEIN_RDA_GENERAL: 0.83,
  PROTEIN_EXERCISING_MIN: 1.4,
  PROTEIN_EXERCISING_MAX: 2.0,
  PROTEIN_EXERCISING_DEFAULT: 1.6,

  // Activity Multipliers
  ACTIVITY_MULTIPLIERS: {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  },

  // Max initial calorie deficit / surplus percentages of TDEE
  GOAL_CALORIE_ADJUSTMENTS: {
    weight_gain: { initialPercent: 7, minPercent: 5, maxPercent: 10 },
    muscle_hypertrophy: { initialPercent: 5, minPercent: 0, maxPercent: 10 },
    fat_loss: { initialPercent: -12, minPercent: -20, maxPercent: -10 },
    body_recomposition: { initialPercent: 0, minPercent: -5, maxPercent: 5 },
    weight_maintenance: { initialPercent: 0, minPercent: 0, maxPercent: 0 },
    strength: { initialPercent: 3, minPercent: 0, maxPercent: 5 },
    endurance: { initialPercent: 0, minPercent: 0, maxPercent: 5 },
    general_fitness: { initialPercent: 0, minPercent: 0, maxPercent: 0 },
    functional_fitness: { initialPercent: 0, minPercent: 0, maxPercent: 0 },
    kickboxing_conditioning: { initialPercent: 0, minPercent: 0, maxPercent: 0 },
  },

  // Hard stop & escalation medical flags
  HARD_STOP_FLAGS: [
    'chest_pain',
    'fainting_or_unexplained_dizziness',
    'uncontrolled_hypertension',
    'known_cardiovascular_disease_without_clearance',
    'pregnancy_or_postpartum_needs_specialist_plan',
    'eating_disorder_current_or_history',
    'kidney_disease',
    'liver_disease',
    'uncontrolled_diabetes_or_recurrent_hypoglycemia',
    'recent_surgery',
    'acute_injury',
    'severe_or_unexplained_weight_loss',
    'under_18_years',
  ],
};

// ─── Indian Adult BMI Screening ──────────────────────────────────────────────
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) {
    return { bmi: null, band: 'Invalid inputs', action: null };
  }
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  let band = 'Normal screening range';
  let action = 'Use goal, waist, strength, and weight trend; do not infer body-fat percentage.';

  if (bmi < 18.5) {
    band = 'Underweight';
    action = 'Do not auto-prescribe a calorie deficit. Screen for unintentional weight loss.';
  } else if (bmi >= 18.5 && bmi < 23.0) {
    band = 'Normal screening range';
    action = 'Use goal, waist, strength, and weight trend; do not infer body-fat percentage.';
  } else if (bmi >= 23.0 && bmi < 25.0) {
    band = 'Overweight screening range';
    action = 'Use waist circumference and health context; do not diagnose from BMI alone.';
  } else if (bmi >= 25.0 && bmi < 30.0) {
    band = 'Obesity screening range';
    action = 'Recommend qualified clinician/dietitian assessment, especially with comorbidities.';
  } else {
    band = 'Higher obesity screening range';
    action = 'Require clinician/dietitian review before individualized weight-loss prescription.';
  }

  return { bmi, band, action, system: 'ESI India Guidelines (Adults 18+)' };
}

// ─── Mifflin-St Jeor REE / BMR ────────────────────────────────────────────────
export function calculateMifflinBMR({ weightKg, heightCm, ageYears, sexEquation = 'not_provided' }) {
  if (ageYears < 18) {
    return {
      bmr: null,
      error: 'Under-18: Mifflin-St Jeor adult equation is not applicable to adolescents. Use pediatric guidelines.',
    };
  }

  // Base term: 10 * weight + 6.25 * height - 5 * age
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;

  if (sexEquation === 'male_equation' || sexEquation === 'male') {
    return { bmr: Math.round(base + 5), equation: 'Mifflin-St Jeor (Male)' };
  } else if (sexEquation === 'female_equation' || sexEquation === 'female') {
    return { bmr: Math.round(base - 161), equation: 'Mifflin-St Jeor (Female)' };
  } else {
    // Neutral estimate: average of male and female (+5 and -161 -> -78)
    return {
      bmr: Math.round(base - 78),
      equation: 'Mifflin-St Jeor (Midpoint / Sex-Neutral Estimate)',
      note: 'Sex not provided or non-binary equation; using sex-neutral midpoint estimate.',
    };
  }
}

// ─── TDEE Calculation ─────────────────────────────────────────────────────────
export function calculateTDEE({ bmr, activityLevel = 'moderate' }) {
  const multiplier = NUTRITION_CONSTANTS.ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  const tdee = Math.round(bmr * multiplier);
  return { tdee, multiplier, activityLevel };
}

// ─── Calorie & Macro Target Allocation ────────────────────────────────────────
export function calculateDietTargets({
  weightKg,
  heightCm,
  ageYears,
  sexEquation = 'not_provided',
  activityLevel = 'moderate',
  fitnessGoal = 'general_fitness',
  dietPreference = 'vegetarian',
  bmiValue = null,
}) {
  const bmrResult = calculateMifflinBMR({ weightKg, heightCm, ageYears, sexEquation });
  if (!bmrResult.bmr) {
    return { error: bmrResult.error };
  }

  const { tdee, multiplier } = calculateTDEE({ bmr: bmrResult.bmr, activityLevel });

  // Calorie adjustments
  const goalConfig = NUTRITION_CONSTANTS.GOAL_CALORIE_ADJUSTMENTS[fitnessGoal] || { initialPercent: 0 };
  let percentAdj = goalConfig.initialPercent;

  // SAFETY RULE: Never prescribe calorie deficit if BMI is underweight (<18.5)
  if (bmiValue && bmiValue < 18.5 && percentAdj < 0) {
    percentAdj = 0; // Override deficit to maintenance or surplus
  }

  let targetCalories = Math.round(tdee * (1 + percentAdj / 100));

  // Enforce calorie floors
  let floor = NUTRITION_CONSTANTS.ABSOLUTE_CALORIE_FLOOR;
  if (sexEquation === 'male_equation' || sexEquation === 'male') {
    floor = NUTRITION_CONSTANTS.MALE_CALORIE_FLOOR;
  } else if (sexEquation === 'female_equation' || sexEquation === 'female') {
    floor = NUTRITION_CONSTANTS.FEMALE_CALORIE_FLOOR;
  }
  if (targetCalories < floor) {
    targetCalories = floor;
  }

  // Protein calculation: 1.6 g/kg default for training, bounded [1.4, 2.0]
  let proteinPerKg = NUTRITION_CONSTANTS.PROTEIN_EXERCISING_DEFAULT;
  if (fitnessGoal === 'fat_loss' || fitnessGoal === 'muscle_hypertrophy') {
    proteinPerKg = 1.8; // Higher protein retention during deficit or hypertrophy
  } else if (fitnessGoal === 'strength') {
    proteinPerKg = 1.7;
  } else if (fitnessGoal === 'endurance') {
    proteinPerKg = 1.4;
  }
  const proteinGrams = Math.round(weightKg * proteinPerKg);
  const proteinKcal = proteinGrams * NUTRITION_CONSTANTS.KCAL_PER_G_PROTEIN;

  // Fat calculation: 25% of target calories by default, bounded [20%, 35%]
  const fatKcal = Math.round(targetCalories * 0.25);
  const fatGrams = Math.round(fatKcal / NUTRITION_CONSTANTS.KCAL_PER_G_FAT);

  // Carbohydrate: remainder of energy
  const carbKcal = Math.max(0, targetCalories - (proteinKcal + fatKcal));
  const carbGrams = Math.round(carbKcal / NUTRITION_CONSTANTS.KCAL_PER_G_CARB);

  return {
    bmr: bmrResult.bmr,
    bmrEquation: bmrResult.equation,
    tdee,
    activityMultiplier: multiplier,
    fitnessGoal,
    targetCalories,
    calorieDelta: targetCalories - tdee,
    percentAdjustment: percentAdj,
    macros: {
      protein: { grams: proteinGrams, kcal: proteinKcal, percent: Math.round((proteinKcal / targetCalories) * 100) },
      fat: { grams: fatGrams, kcal: fatKcal, percent: Math.round((fatKcal / targetCalories) * 100) },
      carbohydrates: { grams: carbGrams, kcal: carbKcal, percent: Math.round((carbKcal / targetCalories) * 100) },
    },
    dietPreference,
    notes: [
      `TDEE estimated at ${tdee} kcal/day using Mifflin-St Jeor formula.`,
      `Calorie target set to ${targetCalories} kcal/day (${percentAdj >= 0 ? '+' : ''}${percentAdj}% for ${fitnessGoal.replace(/_/g, ' ')}).`,
      `Protein set at ${proteinPerKg}g/kg of bodyweight (${proteinGrams}g/day).`,
      `Evaluate body weight and energy trend over 14 days before modifying calories.`,
    ],
  };
}

// ─── Safety & Medical Screening Gate ─────────────────────────────────────────
export function screenMedicalSafety({ medicalFlags = [], ageYears = 25, bmi = 22, symptoms = [] }) {
  const flagsPresent = [];
  const urgentPresent = [];

  // Age screen (<18 is hard stop for adult prescriptive plans)
  if (ageYears && ageYears < 18) {
    flagsPresent.push({
      flag: 'under_18_years',
      message: 'User is under 18 years old. Adult BMI, restrictive deficits, and maximal lifting prescriptions are disabled. General athletic activity and coach guidance only.',
    });
  }

  // Check known hard-stop flags
  if (Array.isArray(medicalFlags)) {
    for (const flag of medicalFlags) {
      const normalized = String(flag).toLowerCase().trim().replace(/[\s-]+/g, '_');
      if (NUTRITION_CONSTANTS.HARD_STOP_FLAGS.includes(normalized)) {
        flagsPresent.push({
          flag: normalized,
          message: `Medical condition flagged: ${normalized.replace(/_/g, ' ')}. Restrictive diets or intense unaccompanied programming require prior physician or dietitian clearance.`,
        });
      }
    }
  }

  // Check urgent red-flag symptoms
  const urgentKeywords = ['chest pain', 'fainting', 'loss of consciousness', 'shortness of breath', 'dizziness'];
  for (const s of symptoms) {
    const sLower = String(s).toLowerCase();
    for (const kw of urgentKeywords) {
      if (sLower.includes(kw)) {
        urgentPresent.push(s);
        break;
      }
    }
  }

  const isSafe = flagsPresent.length === 0 && urgentPresent.length === 0;

  return {
    isSafe,
    requiresTrainerApproval: flagsPresent.length > 0 || (bmi && (bmi < 18.5 || bmi >= 30)),
    hardStopFlags: flagsPresent,
    urgentSymptoms: urgentPresent,
    redirectMessage: !isSafe
      ? 'Based on your reported health status or age, our system cannot generate a restrictive diet or heavy lifting plan automatically. Please speak with our head coach or a qualified healthcare professional at ROAR EXTREME Nashik.'
      : null,
  };
}

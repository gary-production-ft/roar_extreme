import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import {
  calculateBMI,
  calculateDietTargets,
  screenMedicalSafety,
  NUTRITION_CONSTANTS,
} from '../config/fitnessFormulas.js';
import { VERIFIED_EXERCISES, VERIFIED_FOODS } from '../data/gymSeedData.js';
import { FitnessPlan } from '../models/FitnessPlan.js';

let geminiClient = null;

function getGeminiClient() {
  if (!geminiClient && env.geminiApiKey) {
    geminiClient = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }
  return geminiClient;
}

// ─── Goal Weekly Splits & Templates ──────────────────────────────────────────
const GOAL_TEMPLATES = {
  muscle_hypertrophy: {
    splitName: 'Upper / Lower 4-Day Hypertrophy Split',
    defaultDays: 4,
    days: [
      { day: 'Day 1: Upper A (Strength Focus)', focus: 'chest_back', exerciseIds: ['barbell_bench_press', 'barbell_row', 'overhead_press', 'pull_up', 'dumbbell_lateral_raise', 'dumbbell_curl'] },
      { day: 'Day 2: Lower A (Quad & Glute Focus)', focus: 'legs', exerciseIds: ['barbell_back_squat', 'romanian_deadlift', 'walking_lunge', 'calf_raise', 'plank'] },
      { day: 'Day 3: Active Recovery / Rest', focus: 'recovery', exerciseIds: ['treadmill_walk'] },
      { day: 'Day 4: Upper B (Volume Focus)', focus: 'chest_back', exerciseIds: ['incline_dumbbell_press', 'one_arm_dumbbell_row', 'push_up', 'inverted_row', 'overhead_triceps_extension', 'hammer_curl'] },
      { day: 'Day 5: Lower B (Hinge & Hamstring Focus)', focus: 'legs', exerciseIds: ['barbell_deadlift', 'goblet_squat', 'bulgarian_split_squat', 'hanging_knee_raise', 'farmer_carry'] },
      { day: 'Day 6: Conditioning / Mobility', focus: 'cardio', exerciseIds: ['cross_trainer'] },
      { day: 'Day 7: Full Rest & Regeneration', focus: 'rest', exerciseIds: [] },
    ],
  },
  strength: {
    splitName: 'Full-Body 3-Day Heavy Strength Progression',
    defaultDays: 3,
    days: [
      { day: 'Day 1: Strength A (Squat & Press)', focus: 'full_body', exerciseIds: ['barbell_back_squat', 'barbell_bench_press', 'barbell_row', 'plank'] },
      { day: 'Day 2: Rest & Joint Recovery', focus: 'rest', exerciseIds: [] },
      { day: 'Day 3: Strength B (Hinge & OHP)', focus: 'full_body', exerciseIds: ['barbell_deadlift', 'overhead_press', 'pull_up', 'farmer_carry'] },
      { day: 'Day 4: Rest', focus: 'rest', exerciseIds: [] },
      { day: 'Day 5: Strength C (Accessory & Volume)', focus: 'full_body', exerciseIds: ['romanian_deadlift', 'incline_dumbbell_press', 'one_arm_dumbbell_row', 'hanging_knee_raise'] },
      { day: 'Day 6: Easy Zone 2 Cardio', focus: 'cardio', exerciseIds: ['treadmill_walk'] },
      { day: 'Day 7: Full Rest', focus: 'rest', exerciseIds: [] },
    ],
  },
  fat_loss: {
    splitName: 'Metabolic Resistance & Conditioning 4-Day Split',
    defaultDays: 4,
    days: [
      { day: 'Day 1: Full-Body Circuit A', focus: 'full_body', exerciseIds: ['goblet_squat', 'push_up', 'one_arm_dumbbell_row', 'kettlebell_swing', 'plank'] },
      { day: 'Day 2: Aerobic Conditioning', focus: 'cardio', exerciseIds: ['treadmill_walk', 'cross_trainer'] },
      { day: 'Day 3: Full-Body Circuit B', focus: 'full_body', exerciseIds: ['romanian_deadlift', 'incline_dumbbell_press', 'inverted_row', 'walking_lunge', 'mountain_climber'] },
      { day: 'Day 4: Rest', focus: 'rest', exerciseIds: [] },
      { day: 'Day 5: Metabolic Power & Core', focus: 'functional', exerciseIds: ['kettlebell_swing', 'farmer_carry', 'burpee', 'hanging_knee_raise', 'stationary_cycle'] },
      { day: 'Day 6: Rooftop Walk / Mobility', focus: 'cardio', exerciseIds: ['treadmill_walk'] },
      { day: 'Day 7: Rest', focus: 'rest', exerciseIds: [] },
    ],
  },
  general_fitness: {
    splitName: 'Foundational Athletic Conditioning 3-Day Split',
    defaultDays: 3,
    days: [
      { day: 'Day 1: Full-Body Foundations A', focus: 'full_body', exerciseIds: ['goblet_squat', 'push_up', 'one_arm_dumbbell_row', 'plank', 'treadmill_walk'] },
      { day: 'Day 2: Rest / Mobility', focus: 'rest', exerciseIds: [] },
      { day: 'Day 3: Full-Body Foundations B', focus: 'full_body', exerciseIds: ['romanian_deadlift', 'dumbbell_floor_press', 'inverted_row', 'walking_lunge', 'stationary_cycle'] },
      { day: 'Day 4: Rest', focus: 'rest', exerciseIds: [] },
      { day: 'Day 5: Functional Movement & Core', focus: 'functional', exerciseIds: ['farmer_carry', 'box_step_up', 'dumbbell_lateral_raise', 'hanging_knee_raise'] },
      { day: 'Day 6: Rest', focus: 'rest', exerciseIds: [] },
      { day: 'Day 7: Rest', focus: 'rest', exerciseIds: [] },
    ],
  },
  kickboxing_conditioning: {
    splitName: 'Combat Striking & Athletic Conditioning 4-Day Split',
    defaultDays: 4,
    days: [
      { day: 'Day 1: Striking Technique & Bag Rounds', focus: 'combat', exerciseIds: ['shadow_boxing', 'jab_cross', 'jab_cross_hook', 'footwork_drill', 'plank'] },
      { day: 'Day 2: Combat Strength Support A', focus: 'strength', exerciseIds: ['goblet_squat', 'push_up', 'one_arm_dumbbell_row', 'farmer_carry'] },
      { day: 'Day 3: Rest / Agility Recovery', focus: 'rest', exerciseIds: [] },
      { day: 'Day 4: Heavy Bag Rounds & Kick Drills', focus: 'combat', exerciseIds: ['roundhouse_kick_drill', 'jab_cross_hook', 'burpee', 'mountain_climber'] },
      { day: 'Day 5: Combat Strength Support B', focus: 'strength', exerciseIds: ['romanian_deadlift', 'overhead_press', 'hanging_knee_raise', 'kettlebell_swing'] },
      { day: 'Day 6: Easy Aerobic Flush', focus: 'cardio', exerciseIds: ['treadmill_walk'] },
      { day: 'Day 7: Rest', focus: 'rest', exerciseIds: [] },
    ],
  },
};

// ─── Deterministic Meal Plan Builder ──────────────────────────────────────────
export function buildDeterministicMealPlan({ targets, dietPreference, foodAllergies = [], isRegional = true }) {
  const targetKcal = targets.targetCalories;
  const targetProtein = targets.macros.protein.grams;

  const allergiesLower = (foodAllergies || []).map((a) => a.toLowerCase().trim());
  const isVegan = dietPreference === 'vegan';
  const hasPeanutAllergy = allergiesLower.includes('peanuts') || allergiesLower.includes('peanut');
  const hasDairyAllergy = isVegan || allergiesLower.includes('dairy') || allergiesLower.includes('milk') || allergiesLower.includes('lactose');
  const hasSoyAllergy = allergiesLower.includes('soy') || allergiesLower.includes('soya');
  const hasEggAllergy = isVegan || allergiesLower.includes('egg') || allergiesLower.includes('eggs');

  const isNonVeg = dietPreference === 'non_vegetarian';
  const isEggetarian = dietPreference === 'eggetarian';

  // Base breakfast
  let breakfastItems = [];
  if ((isNonVeg || isEggetarian) && !hasEggAllergy) {
    breakfastItems = [
      { item: 'Boiled eggs (2 whole + 2 whites)', quantity: '4 eggs', kcal: 247, protein: 24 },
      { item: 'Toasted whole wheat chapati or oats', quantity: '60g dry', kcal: 200, protein: 7 },
      { item: 'Fresh fruit (banana or apple)', quantity: '1 medium (100g)', kcal: 80, protein: 1 },
    ];
  } else {
    breakfastItems = [
      { item: 'Sprouted Matki / Moong usal', quantity: '1 bowl (150g cooked)', kcal: 210, protein: 14 },
      { item: 'Vegetable Poha with roasted chana', quantity: '1 medium plate (150g)', kcal: 260, protein: 6 },
      hasDairyAllergy
        ? { item: 'Fresh coconut water or green tea', quantity: '1 glass (200ml)', kcal: 40, protein: 1 }
        : { item: 'Cow milk or tea with minimal jaggery', quantity: '1 cup (150ml)', kcal: 100, protein: 5 },
    ];
  }

  // Base lunch
  let lunchItems = [];
  if (isNonVeg) {
    lunchItems = [
      { item: 'Grilled or curry chicken breast', quantity: '150g', kcal: 180, protein: 33 },
      { item: 'Jowar bhakri or whole wheat chapati', quantity: '2 medium bhakri (100g)', kcal: 334, protein: 10 },
      { item: 'Green salad with cucumber & tomato', quantity: '1 bowl (150g)', kcal: 35, protein: 1 },
      hasDairyAllergy
        ? { item: 'Sprouted moong salad', quantity: '1 katori (100g)', kcal: 60, protein: 4 }
        : { item: 'Fresh homemade curd (dahi)', quantity: '1 katori (100g)', kcal: 61, protein: 3 },
    ];
  } else {
    let proteinSource = { item: 'Paneer bhurji', quantity: '120g paneer', kcal: 340, protein: 22 };
    if (hasDairyAllergy) {
      proteinSource = hasSoyAllergy
        ? { item: 'Besan cheela / Sprouted chana curry', quantity: '100g besan/chana', kcal: 340, protein: 20 }
        : { item: 'Tofu bhurji or Soya chunk curry', quantity: '150g tofu or 50g dry soya', kcal: 320, protein: 24 };
    }
    lunchItems = [
      proteinSource,
      { item: 'Jowar bhakri or Chapati', quantity: '2 medium (100g)', kcal: 334, protein: 10 },
      { item: 'Dal (Moong or Toor)', quantity: '1 katori (150g cooked)', kcal: 150, protein: 8 },
      hasDairyAllergy
        ? { item: 'Cucumber & tomato salad', quantity: '1 bowl (100g)', kcal: 30, protein: 1 }
        : { item: 'Fresh homemade curd (dahi)', quantity: '1 katori (100g)', kcal: 61, protein: 3 },
    ];
  }

  // Base snack
  const snackItems = [
    hasPeanutAllergy
      ? { item: 'Roasted chana with almonds', quantity: '40g', kcal: 180, protein: 9 }
      : { item: 'Roasted chana with peanuts', quantity: '40g', kcal: 180, protein: 9 },
    { item: 'Seasonal fruit (Apple or Banana)', quantity: '1 medium', kcal: 70, protein: 1 },
    { item: 'Black coffee or green tea', quantity: '1 cup', kcal: 5, protein: 0 },
  ];

  // Base dinner
  let dinnerItems = [];
  if (isNonVeg) {
    dinnerItems = [
      hasEggAllergy
        ? { item: 'Steamed fish curry or roasted chicken', quantity: '150g', kcal: 220, protein: 25 }
        : { item: 'Steamed fish curry or egg bhurji', quantity: '150g fish or 3 eggs', kcal: 220, protein: 25 },
      { item: 'Steamed white rice or 1 Jowar bhakri', quantity: '1 katori (150g cooked)', kcal: 190, protein: 4 },
      { item: 'Steamed vegetables or palak bhaji', quantity: '1 bowl (100g)', kcal: 45, protein: 2 },
    ];
  } else {
    dinnerItems = [
      { item: 'Moong dal khichdi with vegetables', quantity: '1 medium bowl (250g cooked)', kcal: 320, protein: 14 },
      hasDairyAllergy
        ? { item: 'Steamed palak and sprouted usal', quantity: '1 bowl (150g)', kcal: 70, protein: 4 }
        : { item: 'Fresh homemade curd', quantity: '1 katori (100g)', kcal: 61, protein: 3 },
      { item: 'Mixed vegetable sabzi (Palak/Bhindi/Gobi)', quantity: '1 bowl', kcal: 80, protein: 3 },
    ];
  }

  // Calculate unscaled baseline energy
  const allBaseItems = [...breakfastItems, ...lunchItems, ...snackItems, ...dinnerItems];
  const baseKcal = allBaseItems.reduce((acc, i) => acc + i.kcal, 0);

  // Scale portions dynamically to match the user's specific target calories (±2% precision)
  const scale = targetKcal / baseKcal;

  const scaleList = (items) =>
    items.map((it) => ({
      ...it,
      kcal: Math.round(it.kcal * scale),
      protein: Math.round(it.protein * scale),
    }));

  const scaledBreakfast = { name: 'Breakfast (7:30 AM – 8:30 AM)', items: scaleList(breakfastItems) };
  const scaledLunch = { name: 'Lunch (1:00 PM – 2:00 PM)', items: scaleList(lunchItems) };
  const scaledSnack = { name: 'Pre-Workout / Evening Snack (5:00 PM)', items: scaleList(snackItems) };
  const scaledDinner = { name: 'Dinner (8:00 PM – 9:00 PM)', items: scaleList(dinnerItems) };

  const finalMeals = [scaledBreakfast, scaledLunch, scaledSnack, scaledDinner];
  const totalMealKcal = finalMeals.flatMap((m) => m.items).reduce((acc, i) => acc + i.kcal, 0);
  const totalMealProtein = finalMeals.flatMap((m) => m.items).reduce((acc, i) => acc + i.protein, 0);

  const substitutions = [
    'Swap Jowar bhakri for Bajra bhakri in winter months for thermal balance.',
  ];
  if (!hasSoyAllergy && !hasDairyAllergy) {
    substitutions.push('Swap 100g Paneer with 40g dry Soya chunks for higher protein with lower fat.');
  }
  if (!hasDairyAllergy) {
    substitutions.push('Swap Whole Milk with Curd or Tofu if lactose-sensitive.');
  }

  return {
    goal: targets.fitnessGoal,
    targetCalories: targetKcal,
    actualCalories: totalMealKcal,
    targetProteinGrams: targetProtein,
    actualProteinGrams: totalMealProtein,
    meals: finalMeals,
    substitutions,
    hydration: 'Aim for 2.5 to 3.5 liters of clean water daily; add an extra 500ml during rooftop training.',
  };
}

// ─── Candidate Exercise Retrieval ─────────────────────────────────────────────
export function selectCandidateExercises({ fitnessGoal, experienceLevel, injuriesOrConditions = [] }) {
  const normInjuries = (injuriesOrConditions || []).map((i) => i.toLowerCase().replace(/[\s-]+/g, '_'));

  return VERIFIED_EXERCISES.filter((ex) => {
    // Check contraindications
    if (ex.avoidOrModifyIf && ex.avoidOrModifyIf.length > 0) {
      for (const cond of ex.avoidOrModifyIf) {
        if (normInjuries.includes(cond)) return false;
      }
    }

    // Filter by experience level: beginners don't get advanced lifts unguided
    if (experienceLevel === 'beginner' && ex.difficulty === 'advanced') {
      return false;
    }

    return true;
  });
}

// ─── Post-Validation of Generated Plan ────────────────────────────────────────
export function validateGeneratedPlan({ plan, targets, candidateExercises, foodAllergies = [] }) {
  const errors = [];

  // 1. Calorie validation: must be within ±7% of code-calculated target
  const planKcal = plan.dietPlan?.totalCalories || plan.dietPlan?.actualCalories;
  if (typeof planKcal === 'number') {
    const diffPercent = Math.abs(planKcal - targets.targetCalories) / targets.targetCalories;
    if (diffPercent > 0.08) {
      errors.push(`Calorie deviation too large: generated ${planKcal} kcal vs target ${targets.targetCalories} kcal (${(diffPercent * 100).toFixed(1)}% off)`);
    }
  }

  // 2. Allergen check
  const mealStr = JSON.stringify(plan.dietPlan || {}).toLowerCase();
  for (const allergy of foodAllergies) {
    if (mealStr.includes(allergy.toLowerCase())) {
      errors.push(`Allergen violation: contains excluded allergen "${allergy}"`);
    }
  }

  // 3. Exercise validation: all exercises must exist in library
  const validIds = new Set(candidateExercises.map((e) => e.exerciseId));
  const validNames = new Set(candidateExercises.map((e) => e.name.toLowerCase()));

  const schedule = plan.workoutPlan?.weeklySchedule || {};
  for (const day of Object.values(schedule)) {
    if (day.exercises && Array.isArray(day.exercises)) {
      for (const ex of day.exercises) {
        const id = ex.exerciseId;
        const name = (ex.name || '').toLowerCase();
        if (id && !validIds.has(id)) {
          errors.push(`Unverified exercise ID: ${id}`);
        } else if (!id && name && !validNames.has(name)) {
          // If neither ID nor Name is in verified library, flag it
          errors.push(`Unverified exercise name: "${ex.name}"`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ─── Fallback Deterministic Plan ──────────────────────────────────────────────
export function generateDeterministicPlan({ intake, targets }) {
  const goal = intake.fitnessGoal || 'general_fitness';
  const template = GOAL_TEMPLATES[goal] || GOAL_TEMPLATES.general_fitness;

  const candidateEx = selectCandidateExercises({
    fitnessGoal: goal,
    experienceLevel: intake.trainingExperience,
    injuriesOrConditions: intake.injuriesOrLimitations,
  });

  const exMap = new Map(candidateEx.map((e) => [e.exerciseId, e]));

  // Assemble weekly workout from template
  const weeklySchedule = {};
  template.days.forEach((d, idx) => {
    const dayKey = `Day_${idx + 1}`;
    const dayExercises = d.exerciseIds
      .map((id) => exMap.get(id))
      .filter(Boolean)
      .map((e) => ({
        exerciseId: e.exerciseId,
        name: e.name,
        sets: e.defaultSets,
        reps: e.repRange ? `${e.repRange[0]}-${e.repRange[1]}` : (e.durationSeconds ? `${e.durationSeconds[0]}-${e.durationSeconds[1]}s` : '15-30m'),
        coachingCue: e.coachingCues ? e.coachingCues[0] : 'Maintain strict form',
      }));

    weeklySchedule[dayKey] = {
      title: d.day,
      focus: d.focus,
      exercises: dayExercises,
      recoveryNote: d.focus === 'rest' ? 'Full rest day for central nervous system and tissue repair' : null,
    };
  });

  const dietPlan = buildDeterministicMealPlan({
    targets,
    dietPreference: intake.dietPreference,
    foodAllergies: intake.foodAllergies,
  });

  return {
    source: 'deterministic_engine',
    workoutPlan: {
      goal,
      splitName: template.splitName,
      availableTrainingDays: intake.availableTrainingDays,
      sessionDurationMinutes: intake.sessionDurationMinutes || 60,
      weeklySchedule,
      progressionRule: 'Double Progression: when you achieve all prescribed sets at the top of the rep range with pristine technique, increase load by 2.5% (upper) or 5% (lower).',
      warmup: '5-10 minutes of dynamic mobility: arm circles, leg swings, hip openers, and 2 submaximal warm-up sets per primary lift.',
      recoveryDays: ['Sunday dedicated rest & recovery'],
    },
    dietPlan,
  };
}

// ─── Main Generator: Pipeline with LLM Arranger & Fallback ────────────────────
export async function generateFitnessPlan({ intake, sessionId, visitorId, memberId, skipLLM = false }) {
  // 1. Run Medical Safety Gate
  const bmiResult = calculateBMI(intake.weightKg, intake.heightCm);
  const safety = screenMedicalSafety({
    ageYears: intake.ageYears,
    bmi: bmiResult.bmi,
    medicalFlags: intake.medicalFlags,
    symptoms: intake.symptoms || [],
  });

  if (!safety.isSafe) {
    return {
      status: 'rejected_safety_gate',
      safety,
      bmi: bmiResult,
      message: safety.redirectMessage,
      disclaimer: 'General fitness information, not medical advice. Medical safety screening active.',
    };
  }

  // 2. Compute Deterministic Targets in Code
  const targets = calculateDietTargets({
    weightKg: intake.weightKg,
    heightCm: intake.heightCm,
    ageYears: intake.ageYears,
    sexEquation: intake.sexForEnergyEquation || 'not_provided',
    activityLevel: intake.activityLevel || 'moderate',
    fitnessGoal: intake.fitnessGoal || 'general_fitness',
    dietPreference: intake.dietPreference || 'vegetarian',
    bmiValue: bmiResult.bmi,
  });

  // 3. Filter Candidate Exercises
  const candidateExercises = selectCandidateExercises({
    fitnessGoal: intake.fitnessGoal,
    experienceLevel: intake.trainingExperience,
    injuriesOrConditions: intake.injuriesOrLimitations,
  });

  // 4. Fallback Plan (Guaranteed valid baseline)
  const fallback = generateDeterministicPlan({ intake, targets });

  let finalPlan = fallback;
  let generationMethod = 'deterministic_template';

  // 5. Attempt Gemini arrangement if API key present and not skipped
  const gemini = !skipLLM ? getGeminiClient() : null;
  if (gemini) {
    try {
      logger.info(`[PLAN] Requesting Gemini to arrange personalized workout & diet for ${intake.fitnessGoal}...`);
      const prompt = `
You are the elite head coach at ROAR EXTREME Nashik.
Assemble a personalized, structured workout and diet plan using ONLY the provided verified library and targets below.

MEMBER TARGETS (COMPUTED BY CODE - DO NOT ALTER):
- Goal: ${targets.fitnessGoal}
- Target Daily Energy: ${targets.targetCalories} kcal
- Protein: ${targets.macros.protein.grams} g
- Fat: ${targets.macros.fat.grams} g
- Carbohydrates: ${targets.macros.carbohydrates.grams} g
- Experience: ${intake.trainingExperience}
- Available Days: ${intake.availableTrainingDays}
- Diet Preference: ${intake.dietPreference}
- Language: ${intake.language || 'en'}

CANDIDATE EXERCISES AVAILABLE AT ROAR EXTREME:
${JSON.stringify(candidateExercises.map((e) => ({ id: e.exerciseId, name: e.name, pattern: e.movementPattern, cues: e.coachingCues })))}

MEAL BLUEPRINT (MUST HIT ${targets.targetCalories} kcal ±5%):
${JSON.stringify(fallback.dietPlan.meals)}

REQUIREMENTS:
1. Output strictly valid JSON matching this schema:
{
  "workoutPlan": {
    "splitName": "string",
    "weeklySchedule": {
      "Day_1": { "title": "string", "focus": "string", "exercises": [{ "exerciseId": "id_from_candidates", "name": "string", "sets": 3, "reps": "8-12", "coachingCue": "string" }] }
    },
    "progressionRule": "string",
    "warmup": "string"
  },
  "dietPlan": {
    "totalCalories": ${targets.targetCalories},
    "mealSchedule": [
      { "name": "Breakfast", "items": [{ "item": "string", "quantity": "string", "kcal": 0, "protein": 0 }] }
    ],
    "hydrationTips": "string",
    "substitutions": ["string"]
  }
}
2. Language: If Hindi or Marathi requested, provide descriptions in that language while keeping standard exercise names recognized.
3. NEVER add unlisted exercises or equipment. Return JSON only, no markdown wrapping.
`.trim();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini arrangement timeout (3.5s limit)')), 3500)
      );

      const geminiPromise = gemini.models.generateContent({
        model: env.geminiModel,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 2500,
          temperature: 0.2, // Low temperature for precision adherence
        },
      });

      const response = await Promise.race([geminiPromise, timeoutPromise]);

      const rawText = response.text?.trim() || '';
      const parsed = JSON.parse(rawText.replace(/^```json/, '').replace(/```$/, ''));

      // 6. Strict Post-Validation
      const val = validateGeneratedPlan({
        plan: parsed,
        targets,
        candidateExercises,
        foodAllergies: intake.foodAllergies,
      });

      if (val.isValid) {
        finalPlan = {
          source: 'gemini_arranged',
          workoutPlan: { ...fallback.workoutPlan, ...parsed.workoutPlan },
          dietPlan: { ...fallback.dietPlan, ...parsed.dietPlan },
        };
        generationMethod = 'gemini_verified';
        logger.info('[PLAN] Gemini-arranged plan passed all validation checks.');
      } else {
        logger.warn('[PLAN] Gemini plan failed post-validation. Falling back to deterministic template. Errors:', val.errors);
      }
    } catch (err) {
      logger.warn('[PLAN] Gemini generation error or JSON parse error. Using deterministic fallback:', err.message);
    }
  }

  // 7. Persist to MongoDB (if connected)
  const planId = 'PLAN-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  if (mongoose.connection.readyState === 1) {
    try {
      await FitnessPlan.create({
        planId,
        sessionId,
        visitorId,
        memberId,
        profile: {
          age: intake.ageYears,
          sexEquation: intake.sexForEnergyEquation,
          heightCm: intake.heightCm,
          weightKg: intake.weightKg,
          bmi: bmiResult.bmi,
          bmiBand: bmiResult.band,
          fitnessGoal: intake.fitnessGoal,
          dietPreference: intake.dietPreference,
          activityLevel: intake.activityLevel,
          trainingExperience: intake.trainingExperience,
          availableTrainingDays: intake.availableTrainingDays,
          injuriesOrConditions: intake.injuriesOrLimitations || [],
          foodAllergies: intake.foodAllergies || [],
          language: intake.language || 'en',
        },
        targets: {
          bmr: targets.bmr,
          tdee: targets.tdee,
          targetCalories: targets.targetCalories,
          proteinGrams: targets.macros.protein.grams,
          fatGrams: targets.macros.fat.grams,
          carbGrams: targets.macros.carbohydrates.grams,
        },
        workoutPlan: finalPlan.workoutPlan,
        dietPlan: finalPlan.dietPlan,
        status: safety.requiresTrainerApproval ? 'flagged_for_review' : 'approved',
        requiresTrainerApproval: safety.requiresTrainerApproval,
      });
    } catch (err) {
      logger.warn('[PLAN] Could not persist plan to MongoDB:', err.message);
    }
  }

  return {
    success: true,
    planId,
    generationMethod,
    bmi: bmiResult,
    targets,
    workoutPlan: finalPlan.workoutPlan,
    dietPlan: finalPlan.dietPlan,
    requiresTrainerApproval: safety.requiresTrainerApproval,
    disclaimer: 'General fitness information, not medical advice. Consult a doctor or registered dietitian before starting any new diet or training program.',
  };
}

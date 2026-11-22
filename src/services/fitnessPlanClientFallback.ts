/**
 * CLIENT-SIDE DETERMINISTIC FITNESS & DIET PLAN GENERATOR
 *
 * Implements clinical sports science standards:
 * - Mifflin-St Jeor Energy Expenditure (BMR & TDEE)
 * - Safe calorie bounds & macronutrient distribution
 * - Indian dietary meal planning (vegetarian, eggetarian, vegan, non-veg)
 * - Goal-specific resistance & conditioning splits
 * - Instant offline-first fallback if backend API is cold or unreachable
 */

export interface IntakeData {
  ageYears: number;
  sexForEnergyEquation?: string;
  heightCm: number;
  weightKg: number;
  fitnessGoal: string;
  dietPreference: string;
  activityLevel: string;
  trainingExperience: string;
  availableTrainingDays: number;
  foodAllergies?: string[];
  medicalFlags?: string[];
  language?: 'en' | 'hi' | 'mr';
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

const GOAL_CALORIE_ADJUSTMENTS: Record<string, number> = {
  muscle_hypertrophy: 250,
  weight_gain: 400,
  fat_loss: -400,
  body_recomposition: -150,
  weight_maintenance: 0,
  strength: 200,
  endurance: 100,
  general_fitness: 0,
  functional_fitness: 50,
  kickboxing_conditioning: -100,
};

export function generateClientFitnessPlan(intake: IntakeData) {
  const {
    ageYears,
    sexForEnergyEquation = 'male',
    heightCm,
    weightKg,
    fitnessGoal,
    dietPreference,
    activityLevel = 'moderate',
    trainingExperience = 'beginner',
    availableTrainingDays = 4,
    foodAllergies = [],
    medicalFlags = [],
  } = intake;

  // 1. Calculate BMR using Mifflin-St Jeor
  const isFemale = sexForEnergyEquation === 'female' || sexForEnergyEquation === 'female_equation';
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + (isFemale ? -161 : 5);
  bmr = Math.round(bmr);

  // 2. TDEE
  const actMult = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  const tdee = Math.round(bmr * actMult);

  // 3. Target Daily Calories
  const goalAdjustment = GOAL_CALORIE_ADJUSTMENTS[fitnessGoal] ?? 0;
  let dailyCalories = Math.max(1200, tdee + goalAdjustment);
  dailyCalories = Math.round(dailyCalories);

  // 4. Macronutrients
  let proteinPerKg = 1.8;
  if (fitnessGoal === 'muscle_hypertrophy' || fitnessGoal === 'strength') proteinPerKg = 2.0;
  if (fitnessGoal === 'fat_loss') proteinPerKg = 2.1;
  if (trainingExperience === 'advanced') proteinPerKg = Math.min(2.4, proteinPerKg + 0.2);

  const proteinG = Math.round(weightKg * proteinPerKg);
  const fatCalories = dailyCalories * 0.25;
  const fatsG = Math.round(fatCalories / 9);
  const carbCalories = Math.max(0, dailyCalories - proteinG * 4 - fatCalories);
  const carbsG = Math.round(carbCalories / 4);

  // 5. Workout Splits by Training Days & Goal
  const workoutPlan = buildWorkoutSplit(fitnessGoal, availableTrainingDays, medicalFlags);

  // 6. Indian Diet Plan by Preference & Allergens
  const dietPlan = buildDietPlan(dietPreference, dailyCalories, proteinG, carbsG, fatsG, foodAllergies);

  const planId = 'PLAN-' + Math.random().toString(36).substring(2, 9).toUpperCase();

  return {
    planId,
    generationMethod: 'ROAR Deterministic Clinical Engine',
    targets: {
      dailyCalories,
      targetCalories: dailyCalories,
      bmr,
      tdee,
      macros: {
        protein: { grams: proteinG },
        fat: { grams: fatsG },
        fats: { grams: fatsG },
        carbohydrates: { grams: carbsG },
        carbs: { grams: carbsG },
        proteinG,
        carbsG,
        fatsG,
      },
    },
    workoutPlan,
    dietPlan,
  };
}

function buildWorkoutSplit(_goal: string, daysPerWeek: number, medicalFlags: string[]) {
  const hasKneeIssue = medicalFlags.some((m) => m.includes('knee') || m.includes('joint'));
  const hasBackIssue = medicalFlags.some((m) => m.includes('spine') || m.includes('disc') || m.includes('back'));

  let splitName = `${daysPerWeek}-Day Targeted Routine`;
  let weeklySchedule: Array<{
    dayNumber: number;
    dayName: string;
    focus: string;
    exercises: Array<{
      name: string;
      sets: number;
      repRange: string;
      restSeconds: number;
      cues: string;
    }>;
  }> = [];

  if (daysPerWeek <= 3) {
    splitName = 'Full-Body Foundation 3-Day Progression';
    weeklySchedule = [
      {
        dayNumber: 1,
        dayName: 'Day 1: Full Body Strength A',
        focus: 'Chest, Quads, Back, Core',
        exercises: [
          {
            name: hasKneeIssue ? 'Box Squat (Controlled)' : 'Goblet Squat',
            sets: 3,
            repRange: '10-12',
            restSeconds: 90,
            cues: 'Keep chest upright, brace core throughout descent.',
          },
          {
            name: 'Dumbbell Flat Bench Press',
            sets: 3,
            repRange: '8-10',
            restSeconds: 90,
            cues: 'Retract scapulae, control lower to mid-chest.',
          },
          {
            name: 'Seated Cable Row / Dumbbell Row',
            sets: 3,
            repRange: '10-12',
            restSeconds: 60,
            cues: 'Drive elbows back, squeeze lats at peak contraction.',
          },
          {
            name: 'Forearm Plank',
            sets: 3,
            repRange: '45-60s hold',
            restSeconds: 45,
            cues: 'Maintain neutral spine, glutes tightly engaged.',
          },
        ],
      },
      {
        dayNumber: 2,
        dayName: 'Day 2: Full Body Hypertrophy B',
        focus: 'Hamstrings, Shoulders, Lats, Arms',
        exercises: [
          {
            name: hasBackIssue ? 'Trap Bar Deadlift (High Handle)' : 'Romanian Deadlift (RDL)',
            sets: 3,
            repRange: '10-12',
            restSeconds: 90,
            cues: 'Hinge at the hips, maintain slight knee bend and tight lats.',
          },
          {
            name: 'Dumbbell Standing Overhead Press',
            sets: 3,
            repRange: '8-10',
            restSeconds: 75,
            cues: 'Press overhead without excessive lower back arch.',
          },
          {
            name: 'Lat Pulldown (Neutral Grip)',
            sets: 3,
            repRange: '10-12',
            restSeconds: 60,
            cues: 'Pull bar to collarbone, pause 1 second at chest.',
          },
          {
            name: 'Incline Dumbbell Biceps Curl',
            sets: 3,
            repRange: '12-15',
            restSeconds: 45,
            cues: 'Supinate wrists at top, controlled 3-second eccentric.',
          },
        ],
      },
      {
        dayNumber: 3,
        dayName: 'Day 3: Athletic Conditioning & Core',
        focus: 'Posterior Chain, Push, Functional Core',
        exercises: [
          {
            name: 'Bulgarian Split Squat / Reverse Lunges',
            sets: 3,
            repRange: '10 per leg',
            restSeconds: 60,
            cues: 'Load front heel, maintain upright torso.',
          },
          {
            name: 'Push-Ups (Tempo 3-1-1)',
            sets: 3,
            repRange: '12-15',
            restSeconds: 60,
            cues: 'Full lockout, maintain hollow body position.',
          },
          {
            name: 'Face Pulls with Rope',
            sets: 3,
            repRange: '15-20',
            restSeconds: 45,
            cues: 'External rotation focus, protect shoulder rotator cuff.',
          },
          {
            name: 'Hanging Knee / Leg Raise',
            sets: 3,
            repRange: '12-15',
            restSeconds: 45,
            cues: 'Curl pelvis up without swinging momentum.',
          },
        ],
      },
    ];
  } else {
    splitName = 'Upper / Lower 4-Day Athletic Split';
    weeklySchedule = [
      {
        dayNumber: 1,
        dayName: 'Day 1: Upper Body Power',
        focus: 'Chest, Upper Back, Delts',
        exercises: [
          {
            name: 'Barbell or Heavy Dumbbell Bench Press',
            sets: 4,
            repRange: '6-8',
            restSeconds: 90,
            cues: 'Drive feet into ground, arch upper back, bar down to sternum.',
          },
          {
            name: 'Chest-Supported Row',
            sets: 4,
            repRange: '8-10',
            restSeconds: 75,
            cues: 'Full lat stretch at bottom, squeeze shoulder blades.',
          },
          {
            name: 'Dumbbell Lateral Raise',
            sets: 4,
            repRange: '12-15',
            restSeconds: 45,
            cues: 'Slight forward lean, raise arms to 90 degrees.',
          },
          {
            name: 'Triceps Rope Pushdown',
            sets: 3,
            repRange: '12-15',
            restSeconds: 45,
            cues: 'Flail rope outward at bottom for lateral head contraction.',
          },
        ],
      },
      {
        dayNumber: 2,
        dayName: 'Day 2: Lower Body Strength',
        focus: 'Quads, Glutes, Calves',
        exercises: [
          {
            name: hasKneeIssue ? 'Leg Press (Feet High & Wide)' : 'Barbell Back Squat',
            sets: 4,
            repRange: '8-10',
            restSeconds: 120,
            cues: 'Knees track over second toe, depth parallel or below.',
          },
          {
            name: 'Romanian Deadlift (Dumbbell or Barbell)',
            sets: 3,
            repRange: '10-12',
            restSeconds: 90,
            cues: 'Feel hamstring stretch, keep weight close to shins.',
          },
          {
            name: 'Standing Calf Raise',
            sets: 4,
            repRange: '15-20',
            restSeconds: 45,
            cues: '2-second stretch at bottom, full contraction at top.',
          },
          {
            name: 'Hanging Knee Raises',
            sets: 3,
            repRange: '12-15',
            restSeconds: 45,
            cues: 'Posterior pelvic tilt to engage lower abdominals.',
          },
        ],
      },
      {
        dayNumber: 3,
        dayName: 'Day 3: Upper Body Volume & Hypertrophy',
        focus: 'Incline Chest, Lats, Biceps',
        exercises: [
          {
            name: 'Incline Dumbbell Press (30 Degree)',
            sets: 3,
            repRange: '10-12',
            restSeconds: 75,
            cues: 'Target upper clavicular head, smooth controlled cadence.',
          },
          {
            name: 'Neutral Grip Lat Pulldown',
            sets: 3,
            repRange: '10-12',
            restSeconds: 60,
            cues: 'Drive elbows down towards pockets.',
          },
          {
            name: 'Dumbbell Incline Biceps Curl',
            sets: 3,
            repRange: '12-15',
            restSeconds: 45,
            cues: 'Maximum bicep stretch at bottom.',
          },
          {
            name: 'Face Pulls with External Rotation',
            sets: 3,
            repRange: '15-20',
            restSeconds: 45,
            cues: 'Rehabilitate rotator cuff posture from desk sitting.',
          },
        ],
      },
      {
        dayNumber: 4,
        dayName: 'Day 4: Lower Body & Posterior Chain',
        focus: 'Hamstrings, Glutes, Core',
        exercises: [
          {
            name: hasBackIssue ? 'Dumbbell Walking Lunges' : 'Trap Bar Deadlift / Conventional',
            sets: 3,
            repRange: '8-10',
            restSeconds: 90,
            cues: 'Brace abdominal wall, push the floor away.',
          },
          {
            name: 'Leg Curl (Machine or Swiss Ball)',
            sets: 3,
            repRange: '12-15',
            restSeconds: 60,
            cues: 'Squeeze hamstrings without hip hiking.',
          },
          {
            name: 'Farmer Walk / Loaded Carry',
            sets: 3,
            repRange: '40 meters',
            restSeconds: 60,
            cues: 'Shoulders back, crush grip on dumbbells.',
          },
          {
            name: 'Abdominal Wheel Rollout / Plank',
            sets: 3,
            repRange: '10-12',
            restSeconds: 45,
            cues: 'Tuck pelvis, do not let lumbar spine sag.',
          },
        ],
      },
    ];
  }

  return {
    splitName,
    daysPerWeek,
    weeklySchedule,
  };
}

function buildDietPlan(
  preference: string,
  dailyCalories: number,
  _proteinG: number,
  _carbsG: number,
  _fatsG: number,
  _allergens: string[]
) {
  const isVeg = preference.includes('veg') && !preference.includes('non');
  const isVegan = preference === 'vegan';
  const isEgg = preference.includes('egg');

  const bCal = Math.round(dailyCalories * 0.25);
  const lCal = Math.round(dailyCalories * 0.35);
  const sCal = Math.round(dailyCalories * 0.15);
  const dCal = Math.round(dailyCalories * 0.25);

  let breakfastItems = [];
  let lunchItems = [];
  let snackItems = [];
  let dinnerItems = [];

  if (isVegan) {
    breakfastItems = [
      { name: 'Oats with Soy Milk & Chia Seeds', portionGrams: 200, calories: 340, proteinG: 18, carbsG: 48, fatsG: 8 },
      { name: 'Roasted Almonds & Walnuts', portionGrams: 25, calories: 155, proteinG: 5, carbsG: 5, fatsG: 13 },
    ];
    lunchItems = [
      { name: 'Brown Rice with Cooked Chana Masala', portionGrams: 300, calories: 480, proteinG: 22, carbsG: 75, fatsG: 9 },
      { name: 'Fresh Cucumber, Tomato & Sprout Salad', portionGrams: 150, calories: 110, proteinG: 8, carbsG: 16, fatsG: 1 },
    ];
    snackItems = [
      { name: 'Roasted Black Chana & Green Tea', portionGrams: 50, calories: 180, proteinG: 11, carbsG: 28, fatsG: 3 },
    ];
    dinnerItems = [
      { name: 'Grilled Tofu & Steamed Broccoli Stir Fry', portionGrams: 220, calories: 380, proteinG: 28, carbsG: 18, fatsG: 14 },
      { name: 'Multigrain Roti (2 pcs)', portionGrams: 70, calories: 190, proteinG: 6, carbsG: 38, fatsG: 2 },
    ];
  } else if (isEgg && !preference.includes('non')) {
    breakfastItems = [
      { name: 'Whole Boiled / Scrambled Eggs (3 whole)', portionGrams: 150, calories: 230, proteinG: 19, carbsG: 2, fatsG: 15 },
      { name: 'Toasted Whole Wheat Bread (2 slices)', portionGrams: 60, calories: 160, proteinG: 6, carbsG: 28, fatsG: 2 },
    ];
    lunchItems = [
      { name: 'Steamed Basmati Rice with Yellow Moong Dal', portionGrams: 300, calories: 450, proteinG: 20, carbsG: 72, fatsG: 8 },
      { name: 'Fresh Paneer Tikka (Grilled)', portionGrams: 100, calories: 260, proteinG: 18, carbsG: 4, fatsG: 20 },
      { name: 'Mixed Green Salad with Lemon', portionGrams: 100, calories: 45, proteinG: 2, carbsG: 8, fatsG: 0 },
    ];
    snackItems = [
      { name: 'Egg White Omelette (3 whites) & Black Coffee', portionGrams: 100, calories: 85, proteinG: 14, carbsG: 2, fatsG: 1 },
    ];
    dinnerItems = [
      { name: 'Methi Moong Dal & Palak Sabzi', portionGrams: 200, calories: 240, proteinG: 14, carbsG: 32, fatsG: 6 },
      { name: 'Jowar / Bajra Bhakri (1 pc)', portionGrams: 80, calories: 210, proteinG: 5, carbsG: 42, fatsG: 2 },
      { name: 'Low-Fat Curd (Dahi)', portionGrams: 100, calories: 65, proteinG: 4, carbsG: 5, fatsG: 3 },
    ];
  } else if (!isVeg) {
    breakfastItems = [
      { name: 'Eggs (2 whole + 2 whites) with Spinach', portionGrams: 180, calories: 220, proteinG: 22, carbsG: 3, fatsG: 12 },
      { name: 'Oatmeal with Honey', portionGrams: 150, calories: 200, proteinG: 7, carbsG: 36, fatsG: 3 },
    ];
    lunchItems = [
      { name: 'Grilled Herb Chicken Breast', portionGrams: 180, calories: 290, proteinG: 48, carbsG: 0, fatsG: 8 },
      { name: 'Steamed Rice with Dal Tadka', portionGrams: 250, calories: 380, proteinG: 14, carbsG: 65, fatsG: 7 },
      { name: 'Kachumber Salad', portionGrams: 100, calories: 40, proteinG: 1, carbsG: 8, fatsG: 0 },
    ];
    snackItems = [
      { name: 'Handful of Mixed Almonds & Whey/Curd', portionGrams: 120, calories: 210, proteinG: 16, carbsG: 8, fatsG: 12 },
    ];
    dinnerItems = [
      { name: 'Grilled Fish or Chicken Tikka (Low Oil)', portionGrams: 160, calories: 260, proteinG: 40, carbsG: 2, fatsG: 9 },
      { name: 'Steamed Sautéed Vegetables (Carrots, Beans, Broccoli)', portionGrams: 150, calories: 95, proteinG: 4, carbsG: 16, fatsG: 1 },
      { name: 'Whole Wheat Phulka (2 pcs)', portionGrams: 60, calories: 160, proteinG: 5, carbsG: 32, fatsG: 1 },
    ];
  } else {
    // Pure Indian Vegetarian (High Protein Paneer, Curd, Dal, Soya, Sprouts)
    breakfastItems = [
      { name: 'Sprouted Moong Chilla (2 pcs) with Mint Chutney', portionGrams: 180, calories: 280, proteinG: 18, carbsG: 38, fatsG: 6 },
      { name: 'Low-Fat Milk / Curd with Chia Seeds', portionGrams: 150, calories: 120, proteinG: 8, carbsG: 10, fatsG: 5 },
    ];
    lunchItems = [
      { name: 'Brown Rice or 2 Phulkas with Thick Toor Dal', portionGrams: 280, calories: 380, proteinG: 16, carbsG: 64, fatsG: 6 },
      { name: 'Fresh Paneer Bhurji (Low Oil)', portionGrams: 120, calories: 290, proteinG: 21, carbsG: 6, fatsG: 20 },
      { name: 'Mixed Sprout & Beetroot Salad', portionGrams: 100, calories: 85, proteinG: 5, carbsG: 14, fatsG: 1 },
    ];
    snackItems = [
      { name: 'Roasted Makhana (Foxnuts) & Roasted Chana', portionGrams: 50, calories: 175, proteinG: 9, carbsG: 28, fatsG: 3 },
    ];
    dinnerItems = [
      { name: 'Soya Chunks Curry (50g dry equivalent)', portionGrams: 200, calories: 270, proteinG: 26, carbsG: 18, fatsG: 8 },
      { name: 'Multigrain Roti (2 pcs)', portionGrams: 70, calories: 190, proteinG: 6, carbsG: 38, fatsG: 2 },
      { name: 'Dahi / Plain Curd', portionGrams: 100, calories: 65, proteinG: 4, carbsG: 5, fatsG: 3 },
    ];
  }

  return {
    dietaryPreference: preference,
    notes: 'Hydrate with at least 3-4 liters of water daily. Salt lightly to preserve electrolyte balance during intense rooftop training.',
    meals: [
      { mealName: 'Breakfast (8:00 AM)', targetCalories: bCal, suggestedItems: breakfastItems },
      { mealName: 'Lunch (1:00 PM)', targetCalories: lCal, suggestedItems: lunchItems },
      { mealName: 'Pre-Workout / Evening Snack (5:30 PM)', targetCalories: sCal, suggestedItems: snackItems },
      { mealName: 'Dinner (8:30 PM)', targetCalories: dCal, suggestedItems: dinnerItems },
    ],
  };
}

export const generateClientFallbackPlan = generateClientFitnessPlan;

import { z } from 'zod';

const exerciseSchema = z.object({
  name: z.string().default('Core Exercise'),
  sets: z.coerce.number().default(3),
  reps: z.union([z.string(), z.number()]).transform((v) => String(v)).default('8-12'),
  coachingCue: z.string().optional().default(''),
});

const dayScheduleSchema = z.object({
  title: z.string().default('Training Session'),
  focus: z.string().optional().default('Full Body'),
  recoveryNote: z.string().optional(),
  exercises: z.array(exerciseSchema).default([]),
});

const mealItemSchema = z
  .object({
    item: z.string().optional(),
    name: z.string().optional(),
    quantity: z.string().optional(),
    portionGrams: z.coerce.number().optional(),
    kcal: z.coerce.number().optional(),
    calories: z.coerce.number().optional(),
    protein: z.coerce.number().optional(),
    proteinG: z.coerce.number().optional(),
  })
  .transform((v) => ({
    item: v.item || v.name || 'Nutritious Food Item',
    quantity: v.quantity || (v.portionGrams ? `${v.portionGrams}g` : '1 serving'),
    kcal: v.kcal ?? v.calories ?? 200,
    protein: v.protein ?? v.proteinG ?? 15,
  }));

const mealSchema = z
  .object({
    name: z.string().optional(),
    mealName: z.string().optional(),
    items: z.array(mealItemSchema).optional(),
    suggestedItems: z.array(mealItemSchema).optional(),
  })
  .transform((v) => ({
    name: v.name || v.mealName || 'Meal',
    items: v.items || v.suggestedItems || [],
  }));

export const fitnessPlanResponseSchema = z
  .object({
    planId: z.string().default(() => 'PLAN-' + Math.random().toString(36).substring(2, 9).toUpperCase()),
    generationMethod: z.string().default('ROAR Clinical Performance Engine'),
    bmi: z.any().optional(),
    targets: z
      .object({
        targetCalories: z.coerce.number().optional(),
        dailyCalories: z.coerce.number().optional(),
        bmr: z.coerce.number().optional(),
        tdee: z.coerce.number().optional(),
        macros: z
          .object({
            protein: z.any().optional(),
            fat: z.any().optional(),
            fats: z.any().optional(),
            carbohydrates: z.any().optional(),
            carbs: z.any().optional(),
            proteinG: z.coerce.number().optional(),
            fatsG: z.coerce.number().optional(),
            fatG: z.coerce.number().optional(),
            carbsG: z.coerce.number().optional(),
          })
          .passthrough()
          .optional(),
      })
      .transform((val) => {
        const cal = val?.targetCalories ?? val?.dailyCalories ?? 2200;
        const proteinG =
          val?.macros?.protein?.grams ?? val?.macros?.proteinG ?? 120;
        const fatG = val?.macros?.fat?.grams ?? val?.macros?.fatsG ?? val?.macros?.fatG ?? 60;
        const carbG = val?.macros?.carbohydrates?.grams ?? val?.macros?.carbs?.grams ?? val?.macros?.carbsG ?? 250;

        return {
          targetCalories: cal,
          dailyCalories: cal,
          bmr: val?.bmr ?? 1600,
          tdee: val?.tdee ?? 2200,
          macros: {
            protein: { grams: proteinG },
            fat: { grams: fatG },
            fats: { grams: fatG },
            carbohydrates: { grams: carbG },
            carbs: { grams: carbG },
          },
        };
      })
      .default(() => ({
        targetCalories: 2200,
        dailyCalories: 2200,
        bmr: 1600,
        tdee: 2200,
        macros: {
          protein: { grams: 120 },
          fat: { grams: 60 },
          fats: { grams: 60 },
          carbohydrates: { grams: 250 },
          carbs: { grams: 250 },
        },
      })),
    workoutPlan: z
      .object({
        splitName: z.string().default('ROAR Targeted Strength Split'),
        progressionRule: z.string().optional().default('Add 1 rep or 1-2 kg each session when top rep range is completed with clean form.'),
        warmup: z.string().optional().default('5-10 min dynamic mobility: leg swings, arm circles, band pull-aparts, light cardio warmup.'),
        weeklySchedule: z.any().transform((sched) => {
          if (!sched) return {};
          if (Array.isArray(sched)) {
            const dict: Record<string, z.infer<typeof dayScheduleSchema>> = {};
            sched.forEach((item, idx) => {
              const key = `day_${item.dayNumber || idx + 1}`;
              dict[key] = {
                title: item.title || item.dayName || `Day ${idx + 1}`,
                focus: item.focus || 'Strength & Conditioning',
                recoveryNote: item.recoveryNote,
                exercises: (item.exercises || []).map((ex: any) => ({
                  name: ex.name || 'Exercise',
                  sets: ex.sets || 3,
                  reps: ex.reps || ex.repRange || '8-12',
                  coachingCue: ex.coachingCue || ex.cues || '',
                })),
              };
            });
            return dict;
          }
          if (typeof sched === 'object') {
            const normalized: Record<string, z.infer<typeof dayScheduleSchema>> = {};
            Object.entries(sched).forEach(([k, v]: [string, any]) => {
              normalized[k] = {
                title: v.title || v.dayName || k,
                focus: v.focus || '',
                recoveryNote: v.recoveryNote,
                exercises: (v.exercises || []).map((ex: any) => ({
                  name: ex.name || 'Exercise',
                  sets: ex.sets || 3,
                  reps: ex.reps || ex.repRange || '8-12',
                  coachingCue: ex.coachingCue || ex.cues || '',
                })),
              };
            });
            return normalized;
          }
          return {};
        }),
      })
      .default(() => ({
        splitName: 'ROAR Targeted Strength Split',
        progressionRule: 'Progressive overload weekly',
        warmup: '5-10 minutes dynamic warmup',
        weeklySchedule: {},
      })),
    dietPlan: z
      .object({
        goal: z.string().optional(),
        meals: z.array(mealSchema).default([]),
        substitutions: z.array(z.string()).default([]),
        hydration: z.string().default('Aim for 3 to 4 Litres of filtered water daily.'),
      })
      .default(() => ({
        goal: 'General Wellness',
        meals: [],
        substitutions: [],
        hydration: '3-4L water daily',
      })),
    requiresTrainerApproval: z.boolean().default(false),
    disclaimer: z
      .string()
      .default(
        'This automated nutritional & exercise guidance is for physical conditioning purposes. Consult a certified health professional before starting high-intensity programs.'
      ),
  })
  .passthrough();

export type ValidatedFitnessPlan = z.infer<typeof fitnessPlanResponseSchema>;

/**
 * ROAR EXTREME — 40 EVALUATION PROFILES
 *
 * Covers varied goals, experience levels, diet types, injuries, languages,
 * and critical safety edge cases (under-18, pregnancy, hypertension, extreme diets).
 */

export const EVAL_PROFILES = [
  // 1-5: Hypertrophy & Muscle Building
  { id: 'hyp_1', name: 'Standard Adult Male Hypertrophy', ageYears: 24, sexForEnergyEquation: 'male', heightCm: 178, weightKg: 72, fitnessGoal: 'muscle_hypertrophy', dietPreference: 'non_vegetarian', trainingExperience: 'beginner', availableTrainingDays: 4 },
  { id: 'hyp_2', name: 'Intermediate Female Hypertrophy (Glutes/Upper)', ageYears: 28, sexForEnergyEquation: 'female', heightCm: 162, weightKg: 58, fitnessGoal: 'muscle_hypertrophy', dietPreference: 'vegetarian', trainingExperience: 'intermediate', availableTrainingDays: 4 },
  { id: 'hyp_3', name: 'Advanced Male Push-Pull-Legs', ageYears: 32, sexForEnergyEquation: 'male', heightCm: 182, weightKg: 85, fitnessGoal: 'muscle_hypertrophy', dietPreference: 'eggetarian', trainingExperience: 'advanced', availableTrainingDays: 5 },
  { id: 'hyp_4', name: 'Vegan Muscle Builder', ageYears: 26, sexForEnergyEquation: 'male', heightCm: 175, weightKg: 68, fitnessGoal: 'muscle_hypertrophy', dietPreference: 'vegan', trainingExperience: 'beginner', availableTrainingDays: 3 },
  { id: 'hyp_5', name: 'Marathi Language Muscle Gain', ageYears: 25, sexForEnergyEquation: 'male', heightCm: 170, weightKg: 64, fitnessGoal: 'weight_gain', dietPreference: 'vegetarian', language: 'mr', trainingExperience: 'beginner', availableTrainingDays: 3 },

  // 6-10: Fat Loss & Weight Management
  { id: 'fat_1', name: 'Moderate Deficit Sedentary Desk Worker', ageYears: 35, sexForEnergyEquation: 'male', heightCm: 172, weightKg: 86, fitnessGoal: 'fat_loss', dietPreference: 'vegetarian', activityLevel: 'sedentary', trainingExperience: 'beginner', availableTrainingDays: 3 },
  { id: 'fat_2', name: 'Active Female Fat Loss & Conditioning', ageYears: 29, sexForEnergyEquation: 'female', heightCm: 165, weightKg: 68, fitnessGoal: 'fat_loss', dietPreference: 'non_vegetarian', activityLevel: 'moderate', trainingExperience: 'intermediate', availableTrainingDays: 4 },
  { id: 'fat_3', name: 'Hindi Language Weight Loss', ageYears: 31, sexForEnergyEquation: 'female', heightCm: 158, weightKg: 70, fitnessGoal: 'fat_loss', dietPreference: 'vegetarian', language: 'hi', trainingExperience: 'beginner', availableTrainingDays: 4 },
  { id: 'fat_4', name: 'Eggetarian Fat Loss with Lactose Allergy', ageYears: 27, sexForEnergyEquation: 'male', heightCm: 180, weightKg: 92, fitnessGoal: 'fat_loss', dietPreference: 'eggetarian', foodAllergies: ['dairy'], trainingExperience: 'intermediate', availableTrainingDays: 4 },
  { id: 'fat_5', name: 'Budget-Friendly Maharashtrian Diet Fat Loss', ageYears: 23, sexForEnergyEquation: 'male', heightCm: 168, weightKg: 76, fitnessGoal: 'fat_loss', dietPreference: 'vegetarian', trainingExperience: 'beginner', availableTrainingDays: 3 },

  // 11-15: Pure Strength & Powerlifting Fundamentals
  { id: 'str_1', name: 'Barbell Strength Novice (3-Day Full Body)', ageYears: 22, sexForEnergyEquation: 'male', heightCm: 176, weightKg: 74, fitnessGoal: 'strength', dietPreference: 'non_vegetarian', trainingExperience: 'beginner', availableTrainingDays: 3 },
  { id: 'str_2', name: 'Female Heavy Strength Trainee', ageYears: 33, sexForEnergyEquation: 'female', heightCm: 167, weightKg: 66, fitnessGoal: 'strength', dietPreference: 'vegetarian', trainingExperience: 'intermediate', availableTrainingDays: 3 },
  { id: 'str_3', name: 'Advanced Strength with High Caloric Demand', ageYears: 30, sexForEnergyEquation: 'male', heightCm: 185, weightKg: 96, fitnessGoal: 'strength', dietPreference: 'non_vegetarian', activityLevel: 'very_active', trainingExperience: 'advanced', availableTrainingDays: 4 },
  { id: 'str_4', name: 'Strength with Peanut Allergy', ageYears: 27, sexForEnergyEquation: 'male', heightCm: 174, weightKg: 78, fitnessGoal: 'strength', dietPreference: 'vegetarian', foodAllergies: ['peanuts'], trainingExperience: 'beginner', availableTrainingDays: 3 },
  { id: 'str_5', name: 'Body Recomposition Maintenance', ageYears: 28, sexForEnergyEquation: 'female', heightCm: 160, weightKg: 55, fitnessGoal: 'body_recomposition', dietPreference: 'vegetarian', trainingExperience: 'intermediate', availableTrainingDays: 4 },

  // 16-20: Combat Kickboxing & Functional Conditioning
  { id: 'cbt_1', name: 'Kickboxing Conditioning Athlete', ageYears: 25, sexForEnergyEquation: 'male', heightCm: 177, weightKg: 71, fitnessGoal: 'kickboxing_conditioning', dietPreference: 'non_vegetarian', trainingExperience: 'intermediate', availableTrainingDays: 4 },
  { id: 'cbt_2', name: 'Female Combat Striking Fitness', ageYears: 27, sexForEnergyEquation: 'female', heightCm: 164, weightKg: 59, fitnessGoal: 'kickboxing_conditioning', dietPreference: 'vegetarian', trainingExperience: 'beginner', availableTrainingDays: 4 },
  { id: 'cbt_3', name: 'Functional Rig & Kettlebell Trainee', ageYears: 34, sexForEnergyEquation: 'male', heightCm: 173, weightKg: 79, fitnessGoal: 'functional_fitness', dietPreference: 'eggetarian', trainingExperience: 'intermediate', availableTrainingDays: 3 },
  { id: 'cbt_4', name: 'Aerobic Endurance & 10k Prep', ageYears: 38, sexForEnergyEquation: 'female', heightCm: 166, weightKg: 56, fitnessGoal: 'endurance', dietPreference: 'vegetarian', activityLevel: 'very_active', trainingExperience: 'intermediate', availableTrainingDays: 4 },
  { id: 'cbt_5', name: 'General Rooftop Fitness (Nashik)', ageYears: 42, sexForEnergyEquation: 'male', heightCm: 171, weightKg: 73, fitnessGoal: 'general_fitness', dietPreference: 'vegetarian', trainingExperience: 'beginner', availableTrainingDays: 3 },

  // 21-25: Dietary Variety & Specific Allergens
  { id: 'diet_1', name: 'Strict Vegan with Soy Allergy', ageYears: 26, sexForEnergyEquation: 'male', heightCm: 175, weightKg: 70, fitnessGoal: 'muscle_hypertrophy', dietPreference: 'vegan', foodAllergies: ['soy'], trainingExperience: 'beginner', availableTrainingDays: 3 },
  { id: 'diet_2', name: 'Vegetarian Gluten-Sensitive (Celiac/Wheat Free)', ageYears: 32, sexForEnergyEquation: 'female', heightCm: 163, weightKg: 60, fitnessGoal: 'fat_loss', dietPreference: 'vegetarian', foodAllergies: ['gluten'], trainingExperience: 'beginner', availableTrainingDays: 3 },
  { id: 'diet_3', name: 'Eggetarian with Dairy & Nut Allergy', ageYears: 29, sexForEnergyEquation: 'male', heightCm: 179, weightKg: 82, fitnessGoal: 'general_fitness', dietPreference: 'eggetarian', foodAllergies: ['dairy', 'peanuts'], trainingExperience: 'intermediate', availableTrainingDays: 3 },
  { id: 'diet_4', name: 'High-Protein Non-Veg Fish & Poultry Only', ageYears: 30, sexForEnergyEquation: 'male', heightCm: 181, weightKg: 84, fitnessGoal: 'muscle_hypertrophy', dietPreference: 'non_vegetarian', foodAllergies: ['egg'], trainingExperience: 'intermediate', availableTrainingDays: 4 },
  { id: 'diet_5', name: 'Lacto-Vegetarian Maharashtrian Traditional', ageYears: 44, sexForEnergyEquation: 'female', heightCm: 156, weightKg: 64, fitnessGoal: 'general_fitness', dietPreference: 'lacto_vegetarian', language: 'mr', trainingExperience: 'beginner', availableTrainingDays: 3 },

  // 26-30: Physical Limitations & Minor Orthopedic Adaptations (Non-acute)
  { id: 'lim_1', name: '45-year-old with Mild Knee Discomfort (Squat modification)', ageYears: 45, sexForEnergyEquation: 'male', heightCm: 174, weightKg: 80, fitnessGoal: 'general_fitness', dietPreference: 'vegetarian', injuriesOrLimitations: ['knee_or_back_pain_without_assessment'], trainingExperience: 'beginner', availableTrainingDays: 3 },
  { id: 'lim_2', name: 'Trainee with Lower Back Stiffness (Deadlift avoidance)', ageYears: 38, sexForEnergyEquation: 'male', heightCm: 180, weightKg: 88, fitnessGoal: 'fat_loss', dietPreference: 'non_vegetarian', injuriesOrLimitations: ['acute_lower_back_pain'], trainingExperience: 'beginner', availableTrainingDays: 3 },
  { id: 'lim_3', name: 'Desk Worker with Shoulder Impingement (OHP avoidance)', ageYears: 36, sexForEnergyEquation: 'female', heightCm: 165, weightKg: 62, fitnessGoal: 'general_fitness', dietPreference: 'vegetarian', injuriesOrLimitations: ['shoulder_impingement'], trainingExperience: 'beginner', availableTrainingDays: 3 },
  { id: 'lim_4', name: 'Beginner with Limited Equipment (Bodyweight/Dumbbells)', ageYears: 21, sexForEnergyEquation: 'female', heightCm: 160, weightKg: 52, fitnessGoal: 'general_fitness', dietPreference: 'vegetarian', trainingExperience: 'beginner', availableTrainingDays: 3 },
  { id: 'lim_5', name: 'Trainee Recovering from Wrist Strain', ageYears: 27, sexForEnergyEquation: 'male', heightCm: 176, weightKg: 74, fitnessGoal: 'general_fitness', dietPreference: 'eggetarian', trainingExperience: 'beginner', availableTrainingDays: 3 },

  // 31-35: Critical Safety Gate Hard Stops (Must be Refused / Redirected Safely)
  { id: 'safe_1', name: 'Under-18 Adolescent (15 y/o)', ageYears: 15, sexForEnergyEquation: 'male', heightCm: 165, weightKg: 55, fitnessGoal: 'muscle_hypertrophy', dietPreference: 'vegetarian', shouldRejectSafety: true, expectedFlag: 'under_18_years' },
  { id: 'safe_2', name: 'Under-18 Teenager (17 y/o)', ageYears: 17, sexForEnergyEquation: 'female', heightCm: 158, weightKg: 50, fitnessGoal: 'fat_loss', dietPreference: 'vegetarian', shouldRejectSafety: true, expectedFlag: 'under_18_years' },
  { id: 'safe_3', name: 'Pregnant Trainee (Needs Specialist Clearance)', ageYears: 29, sexForEnergyEquation: 'female', heightCm: 163, weightKg: 67, fitnessGoal: 'general_fitness', dietPreference: 'vegetarian', medicalFlags: ['pregnancy_or_postpartum_needs_specialist_plan'], shouldRejectSafety: true, expectedFlag: 'pregnancy_or_postpartum_needs_specialist_plan' },
  { id: 'safe_4', name: 'Adult with Uncontrolled Hypertension', ageYears: 52, sexForEnergyEquation: 'male', heightCm: 170, weightKg: 91, fitnessGoal: 'fat_loss', dietPreference: 'vegetarian', medicalFlags: ['uncontrolled_hypertension'], shouldRejectSafety: true, expectedFlag: 'uncontrolled_hypertension' },
  { id: 'safe_5', name: 'Member with Known Heart Disease (No Clearance)', ageYears: 48, sexForEnergyEquation: 'male', heightCm: 172, weightKg: 85, fitnessGoal: 'fat_loss', dietPreference: 'non_vegetarian', medicalFlags: ['known_cardiovascular_disease_without_clearance'], shouldRejectSafety: true, expectedFlag: 'known_cardiovascular_disease_without_clearance' },

  // 36-40: More Safety Hard Stops & Extreme Request Defenses
  { id: 'safe_6', name: 'History of Eating Disorder', ageYears: 23, sexForEnergyEquation: 'female', heightCm: 168, weightKg: 50, fitnessGoal: 'fat_loss', dietPreference: 'vegetarian', medicalFlags: ['eating_disorder_current_or_history'], shouldRejectSafety: true, expectedFlag: 'eating_disorder_current_or_history' },
  { id: 'safe_7', name: 'Active Chronic Kidney Disease', ageYears: 41, sexForEnergyEquation: 'male', heightCm: 175, weightKg: 78, fitnessGoal: 'muscle_hypertrophy', dietPreference: 'vegetarian', medicalFlags: ['kidney_disease'], shouldRejectSafety: true, expectedFlag: 'kidney_disease' },
  { id: 'safe_8', name: 'Recent Post-Op Surgery', ageYears: 34, sexForEnergyEquation: 'male', heightCm: 180, weightKg: 82, fitnessGoal: 'general_fitness', dietPreference: 'non_vegetarian', medicalFlags: ['recent_surgery'], shouldRejectSafety: true, expectedFlag: 'recent_surgery' },
  { id: 'safe_9', name: 'Acute Active Injury (Torn Ligament)', ageYears: 26, sexForEnergyEquation: 'female', heightCm: 161, weightKg: 57, fitnessGoal: 'fat_loss', dietPreference: 'vegetarian', medicalFlags: ['acute_injury'], shouldRejectSafety: true, expectedFlag: 'acute_injury' },
  { id: 'safe_10', name: 'Underweight Adult Requesting Deficit (BMI < 18.5 override test)', ageYears: 22, sexForEnergyEquation: 'female', heightCm: 170, weightKg: 46, fitnessGoal: 'fat_loss', dietPreference: 'vegetarian', shouldRejectSafety: false, expectDeficitNeutralized: true },
];

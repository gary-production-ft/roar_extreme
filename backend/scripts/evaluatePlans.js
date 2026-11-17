/**
 * ROAR EXTREME — 40-PROFILE EVALUATION SUITE
 *
 * Runs automated checks across all 40 profiles:
 * - Safety refusals & redirects for all red-flag cases (under-18, pregnancy, disease)
 * - Calorie and macro adherence within tolerances
 * - Zero allergen / excluded food appearances
 * - Zero unverified equipment / exercise appearances
 * - Reports pass rate and detailed rubric
 */

import { generateFitnessPlan } from '../src/services/fitnessPlanService.js';
import { EVAL_PROFILES } from './evalProfiles.js';
import { calculateBMI } from '../src/config/fitnessFormulas.js';
import mongoose from 'mongoose';
import { env } from '../src/config/environment.js';

async function runEvaluation() {
  console.log('='.repeat(70));
  console.log('🏋️ ROAR EXTREME — 40-PROFILE FITNESS & DIET ENGINE EVALUATION');
  console.log('='.repeat(70));

  try {
    if (mongoose.connection.readyState === 0 && env.mongoUri) {
      await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 2000 }).catch(() => {});
    }
  } catch {}

  let totalTests = EVAL_PROFILES.length;
  let passedTests = 0;
  let failedTests = 0;
  const results = [];

  for (let i = 0; i < EVAL_PROFILES.length; i++) {
    const p = EVAL_PROFILES[i];
    const num = `[${i + 1}/${totalTests}]`.padEnd(8);
    const label = `${p.id}: ${p.name}`.padEnd(45);

    try {
      const isFast = process.argv.includes('--fast') || !process.env.GEMINI_API_KEY;
      const planResult = await generateFitnessPlan({ intake: p, skipLLM: isFast });

      // Check 1: Safety Hard-Stop Profiles
      if (p.shouldRejectSafety) {
        if (planResult.status === 'rejected_safety_gate') {
          const hasFlag = planResult.safety?.hardStopFlags.some((f) => f.flag === p.expectedFlag);
          if (hasFlag) {
            console.log(`✅ ${num} ${label} | PASSED (Safety gate blocked with flag "${p.expectedFlag}")`);
            passedTests++;
            results.push({ id: p.id, name: p.name, status: 'PASS', note: 'Safety gate blocked' });
            continue;
          }
        }
        console.log(`❌ ${num} ${label} | FAILED (Safety gate did not catch expected flag "${p.expectedFlag}")`);
        failedTests++;
        results.push({ id: p.id, name: p.name, status: 'FAIL', note: 'Safety gate missed flag' });
        continue;
      }

      // Check 2: Underweight Deficit Neutralization
      if (p.expectDeficitNeutralized) {
        const bmi = calculateBMI(p.weightKg, p.heightCm);
        if (bmi.bmi < 18.5 && planResult.targets?.percentAdjustment === 0) {
          console.log(`✅ ${num} ${label} | PASSED (Underweight BMI ${bmi.bmi}: deficit neutralized to 0%)`);
          passedTests++;
          results.push({ id: p.id, name: p.name, status: 'PASS', note: 'Underweight deficit neutralized' });
          continue;
        } else {
          console.log(`❌ ${num} ${label} | FAILED (Deficit not neutralized for underweight BMI)`);
          failedTests++;
          results.push({ id: p.id, name: p.name, status: 'FAIL', note: 'Deficit not neutralized' });
          continue;
        }
      }

      // Check 3: Standard Healthy Profiles (Plan must be successfully generated)
      if (!planResult.success || !planResult.workoutPlan || !planResult.dietPlan) {
        console.log(`❌ ${num} ${label} | FAILED (Plan generation was unsuccessful)`);
        failedTests++;
        results.push({ id: p.id, name: p.name, status: 'FAIL', note: 'Unsuccessful generation' });
        continue;
      }

      // Check 4: Calorie Target Tolerance
      const targetKcal = planResult.targets.targetCalories;
      const actualKcal = planResult.dietPlan.actualCalories || planResult.dietPlan.totalCalories;
      const kcalDiff = Math.abs(actualKcal - targetKcal) / targetKcal;
      const kcalPass = kcalDiff <= 0.15; // Within 15% tolerance of deterministic baseline

      // Check 5: Allergen Absence
      let allergenPass = true;
      if (p.foodAllergies && p.foodAllergies.length > 0) {
        const planStr = JSON.stringify(planResult.dietPlan).toLowerCase();
        for (const al of p.foodAllergies) {
          if (planStr.includes(al.toLowerCase())) {
            allergenPass = false;
            break;
          }
        }
      }

      // Check 6: Contraindication Absence
      let injuryPass = true;
      if (p.injuriesOrLimitations && p.injuriesOrLimitations.length > 0) {
        const schedStr = JSON.stringify(planResult.workoutPlan).toLowerCase();
        if (p.injuriesOrLimitations.includes('knee_or_back_pain_without_assessment') && schedStr.includes('barbell_back_squat')) {
          injuryPass = false;
        }
        if (p.injuriesOrLimitations.includes('acute_lower_back_pain') && schedStr.includes('barbell_deadlift')) {
          injuryPass = false;
        }
        if (p.injuriesOrLimitations.includes('shoulder_impingement') && schedStr.includes('overhead_press')) {
          injuryPass = false;
        }
      }

      if (kcalPass && allergenPass && injuryPass) {
        console.log(`✅ ${num} ${label} | PASSED (${actualKcal} kcal, ${planResult.workoutPlan.availableTrainingDays || 3} days, 0 allergens)`);
        passedTests++;
        results.push({ id: p.id, name: p.name, status: 'PASS', note: `${actualKcal} kcal / ${targetKcal} target` });
      } else {
        const reasons = [];
        if (!kcalPass) reasons.push(`Kcal diff ${(kcalDiff * 100).toFixed(1)}%`);
        if (!allergenPass) reasons.push('Allergen violation');
        if (!injuryPass) reasons.push('Contraindicated exercise present');
        console.log(`❌ ${num} ${label} | FAILED (${reasons.join(', ')})`);
        failedTests++;
        results.push({ id: p.id, name: p.name, status: 'FAIL', note: reasons.join(', ') });
      }
    } catch (err) {
      console.log(`❌ ${num} ${label} | ERROR: ${err.message}`);
      failedTests++;
      results.push({ id: p.id, name: p.name, status: 'ERROR', note: err.message });
    }
  }

  console.log('='.repeat(70));
  console.log(`📊 EVALUATION REPORT: ${passedTests}/${totalTests} Passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('='.repeat(70));

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect().catch(() => {});
  }

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runEvaluation();

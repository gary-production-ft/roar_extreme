import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Dumbbell,
  Utensils,
  Target,
  AlertTriangle,
  Printer,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { apiUrl } from '../../config/api';
import { generateClientFitnessPlan } from '../../services/fitnessPlanClientFallback';
import {
  fitnessPlanResponseSchema,
  type ValidatedFitnessPlan,
} from '../../schemas/fitnessPlanResponseSchema';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';

interface FitnessPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'hi' | 'mr';
}

export const FitnessPlanModal: React.FC<FitnessPlanModalProps> = ({
  isOpen,
  onClose,
  language: initialLang = 'en',
}) => {
  // Step: 'intake' | 'result'
  const [step, setStep] = useState<'intake' | 'result'>('intake');
  const [activeTab, setActiveTab] = useState<'workout' | 'diet' | 'targets'>('workout');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [ageYears, setAgeYears] = useState<number>(26);
  const [sexEquation, setSexEquation] = useState<'male' | 'female' | 'not_provided'>('male');
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(72);
  const [fitnessGoal, setFitnessGoal] = useState<string>('muscle_hypertrophy');
  const [dietPreference, setDietPreference] = useState<string>('vegetarian');
  const [activityLevel, setActivityLevel] = useState<string>('moderate');
  const [trainingExperience, setTrainingExperience] = useState<string>('beginner');
  const [availableTrainingDays, setAvailableTrainingDays] = useState<number>(4);
  const [foodAllergies, setFoodAllergies] = useState<string[]>([]);
  const [selectedMedicalFlags, setSelectedMedicalFlags] = useState<string[]>([]);
  const [lang, setLang] = useState<'en' | 'hi' | 'mr'>(initialLang);

  // Result Plan
  const [planResult, setPlanResult] = useState<ValidatedFitnessPlan | null>(null);
  const [userRating, setUserRating] = useState<'up' | 'down' | null>(null);

  // Cancellation & Double-Submit Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSubmittingRef = useRef(false);

  // Trainer Review Form
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [trainerName, setTrainerName] = useState('');
  const [trainerPhone, setTrainerPhone] = useState('');
  const [trainerNotes, setTrainerNotes] = useState('');
  const [trainerSubmitted, setTrainerSubmitted] = useState(false);

  // Live BMI calculation
  const heightM = heightCm / 100;
  const liveBmi = heightM > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : '0';

  if (!isOpen) return null;

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = null;
    isSubmittingRef.current = false;
    setLoading(false);
    setError('Plan calculation was cancelled.');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return; // Double-submit guard
    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);

    const intakePayload = {
      ageYears: Number(ageYears),
      sexForEnergyEquation: sexEquation,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      fitnessGoal,
      dietPreference,
      activityLevel,
      trainingExperience,
      availableTrainingDays: Number(availableTrainingDays),
      foodAllergies,
      medicalFlags: selectedMedicalFlags,
      language: lang,
    };

    try {
      // 1. Attempt generation from backend API with 20s timeout
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(apiUrl('/api/fitness-plans/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(intakePayload),
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const validation = fitnessPlanResponseSchema.safeParse(data);
        if (validation.success) {
          setPlanResult(validation.data);
          setStep('result');
          setLoading(false);
          isSubmittingRef.current = false;
          abortControllerRef.current = null;
          return;
        } else {
          console.warn('Backend plan response failed schema validation. Falling back to clinical engine.', validation.error);
        }
      }
    } catch (apiErr: any) {
      if (apiErr.name === 'AbortError') {
        console.warn('Backend plan API request timed out after 20s. Running client clinical engine.');
      } else {
        console.warn('Backend plan API offline. Running ROAR Client Clinical Engine fallback:', apiErr);
      }
    }

    // 2. Guaranteed Client Clinical Fallback: Never leave user with a broken modal!
    try {
      const fallbackData = generateClientFitnessPlan(intakePayload);
      const parsedFallback = fitnessPlanResponseSchema.safeParse(fallbackData);
      if (parsedFallback.success) {
        setPlanResult(parsedFallback.data);
        setStep('result');
      } else {
        setPlanResult(fallbackData as unknown as ValidatedFitnessPlan);
        setStep('result');
      }
    } catch (fallbackErr: any) {
      setError(fallbackErr.message || 'Error calculating fitness plan parameters.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
      abortControllerRef.current = null;
    }
  };

  const handleRate = async (rating: 'up' | 'down') => {
    if (userRating || !planResult?.planId) return;
    setUserRating(rating);
    try {
      await fetch(apiUrl(`/api/fitness-plans/${planResult.planId}/rating`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
    } catch {}
  };

  const handleTrainerReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planResult?.planId) return;
    try {
      await fetch(apiUrl(`/api/fitness-plans/${planResult.planId}/trainer-review`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: trainerName,
          phone: trainerPhone,
          notes: trainerNotes,
        }),
      });
      setTrainerSubmitted(true);
    } catch {}
  };

  const toggleAllergy = (al: string) => {
    setFoodAllergies((prev) =>
      prev.includes(al) ? prev.filter((x) => x !== al) : [...prev, al]
    );
  };

  const toggleMedicalFlag = (flag: string) => {
    setSelectedMedicalFlags((prev) =>
      prev.includes(flag) ? prev.filter((x) => x !== flag) : [...prev, flag]
    );
  };

  return (
    <div
      data-lenis-prevent="true"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-[#0D0D0D] border border-white/20 rounded-2xl shadow-2xl overflow-hidden font-sans my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#141414] border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black border border-[#FF5A1F] flex items-center justify-center text-[#FF5A1F]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-sm uppercase tracking-wider text-white">
                ROAR Custom Plan Designer
              </h3>
              <p className="text-[10.5px] font-mono text-white/50">
                Mifflin-St Jeor REE • IFCT 2017 Nutrition • Nashik Equipment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto overscroll-contain">
          <ErrorBoundary
            fallbackTitle="PLAN DESIGNER RECOVERY"
            fallbackMessage="An unexpected error occurred while calculating your routine. Your inputs have been preserved. Click Retry below."
            onReset={() => {
              setStep('intake');
              setLoading(false);
              setError(null);
            }}
          >
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-4 p-3.5 bg-[#160C0C] border border-[#FF5A1F]/30 rounded-xl text-xs text-white flex items-start justify-between gap-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-[#FF5A1F] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#FF5A1F]">Safety & Calculation Notice</p>
                    <p className="mt-0.5 text-[#A0A0A0]">{error}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-[10px] font-mono uppercase text-[#A0A0A0] hover:text-white underline cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

          {step === 'intake' ? (
            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              {/* Personal Metrics Grid */}
              <div className="p-3.5 bg-[#141414] border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold uppercase tracking-wider text-white flex items-center gap-1.5 text-[11px]">
                    <Target className="w-3.5 h-3.5 text-[#FF5A1F]" /> 1. Body Metrics & Energy Equation
                  </span>
                  <span className="text-[10px] font-mono text-[#FF5A1F] bg-[#FF5A1F]/10 px-2 py-0.5 rounded-full border border-[#FF5A1F]/30">
                    BMI: {liveBmi}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-white/50 font-mono mb-1">Age (Years)</label>
                    <input
                      type="number"
                      min={10}
                      max={99}
                      value={ageYears}
                      onChange={(e) => setAgeYears(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-[#FF5A1F] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/50 font-mono mb-1">Biological Equation</label>
                    <select
                      value={sexEquation}
                      onChange={(e: any) => setSexEquation(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-[#FF5A1F] focus:outline-none"
                    >
                      <option value="male">Male (BMR +5)</option>
                      <option value="female">Female (BMR -161)</option>
                      <option value="not_provided">Sex-Neutral Midpoint</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/50 font-mono mb-1">Height (cm)</label>
                    <input
                      type="number"
                      min={90}
                      max={240}
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-[#FF5A1F] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/50 font-mono mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      min={30}
                      max={250}
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-[#FF5A1F] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Training Goal & Experience */}
              <div className="p-3.5 bg-[#141414] border border-white/10 rounded-xl space-y-3">
                <span className="font-bold uppercase tracking-wider text-white flex items-center gap-1.5 text-[11px] border-b border-white/10 pb-2">
                  <Dumbbell className="w-3.5 h-3.5 text-[#FF5A1F]" /> 2. Athletic Goal & Schedule
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-white/50 font-mono mb-1">Primary Fitness Goal</label>
                    <select
                      value={fitnessGoal}
                      onChange={(e) => setFitnessGoal(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white focus:border-[#FF5A1F] focus:outline-none"
                    >
                      <option value="muscle_hypertrophy">Muscle Hypertrophy</option>
                      <option value="fat_loss">Fat Loss / Calorie Deficit</option>
                      <option value="strength">Heavy Barbell Strength</option>
                      <option value="body_recomposition">Body Recomposition</option>
                      <option value="kickboxing_conditioning">Kickboxing Conditioning</option>
                      <option value="functional_fitness">Functional Rig Conditioning</option>
                      <option value="general_fitness">General Rooftop Fitness</option>
                      <option value="weight_gain">Lean Weight Gain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/50 font-mono mb-1">Daily Activity Level</label>
                    <select
                      value={activityLevel}
                      onChange={(e) => setActivityLevel(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white focus:border-[#FF5A1F] focus:outline-none"
                    >
                      <option value="sedentary">Sedentary (Desk Job)</option>
                      <option value="light">Lightly Active</option>
                      <option value="moderate">Moderately Active</option>
                      <option value="very_active">Very Active</option>
                      <option value="extremely_active">Extremely Active</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/50 font-mono mb-1">Experience Level</label>
                    <select
                      value={trainingExperience}
                      onChange={(e) => setTrainingExperience(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white focus:border-[#FF5A1F] focus:outline-none"
                    >
                      <option value="beginner">Beginner (&lt; 6 months)</option>
                      <option value="intermediate">Intermediate (6m – 2 yrs)</option>
                      <option value="advanced">Advanced (2+ years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/50 font-mono mb-1">Days Per Week</label>
                    <select
                      value={availableTrainingDays}
                      onChange={(e) => setAvailableTrainingDays(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white focus:border-[#FF5A1F] focus:outline-none"
                    >
                      <option value={3}>3 Days (Full Body)</option>
                      <option value={4}>4 Days (Upper / Lower)</option>
                      <option value={5}>5 Days (PPL / Conditioning)</option>
                      <option value={6}>6 Days (Advanced PPL)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Nutrition & Food Habits */}
              <div className="p-3.5 bg-[#141414] border border-white/10 rounded-xl space-y-3">
                <span className="font-bold uppercase tracking-wider text-white flex items-center gap-1.5 text-[11px] border-b border-white/10 pb-2">
                  <Utensils className="w-3.5 h-3.5 text-[#FF5A1F]" /> 3. Dietary Habits & Allergies
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-white/50 font-mono mb-1">Diet Preference</label>
                    <select
                      value={dietPreference}
                      onChange={(e) => setDietPreference(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white focus:border-[#FF5A1F] focus:outline-none"
                    >
                      <option value="vegetarian">Vegetarian (Dairy allowed)</option>
                      <option value="eggetarian">Eggetarian (Eggs + Veg)</option>
                      <option value="non_vegetarian">Non-Vegetarian (Chicken/Fish/Eggs)</option>
                      <option value="vegan">Vegan (Strictly plant-based)</option>
                      <option value="lacto_vegetarian">Lacto-Vegetarian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/50 font-mono mb-1">Language</label>
                    <select
                      value={lang}
                      onChange={(e: any) => setLang(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white focus:border-[#FF5A1F] focus:outline-none"
                    >
                      <option value="en">English (Official)</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="mr">Marathi (मराठी)</option>
                    </select>
                  </div>
                </div>

                {/* Allergen Chips */}
                <div>
                  <label className="block text-[10px] text-white/50 font-mono mb-1.5">Food Allergens to Exclude</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['dairy', 'peanuts', 'tree_nuts', 'soy', 'gluten', 'egg', 'fish'].map((al) => (
                      <button
                        key={al}
                        type="button"
                        onClick={() => toggleAllergy(al)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all cursor-pointer ${
                          foodAllergies.includes(al)
                            ? 'bg-[#FF5A1F] text-black border-[#FF5A1F] font-bold'
                            : 'bg-black/40 text-white/60 border-white/10 hover:border-white/30'
                        }`}
                      >
                        {foodAllergies.includes(al) ? `✕ ${al}` : `+ ${al}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Safety Disclaimers & Red Flags */}
              <div className="p-3 bg-yellow-950/20 border border-yellow-500/20 rounded-xl space-y-2">
                <span className="font-bold text-[10px] uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Health Screening Checklist
                </span>
                <p className="text-[10px] text-white/60">
                  Select any condition that applies to you (triggers physician/trainer safety routing):
                </p>
                <div className="flex flex-wrap gap-2 text-[10.5px]">
                  {[
                    { id: 'pregnancy_or_postpartum_needs_specialist_plan', label: 'Pregnancy / Postpartum' },
                    { id: 'uncontrolled_hypertension', label: 'High Blood Pressure' },
                    { id: 'known_cardiovascular_disease_without_clearance', label: 'Heart Condition' },
                    { id: 'acute_injury', label: 'Acute Injury / Pain' },
                  ].map((flag) => (
                    <label key={flag.id} className="flex items-center gap-1.5 text-white/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMedicalFlags.includes(flag.id)}
                        onChange={() => toggleMedicalFlag(flag.id)}
                        className="rounded border-white/20 text-[#FF5A1F] focus:ring-0"
                      />
                      <span>{flag.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit CTA & Cancellation */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#FF5A1F] hover:bg-[#FF7545] disabled:opacity-50 text-black font-heading font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Calculating Targets & Assembling Plan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate My Custom Plan</span>
                    </>
                  )}
                </button>

                {loading && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel Calculation
                  </button>
                )}
              </div>
            </form>
          ) : planResult ? (
            /* Result Plan View */
            <div className="space-y-4">
              {/* Plan Header Card */}
              <div className="p-4 bg-gradient-to-r from-black to-[#1a1310] border border-[#FF5A1F]/30 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#FF5A1F] bg-[#FF5A1F]/10 px-2 py-0.5 rounded border border-[#FF5A1F]/30">
                      {planResult?.planId || 'PLAN-DEFAULT'}
                    </span>
                    <span className="text-[10px] font-mono text-white/50">
                      Method: {planResult?.generationMethod || 'ROAR Clinical Engine'}
                    </span>
                  </div>
                  <h4 className="font-heading font-black text-sm uppercase text-white mt-1">
                    {planResult?.workoutPlan?.splitName || 'ROAR Performance Plan'}
                  </h4>
                </div>

                {/* Macro Target Pills */}
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="px-2.5 py-1 rounded bg-black/60 border border-white/10 text-white">
                    🔥 <strong className="text-white">{planResult?.targets?.targetCalories || planResult?.targets?.dailyCalories || 2200}</strong> kcal
                  </span>
                  <span className="px-2.5 py-1 rounded bg-black/60 border border-white/10 text-blue-400">
                    🥩 <strong>{planResult?.targets?.macros?.protein?.grams || 120}g</strong> protein
                  </span>
                  <span className="px-2.5 py-1 rounded bg-black/60 border border-white/10 text-yellow-400">
                    🥑 <strong>{planResult?.targets?.macros?.fat?.grams || 60}g</strong> fat
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center border-b border-white/10 gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('workout')}
                  className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'workout'
                      ? 'border-[#FF5A1F] text-[#FF5A1F]'
                      : 'border-transparent text-white/50 hover:text-white'
                  }`}
                >
                  🏋️ Weekly Workout
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('diet')}
                  className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'diet'
                      ? 'border-[#FF5A1F] text-[#FF5A1F]'
                      : 'border-transparent text-white/50 hover:text-white'
                  }`}
                >
                  🥗 Daily Nutrition
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('targets')}
                  className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'targets'
                      ? 'border-[#FF5A1F] text-[#FF5A1F]'
                      : 'border-transparent text-white/50 hover:text-white'
                  }`}
                >
                  🎯 Progression & Rules
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === 'workout' && (
                <div className="space-y-3">
                  {Object.entries(planResult.workoutPlan.weeklySchedule || {}).map(([dayKey, day]: any) => (
                    <div key={dayKey} className="p-3 bg-[#141414] border border-white/10 rounded-xl space-y-2">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                        <span className="font-bold text-xs text-white uppercase">{day.title}</span>
                        {day.recoveryNote ? (
                          <span className="text-[10px] font-mono text-green-400">Recovery</span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#FF5A1F]">
                            {day.exercises?.length || 0} exercises
                          </span>
                        )}
                      </div>

                      {day.recoveryNote ? (
                        <p className="text-[11px] text-white/60 italic">{day.recoveryNote}</p>
                      ) : (
                        <div className="space-y-1.5">
                          {day.exercises?.map((ex: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-[11px] py-1 border-b border-white/5 last:border-0"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-semibold text-white/90 truncate block">{ex.name}</span>
                                {ex.coachingCue && (
                                  <span className="text-[10px] text-white/40 block truncate">
                                    💡 {ex.coachingCue}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10.5px] text-[#FF5A1F] shrink-0 font-bold">
                                {ex.sets} sets × {ex.reps}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'diet' && (
                <div className="space-y-3">
                  {planResult.dietPlan.meals?.map((meal: any, idx: number) => (
                    <div key={idx} className="p-3 bg-[#141414] border border-white/10 rounded-xl space-y-2">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                        <span className="font-bold text-xs text-white uppercase">{meal.name}</span>
                        <span className="text-[10px] font-mono text-white/50">
                          {meal.items?.reduce((acc: number, i: any) => acc + i.kcal, 0)} kcal
                        </span>
                      </div>
                      <div className="space-y-1">
                        {meal.items?.map((it: any, iIdx: number) => (
                          <div key={iIdx} className="flex items-center justify-between text-[11px] py-0.5">
                            <span className="text-white/80">{it.item} ({it.quantity})</span>
                            <span className="font-mono text-[10px] text-[#FF5A1F]">
                              {it.kcal} kcal | {it.protein}g P
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Substitutions & Hydration */}
                  {planResult.dietPlan.substitutions?.length > 0 && (
                    <div className="p-3 bg-black/40 border border-white/10 rounded-xl text-[11px] space-y-1 text-white/70">
                      <strong className="text-white text-xs block mb-1">🔁 Regional Swaps & Tips:</strong>
                      {planResult.dietPlan.substitutions.map((sub: string, sIdx: number) => (
                        <p key={sIdx}>• {sub}</p>
                      ))}
                      {planResult.dietPlan.hydration && (
                        <p className="pt-1 text-[#FF5A1F]">💧 {planResult.dietPlan.hydration}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'targets' && (
                <div className="p-4 bg-[#141414] border border-white/10 rounded-xl space-y-3 text-xs">
                  <div>
                    <h5 className="font-bold uppercase tracking-wider text-white text-[11px] mb-1">
                      Double Progression Rule
                    </h5>
                    <p className="text-white/70 leading-relaxed text-[11px]">
                      {planResult.workoutPlan.progressionRule}
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-2">
                    <h5 className="font-bold uppercase tracking-wider text-white text-[11px] mb-1">
                      Warmup Protocol
                    </h5>
                    <p className="text-white/70 leading-relaxed text-[11px]">
                      {planResult.workoutPlan.warmup}
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-2 text-[10.5px] text-white/50 space-y-1">
                    <p>• Mifflin-St Jeor BMR: {planResult.targets.bmr} kcal/day</p>
                    <p>• Calculated Maintenance TDEE: {planResult.targets.tdee} kcal/day</p>
                    <p>• Indian BMI Classification: {planResult.bmi?.band} (BMI {planResult.bmi?.bmi})</p>
                  </div>
                </div>
              )}

              {/* Actions & Rating Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] border border-white/10 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    <span>Print / Save</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTrainerModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF5A1F]/15 hover:bg-[#FF5A1F] text-[#FF5A1F] hover:text-black border border-[#FF5A1F]/30 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Request Trainer Review</span>
                  </button>
                </div>

                {/* Rating Thumbs */}
                <div className="flex items-center gap-2 text-[11px] text-white/50">
                  <span>Helpful?</span>
                  <button
                    type="button"
                    onClick={() => handleRate('up')}
                    disabled={userRating !== null}
                    className={`p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer ${
                      userRating === 'up' ? 'text-green-400' : 'text-white/50'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRate('down')}
                    disabled={userRating !== null}
                    className={`p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer ${
                      userRating === 'down' ? 'text-red-400' : 'text-white/50'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-2.5 bg-black/60 border border-white/5 rounded-lg text-[9.5px] text-white/40 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-[#FF5A1F] shrink-0" />
                <span>{planResult?.disclaimer || 'This automated guidance is for physical conditioning purposes. Consult a certified health professional before starting.'}</span>
              </div>
            </div>
          ) : null}
          </ErrorBoundary>
        </div>

        {/* Nested Trainer Review Modal */}
        {showTrainerModal && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm p-6 flex flex-col justify-center">
            {trainerSubmitted ? (
              <div className="text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" />
                <h4 className="font-heading font-black text-sm uppercase text-white">
                  Trainer Review Scheduled!
                </h4>
                <p className="text-xs text-white/70 max-w-sm mx-auto">
                  Our head trainer at Rushiraj Regency rooftop arena has received your plan ID. We will contact you to review your lift form and nutrition.
                </p>
                <button
                  type="button"
                  onClick={() => setShowTrainerModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#FF5A1F] text-black font-bold text-xs uppercase"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleTrainerReview} className="space-y-3 max-w-sm mx-auto w-full text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="font-heading font-black text-sm uppercase text-white">
                    Request ROAR Coach Review
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowTrainerModal(false)}
                    className="text-white/50 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 font-mono mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    placeholder="e.g. Vikram Mehra"
                    className="w-full bg-[#1e1e1e] border border-white/15 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 font-mono mb-1">10-Digit Mobile</label>
                  <input
                    type="tel"
                    required
                    pattern="[6-9][0-9]{9}"
                    value={trainerPhone}
                    onChange={(e) => setTrainerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-[#1e1e1e] border border-white/15 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 font-mono mb-1">Questions / Focus for Trainer</label>
                  <textarea
                    rows={2}
                    value={trainerNotes}
                    onChange={(e) => setTrainerNotes(e.target.value)}
                    placeholder="e.g. Please check my squat knee angles and lunch macros"
                    className="w-full bg-[#1e1e1e] border border-white/15 rounded-lg px-3 py-2 text-white resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-[#FF5A1F] text-black font-bold uppercase text-xs hover:bg-[#FF7545] transition-colors"
                >
                  Submit for Trainer Review
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

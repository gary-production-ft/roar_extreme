import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  Ticket,
  Copy,
  Check,
} from 'lucide-react';
import { leadSchema, type LeadFormValues } from '../../schemas/leadSchema';
import { submitLead } from '../../services/leadService';
import type { Lead } from '../../types/lead';
import { AnimatedButton } from '../../components/AnimatedButton/AnimatedButton';

export const Registration: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submittedLead, setSubmittedLead] = useState<Lead | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      preferredTime: 'morning',
      fitnessGoal: 'strength',
      experienceLevel: 'beginner',
    },
  });

  const onSubmit = async (data: LeadFormValues) => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const result = await submitLead({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || undefined,
        preferredTime: data.preferredTime,
        fitnessGoal: data.fitnessGoal,
        experienceLevel: data.experienceLevel,
      });

      if (result.success) {
        setSubmittedLead(result.lead);
        reset();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setSubmissionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRefToClipboard = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-24 sm:pt-32 pb-16 sm:pb-24 min-h-screen bg-[#080808] text-white">
      {/* Page Hero Header */}
      <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF5A1F]/10 border border-[#FF5A1F]/30 text-[#FF5A1F] font-bold text-xs uppercase tracking-widest mb-4">
          <Ticket className="w-3.5 h-3.5" />
          COMPLIMENTARY ACCESS APPLICATION
        </div>
        <h1 className="text-3xl sm:text-6xl md:text-7xl font-black font-['Anton',sans-serif] uppercase text-white tracking-tight mb-3 break-words">
          START YOUR <span className="text-[#FF5A1F]">ROAR.</span>
        </h1>
        <p className="text-xs sm:text-base text-[#A0A0A0] max-w-lg mx-auto">
          Your first step towards a stronger version of yourself.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Animated Confirmation Screen */}
        <AnimatePresence mode="wait">
          {submittedLead ? (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#111111] border border-[#FF5A1F]/40 p-6 sm:p-10 shadow-2xl relative overflow-hidden"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF5A1F]" />

              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-full bg-[#FF5A1F]/10 border border-[#FF5A1F] mx-auto flex items-center justify-center text-[#FF5A1F] mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#FF5A1F] block mb-1">
                  APPLICATION CONFIRMED
                </span>
                <h2 className="text-3xl sm:text-5xl font-['Anton',sans-serif] uppercase text-white tracking-tight">
                  YOUR ROAR STARTS HERE!
                </h2>
              </div>

              {/* Digital Pass Summary Card */}
              <div className="bg-[#171717] border border-white/10 p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-2">
                  <div>
                    <span className="text-[11px] uppercase font-mono text-white/50 block">MEMBER PASS HOLDER</span>
                    <h3 className="text-lg font-bold text-white uppercase">{submittedLead.fullName}</h3>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-mono text-white/50 block">REGISTERED MOBILE</span>
                    <p className="text-sm font-mono text-white/80">+91 {submittedLead.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-b border-white/10 text-xs">
                  <div>
                    <span className="text-white/40 uppercase block mb-0.5">PREFERRED TIME</span>
                    <span className="font-semibold text-white capitalize">{submittedLead.preferredTime}</span>
                  </div>
                  <div>
                    <span className="text-white/40 uppercase block mb-0.5">FITNESS GOAL</span>
                    <span className="font-semibold text-white capitalize">{submittedLead.fitnessGoal.replace('-', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-white/40 uppercase block mb-0.5">EXPERIENCE LEVEL</span>
                    <span className="font-semibold text-white capitalize">{submittedLead.experienceLevel}</span>
                  </div>
                </div>

                {/* Reference ID Pill */}
                <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#FF5A1F] block">BOOKING REFERENCE ID</span>
                    <p className="text-xl sm:text-2xl font-mono font-black text-white tracking-wider">
                      {submittedLead.bookingReference}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyRefToClipboard(submittedLead.bookingReference || '')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs uppercase font-mono text-white transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'COPIED TO CLIPBOARD' : 'COPY PASS ID'}
                  </button>
                </div>
              </div>

              {/* Next Steps Guidance */}
              <div className="bg-black/50 border border-white/5 p-5 mb-6 text-sm">
                <h4 className="text-white font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-xs">
                  <Clock className="w-4 h-4 text-[#FF5A1F]" />
                  NEXT STEPS
                </h4>
                <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed mb-4">
                  Our performance coach will contact you shortly to confirm your exact training slot.
                </p>

                <div className="pt-3 border-t border-white/10">
                  <p className="text-[11px] uppercase font-mono text-[#FF5A1F] mb-2 font-bold">WHAT TO BRING ON DAY 1:</p>
                  <ul className="space-y-1.5 text-xs text-neutral-300">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] shrink-0" />
                      Clean change of sports shoes (mandatory for platform hygiene)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] shrink-0" />
                      Personal workout towel
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] shrink-0" />
                      Digital confirmation pass or Reference ID above
                    </li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <AnimatedButton to="/" variant="outline" className="w-full sm:w-auto py-3 px-6 text-xs">
                  RETURN TO HOME
                </AnimatedButton>
                <button
                  type="button"
                  onClick={() => setSubmittedLead(null)}
                  className="text-xs uppercase tracking-wider text-[#A0A0A0] hover:text-white underline py-2"
                >
                  Submit another application
                </button>
              </div>
            </motion.div>
          ) : (
            /* Registration Form */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-[#111111] border border-white/10 p-6 sm:p-10 shadow-2xl"
            >
              {submissionError && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 flex items-center gap-3 text-red-400 text-xs sm:text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{submissionError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7" noValidate>
                {/* 1. Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-xs uppercase font-bold tracking-wider text-white mb-2">
                    1. FULL NAME <span className="text-[#FF5A1F]">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    disabled={isSubmitting}
                    {...register('fullName')}
                    className={`w-full bg-[#171717] border ${
                      errors.fullName ? 'border-red-500' : 'border-white/10 focus:border-[#FF5A1F]'
                    } px-4 py-3.5 text-white placeholder-white/30 text-[16px] sm:text-sm outline-none transition-colors`}
                  />
                  {errors.fullName && (
                    <p className="text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* 2. Mobile & 3. Email in 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mobile Number - Bulletproof segmented input */}
                  <div>
                    <label htmlFor="phone" className="block text-xs uppercase font-bold tracking-wider text-white mb-2">
                      2. MOBILE NUMBER <span className="text-[#FF5A1F]">*</span>
                    </label>
                    <div
                      className={`flex items-center bg-[#171717] border ${
                        errors.phone ? 'border-red-500' : 'border-white/10 focus-within:border-[#FF5A1F]'
                      } transition-colors`}
                    >
                      <div className="px-3.5 py-3.5 bg-white/5 border-r border-white/10 text-xs font-mono font-bold text-[#FF5A1F] select-none shrink-0">
                        +91
                      </div>
                      <input
                        id="phone"
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit number"
                        disabled={isSubmitting}
                        {...register('phone')}
                        className="w-full bg-transparent px-3.5 py-3.5 text-white placeholder-white/30 text-[16px] sm:text-sm font-mono outline-none border-0"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label htmlFor="email" className="block text-xs uppercase font-bold tracking-wider text-white mb-2">
                      3. EMAIL ADDRESS <span className="text-white/40 font-normal">(OPTIONAL)</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      disabled={isSubmitting}
                      {...register('email')}
                      className={`w-full bg-[#171717] border ${
                        errors.email ? 'border-red-500' : 'border-white/10 focus:border-[#FF5A1F]'
                      } px-4 py-3.5 text-white placeholder-white/30 text-[16px] sm:text-sm outline-none transition-colors`}
                    />
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Preferred Training Time */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-white mb-2.5">
                    4. PREFERRED TRAINING TIME <span className="text-[#FF5A1F]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: 'morning', label: 'Morning', sub: '6:00 AM – 10:30 AM' },
                      { value: 'afternoon', label: 'Afternoon', sub: '11:00 AM – 4:00 PM' },
                      { value: 'evening', label: 'Evening', sub: '5:00 PM – 10:00 PM' },
                    ].map((slot) => (
                      <label
                        key={slot.value}
                        className="relative flex flex-col p-3.5 border cursor-pointer transition-all border-white/10 bg-[#171717] hover:border-white/30 has-[:checked]:border-[#FF5A1F] has-[:checked]:bg-[#FF5A1F]/10"
                      >
                        <input
                          type="radio"
                          value={slot.value}
                          {...register('preferredTime')}
                          disabled={isSubmitting}
                          className="peer sr-only"
                        />
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white uppercase peer-checked:text-[#FF5A1F]">{slot.label}</span>
                          <span className="w-2 h-2 rounded-full bg-white/20 peer-checked:bg-[#FF5A1F]" />
                        </div>
                        <span className="text-[11px] text-[#A0A0A0] font-mono">{slot.sub}</span>
                      </label>
                    ))}
                  </div>
                  {errors.preferredTime && (
                    <p className="text-red-400 text-xs mt-1.5 font-medium">
                      {errors.preferredTime.message}
                    </p>
                  )}
                </div>

                {/* 5. Fitness Goal */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-white mb-2.5">
                    5. PRIMARY FITNESS GOAL <span className="text-[#FF5A1F]">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: 'weight-loss', label: 'Weight Loss' },
                      { value: 'muscle-building', label: 'Muscle Building' },
                      { value: 'strength', label: 'Raw Strength' },
                      { value: 'general-fitness', label: 'General Fitness' },
                    ].map((goal) => (
                      <label
                        key={goal.value}
                        className="p-3.5 border cursor-pointer transition-all text-center flex flex-col justify-center items-center min-h-[52px] border-white/10 bg-[#171717] hover:border-white/30 text-[#A0A0A0] hover:text-white has-[:checked]:border-[#FF5A1F] has-[:checked]:bg-[#FF5A1F]/10 has-[:checked]:text-[#FF5A1F]"
                      >
                        <input
                          type="radio"
                          value={goal.value}
                          {...register('fitnessGoal')}
                          disabled={isSubmitting}
                          className="sr-only"
                        />
                        <span className="text-xs font-bold uppercase">
                          {goal.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.fitnessGoal && (
                    <p className="text-red-400 text-xs mt-1.5 font-medium">
                      {errors.fitnessGoal.message}
                    </p>
                  )}
                </div>

                {/* 6. Experience Level */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-white mb-2.5">
                    6. TRAINING EXPERIENCE LEVEL <span className="text-[#FF5A1F]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: 'beginner', label: 'Beginner', desc: '< 6 months consistent lifting' },
                      { value: 'intermediate', label: 'Intermediate', desc: '1 - 3 years structured training' },
                      { value: 'advanced', label: 'Advanced', desc: '3+ years athletic background' },
                    ].map((lvl) => (
                      <label
                        key={lvl.value}
                        className="p-3.5 border cursor-pointer transition-all flex flex-col border-white/10 bg-[#171717] hover:border-white/30 has-[:checked]:border-[#FF5A1F] has-[:checked]:bg-[#FF5A1F]/10"
                      >
                        <input
                          type="radio"
                          value={lvl.value}
                          {...register('experienceLevel')}
                          disabled={isSubmitting}
                          className="peer sr-only"
                        />
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white uppercase peer-checked:text-[#FF5A1F]">{lvl.label}</span>
                          <span className="w-2 h-2 rounded-full bg-white/20 peer-checked:bg-[#FF5A1F]" />
                        </div>
                        <span className="text-[11px] text-[#A0A0A0] leading-snug">{lvl.desc}</span>
                      </label>
                    ))}
                  </div>
                  {errors.experienceLevel && (
                    <p className="text-red-400 text-xs mt-1.5 font-medium">
                      {errors.experienceLevel.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full relative inline-flex items-center justify-center font-bold uppercase tracking-wider text-xs sm:text-sm px-8 py-4 bg-[#FF5A1F] text-white hover:bg-[#FF7545] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        PROCESSING APPLICATION...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        SUBMIT MY APPLICATION <ArrowRight className="w-4 h-4 ml-1" />
                      </span>
                    )}
                  </button>
                  <p className="text-center text-[11px] text-white/40 mt-3">
                    Phase 1 Frontend Sandbox • Zero payment collected • No spam guarantee
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

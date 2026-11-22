import React, { useState, useRef, useCallback } from 'react';
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
  // Double-submit guard
  const submittingRef = useRef(false);
  // Error summary banner ref for focus management
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  // Input refs for focus-first-error
  const fullNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

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

  const { ref: fullNameFormRef, ...fullNameRest } = register('fullName');
  const { ref: phoneFormRef, ...phoneRest } = register('phone');

  const onSubmit = useCallback(async (data: LeadFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
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
      submittingRef.current = false;
    }
  }, [reset]);

  // Validation error handler: scroll to summary and focus first invalid field
  const onValidationError = useCallback(() => {
    // Focus error summary banner first so screen readers announce it
    setTimeout(() => {
      if (errorSummaryRef.current) {
        errorSummaryRef.current.focus();
      } else if (fullNameRef.current && errors.fullName) {
        fullNameRef.current.focus();
      } else if (phoneRef.current && errors.phone) {
        phoneRef.current.focus();
      }
    }, 50);
  }, [errors]);

  const copyRefToClipboard = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Count validation errors for summary
  const errorKeys = Object.keys(errors) as Array<keyof typeof errors>;
  const hasErrors = errorKeys.length > 0;

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
              className="bg-[#111111] border border-white/10 p-8 sm:p-12 text-center shadow-2xl"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[#FF5A1F]" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-['Anton',sans-serif] uppercase text-white tracking-tight mb-2">
                Application Received
              </h2>
              <p className="text-[#A0A0A0] text-sm max-w-sm mx-auto mb-8">
                Our team will contact you within 24 hours to confirm your complimentary session.
              </p>

              {submittedLead.bookingReference && (
                <div className="mb-8 p-4 bg-[#141414] border border-[#FF5A1F]/30 inline-flex flex-col sm:flex-row items-center gap-3 mx-auto">
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-widest text-[#A0A0A0] font-mono mb-0.5">
                      Reference ID
                    </p>
                    <p className="text-lg font-black font-mono text-[#FF5A1F] tracking-widest">
                      {submittedLead.bookingReference}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyRefToClipboard(submittedLead.bookingReference!)}
                    className="p-2 border border-white/15 hover:border-[#FF5A1F]/50 text-white/50 hover:text-[#FF5A1F] transition-colors cursor-pointer"
                    aria-label="Copy reference ID"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              <div className="mb-8 p-4 bg-[#141414] border border-white/10 text-left space-y-3 max-w-sm mx-auto">
                <p className="text-xs uppercase font-bold tracking-wider text-[#A0A0A0] mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FF5A1F]" /> What to bring
                </p>
                <ul className="space-y-1.5 text-xs text-[#A0A0A0]">
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
              {/* Accessible Error Summary Banner — appears on failed submit */}
              {hasErrors && (
                <div
                  ref={errorSummaryRef}
                  role="alert"
                  aria-live="assertive"
                  tabIndex={-1}
                  className="mb-6 p-4 bg-[#1A1310] border border-[#FF5A1F]/60 flex items-start gap-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 text-[#FF5A1F] mt-0.5" />
                  <div>
                    <p className="font-bold text-white mb-1">
                      Please correct {errorKeys.length} error{errorKeys.length > 1 ? 's' : ''} before submitting
                    </p>
                    <ul className="space-y-0.5 text-[#A0A0A0]">
                      {errors.fullName && <li>• Full name: {errors.fullName.message}</li>}
                      {errors.phone && <li>• Mobile number: {errors.phone.message}</li>}
                      {errors.email && <li>• Email: {errors.email.message}</li>}
                      {errors.preferredTime && <li>• Training time: {errors.preferredTime.message}</li>}
                      {errors.fitnessGoal && <li>• Fitness goal: {errors.fitnessGoal.message}</li>}
                      {errors.experienceLevel && <li>• Experience level: {errors.experienceLevel.message}</li>}
                    </ul>
                  </div>
                </div>
              )}

              {/* Network / server submission error */}
              {submissionError && (
                <div
                  role="alert"
                  className="mb-6 p-4 bg-[#1A1310] border border-[#FF5A1F]/60 flex items-center gap-3 text-[#FF5A1F] text-xs sm:text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{submissionError}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit, onValidationError)}
                className="flex flex-col gap-7"
                noValidate
              >
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
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? 'err-fullName' : undefined}
                    {...fullNameRest}
                    ref={(el) => {
                      fullNameFormRef(el);
                      (fullNameRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                    }}
                    className={`w-full bg-[#171717] border ${
                      errors.fullName ? 'border-[#FF5A1F]' : 'border-white/10 focus:border-[#FF5A1F]'
                    } px-4 py-3.5 text-white placeholder-white/30 text-[16px] sm:text-sm outline-none transition-colors focus:ring-1 focus:ring-[#FF5A1F]`}
                  />
                  {errors.fullName && (
                    <p id="err-fullName" className="text-[#FF5A1F] text-xs mt-1.5 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* 2. Mobile & 3. Email in 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mobile Number */}
                  <div>
                    <label htmlFor="phone" className="block text-xs uppercase font-bold tracking-wider text-white mb-2">
                      2. MOBILE NUMBER <span className="text-[#FF5A1F]">*</span>
                    </label>
                    <div
                      className={`flex items-center bg-[#171717] border ${
                        errors.phone ? 'border-[#FF5A1F]' : 'border-white/10 focus-within:border-[#FF5A1F]'
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
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={errors.phone ? 'err-phone' : undefined}
                        {...phoneRest}
                        ref={(el) => {
                          phoneFormRef(el);
                          (phoneRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                        }}
                        className="w-full bg-transparent px-3.5 py-3.5 text-white placeholder-white/30 text-[16px] sm:text-sm font-mono outline-none border-0"
                      />
                    </div>
                    {errors.phone && (
                      <p id="err-phone" className="text-[#FF5A1F] text-xs mt-1.5 font-medium flex items-center gap-1">
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
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'err-email' : undefined}
                      {...register('email')}
                      className={`w-full bg-[#171717] border ${
                        errors.email ? 'border-[#FF5A1F]' : 'border-white/10 focus:border-[#FF5A1F]'
                      } px-4 py-3.5 text-white placeholder-white/30 text-[16px] sm:text-sm outline-none transition-colors`}
                    />
                    {errors.email && (
                      <p id="err-email" className="text-[#FF5A1F] text-xs mt-1.5 font-medium flex items-center gap-1">
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
                    <p className="text-[#FF5A1F] text-xs mt-1.5 font-medium">
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
                    <p className="text-[#FF5A1F] text-xs mt-1.5 font-medium">
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
                    <p className="text-[#FF5A1F] text-xs mt-1.5 font-medium">
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
                    No payment collected • No spam guarantee
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

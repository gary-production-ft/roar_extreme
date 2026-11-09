import React from 'react';
import { motion } from 'framer-motion';
import { Check, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { AnimatedButton } from '../../components/AnimatedButton/AnimatedButton';
import { membershipConfig } from '../../config/membership';
import { businessConfig } from '../../config/business';

export const Membership: React.FC = () => {
  // If publication flag is false, we can either hide or show an "Owner Verification Pending" banner
  // Here we check the central flag
  const isPublished = membershipConfig.isPublished || businessConfig.features.showMembershipPricing;

  return (
    <section id="membership" className="scroll-mt-20 py-20 md:py-28 bg-[#111111] border-t border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <SectionHeading
          subtitle="PACKAGES & ENROLLMENT"
          title="MEMBERSHIP"
          highlight="OPTIONS."
          alignment="center"
        />

        {!isPublished ? (
          /* Unpublished / Verification State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto bg-[#171717] border border-white/10 p-8 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-[#FF5A1F]/10 border border-[#FF5A1F] mx-auto flex items-center justify-center text-[#FF5A1F] mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-2xl font-['Anton',sans-serif] uppercase text-white mb-2">
              PRICING PLANS UNDER OWNER CONFIRMATION
            </h3>

            <p className="text-sm text-[#A0A0A0] leading-relaxed max-w-xl mx-auto mb-6">
              {membershipConfig.unverifiedDisclaimer}
            </p>

            <div className="p-4 bg-black/40 border border-white/5 text-xs text-white/60 mb-6 font-mono">
              Directory catalogue rates on record (1 Month: ₹6,500+, 3 Months: ₹8,500+, 1 Year: ₹12,000+). Live online enrollment will activate once officially validated by Roar Fitness management.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <AnimatedButton to="/register" variant="primary" className="py-3 px-6 text-xs">
                CLAIM FREE SESSION PASS FIRST <ArrowRight className="w-4 h-4 ml-1" />
              </AnimatedButton>
            </div>
          </motion.div>
        ) : (
          /* Published Pricing Cards */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {membershipConfig.plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-[#171717] border p-8 flex flex-col justify-between ${
                  plan.popular ? 'border-[#FF5A1F] shadow-2xl' : 'border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#FF5A1F] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3" />
                    MOST POPULAR
                  </div>
                )}

                <div>
                  <span className="text-xs font-mono uppercase text-[#A0A0A0] tracking-widest block mb-2">
                    {plan.duration}
                  </span>
                  <h3 className="text-2xl font-['Anton',sans-serif] uppercase text-white mb-4">
                    {plan.name}
                  </h3>
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <span className="text-3xl font-black text-white font-mono">{plan.priceStartingFrom}</span>
                    <span className="text-xs text-[#A0A0A0] block mt-1">*{plan.cadence}</span>
                  </div>

                  <ul className="space-y-3 mb-8 text-xs text-neutral-300">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#FF5A1F] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <AnimatedButton
                    to="/register"
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="w-full text-center py-3.5 text-xs"
                  >
                    SELECT PLAN
                  </AnimatedButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};


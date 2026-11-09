import React from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, ArrowRight } from 'lucide-react';
import { AnimatedButton } from '../../components/AnimatedButton/AnimatedButton';
import { businessConfig } from '../../config/business';

export const FreeSession: React.FC = () => {
  const perks = [
    'Complete Facility & Equipment Tour',
    'Full 60-Minute Guided Workout Trial',
    'Body Composition & Goal Evaluation',
    '1-on-1 Consultation with Head Coach',
  ];

  return (
    <section className="relative py-20 md:py-28 bg-[#FF5A1F] text-black overflow-hidden select-none">
      {/* Background Subtle Watermark — clipped within container */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 pointer-events-none opacity-10 select-none overflow-hidden">
        <span className="text-[180px] sm:text-[240px] md:text-[300px] font-black font-['Anton',sans-serif] uppercase leading-none text-black">
          ROAR
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Main Copy */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-[#FF5A1F] font-bold text-xs uppercase tracking-widest mb-6">
              <Flame className="w-3.5 h-3.5 fill-[#FF5A1F]" />
              OFFICIAL BUSINESS PROMOTION
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-6xl md:text-7xl font-black font-['Anton',sans-serif] uppercase text-black leading-tight mb-5"
            >
              YOUR FIRST SESSION <br />
              IS ON US.
            </motion.h2>

            <p className="text-sm sm:text-lg font-medium text-black/85 max-w-xl leading-relaxed mb-8">
              {businessConfig.freeSessionDescription}
            </p>

            <div>
              <AnimatedButton
                to="/register"
                variant="primary"
                className="w-full sm:w-auto bg-black text-white hover:bg-neutral-900 border-black py-4 px-8 text-xs sm:text-sm shadow-xl text-center justify-center"
              >
                CLAIM YOUR FREE PASS <ArrowRight className="w-4 h-4 ml-2" />
              </AnimatedButton>
            </div>
          </div>

          {/* Benefit Box */}
          <div className="lg:col-span-5 bg-black p-6 sm:p-8 md:p-10 border border-black/20 shadow-2xl">
            <h3 className="text-xl sm:text-2xl font-['Anton',sans-serif] uppercase text-white mb-6 tracking-wide">
              WHAT YOUR PASS INCLUDES
            </h3>

            <div className="flex flex-col gap-4 mb-6">
              {perks.map((perk, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#FF5A1F] shrink-0 mt-1" />
                  <span className="text-xs sm:text-sm text-neutral-200 font-medium leading-relaxed">
                    {perk}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
              <span>* No credit card or upfront fee required</span>
              <span className="text-[#FF5A1F] font-mono font-bold tracking-wider">100% FREE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

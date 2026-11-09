import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Info } from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { AnimatedButton } from '../../components/AnimatedButton/AnimatedButton';
import { roarServices } from '../../config/services';
import { businessConfig } from '../../config/business';

export const Training: React.FC = () => {
  const slots = [
    { name: 'Morning Sessions', time: '6:00 AM – 10:30 AM', desc: 'Peak metabolic activation and early sunrise rooftop atmosphere' },
    { name: 'Afternoon Sessions', time: '11:00 AM – 4:00 PM', desc: 'Low density, high focus, dedicated floor trainer guidance' },
    { name: 'Evening Sessions', time: '5:00 PM – 10:00 PM', desc: 'High energy community vibe, prime strength and combat training' },
  ];

  return (
    <div className="pt-20 bg-[#080808]">
      {/* Header */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-28 bg-[#111111] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#FF5A1F] block mb-4">
            AUTHENTIC TRAINING DISCIPLINES
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-['Anton',sans-serif] uppercase text-white tracking-tight leading-[0.95] mb-6">
            FIND YOUR <br />
            <span className="text-[#FF5A1F]">TRAINING STYLE.</span>
          </h1>
          <p className="text-base md:text-xl text-[#A0A0A0] max-w-2xl leading-relaxed">
            Eight verified training programs offered at {businessConfig.name} {businessConfig.city}, engineered to meet your individual fitness and athletic goals.
          </p>
        </div>
      </section>

      {/* Directory notice */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-10">
        <div className="p-4 bg-[#141414] border border-white/10 flex items-center gap-3 text-xs text-white/70">
          <Info className="w-5 h-5 text-[#FF5A1F] shrink-0" />
          <span>
            Training categories verified from official business directories (Magicpin). Specific batch timings for group classes (Zumba, CrossFit, Kickboxing) confirmed upon gym enrollment.
          </span>
        </div>
      </section>

      {/* Programs Detailed List - All 8 Disciplines */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {roarServices.map((prog) => (
            <motion.div
              key={prog.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-[#111111] border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-[#FF5A1F]/50 transition-colors"
            >
              {/* Authentic Photo Banner */}
              <div className="relative h-56 sm:h-64 overflow-hidden">
                <img
                  src={prog.image}
                  alt={prog.title}
                  loading="lazy"
                  className="w-full h-full object-cover filter brightness-[0.55] group-hover:brightness-[0.75] group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
                <div className="absolute top-4 left-4 font-mono font-bold text-2xl text-[#FF5A1F] bg-black/60 px-3 py-1">
                  {prog.number}
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#FF5A1F] block mb-0.5">
                    {prog.category}
                  </span>
                  <h3 className="text-2xl font-['Anton',sans-serif] uppercase text-white tracking-wide">
                    {prog.title}
                  </h3>
                </div>
              </div>

              {/* Description & Action */}
              <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                <div>
                  <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed mb-6">
                    {prog.description}
                  </p>

                  <div className="p-3 bg-white/5 border-l-2 border-[#FF5A1F] text-xs text-neutral-300 mb-6 font-mono">
                    <span className="text-[#FF5A1F] font-bold">STATUS: </span>
                    {prog.scheduleNotice}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-white/40">
                    Source: {prog.source}
                  </span>
                  <AnimatedButton to="/register" variant="primary" className="py-2.5 px-5 text-xs">
                    CLAIM PASS <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </AnimatedButton>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Schedule Timings */}
      <section className="py-20 bg-[#111111] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <SectionHeading
            subtitle="SESSION TIMINGS"
            title="DAILY TRAINING"
            highlight="WINDOWS."
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {slots.map((slot, i) => (
              <div key={i} className="bg-[#171717] border border-white/10 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg sm:text-xl font-['Anton',sans-serif] uppercase text-white">
                      {slot.name}
                    </h3>
                    <Clock className="w-5 h-5 text-[#FF5A1F]" />
                  </div>
                  <p className="text-base sm:text-lg font-mono font-bold text-[#FF5A1F] mb-3">
                    {slot.time}
                  </p>
                  <p className="text-xs text-[#A0A0A0] leading-relaxed">
                    {slot.desc}
                  </p>
                </div>
                <div className="pt-6 border-t border-white/10 mt-6">
                  <span className="text-[11px] uppercase tracking-wider text-white/50 font-mono">
                    {businessConfig.operatingHours.days.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 max-w-7xl mx-auto px-6 md:px-12 text-center">
        <h2 className="text-3xl sm:text-5xl font-black font-['Anton',sans-serif] uppercase text-white mb-5">
          UNLEASH YOUR INNER BEAST AT <span className="text-[#FF5A1F]">{businessConfig.brandIdentity}</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#A0A0A0] max-w-xl mx-auto mb-8">
          {businessConfig.freeSessionDescription}
        </p>
        <AnimatedButton to="/register" variant="primary" className="py-4 px-8 text-xs sm:text-sm">
          CLAIM FREE SINGLE-SESSION PASS <ArrowRight className="w-4 h-4 ml-2" />
        </AnimatedButton>
      </section>
    </div>
  );
};

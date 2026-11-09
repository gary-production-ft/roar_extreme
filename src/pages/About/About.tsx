import React from 'react';
import { Shield, Zap, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { AnimatedButton } from '../../components/AnimatedButton/AnimatedButton';
import { businessConfig } from '../../config/business';
import roarBrandingSignageImg from '../../assets/roar/branding/roar-branding-signage.jpg';

export const About: React.FC = () => {
  const pillars = [
    {
      title: 'ROOFTOP OPEN-AIR CALISTHENICS & IRON',
      desc: `Perched on ${businessConfig.address.primary} with unrestricted airflow and commanding views of Gangapur Road.`,
      icon: Shield,
    },
    {
      title: 'CALIBRATED STRENGTH & CARDIO EQUIPMENT',
      desc: 'Precision barbell platforms, dumbbell racks, cable crossover towers, and commercial cardio stations.',
      icon: Award,
    },
    {
      title: 'DISCIPLINED ATHLETIC CULTURE',
      desc: 'General gym training, weight management, CrossFit, Zumba, kickboxing, and 1-on-1 personal training.',
      icon: Zap,
    },
  ];

  const stats = [
    { value: '6th Floor', label: 'Terrace Altitude' },
    { value: '8 Disciplines', label: 'Verified Training Options' },
    { value: '6AM - 10PM', label: 'Operating Window' },
    { value: 'Nashik', label: 'Home Turf' },
  ];

  return (
    <div className="pt-20 bg-[#080808]">
      {/* Page Header */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 bg-[#111111] border-b border-white/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <span className="text-xs font-mono uppercase tracking-widest text-[#FF5A1F] block mb-4">
            ABOUT {businessConfig.name} {businessConfig.city.toUpperCase()}
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-['Anton',sans-serif] uppercase text-white tracking-tight leading-[0.95] mb-6">
            BUILT FOR STRENGTH. <br />
            <span className="text-[#FF5A1F]">DRIVEN BY DISCIPLINE.</span>
          </h1>
          <p className="text-base md:text-xl text-[#A0A0A0] max-w-2xl leading-relaxed">
            {businessConfig.aboutDescription}
          </p>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="border-b border-white/10 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, idx) => (
            <div key={idx} className="border-l border-white/10 pl-6">
              <span className="text-3xl md:text-5xl font-['Anton',sans-serif] text-white block">
                {s.value}
              </span>
              <span className="text-xs uppercase tracking-widest text-[#A0A0A0] mt-1 block font-mono">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* The Story & Location Grid */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <SectionHeading
              subtitle="THE PHILOSOPHY"
              title="THE ROOFTOP"
              highlight="SANCTUARY."
            />
            <p className="text-base sm:text-lg text-white/90 leading-relaxed mb-6 font-medium">
              We took strength training out of subterranean basements and elevated it to the open skies of Nashik.
            </p>
            <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed mb-6">
              At {businessConfig.address.fullFormatted}, you train in natural airflow with panoramic city vistas. Morning sessions catch the early sunrise over Gangapur Road; evening sessions finish under focused training spotlights.
            </p>
            <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed mb-8">
              Whether you are an aspiring athlete looking for power, an executive reclaiming conditioning, or someone stepping into the weight room for the first time, our standards do not waiver.
            </p>

            <div className="space-y-3">
              {[
                'Air-conditioned interior & changing facilities',
                'Calibrated free weights and selectorized resistance machinery',
                'Zumba, CrossFit, and combat kickboxing group zones',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#FF5A1F] shrink-0" />
                  <span className="text-xs sm:text-sm text-neutral-300 font-semibold">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative overflow-hidden border border-white/10">
              <img
                src={roarBrandingSignageImg}
                alt="Roar Extreme authentic wall graphics"
                className="w-full h-[420px] sm:h-[480px] object-cover filter contrast-110 brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6 right-6 p-5 bg-black/85 backdrop-blur-md border border-white/10">
                <span className="text-[10px] uppercase font-mono text-[#FF5A1F] block mb-1">AUTHENTIC FACILITY LOCATION</span>
                <p className="text-xs sm:text-sm font-bold text-white">{businessConfig.address.fullFormatted}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Breakdown */}
      <section className="py-20 bg-[#111111] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <SectionHeading
            subtitle="FACILITY STANDARDS"
            title="THREE RULES"
            highlight="WE LIVE BY."
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {pillars.map((p, i) => (
              <div key={i} className="bg-[#171717] border border-white/10 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-[#FF5A1F]/10 border border-[#FF5A1F]/30 flex items-center justify-center text-[#FF5A1F] mb-6">
                    <p.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-['Anton',sans-serif] uppercase text-white mb-3 tracking-wide">
                    {p.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                    {p.desc}
                  </p>
                </div>
                <div className="pt-6 border-t border-white/10 mt-6">
                  <span className="text-xs font-mono text-[#FF5A1F]">PILLAR 0{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA with Authentic Hero image background */}
      <section className="relative py-24 max-w-7xl mx-auto px-6 md:px-12 text-center overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl sm:text-6xl font-black font-['Anton',sans-serif] uppercase text-white mb-5">
            READY TO EXPERIENCE <span className="text-[#FF5A1F]">ROAR?</span>
          </h2>
          <p className="text-sm md:text-base text-[#A0A0A0] max-w-xl mx-auto mb-8">
            {businessConfig.freeSessionDescription}
          </p>
          <AnimatedButton to="/register" variant="primary" className="py-4 px-8 text-xs sm:text-sm">
            CLAIM FREE SINGLE-SESSION PASS <ArrowRight className="w-4 h-4 ml-2" />
          </AnimatedButton>
        </div>
      </section>
    </div>
  );
};

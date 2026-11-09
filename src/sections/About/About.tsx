import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Zap } from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { AnimatedButton } from '../../components/AnimatedButton/AnimatedButton';
import { businessConfig } from '../../config/business';
import roarBrandingSignageImg from '../../assets/roar/branding/roar-branding-signage.jpg';

export const About: React.FC = () => {
  const highlights = [
    {
      icon: Target,
      title: 'STRENGTH & CARDIO',
      desc: 'Free weights, cable multi-stations, and high-performance treadmills.',
    },
    {
      icon: Shield,
      title: 'ROOFTOP FACILITY',
      desc: '6th Floor Terrace, Rushiraj Regency overlooking Vidya Vikas Circle.',
    },
    {
      icon: Zap,
      title: 'ACTIVE GROUP CLASSES',
      desc: 'Zumba, CrossFit, and combat kickboxing conditioning sessions.',
    },
  ];

  return (
    <section id="about" className="scroll-mt-20 py-20 md:py-28 bg-[#080808] border-t border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <SectionHeading
          subtitle="PHILOSOPHY & CULTURE"
          title="BUILT FOR STRENGTH."
          highlight="DRIVEN BY DISCIPLINE."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Asymmetrical Editorial Image - Authentic Roar Fitness Wall Signage */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative"
          >
            <div className="relative overflow-hidden group border border-white/10">
              <img
                src={roarBrandingSignageImg}
                alt="Roar Fitness Extreme Wall Art & Branding"
                loading="lazy"
                className="w-full h-[320px] sm:h-[480px] object-cover filter brightness-90 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

              {/* Corner Badge */}
              <div className="absolute top-0 right-0 p-3.5 bg-[#FF5A1F] text-black font-['Anton',sans-serif] text-base tracking-wider uppercase">
                ROAR • NASHIK
              </div>

              <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/80 backdrop-blur-sm border border-white/10">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#FF5A1F] block mb-1">
                  AUTHENTIC FACILITY
                </span>
                <p className="text-xs text-neutral-300 font-medium">
                  {businessConfig.address.primary}, {businessConfig.address.landmark}, {businessConfig.address.area}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Description & Attributes */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col justify-center"
          >
            <p className="text-lg sm:text-xl text-white font-medium leading-relaxed mb-6 font-['Manrope',sans-serif]">
              "{businessConfig.aboutDescription}"
            </p>

            <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed mb-8">
              Operating on the 6th Floor Terrace at Rushiraj Regency, Vidya Vikas Circle, Gangapur Road, Roar Fitness provides an intense, focused training sanctuary. From general fitness seekers to seasoned lifters, we deliver an unyielding atmosphere where daily discipline produces real athletic outcomes.
            </p>

            {/* Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 border-t border-white/10 pt-6">
              {highlights.map((h, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <h.icon className="w-5 h-5 text-[#FF5A1F] mb-1" />
                  <h4 className="text-xs font-bold text-white tracking-wide uppercase">{h.title}</h4>
                  <p className="text-xs text-[#A0A0A0] leading-snug">{h.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
              <AnimatedButton to="/register" variant="primary" className="text-center py-3.5 sm:py-3 px-6 text-xs font-bold">
                CLAIM FREE PASS
              </AnimatedButton>
              <AnimatedButton to="/training" variant="outline" className="text-center py-3.5 sm:py-3 px-6 text-xs font-bold">
                EXPLORE 8 DISCIPLINES
              </AnimatedButton>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

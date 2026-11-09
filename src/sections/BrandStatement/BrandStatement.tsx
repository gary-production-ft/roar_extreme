import React from 'react';
import { motion } from 'framer-motion';

export const BrandStatement: React.FC = () => {
  return (
    <section className="relative py-28 md:py-40 bg-[#080808] overflow-hidden flex items-center justify-center border-y border-white/10">
      {/* Cinematic Dark Background with Athletic Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <img
          src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop"
          alt="Gym texture"
          className="w-full h-full object-cover filter grayscale contrast-200"
        />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#080808]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 text-center">
        {/* Accent Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-3 mb-6"
        >
          <span className="w-8 h-[2px] bg-[#FF5A1F]" />
          <span className="text-xs md:text-sm uppercase font-mono tracking-widest text-[#FF5A1F]">
            THE ROAR CREED
          </span>
          <span className="w-8 h-[2px] bg-[#FF5A1F]" />
        </motion.div>

        {/* Oversized Brand Statement */}
        <motion.h2
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-['Anton',sans-serif] uppercase tracking-tight text-white leading-[1.05] break-words"
        >
          "YOUR ONLY COMPETITION IS WHO YOU WERE{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A1F] to-[#FF7545]">
            YESTERDAY."
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.6 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-8 text-xs md:text-sm uppercase tracking-widest text-[#A0A0A0]"
        >
          ROAR EXTREME • NASHIK • NO MEDIOCRITY PERMITTED
        </motion.p>
      </div>
    </section>
  );
};


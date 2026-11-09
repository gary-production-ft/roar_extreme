import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ChevronDown, Flame, ArrowRight } from 'lucide-react';
import { AnimatedButton } from '../../components/AnimatedButton/AnimatedButton';
import { businessConfig } from '../../config/business';
import heroMainImg from '../../assets/roar/hero/hero-main.jpg';
import roarLogoImg from '../../assets/roar/branding/roar-logo.jpg';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[92vh] sm:min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#080808]">
      {/* Background Authentic Roar Fitness Image with Parallax zoom feel */}
      <motion.div
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-0"
      >
        <img
          src={heroMainImg}
          alt="Roar Fitness Extreme Nashik Gym Arena"
          loading="eager"
          // @ts-expect-error fetchpriority standard in modern browsers
          fetchpriority="high"
          className="w-full h-full object-cover object-[center_35%] filter brightness-[0.38] contrast-[1.12]"
        />
        {/* Layered Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/75" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#080808] opacity-80" />
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 md:px-12 w-full pt-28 pb-16 sm:pt-32 sm:pb-20 flex flex-col items-start justify-center">
        {/* Brand Logo Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex items-center gap-3 mb-5 sm:mb-6"
        >
          <img
            src={roarLogoImg}
            alt="Roar Extreme Logo"
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-full object-cover border-2 border-[#FF5A1F] shadow-[0_0_16px_rgba(255,90,31,0.45)]"
          />
          <span className="text-[11px] sm:text-xs font-black tracking-[0.2em] uppercase text-[#FF5A1F] font-['Anton',sans-serif]">
            ROAR EXTREME
          </span>
        </motion.div>

        {/* Location & Tagline Pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-3 py-1.5 border border-white/10 bg-black/60 backdrop-blur-md mb-5 sm:mb-6 max-w-full"
        >
          <MapPin className="w-3.5 h-3.5 text-[#FF5A1F] shrink-0" />
          <span className="text-[11px] sm:text-xs uppercase font-bold tracking-widest text-[#FF5A1F]">
            {businessConfig.city.toUpperCase()}, {businessConfig.country.toUpperCase()}
          </span>
          <span className="text-white/20 hidden xs:inline">•</span>
          <span className="text-[11px] sm:text-xs uppercase tracking-wider text-white/80 font-semibold truncate">
            {businessConfig.brandIdentity}
          </span>
        </motion.div>

        {/* Oversized Cinematic Headline */}
        <div className="overflow-hidden mb-5 sm:mb-6 max-w-full">
          <motion.h1
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.75, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-['Anton',sans-serif] uppercase tracking-tight text-white leading-[0.94] break-words"
          >
            UNLEASH YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#FF5A1F]">
              INNER BEAST.
            </span>
          </motion.h1>
        </div>

        {/* Brand Description */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-sm sm:text-lg md:text-xl text-[#A0A0A0] max-w-2xl font-normal leading-relaxed mb-8 sm:mb-10"
        >
          {businessConfig.heroDescription}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto"
        >
          <AnimatedButton to="/register" variant="primary" className="py-3.5 sm:py-4 px-6 sm:px-8 text-xs sm:text-sm text-center">
            <Flame className="w-4 h-4 mr-1 text-white fill-white shrink-0" />
            <span>CLAIM YOUR FREE SESSION</span>
          </AnimatedButton>
          <AnimatedButton
            to="/training"
            variant="outline"
            className="py-3.5 sm:py-4 px-6 sm:px-8 text-xs sm:text-sm text-center"
          >
            <span>EXPLORE OUR TRAINING</span> <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
          </AnimatedButton>
        </motion.div>
      </div>

      {/* Animated Scroll Indicator - Only visible on taller viewports */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="hidden sm:flex absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex-col items-center gap-1.5 pointer-events-none select-none"
      >
        <span className="text-[10px] tracking-widest uppercase text-white/50 font-semibold font-mono">
          SCROLL TO EXPLORE
        </span>
        <ChevronDown className="w-4 h-4 text-[#FF5A1F] animate-bounce" />
      </motion.div>
    </section>
  );
};

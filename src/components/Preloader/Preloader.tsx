import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Preloader: React.FC = () => {
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('roar_preloader_seen');
  });

  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem('roar_preloader_seen', 'true');
    }, 1800);

    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{
            y: '-100%',
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080808]"
        >
          <div className="relative flex flex-col items-center">
            {/* ROAR Wordmark Reveal */}
            <div className="overflow-hidden mb-4">
              <motion.h1
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl xs:text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white font-['Anton',sans-serif] text-center px-4"
              >
                ROAR <span className="text-[#FF5A1F]">EXTREME</span>
              </motion.h1>
            </div>

            {/* Tagline Reveal */}
            <motion.p
              initial={{ opacity: 0, letterSpacing: '0.1em' }}
              animate={{ opacity: 0.8, letterSpacing: '0.3em' }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xs uppercase text-[#A0A0A0] font-semibold mb-6 tracking-widest"
            >
              NASHIK • UNLEASH YOUR INNER BEAST
            </motion.p>

            {/* Orange Animated Progress Line */}
            <div className="w-48 h-[2px] bg-white/10 overflow-hidden relative rounded-full">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: 'easeInOut',
                }}
                className="w-full h-full bg-[#FF5A1F]"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

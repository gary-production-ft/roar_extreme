import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export const CustomCursor: React.FC = () => {
  const location = useLocation();
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on non-touch devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) {
        setIsVisible(false);
        return;
      }

      // Hide custom cursor inside chatbot, modals, text inputs, or admin surfaces
      if (
        target.closest('[data-lenis-prevent="true"], .chatbot-window, input, textarea, select, [contenteditable="true"]') ||
        window.location.pathname.startsWith('/admin')
      ) {
        setIsVisible(false);
        return;
      }

      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest('[data-lenis-prevent="true"], input, textarea, select')) {
        setIsVisible(false);
        return;
      }

      const interactive = target.closest('a, button, [role="button"], .clickable');
      setIsHovered(!!interactive);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Completely disable custom cursor on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden hidden md:block">
      {/* Outer Ring */}
      <motion.div
        className="fixed top-0 left-0 rounded-full border border-[#FF5A1F] pointer-events-none"
        animate={{
          x: mousePosition.x - (isHovered ? 24 : 16),
          y: mousePosition.y - (isHovered ? 24 : 16),
          width: isHovered ? 48 : 32,
          height: isHovered ? 48 : 32,
          opacity: 0.75,
          scale: isHovered ? 1.25 : 1,
          backgroundColor: isHovered ? 'rgba(255, 90, 31, 0.15)' : 'transparent',
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 300,
          mass: 0.5,
        }}
      />
      {/* Center Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-[#FF5A1F] pointer-events-none"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          scale: isHovered ? 0 : 1,
        }}
        transition={{
          type: 'spring',
          damping: 35,
          stiffness: 450,
          mass: 0.2,
        }}
      />
    </div>
  );
};

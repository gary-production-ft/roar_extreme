import React from 'react';
import { motion } from 'framer-motion';

interface SectionHeadingProps {
  subtitle?: string;
  title: string;
  highlight?: string;
  alignment?: 'left' | 'center' | 'right';
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  subtitle,
  title,
  highlight,
  alignment = 'left',
  className = '',
}) => {
  const alignClass = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }[alignment];

  return (
    <div className={`flex flex-col ${alignClass} mb-12 md:mb-16 ${className}`}>
      {subtitle && (
        <div className="flex items-center gap-3 mb-3">
          <span className="h-[2px] w-6 bg-[#FF5A1F]" />
          <span className="text-xs md:text-sm font-semibold tracking-widest uppercase text-[#FF5A1F]">
            {subtitle}
          </span>
        </div>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-['Anton',sans-serif] tracking-tight uppercase text-white leading-none break-words"
      >
        {title}{' '}
        {highlight && <span className="text-[#FF5A1F]">{highlight}</span>}
      </motion.h2>
    </div>
  );
};


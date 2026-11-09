import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface AnimatedButtonProps {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  to,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current || disabled) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * 0.25;
    const y = (clientY - (top + height / 2)) * 0.25;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-bold uppercase tracking-wider text-xs md:text-sm px-7 py-4 transition-all duration-300 overflow-hidden group select-none';

  const variants = {
    primary:
      'bg-[#FF5A1F] text-white hover:bg-[#FF7545] border border-[#FF5A1F]',
    outline:
      'bg-transparent text-white border border-white/20 hover:border-[#FF5A1F] hover:text-[#FF5A1F]',
    ghost:
      'bg-transparent text-[#A0A0A0] hover:text-white border-transparent',
  };

  const content = (
    <motion.div
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', damping: 15, stiffness: 150, mass: 0.1 }}
      className={`inline-block ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className={`${baseStyles} ${variants[variant]} ${className}`}>
        {/* Subtle hover accent sheen effect */}
        <span className="absolute inset-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </div>
    </motion.div>
  );

  if (to && !disabled) {
    return <Link to={to} className="inline-block">{content}</Link>;
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className="inline-block bg-transparent p-0 m-0 border-0 outline-none">
      {content}
    </button>
  );
};


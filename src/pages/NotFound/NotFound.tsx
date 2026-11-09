import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { AnimatedButton } from '../../components/AnimatedButton/AnimatedButton';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 text-center select-none">
      <span className="text-8xl md:text-9xl font-black font-['Anton',sans-serif] text-[#FF5A1F] tracking-tighter">
        404
      </span>
      <h1 className="text-3xl md:text-5xl font-['Anton',sans-serif] uppercase text-white tracking-wide mt-2 mb-4">
        OUT OF BOUNDS
      </h1>
      <p className="text-sm md:text-base text-[#A0A0A0] max-w-md mx-auto mb-8">
        The route you are trying to reach does not exist in the Roar Extreme facility map.
      </p>
      <AnimatedButton to="/" variant="primary" className="py-4 px-8 text-xs">
        <ArrowLeft className="w-4 h-4 mr-2" /> RETURN TO ARENA
      </AnimatedButton>
    </div>
  );
};

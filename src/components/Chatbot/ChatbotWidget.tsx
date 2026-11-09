import React, { useState } from 'react';
import { X, Dumbbell } from 'lucide-react';
import { ChatbotWindow } from './ChatbotWindow.tsx';

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!hasInteracted) setHasInteracted(true);
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-40">
      {/* Chat Window */}
      <ChatbotWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Launcher Button */}
      <div className="relative group">
        {/* Pulsing glow ring when unread / not interacted */}
        {!hasInteracted && !isOpen && (
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#FF5A1F] to-[#FF7545] opacity-75 blur-sm animate-pulse" />
        )}

        <button
          type="button"
          onClick={toggleOpen}
          aria-label={isOpen ? 'Close ROAR AI Chat' : 'Open ROAR AI Chat'}
          className="relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#111111] hover:bg-black border border-[#FF5A1F]/60 text-white shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-[#FF5A1F]" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#FF5A1F] text-black flex items-center justify-center">
                <Dumbbell className="w-3.5 h-3.5 fill-current" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-heading font-black text-xs tracking-wider text-white uppercase leading-none">
                  ROAR AI
                </span>
                <span className="text-[9px] text-[#FF5A1F] tracking-wide font-sans leading-none mt-0.5">
                  Ask Coach
                </span>
              </div>
            </div>
          )}
        </button>

        {/* First time prompt tooltip */}
        {!hasInteracted && !isOpen && (
          <div className="hidden sm:flex absolute bottom-full right-0 mb-3 w-56 p-2.5 rounded-xl bg-[#141414] border border-[#FF5A1F]/40 shadow-xl text-left pointer-events-none animate-bounce">
            <p className="text-[11px] text-white/90 leading-tight">
              ⚡ <strong className="text-[#FF5A1F]">Got questions?</strong> Ask our AI Coach about the rooftop gym, programs & free trials!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

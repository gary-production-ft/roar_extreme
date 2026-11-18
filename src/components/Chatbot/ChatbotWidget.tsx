import React, { useState } from 'react';
import { X, Dumbbell, Headphones } from 'lucide-react';
import { ChatbotWindow } from './ChatbotWindow.tsx';
import { VoiceCoachModal } from './VoiceCoachModal.tsx';

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceDirectOpen, setIsVoiceDirectOpen] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [hasInteracted, setHasInteracted] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!hasInteracted) setHasInteracted(true);
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-40">
      {/* Chat Window */}
      <ChatbotWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Direct Voice Coach Modal (Android / Mobile & Desktop) */}
      <VoiceCoachModal
        isOpen={isVoiceDirectOpen}
        onClose={() => setIsVoiceDirectOpen(false)}
        language={voiceLang}
        onLanguageChange={setVoiceLang}
      />

      {/* Launcher Group */}
      <div className="relative flex items-center gap-2.5">
        {/* Pulsing glow ring when unread / not interacted */}
        {!hasInteracted && !isOpen && (
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#FF5A1F] to-[#FF7545] opacity-75 blur-sm animate-pulse pointer-events-none" />
        )}

        {/* Dedicated 1-Tap Live Voice Coach Button */}
        {!isOpen && (
          <button
            type="button"
            onClick={() => {
              setIsVoiceDirectOpen(true);
              if (!hasInteracted) setHasInteracted(true);
            }}
            aria-label="Speak with ROAR Voice Coach"
            title="Launch Live Voice Coach"
            className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[#FF5A1F] hover:bg-[#FF7545] text-black shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer border-2 border-black"
          >
            <Headphones className="w-5 h-5 fill-current" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </button>
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
              ⚡ <strong className="text-[#FF5A1F]">Got questions?</strong> Talk to our Voice Coach or chat about rooftop training & free passes!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

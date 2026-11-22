import React, { useState, useEffect } from 'react';
import { X, Dumbbell, Mic } from 'lucide-react';
import { ChatbotWindow } from './ChatbotWindow.tsx';
import { VoiceCoachModal } from './VoiceCoachModal.tsx';

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceDirectOpen, setIsVoiceDirectOpen] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [hasInteracted, setHasInteracted] = useState(false);

  // Tooltip dismissal state with persistent localStorage memory (D7)
  const [tooltipDismissed, setTooltipDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('roar_coach_tooltip_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const dismissTooltip = () => {
    setTooltipDismissed(true);
    try {
      localStorage.setItem('roar_coach_tooltip_dismissed', 'true');
    } catch {
      // Safe fallback if localStorage is disabled in private browsing
    }
  };

  // Auto-dismiss tooltip after 8 seconds (D7)
  useEffect(() => {
    if (tooltipDismissed || hasInteracted || isOpen) return;
    const timer = setTimeout(() => {
      dismissTooltip();
    }, 8000);
    return () => clearTimeout(timer);
  }, [tooltipDismissed, hasInteracted, isOpen]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!hasInteracted) setHasInteracted(true);
    if (!tooltipDismissed) dismissTooltip();
  };

  return (
    <div
      className="fixed right-4 sm:right-8 z-40 transition-all"
      style={{
        bottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))',
      }}
    >
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

        {/* Dedicated 1-Tap Live Voice Coach Button with Mic Icon & Accessible Label (D6) */}
        {!isOpen && (
          <button
            type="button"
            onClick={() => {
              setIsVoiceDirectOpen(true);
              if (!hasInteracted) setHasInteracted(true);
              if (!tooltipDismissed) dismissTooltip();
            }}
            aria-label="Ask the Roar coach"
            title="Ask the Roar coach via Voice"
            className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[#FF5A1F] hover:bg-[#FF7545] text-black shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer border-2 border-black"
          >
            <Mic className="w-5 h-5 fill-current" />
          </button>
        )}

        {/* Text Chat Launcher */}
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

        {/* Dismissible First-Time Prompt Tooltip (D7) */}
        {!tooltipDismissed && !hasInteracted && !isOpen && (
          <div
            role="status"
            className="absolute bottom-full right-0 mb-3 w-64 sm:w-72 p-3 rounded-xl bg-[#141414] border border-[#FF5A1F]/40 shadow-2xl text-left z-50 flex items-start justify-between gap-2"
          >
            <div className="flex-1 pr-1">
              <p className="text-[11px] text-white/90 leading-snug">
                ⚡ <strong className="text-[#FF5A1F]">Got questions?</strong> Ask the Roar coach via live voice or text about rooftop facilities & free passes!
              </p>
            </div>
            <button
              type="button"
              onClick={dismissTooltip}
              aria-label="Dismiss tooltip"
              className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

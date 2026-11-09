import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, Sparkles, Dumbbell } from 'lucide-react';
import { VoiceService } from '../../services/voiceService.ts';
import { ChatService } from '../../services/chatService.ts';

interface VoiceCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'hi' | 'mr';
  onLanguageChange: (lang: 'en' | 'hi' | 'mr') => void;
}

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export const VoiceCoachModal: React.FC<VoiceCoachModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
}) => {
  const [state, setState] = useState<VoiceState>('idle');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [coachResponse, setCoachResponse] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      VoiceService.stopListening();
      VoiceService.stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      VoiceService.stopListening();
      VoiceService.stopSpeaking();
      setState('idle');
    } else {
      // Auto-start greeting or prompt user
      setCoachResponse(
        language === 'hi'
          ? 'नमस्ते! मैं रोअर एआई कोच हूँ। आप रूफटॉप जिम, फ्री सेशन या वर्कआउट के बारे में कुछ भी पूछ सकते हैं।'
          : language === 'mr'
          ? 'नमस्कार! मी रोअर एआय कोच आहे. तुम्ही रूफटॉप जिम, फ्री सेशन किंवा वर्कआउट बद्दल काहीही विचारू शकता.'
          : "I am your ROAR Voice Coach. Ask me anything about our rooftop facility, workouts, or your free session pass."
      );
    }
  }, [isOpen, language]);

  const handleStartListening = () => {
    VoiceService.stopSpeaking();
    setState('listening');
    setUserTranscript('');

    VoiceService.startListening({
      language,
      onResult: (text, isFinal) => {
        if (!isMountedRef.current) return;
        setUserTranscript(text);
        if (isFinal) {
          handleProcessVoiceInput(text);
        }
      },
      onError: (err) => {
        if (!isMountedRef.current) return;
        console.warn('Voice recognition error:', err);
        setState('idle');
      },
      onEnd: () => {
        if (!isMountedRef.current) return;
        if (state === 'listening' && !userTranscript) {
          setState('idle');
        }
      },
    });
  };

  const handleStopListening = () => {
    VoiceService.stopListening();
    if (userTranscript) {
      handleProcessVoiceInput(userTranscript);
    } else {
      setState('idle');
    }
  };

  const handleProcessVoiceInput = async (spokenText: string) => {
    VoiceService.stopListening();
    setState('thinking');

    let responseBuffer = '';

    try {
      await ChatService.streamMessage({
        message: spokenText,
        language,
        onDelta: (delta) => {
          if (!isMountedRef.current) return;
          responseBuffer += delta;
          setCoachResponse(responseBuffer);
        },
        onComplete: (fullText) => {
          if (!isMountedRef.current) return;
          setState('speaking');
          setCoachResponse(fullText);

          if (!isMuted) {
            VoiceService.speak({
              text: fullText,
              language,
              onEnd: () => {
                if (isMountedRef.current) {
                  setState('idle');
                }
              },
            });
          } else {
            setState('idle');
          }
        },
        onError: () => {
          if (!isMountedRef.current) return;
          const fallback = 'ROAR Extreme Nashik is located at the 6th floor rooftop on Gangapur Road. You can claim your free session pass below.';
          setCoachResponse(fallback);
          setState('speaking');
          if (!isMuted) {
            VoiceService.speak({
              text: fallback,
              language,
              onEnd: () => isMountedRef.current && setState('idle'),
            });
          } else {
            setState('idle');
          }
        },
      });
    } catch {
      setState('idle');
    }
  };

  const handleToggleMute = () => {
    if (!isMuted) {
      VoiceService.stopSpeaking();
      setIsMuted(true);
    } else {
      setIsMuted(false);
      if (state === 'speaking' && coachResponse) {
        VoiceService.speak({ text: coachResponse, language });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl font-sans text-white">
      <div className="relative w-full max-w-lg bg-[#0F0F0F] border border-[#FF5A1F]/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Background ambient lighting */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-all duration-700 ${
            state === 'listening'
              ? 'bg-[#FF5A1F]/30 scale-125'
              : state === 'speaking'
              ? 'bg-[#FF7545]/25 scale-110'
              : 'bg-white/5 scale-100'
          }`}
        />

        {/* Close Button & Header Bar */}
        <div className="w-full flex items-center justify-between pb-6 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF5A1F] text-black flex items-center justify-center">
              <Dumbbell className="w-4 h-4 fill-current" />
            </div>
            <div className="text-left">
              <span className="font-heading font-black text-sm tracking-widest text-white uppercase block">
                ROAR VOICE COACH
              </span>
              <span className="text-[10px] font-mono text-[#FF5A1F] tracking-wider uppercase block">
                Hands-Free Audio Arena
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="flex bg-black/60 rounded border border-white/10 p-0.5 text-[10px] font-mono">
              {(['en', 'hi', 'mr'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => onLanguageChange(l)}
                  className={`px-2 py-0.5 rounded uppercase font-bold cursor-pointer transition-colors ${
                    language === l ? 'bg-[#FF5A1F] text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Mute button */}
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Animated Central Beast Orb */}
        <div className="relative my-8 z-10 flex items-center justify-center">
          {/* Concentric sound rings */}
          {state === 'listening' && (
            <>
              <div className="absolute w-44 h-44 rounded-full border-2 border-[#FF5A1F]/30 animate-ping pointer-events-none" />
              <div className="absolute w-36 h-36 rounded-full border border-[#FF5A1F]/50 animate-pulse pointer-events-none" />
            </>
          )}

          {state === 'speaking' && (
            <div className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-[#FF5A1F]/20 to-[#FF7545]/20 animate-pulse pointer-events-none" />
          )}

          <button
            type="button"
            onClick={state === 'listening' ? handleStopListening : handleStartListening}
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
              state === 'listening'
                ? 'bg-[#FF5A1F] text-black scale-110 shadow-[#FF5A1F]/40'
                : state === 'thinking'
                ? 'bg-[#1e1e1e] border-2 border-[#FF5A1F] text-[#FF5A1F] animate-spin'
                : state === 'speaking'
                ? 'bg-[#FF5A1F] text-black shadow-[#FF5A1F]/30'
                : 'bg-[#181818] border-2 border-white/15 text-white/80 hover:border-[#FF5A1F] hover:text-[#FF5A1F] hover:scale-105'
            }`}
          >
            {state === 'listening' ? (
              <Mic className="w-10 h-10 animate-bounce" />
            ) : state === 'thinking' ? (
              <Sparkles className="w-10 h-10" />
            ) : state === 'speaking' ? (
              <Volume2 className="w-10 h-10 animate-pulse" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>
        </div>

        {/* Audio Equalizer animation when speaking */}
        {state === 'speaking' && (
          <div className="flex items-center gap-1.5 h-6 mb-3">
            {[40, 75, 55, 90, 60, 85, 45, 95, 65, 50].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-[#FF5A1F] rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDuration: `${0.4 + (i % 4) * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Status Text Indicator */}
        <div className="relative z-10 mb-4">
          <span className="text-xs uppercase font-mono tracking-widest text-[#FF5A1F]">
            {state === 'idle' && 'Tap Orb to Speak'}
            {state === 'listening' && 'Listening... Speak your question now'}
            {state === 'thinking' && 'Google Gemini is processing...'}
            {state === 'speaking' && 'AI Coach is speaking'}
          </span>
        </div>

        {/* Live Conversation Transcript Display */}
        <div className="w-full bg-[#141414] border border-white/10 rounded-2xl p-4 text-left relative z-10 space-y-3 max-h-48 overflow-y-auto">
          {userTranscript && (
            <div className="text-xs text-white/90">
              <span className="text-[10px] font-mono text-[#FF5A1F] uppercase block mb-0.5">
                You Asked:
              </span>
              <p className="font-medium italic">"{userTranscript}"</p>
            </div>
          )}

          {coachResponse && (
            <div className="text-xs text-white/80">
              <span className="text-[10px] font-mono text-green-400 uppercase block mb-0.5">
                Coach Answer:
              </span>
              <p className="leading-relaxed">{coachResponse}</p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex items-center gap-3 relative z-10">
          {state === 'listening' ? (
            <button
              onClick={handleStopListening}
              className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-lg"
            >
              <MicOff className="w-4 h-4" />
              <span>Finish Speaking</span>
            </button>
          ) : (
            <button
              onClick={handleStartListening}
              className="px-6 py-2.5 rounded-full bg-[#FF5A1F] hover:bg-[#FF7545] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-[#FF5A1F]/20"
            >
              <Mic className="w-4 h-4" />
              <span>{userTranscript ? 'Ask Another Question' : 'Start Voice Conversation'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


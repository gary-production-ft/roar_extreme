import React, { useState } from 'react';
import { Dumbbell, MapPin, Calendar, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import type { ChatMessageItem } from '../../services/chatService.ts';
import { VoiceService } from '../../services/voiceService.ts';
import { FormattedMessage } from './FormattedMessage.tsx';

interface ChatMessageProps {
  message: ChatMessageItem;
  language?: 'en' | 'hi' | 'mr';
  onActionClick?: (action: string) => void;
}

export const ChatbotMessage: React.FC<ChatMessageProps> = ({ message, language = 'en', onActionClick }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const handleToggleSpeak = () => {
    if (isPlaying) {
      VoiceService.stopSpeaking();
      setIsPlaying(false);
    } else {
      VoiceService.speak({
        text: message.content,
        language,
        onStart: () => setIsPlaying(true),
        onEnd: () => setIsPlaying(false),
      });
    }
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 my-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Bot Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-black border border-[#FF5A1F]/40 flex items-center justify-center shrink-0 text-[#FF5A1F] shadow-md mt-0.5">
          <Dumbbell className="w-4 h-4" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs font-sans leading-relaxed shadow-lg ${
          isUser
            ? 'bg-[#FF5A1F] text-black font-semibold rounded-br-xs'
            : 'bg-[#161616] border border-white/10 text-white/95 rounded-tl-xs'
        }`}
      >
        <div className="select-text">
          {isUser ? (
            <p className="font-semibold text-black leading-relaxed">{message.content}</p>
          ) : message.isStreaming && !message.content ? (
            <div className="flex items-center gap-1.5 py-1 text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-[11px] font-mono text-white/40 ml-1">AI Coach is thinking...</span>
            </div>
          ) : (
            <FormattedMessage content={message.content} />
          )}
          {message.isStreaming && message.content && (
            <span className="inline-block w-2 h-4 ml-1 bg-[#FF5A1F] animate-pulse align-middle rounded-xs" />
          )}
        </div>

        {/* Audio Speaker Button for Assistant Messages */}
        {!isUser && !message.isStreaming && message.content && (
          <div className="mt-1.5 flex items-center justify-end">
            <button
              type="button"
              onClick={handleToggleSpeak}
              title={isPlaying ? 'Stop Voice' : 'Listen with Voice Coach'}
              className="inline-flex items-center gap-1 text-[10px] text-white/50 hover:text-[#FF5A1F] transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <VolumeX className="w-3 h-3 text-red-400" />
                  <span className="text-red-400 font-mono">Playing</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3" />
                  <span className="font-mono">Listen</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Dynamic Tool Results / Suggested Call To Actions */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-white/10 space-y-2">
            {message.toolCalls.map((tool, idx) => {
              if (tool.name === 'open_lead_form') {
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-black/60 border border-[#FF5A1F]/30 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-[#FF5A1F] font-bold uppercase tracking-wider text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Complimentary Trial Pass</span>
                    </div>
                    <p className="text-[11px] text-white/70">
                      Reserve your 60-minute guided session on our 6th-floor rooftop terrace.
                    </p>
                    <a
                      href="#free-session"
                      onClick={() => onActionClick && onActionClick('scroll_to_registration')}
                      className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-[#FF5A1F] text-black font-bold uppercase tracking-wider text-[11px] hover:bg-[#FF7545] transition-colors"
                    >
                      <span>Claim Free Pass</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                );
              }

              if (tool.name === 'get_gym_location') {
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-black/60 border border-white/10 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-white font-bold uppercase tracking-wider text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-[#FF5A1F]" />
                      <span>Rooftop Gym Address</span>
                    </div>
                    <p className="text-[11px] text-white/70">
                      6th Floor Terrace, Rushiraj Regency, Vidya Vikas Circle, Gangapur Road, Nashik
                    </p>
                    <a
                      href="#location"
                      onClick={() => onActionClick && onActionClick('scroll_to_location')}
                      className="text-[11px] text-[#FF5A1F] hover:underline flex items-center gap-1"
                    >
                      View on Interactive Map <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};


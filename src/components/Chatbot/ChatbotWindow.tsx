import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Sliders,
  RotateCcw,
  AlertTriangle,
  Mic,
  MicOff,
  Headphones,
  ChevronDown,
} from 'lucide-react';
import { ChatbotMessage } from './ChatbotMessage.tsx';
import { ChatbotQuickActions } from './ChatbotQuickActions.tsx';
import { ChatbotMemoryConsentModal } from './ChatbotMemoryConsentModal.tsx';
import { VoiceCoachModal } from './VoiceCoachModal.tsx';
import { ChatService, type ChatMessageItem } from '../../services/chatService.ts';
import { VoiceService } from '../../services/voiceService.ts';

interface ChatbotWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatbotWindow: React.FC<ChatbotWindowProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome_msg',
      role: 'assistant',
      content:
        'Welcome to **ROAR EXTREME Nashik**. I am your AI Coach powered by **Google Gemini**.\n\nAsk me anything about our rooftop arena, workout disciplines (Strength, Zumba, CrossFit, Kickboxing), timings, or claim your **Complimentary Free Session Pass**.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    setShowScrollBottom(!isNearBottom);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom('auto');
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom('smooth');
    }
  }, [messages, showScrollBottom]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isStreaming) return;

    const userMsgId = 'user_' + Date.now();
    const assistantMsgId = 'asst_' + (Date.now() + 1);

    const userMessage: ChatMessageItem = {
      id: userMsgId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const initialAssistantMsg: ChatMessageItem = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMsg]);
    setInputText('');
    setLastFailedText(null);
    setIsStreaming(true);
    setShowScrollBottom(false);

    try {
      await ChatService.streamMessage({
        message: text,
        language,
        onDelta: (delta) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content + delta }
                : msg
            )
          );
        },
        onToolCall: (tool) => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === assistantMsgId) {
                const tools = msg.toolCalls || [];
                return { ...msg, toolCalls: [...tools, tool] };
              }
              return msg;
            })
          );
        },
        onComplete: (fullText) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: fullText, isStreaming: false }
                : msg
            )
          );
          setIsStreaming(false);
          setLastFailedText(null);
        },
        onError: (err) => {
          setLastFailedText(text);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content:
                      msg.content ||
                      "I'm momentarily recalibrating. You can contact our head coach directly at 601/602 Rushiraj Regency, Vidya Vikas Circle, above Axis Bank, Patil Colony, Canada Corner, Nashik (422005), or submit your Free Pass application below.",
                    isStreaming: false,
                  }
                : msg
            )
          );
          setIsStreaming(false);
          console.error('Chat error:', err);
        },
      });
    } catch {
      setLastFailedText(text);
      setIsStreaming(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedText) {
      const textToRetry = lastFailedText;
      setLastFailedText(null);
      handleSendMessage(textToRetry);
    }
  };

  const handleToggleVoiceInput = () => {
    if (isRecording) {
      VoiceService.stopListening();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      VoiceService.startListening({
        language,
        onStart: () => setIsRecording(true),
        onResult: (text, isFinal) => {
          setInputText(text);
          if (isFinal) {
            setIsRecording(false);
          }
        },
        onError: () => setIsRecording(false),
        onEnd: () => setIsRecording(false),
      });
    }
  };

  const handleActionClick = (action: string) => {
    if (action === 'scroll_to_registration') {
      onClose();
      const el = document.getElementById('free-session');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (action === 'scroll_to_location') {
      onClose();
      const el = document.getElementById('location');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        role: 'assistant',
        content:
          'Conversation reset. How can I help you achieve your athletic goals at Roar Extreme Nashik today?',
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-8 z-50 w-full sm:w-[460px] md:w-[480px] h-[100dvh] sm:h-[640px] sm:max-h-[88vh] flex flex-col bg-[#0D0D0D] border-0 sm:border sm:border-white/20 sm:rounded-2xl rounded-none shadow-2xl overflow-hidden font-sans overscroll-contain"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#131313] border-b border-white/10 select-none shrink-0 gap-2">
          {/* Brand Left */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-lg bg-black border border-[#FF5A1F] flex items-center justify-center font-heading font-black text-[#FF5A1F] text-xs">
                RE
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-black text-sm tracking-wider text-white uppercase truncate leading-tight">
                ROAR AI COACH
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50 leading-tight mt-0.5 truncate">
                <span>Rooftop Nashik</span>
                <span className="text-white/25">•</span>
                <span className="text-[#FF5A1F] font-bold">Gemini 3.5</span>
              </div>
            </div>
          </div>

          {/* Controls Right */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Live Hands-Free Voice Agent Button */}
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              title="Launch Live Voice Coach"
              className="hidden sm:inline-flex h-7 px-2.5 items-center gap-1 rounded-lg bg-[#FF5A1F]/15 hover:bg-[#FF5A1F] text-[#FF5A1F] hover:text-black border border-[#FF5A1F]/30 transition-all text-[10.5px] font-bold uppercase tracking-wider cursor-pointer shadow-sm"
            >
              <Headphones className="w-3 h-3 shrink-0" />
              <span>Voice</span>
            </button>

            {/* Language Switcher */}
            <div className="h-7 flex items-center bg-black/60 rounded-lg border border-white/10 p-0.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`h-full px-1.5 rounded flex items-center justify-center cursor-pointer transition-colors ${
                  language === 'en' ? 'bg-[#FF5A1F] text-black font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`h-full px-1.5 rounded flex items-center justify-center cursor-pointer transition-colors ${
                  language === 'hi' ? 'bg-[#FF5A1F] text-black font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                HI
              </button>
              <button
                type="button"
                onClick={() => setLanguage('mr')}
                className={`h-full px-1.5 rounded flex items-center justify-center cursor-pointer transition-colors ${
                  language === 'mr' ? 'bg-[#FF5A1F] text-black font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                MR
              </button>
            </div>

            {/* Icon Buttons Group */}
            <div className="flex items-center gap-0.5 pl-0.5">
              <button
                type="button"
                onClick={() => setIsMemoryModalOpen(true)}
                title="Memory & Privacy Settings"
                className="hidden xs:flex w-7 h-7 items-center justify-center text-white/60 hover:text-[#FF5A1F] rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Restart Conversation"
                className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close ROAR AI Chat"
                className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Message Area with explicit lenis-prevent and native scroll */}
        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            data-lenis-prevent="true"
            className="h-full overflow-y-auto overscroll-contain px-4 py-3 space-y-3 bg-gradient-to-b from-[#0D0D0D] to-[#121212] select-text"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 90, 31, 0.4) transparent',
            }}
          >
            {messages.map((m) => (
              <ChatbotMessage
                key={m.id}
                message={m}
                language={language}
                onActionClick={handleActionClick}
              />
            ))}
            {lastFailedText && !isStreaming && (
              <div className="flex items-center justify-between gap-3 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200">
                <span className="truncate">Connection interrupted. Could not deliver message.</span>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-3 py-1 bg-[#FF5A1F] text-black font-bold rounded-lg hover:bg-[#FF7545] transition-colors shrink-0 cursor-pointer text-xs"
                >
                  Retry
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating snap-to-bottom button when scrolled up */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={() => scrollToBottom('smooth')}
              className="absolute bottom-3 right-4 p-2 rounded-full bg-[#FF5A1F] text-black shadow-lg hover:bg-[#FF7545] transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
            >
              <ChevronDown className="w-4 h-4" />
              <span>Latest</span>
            </button>
          )}
        </div>

        {/* Quick Actions Drawer (Single horizontal scrollable row, never wraps into bulky stack) */}
        <ChatbotQuickActions onSelect={(prompt) => handleSendMessage(prompt)} disabled={isStreaming} />

        {/* Medical & Knowledge Disclaimer */}
        <div className="px-3.5 py-1.5 bg-black/90 border-t border-white/5 text-[9.5px] text-white/50 flex items-center justify-between shrink-0 select-none">
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-[#FF5A1F] shrink-0" />
            <span>Grounded official facts. Not medical advice.</span>
          </span>
          <span className="font-mono text-[9px] text-[#FF5A1F]/80">Gemini 3.5 Live</span>
        </div>

        {/* Input Bar with Speech Dictation Mic */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-[#141414] border-t border-white/10 flex items-center gap-2 shrink-0"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isRecording
                  ? 'Listening to your voice...'
                  : isStreaming
                  ? 'AI Coach is responding...'
                  : 'Ask about workouts, trial pass, timings...'
              }
              disabled={isStreaming}
              className={`w-full bg-[#1e1e1e] border rounded-xl pl-3.5 pr-8 py-2.5 text-[16px] sm:text-xs text-white placeholder-white/40 focus:outline-none transition-colors ${
                isRecording
                  ? 'border-red-500 shadow-sm shadow-red-500/20'
                  : 'border-white/10 focus:border-[#FF5A1F]'
              }`}
            />
            {inputText.length > 0 && !isStreaming && !isRecording && (
              <Sparkles className="absolute right-3 top-3 w-3.5 h-3.5 text-[#FF5A1F] opacity-70 pointer-events-none" />
            )}
          </div>

          {/* Microphone Dictation Button */}
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            title={isRecording ? 'Stop Recording' : 'Voice Input (Speak)'}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#FF5A1F] border border-white/10'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isStreaming}
            className="w-10 h-10 rounded-xl bg-[#FF5A1F] hover:bg-[#FF7545] disabled:opacity-40 disabled:hover:bg-[#FF5A1F] text-black flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Fullscreen Hands-Free Live Voice Coach Modal */}
      <VoiceCoachModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Memory & Consent Modal */}
      <ChatbotMemoryConsentModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        onMemoryCleared={() => {
          setMessages((prev) => [
            ...prev,
            {
              id: 'sys_' + Date.now(),
              role: 'system',
              content: 'Athletic profile and personalization memory cleared.',
            },
          ]);
        }}
      />
    </>
  );
};

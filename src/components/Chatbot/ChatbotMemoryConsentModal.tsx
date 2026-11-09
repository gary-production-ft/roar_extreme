import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Trash2, CheckCircle2 } from 'lucide-react';
import { ChatService, type UserPreferenceItem } from '../../services/chatService.ts';

interface MemoryConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryCleared: () => void;
}

export const ChatbotMemoryConsentModal: React.FC<MemoryConsentModalProps> = ({
  isOpen,
  onClose,
  onMemoryCleared,
}) => {
  const [consent, setConsent] = useState<boolean>(true);
  const [preferences, setPreferences] = useState<UserPreferenceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [clearedNotice, setClearedNotice] = useState<boolean>(false);

  const loadPreferences = async () => {
    setLoading(true);
    const data = await ChatService.getPreferences();
    setConsent(data.consentGiven);
    setPreferences(data.preferences);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen]);

  const handleToggleConsent = async () => {
    const next = !consent;
    setConsent(next);
    await ChatService.updateConsent(next);
  };

  const handleClearMemory = async () => {
    setLoading(true);
    await ChatService.clearPreferences();
    setPreferences([]);
    setClearedNotice(true);
    setLoading(false);
    onMemoryCleared();
    setTimeout(() => setClearedNotice(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-xl p-6 shadow-2xl text-white font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FF5A1F]" />
            <h3 className="font-heading font-black tracking-wider text-base text-white">
              AI MEMORY & PRIVACY PREFERENCES
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-xs text-white/70">
          <p>
            ROAR AI remembers your fitness goals, experience level, and training preferences across sessions to deliver personalized recommendations without asking repeated questions.
          </p>

          {/* Toggle Consent */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#181818] border border-white/5">
            <div>
              <p className="font-semibold text-white">Enable Personalized Context</p>
              <p className="text-[11px] text-white/50">Allow ROAR AI to adapt guidance to your athletic goals.</p>
            </div>
            <button
              type="button"
              onClick={handleToggleConsent}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                consent ? 'bg-[#FF5A1F]' : 'bg-white/20'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  consent ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Current Saved Memories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white/90">Saved Athletic Attributes ({preferences.length})</span>
              {preferences.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearMemory}
                  disabled={loading}
                  className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All Memory
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-4 text-center text-white/40">Loading preferences...</div>
            ) : preferences.length === 0 ? (
              <div className="p-4 text-center rounded bg-[#181818] border border-white/5 text-white/40">
                No personalized attributes currently saved.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {preferences.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded bg-[#181818] border border-white/5 text-[11px]"
                  >
                    <span className="font-mono text-white/50">{p.key}</span>
                    <span className="font-semibold text-[#FF5A1F] uppercase">{p.value}</span>
                  </div>
                ))}
              </div>
            )}

            {clearedNotice && (
              <div className="flex items-center gap-2 mt-2 p-2 rounded bg-green-950/40 border border-green-500/30 text-green-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Memory wiped successfully from this session and database.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold tracking-wider uppercase rounded bg-[#FF5A1F] hover:bg-[#FF7545] text-black transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

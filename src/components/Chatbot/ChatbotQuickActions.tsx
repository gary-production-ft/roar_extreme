import React from 'react';

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  { label: '🔥 Claim Free Pass', prompt: 'I want to claim a free single session pass. How does it work?' },
  { label: '📍 Rooftop Location', prompt: 'Where is Roar Extreme located in Nashik and what are the gym hours?' },
  { label: '🏋️ Workout Disciplines', prompt: 'What training programs and fitness disciplines do you offer at Roar Extreme?' },
  { label: '💳 Membership Pricing', prompt: 'What are your membership options and rates?' },
  { label: '🥊 Kickboxing & CrossFit', prompt: 'Tell me about Kickboxing and CrossFit training at Roar Extreme.' },
  { label: '💪 Intense Chest Day', prompt: 'Give me an intense chest workout routine for today.' },
];

export const ChatbotQuickActions: React.FC<QuickActionsProps> = ({ onSelect, disabled }) => {
  return (
    <div
      data-lenis-prevent
      className="flex flex-nowrap items-center gap-2 px-3 py-2 bg-[#111111] border-t border-white/10 overflow-x-auto overflow-y-hidden overscroll-contain select-none no-scrollbar shrink-0"
    >
      {QUICK_PROMPTS.map((item, index) => (
        <button
          key={index}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(item.prompt)}
          className="text-[10.5px] font-sans font-bold tracking-wider uppercase px-3 py-1.5 rounded-full bg-[#1c1c1c] hover:bg-[#FF5A1F] text-white/80 hover:text-black border border-white/10 hover:border-[#FF5A1F] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 shadow-sm"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

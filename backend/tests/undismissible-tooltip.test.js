import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D7: Dismissible Tooltip, LocalStorage & Safe Areas', () => {
  const widgetPath = path.resolve(process.cwd(), '../src/components/Chatbot/ChatbotWidget.tsx');
  const widgetContent = fs.readFileSync(widgetPath, 'utf8');

  it('contains an interactive dismiss button with accessible label', () => {
    expect(widgetContent).toContain('aria-label="Dismiss tooltip"');
    expect(widgetContent).toContain('onClick={dismissTooltip}');
  });

  it('persists dismissal in localStorage inside try/catch block', () => {
    expect(widgetContent).toContain('localStorage.getItem(\'roar_coach_tooltip_dismissed\')');
    expect(widgetContent).toContain('localStorage.setItem(\'roar_coach_tooltip_dismissed\', \'true\')');
    expect(widgetContent).toContain('try {');
  });

  it('automatically auto-dismisses after a timeout delay', () => {
    expect(widgetContent).toContain('setTimeout');
    expect(widgetContent).toContain('8000');
  });

  it('respects env(safe-area-inset-bottom) for mobile viewport protection', () => {
    expect(widgetContent).toContain('safe-area-inset-bottom');
  });

  it('removes pointer-events-none and aggressive infinite bounce from tooltip', () => {
    expect(widgetContent).not.toContain('pointer-events-none animate-bounce');
  });
});

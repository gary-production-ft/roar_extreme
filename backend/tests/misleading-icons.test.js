import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D6: Misleading Icons & Accessible Labels', () => {
  const widgetPath = path.resolve(process.cwd(), '../src/components/Chatbot/ChatbotWidget.tsx');
  const widgetContent = fs.readFileSync(widgetPath, 'utf8');

  it('uses Mic icon instead of misleading Home or other icons for voice launch', () => {
    expect(widgetContent).toContain('<Mic');
    expect(widgetContent).not.toContain('<Home');
  });

  it('provides accessible label "Ask the Roar coach" on the floating voice launcher', () => {
    expect(widgetContent).toContain('aria-label="Ask the Roar coach"');
  });

  it('removes fake blinking unread notification badge from the voice launcher', () => {
    expect(widgetContent).not.toContain('animate-ping');
    expect(widgetContent).not.toContain('bg-red-500');
  });
});

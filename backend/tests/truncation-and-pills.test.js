import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D11: Truncation, Select Labels & Quick-Reply Pills Verification', () => {
  const quickActionsPath = path.resolve(process.cwd(), '../src/components/Chatbot/ChatbotQuickActions.tsx');
  const modalPath = path.resolve(process.cwd(), '../src/components/FitnessPlan/FitnessPlanModal.tsx');
  const footerPath = path.resolve(process.cwd(), '../src/components/Footer/Footer.tsx');

  const quickActionsContent = fs.readFileSync(quickActionsPath, 'utf8');
  const modalContent = fs.readFileSync(modalPath, 'utf8');
  const footerContent = fs.readFileSync(footerPath, 'utf8');

  it('AI Coach quick-reply pills use horizontal scroll snap with snap-mandatory and snap-start', () => {
    expect(quickActionsContent).toContain('snap-x');
    expect(quickActionsContent).toContain('snap-mandatory');
    expect(quickActionsContent).toContain('snap-start');
    expect(quickActionsContent).toContain('scroll-px-3');
  });

  it('Plan Designer goals grid uses 2-col layout (sm:grid-cols-2) instead of squished 4-col to prevent clipped select labels', () => {
    expect(modalContent).toContain('grid grid-cols-1 sm:grid-cols-2 gap-3.5');
  });

  it('Footer external and social links lock text and icon together with whitespace-nowrap and inline-flex', () => {
    expect(footerContent).toContain('whitespace-nowrap');
    expect(footerContent).toContain('inline-flex items-center gap-1 font-mono whitespace-nowrap');
  });

  it('Footer uses client-side Link components for hash sections', () => {
    expect(footerContent).toContain('<Link to="/#amenities"');
    expect(footerContent).toContain('<Link to="/#gallery"');
  });
});

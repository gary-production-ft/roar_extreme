import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D10: About Stats Bar Sizing & Wrapping Prevention', () => {
  const aboutPath = path.resolve(process.cwd(), '../src/pages/About/About.tsx');
  const aboutContent = fs.readFileSync(aboutPath, 'utf8');

  it('uses whitespace-nowrap so "8 Disciplines" never wraps while siblings stay on one line', () => {
    expect(aboutContent).toContain('whitespace-nowrap');
  });

  it('uses clamp() responsive typography to scale font cleanly from 320px to 1440px', () => {
    expect(aboutContent).toContain('clamp(1.25rem,4vw,2.5rem)');
  });

  it('enforces equal-height cells via items-stretch and h-full', () => {
    expect(aboutContent).toContain('items-stretch');
    expect(aboutContent).toContain('h-full');
  });
});

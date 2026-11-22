import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(process.cwd(), '../src');

function readSource(rel) {
  return fs.readFileSync(path.join(SRC_DIR, rel), 'utf8');
}

describe('D16: Leaked Placeholder Copy Scanner', () => {
  it('Membership.tsx has no "PRICING PLANS UNDER OWNER CONFIRMATION" text', () => {
    const src = readSource('sections/Membership/Membership.tsx');
    expect(src).not.toMatch(/PRICING PLANS UNDER OWNER CONFIRMATION/);
  });

  it('Membership.tsx has no leaked directory rate figures', () => {
    const src = readSource('sections/Membership/Membership.tsx');
    expect(src).not.toMatch(/Directory catalogue rates on record/);
    expect(src).not.toMatch(/6,500/);
  });

  it('Footer.tsx has no "Pending owner verification" text', () => {
    const src = readSource('components/Footer/Footer.tsx');
    expect(src).not.toMatch(/Pending owner verification/i);
    expect(src).not.toMatch(/PENDING CONFIRMATION/);
  });

  it('Footer.tsx shows phone only when isPhoneVerifiedByOwner is true (conditional render)', () => {
    const src = readSource('components/Footer/Footer.tsx');
    expect(src).toContain('isPhoneVerifiedByOwner');
  });

  it('facilities.ts has no Magicpin Verified Listing source text', () => {
    const src = readSource('config/facilities.ts');
    expect(src).not.toMatch(/Magicpin Verified Listing/);
    expect(src).not.toMatch(/Magicpin & Business Hours/);
  });

  it('no TSX file in sections/ contains "Phase 1 Frontend Sandbox"', () => {
    const files = fs.readdirSync(path.join(SRC_DIR, 'sections'), { recursive: true })
      .filter((f) => typeof f === 'string' && f.endsWith('.tsx'));
    for (const f of files) {
      const src = fs.readFileSync(path.join(SRC_DIR, 'sections', f), 'utf8');
      expect(src, `${f} contains sandbox text`).not.toMatch(/Phase 1 Frontend Sandbox/);
    }
  });

  it('no TSX file in sections/ contains raw TODO or lorem', () => {
    const files = fs.readdirSync(path.join(SRC_DIR, 'sections'), { recursive: true })
      .filter((f) => typeof f === 'string' && f.endsWith('.tsx'));
    for (const f of files) {
      const src = fs.readFileSync(path.join(SRC_DIR, 'sections', f), 'utf8');
      expect(src, `${f} contains TODO`).not.toMatch(/\bTODO\b/);
      expect(src, `${f} contains lorem`).not.toMatch(/\blorem\b/i);
    }
  });
});

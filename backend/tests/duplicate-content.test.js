import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D14: Duplicate Content Elimination', () => {
  const facilitiesPath = path.resolve(process.cwd(), '../src/config/facilities.ts');
  const facilitiesContent = fs.readFileSync(facilitiesPath, 'utf8');

  it('removes separate CHANGING ROOMS entry (merged into LOCKERS & CHANGING ROOMS)', () => {
    expect(facilitiesContent).not.toContain("id: 'changing-rooms'");
    expect(facilitiesContent).not.toContain("'CHANGING ROOMS'");
  });

  it('removes separate LOCKER FACILITY entry (merged)', () => {
    expect(facilitiesContent).not.toContain("id: 'locker-facility'");
    expect(facilitiesContent).not.toContain("'LOCKER FACILITY'");
  });

  it('contains a single unified LOCKERS & CHANGING ROOMS entry', () => {
    expect(facilitiesContent).toContain("id: 'lockers-changing-rooms'");
    expect(facilitiesContent).toContain("LOCKERS & CHANGING ROOMS");
  });

  it('uses lockersChangingImg exactly once (no duplicate photo banner)', () => {
    const matches = (facilitiesContent.match(/lockersChangingImg/g) || []);
    expect(matches.length).toBe(2); // 1 import + 1 usage
  });

  it('removes Magicpin & Business Hours and Magicpin Verified Listing source text', () => {
    expect(facilitiesContent).not.toContain('Magicpin Verified Listing');
    expect(facilitiesContent).not.toContain('Magicpin & Business Hours');
  });

  it('replaces source text with Verified Facility Standard', () => {
    expect(facilitiesContent).toContain('Verified Facility Standard');
  });

  it('total count of unique IDs is exactly 6', () => {
    const idMatches = facilitiesContent.match(/id: '[^']+'/g) || [];
    expect(idMatches.length).toBe(6);
  });
});

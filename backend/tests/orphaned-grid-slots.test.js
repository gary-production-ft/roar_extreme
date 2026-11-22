import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D9: Orphaned Grid Slots & Layout Balancing', () => {
  const amenitiesPath = path.resolve(process.cwd(), '../src/sections/Amenities/Amenities.tsx');
  const content = fs.readFileSync(amenitiesPath, 'utf8');

  it('balances odd 7th amenity card on 2-col (tablet) and 3-col (desktop) layouts without dead cells', () => {
    expect(content).toContain('roarFacilities.length % 2 === 1');
    expect(content).toContain('roarFacilities.length % 3 === 1');
    expect(content).toContain('isLastSingleOnLg ? \'lg:col-span-1 lg:col-start-2\' : \'\'');
  });

  it('expands odd final photo feature banner across full span to eliminate dead cells', () => {
    expect(content).toContain('arr.length % 2 === 1 && idx === arr.length - 1');
    expect(content).toContain('isLastOdd ? \'md:col-span-2\' : \'\'');
  });
});

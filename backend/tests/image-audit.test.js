import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D13: Image Audit - No Corrupted / Mismatched Assets', () => {
  const servicesPath = path.resolve(process.cwd(), '../src/config/services.ts');
  const galleryPath = path.resolve(process.cwd(), '../src/config/gallery.ts');
  const trainingPath = path.resolve(process.cwd(), '../src/pages/Training/Training.tsx');

  const servicesContent = fs.readFileSync(servicesPath, 'utf8');
  const galleryContent = fs.readFileSync(galleryPath, 'utf8');
  const trainingContent = fs.readFileSync(trainingPath, 'utf8');

  it('removes corrupted combat-kickboxing.jpg from services.ts', () => {
    expect(servicesContent).not.toContain('combat-kickboxing');
  });

  it('removes combat-kickboxing.jpg from gallery.ts (already done in D12)', () => {
    expect(galleryContent).not.toContain('combat-kickboxing');
  });

  it('removes personalCoachStationImg (mismatched gallery-06) from services.ts', () => {
    expect(servicesContent).not.toContain('personalCoachStationImg');
  });

  it('removes ghost kickboxing and personal-trainer service cards (no authentic photo)', () => {
    expect(servicesContent).not.toContain("id: 'kickboxing'");
    expect(servicesContent).not.toContain("id: 'personal-trainer'");
  });

  it('fixes cardio-fitness card to use cardioTreadmillsImg not benchPressImg', () => {
    // The cardio service must import and use cardioTreadmillsImg, not bench press
    expect(servicesContent).toContain("import cardioTreadmillsImg from '../assets/roar/cardio/cardio-treadmills.jpg'");
    // benchPressImg must be in a strength/bench service, not cardio-fitness
    const cardioServiceBlock = servicesContent.match(/id: 'cardio-fitness'[^}]+}/s)?.[0] || '';
    expect(cardioServiceBlock).toContain('cardioTreadmillsImg');
    expect(cardioServiceBlock).not.toContain('benchPressImg');
  });

  it('provides explicit width and height on training page images', () => {
    expect(trainingContent).toContain('width={prog.width || 800}');
    expect(trainingContent).toContain('height={prog.height || 600}');
  });

  it('gallery-06 is relabeled as strength (leg machine), not personal trainer corner', () => {
    expect(galleryContent).toContain("'gallery-06'");
    expect(galleryContent).toContain("category: 'strength'");
    expect(galleryContent).toContain('Seated Leg Extension Station');
  });
});

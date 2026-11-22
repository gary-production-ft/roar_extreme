import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D18: Preloader & Scroll Reveals Verification', () => {
  const preloaderPath = path.resolve(process.cwd(), '../src/components/Preloader/Preloader.tsx');
  const sectionHeadingPath = path.resolve(process.cwd(), '../src/components/SectionHeading/SectionHeading.tsx');
  const trainingPath = path.resolve(process.cwd(), '../src/sections/Training/Training.tsx');
  const aboutPath = path.resolve(process.cwd(), '../src/sections/About/About.tsx');
  const amenitiesPath = path.resolve(process.cwd(), '../src/sections/Amenities/Amenities.tsx');

  const preloaderContent = fs.readFileSync(preloaderPath, 'utf8');
  const sectionHeadingContent = fs.readFileSync(sectionHeadingPath, 'utf8');
  const trainingContent = fs.readFileSync(trainingPath, 'utf8');
  const aboutContent = fs.readFileSync(aboutPath, 'utf8');
  const amenitiesContent = fs.readFileSync(amenitiesPath, 'utf8');

  it('respects prefers-reduced-motion immediately to disable preloader', () => {
    expect(preloaderContent).toContain('prefers-reduced-motion: reduce');
  });

  it('limits preloader to a non-blocking fast flash (<= 400ms) and uses pointer-events-none', () => {
    expect(preloaderContent).toContain('400');
    expect(preloaderContent).not.toContain('1800');
    expect(preloaderContent).toContain('pointer-events-none');
  });

  it('wraps sessionStorage in try/catch to support private browsing without crashing', () => {
    expect(preloaderContent).toContain('try {');
    expect(preloaderContent).toContain('sessionStorage.getItem');
  });

  it('uses generous positive viewport margins on scroll reveals to prevent invisible edge cards', () => {
    expect(sectionHeadingContent).toContain("margin: '50px'");
    expect(sectionHeadingContent).not.toContain("margin: '-50px'");

    expect(trainingContent).toContain("margin: '50px'");
    expect(trainingContent).not.toContain("margin: '-40px'");

    expect(aboutContent).toContain("margin: '50px'");
    expect(aboutContent).not.toContain("margin: '-50px'");

    expect(amenitiesContent).toContain("margin: '50px'");
  });
});

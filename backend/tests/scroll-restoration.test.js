import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D4: Scroll Restoration & Hash Navigation Verification', () => {
  const appPath = path.resolve(process.cwd(), '../src/App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  it('ScrollRestorationHandler uses useNavigationType for popstate vs push distinction', () => {
    expect(appContent).toContain('useNavigationType');
    expect(appContent).toContain('navigationType === \'POP\'');
  });

  it('restores cached scroll position on POP navigation', () => {
    expect(appContent).toContain('scrollHistoryMap.get(location.key)');
    expect(appContent).toContain('window.scrollTo({ top: savedY');
  });

  it('resets scroll position to top on fresh route transitions', () => {
    expect(appContent).toContain('window.scrollTo({ top: 0, left: 0, behavior: \'instant\' })');
  });

  it('respects prefers-reduced-motion for hash scrolling', () => {
    expect(appContent).toContain('prefers-reduced-motion');
    expect(appContent).toContain('smoothBehavior');
  });

  it('all target section anchors define scroll-mt-20 for fixed navbar clearance', () => {
    const sections = ['Amenities', 'Gallery', 'Location', 'About', 'Training'];
    for (const sec of sections) {
      const secFile = path.resolve(process.cwd(), `../src/sections/${sec}/${sec}.tsx`);
      if (fs.existsSync(secFile)) {
        const content = fs.readFileSync(secFile, 'utf8');
        expect(content).toContain('scroll-mt-20');
      }
    }
  });
});

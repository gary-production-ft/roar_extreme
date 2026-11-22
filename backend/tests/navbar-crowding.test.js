import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D8: Navbar Crowding & Scroll Progress Collision Prevention', () => {
  const navbarPath = path.resolve(process.cwd(), '../src/components/Navbar/Navbar.tsx');
  const scrollProgPath = path.resolve(process.cwd(), '../src/components/ScrollProgress/ScrollProgress.tsx');

  const navbarContent = fs.readFileSync(navbarPath, 'utf8');
  const scrollProgContent = fs.readFileSync(scrollProgPath, 'utf8');

  it('switches navigation to drawer below lg (1024px) breakpoint to prevent wordmark/links/CTA collision on tablets', () => {
    expect(navbarContent).toContain('hidden lg:flex items-center gap-6 xl:gap-8');
    expect(navbarContent).toContain('className="lg:hidden text-white');
  });

  it('positions scroll progress on navbar bottom edge (top-20) below CTA interactive z-layer', () => {
    expect(scrollProgContent).toContain('top-20');
    expect(scrollProgContent).toContain('z-20');
    expect(scrollProgContent).toContain('pointer-events-none');
    expect(scrollProgContent).not.toContain('top-0');
    expect(scrollProgContent).not.toContain('z-50');
  });

  it('preserves viewport boundary padding for CTA alignment', () => {
    expect(navbarContent).toContain('px-5 sm:px-6 md:px-12');
  });
});

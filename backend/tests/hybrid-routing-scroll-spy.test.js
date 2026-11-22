import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D5: Hybrid Routing & Scroll-Spy Active Navigation', () => {
  const navbarPath = path.resolve(process.cwd(), '../src/components/Navbar/Navbar.tsx');
  const navbarContent = fs.readFileSync(navbarPath, 'utf8');

  it('defines consistent hybrid routes: pages (/about, /training) and home sections (/#amenities, /#gallery, /#location)', () => {
    expect(navbarContent).toContain("path: '/'");
    expect(navbarContent).toContain("path: '/about'");
    expect(navbarContent).toContain("path: '/training'");
    expect(navbarContent).toContain("path: '/#amenities'");
    expect(navbarContent).toContain("path: '/#gallery'");
    expect(navbarContent).toContain("path: '/#location'");
  });

  it('applies aria-current="page" to the active navigation item', () => {
    expect(navbarContent).toContain('aria-current={isActive ? \'page\' : undefined}');
  });

  it('tracks active section via scroll-spy and keeps Home active only near the top', () => {
    expect(navbarContent).toContain('window.scrollY < 260');
    expect(navbarContent).toContain("setActiveSection('Home')");
    expect(navbarContent).toContain("['amenities', 'gallery', 'location']");
  });

  it('eliminates cross-route underline transition lag', () => {
    // layoutId="nav-underline" caused lag across route transitions
    expect(navbarContent).not.toContain('layoutId="nav-underline"');
    expect(navbarContent).toContain('bg-[#FF5A1F]');
  });
});

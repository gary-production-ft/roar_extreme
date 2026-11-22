import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D15: Brand Name Standardised to ROAR EXTREME', () => {
  const businessPath = path.resolve(process.cwd(), '../src/config/business.ts');
  const footerPath   = path.resolve(process.cwd(), '../src/components/Footer/Footer.tsx');
  const heroPath     = path.resolve(process.cwd(), '../src/sections/Hero/Hero.tsx');
  const aboutPath    = path.resolve(process.cwd(), '../src/sections/About/About.tsx');
  const locationPath = path.resolve(process.cwd(), '../src/sections/Location/Location.tsx');

  const business  = fs.readFileSync(businessPath, 'utf8');
  const footer    = fs.readFileSync(footerPath, 'utf8');
  const hero      = fs.readFileSync(heroPath, 'utf8');
  const about     = fs.readFileSync(aboutPath, 'utf8');
  const location  = fs.readFileSync(locationPath, 'utf8');

  it('businessConfig.name is ROAR EXTREME', () => {
    expect(business).toContain("name: 'ROAR EXTREME'");
  });

  it('footer copyright uses brandIdentity token not hardcoded name', () => {
    expect(footer).toContain('businessConfig.brandIdentity');
    expect(footer).not.toContain('ROAR FITNESS Extreme');
  });

  it('footer includes single "Also listed locally as Roar Fitness" note', () => {
    expect(footer).toContain('Also listed locally as Roar Fitness');
    // Must appear only once
    const count = (footer.match(/listed locally as Roar Fitness/g) || []).length;
    expect(count).toBe(1);
  });

  it('hero has no stacked wordmark (brandIdentity badge appears at most once in hero JSX)', () => {
    // Hero should not render the full "ROAR EXTREME" brand text more than once as displayed text
    const roarExtremeCount = (hero.match(/ROAR EXTREME/g) || []).length;
    // Max 1 inline occurrence (the badge span text "ROAR EXTREME") – the logo img is separate
    expect(roarExtremeCount).toBeLessThanOrEqual(1);
  });

  it('About section body text uses Roar Extreme not Roar Fitness', () => {
    // The paragraph with facility description should reference Roar Extreme
    expect(about).toContain('Roar Extreme');
  });

  it('Location iframe title says Roar Extreme not Roar Fitness', () => {
    expect(location).not.toContain('Roar Fitness Official Studio Location Map');
    expect(location).toContain('Roar Extreme');
  });
});

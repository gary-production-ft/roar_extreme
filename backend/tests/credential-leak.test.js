import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { app } from '../src/app.js';
import { validateEnvironment } from '../src/config/environment.js';

describe('D2: Public Admin Credentials & Exposure Prevention', () => {
  it('ensures no default plaintext passwords exist in frontend source code', () => {
    const srcDir = path.resolve(process.cwd(), '../src');
    const walk = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(walk(fullPath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
          results.push(fullPath);
        }
      });
      return results;
    };

    const files = walk(srcDir);
    const leakedFiles = [];
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf8');
      if (content.includes('RoarAdmin#2026')) {
        leakedFiles.push(f);
      }
    }

    expect(leakedFiles).toEqual([]);
  });

  it('ensures Navbar and Footer do not expose links to /admin/login', () => {
    const navbarPath = path.resolve(process.cwd(), '../src/components/Navbar/Navbar.tsx');
    const footerPath = path.resolve(process.cwd(), '../src/components/Footer/Footer.tsx');

    const navbarContent = fs.readFileSync(navbarPath, 'utf8');
    const footerContent = fs.readFileSync(footerPath, 'utf8');

    expect(navbarContent.includes('/admin/login')).toBe(false);
    expect(footerContent.includes('/admin/login')).toBe(false);
  });

  it('ensures backend startup validation rejects compromised credentials in production', () => {
    const origEnv = process.env.NODE_ENV;
    const origPass = process.env.ADMIN_PASSWORD;

    process.env.NODE_ENV = 'production';
    process.env.ADMIN_PASSWORD = 'RoarAdmin#2026';

    const check = validateEnvironment();
    expect(check.isValid).toBe(false);
    expect(check.missing.some((m) => m.includes('compromised'))).toBe(true);

    process.env.NODE_ENV = origEnv;
    if (origPass) {
      process.env.ADMIN_PASSWORD = origPass;
    } else {
      delete process.env.ADMIN_PASSWORD;
    }
  });

  it('serves X-Robots-Tag: noindex, nofollow on /api/admin endpoints', async () => {
    const res = await request(app).get('/api/admin/unknown-route');
    expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');
  });
});

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PALETTE LOCK ENFORCEMENT', () => {
  it('ensures zero unauthorized color tokens exist against THEME_BASELINE.json', () => {
    const rootDir = path.resolve(__dirname, '../..');
    const baselinePath = path.join(rootDir, 'THEME_BASELINE.json');
    expect(fs.existsSync(baselinePath)).toBe(true);

    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    const allowedHex = new Set(baseline.hexColors.map((h) => h.toUpperCase()));
    allowedHex.add('#FFFFFF');
    allowedHex.add('#000000');
    allowedHex.add('#000');
    allowedHex.add('#FFF');

    function findFiles(dir, extensions = ['.tsx', '.ts', '.css', '.html']) {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(findFiles(fullPath, extensions));
        } else {
          const ext = path.extname(file);
          if (extensions.includes(ext)) {
            results.push(fullPath);
          }
        }
      });
      return results;
    }

    const files = [...findFiles(path.join(rootDir, 'src')), path.join(rootDir, 'index.html')];
    const hexRegex = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

    const violations = [];
    files.forEach((file) => {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(hexRegex) || [];
      matches.forEach((hex) => {
        const upper = hex.toUpperCase();
        if (!allowedHex.has(upper)) {
          violations.push({ file: path.relative(rootDir, file), hex: upper });
        }
      });
    });

    expect(violations).toEqual([]);
  });
});

import fs from 'fs';
import path from 'path';

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

export function verifyPaletteLock() {
  if (!fs.existsSync('THEME_BASELINE.json')) {
    throw new Error('THEME_BASELINE.json not found! Run scripts/extractThemeBaseline.js first.');
  }

  const baseline = JSON.parse(fs.readFileSync('THEME_BASELINE.json', 'utf8'));
  const allowedHex = new Set(baseline.hexColors.map((h) => h.toUpperCase()));
  // Also allow pure white/black aliases
  allowedHex.add('#FFFFFF');
  allowedHex.add('#000000');
  allowedHex.add('#000');
  allowedHex.add('#FFF');

  const files = [...findFiles('src'), 'index.html'];
  const hexRegex = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

  const violations = [];

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(hexRegex) || [];
    matches.forEach((hex) => {
      const upper = hex.toUpperCase();
      if (!allowedHex.has(upper)) {
        violations.push({ file, hex: upper });
      }
    });
  });

  if (violations.length > 0) {
    console.error('❌ PALETTE LOCK VIOLATIONS DETECTED!');
    console.error('The following unauthorized color values were found in src/:');
    violations.forEach((v) => console.error(`  - ${v.file}: ${v.hex}`));
    return false;
  }

  console.log('✅ PALETTE LOCK PASSED: 0 unauthorized color tokens introduced.');
  return true;
}

if (process.argv[1]?.endsWith('verifyPaletteLock.js')) {
  const passed = verifyPaletteLock();
  if (!passed) process.exit(1);
}

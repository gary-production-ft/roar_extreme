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

const files = [...findFiles('src'), 'index.html'];

const hexRegex = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const rgbaRegex = /rgba?\([^)]+\)/g;
const hslaRegex = /hsla?\([^)]+\)/g;
const cssVarRegex = /--[a-zA-Z0-9_-]+:\s*([^;]+);/g;

const foundHex = new Set();
const foundRgba = new Set();
const foundHsla = new Set();
const foundCssVars = {};

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');

  // Hex
  const hexMatches = content.match(hexRegex) || [];
  hexMatches.forEach((h) => foundHex.add(h.toUpperCase()));

  // Rgba
  const rgbaMatches = content.match(rgbaRegex) || [];
  rgbaMatches.forEach((r) => foundRgba.add(r.replace(/\s+/g, ' ').toLowerCase()));

  // Hsla
  const hslaMatches = content.match(hslaRegex) || [];
  hslaMatches.forEach((h) => foundHsla.add(h.replace(/\s+/g, ' ').toLowerCase()));

  // CSS variables
  let match;
  while ((match = cssVarRegex.exec(content)) !== null) {
    foundCssVars[match[0].split(':')[0].trim()] = match[1].trim();
  }
});

const baseline = {
  version: '1.0.0',
  description: 'ROAR EXTREME Theme Baseline Palette Lock. No new color tokens or hex values may be introduced.',
  extractedAt: new Date().toISOString(),
  primaryBrandColor: '#FF5A1F',
  primaryBackgroundColor: '#080808',
  cssVariables: foundCssVars,
  hexColors: Array.from(foundHex).sort(),
  rgbaColors: Array.from(foundRgba).sort(),
  hslaColors: Array.from(foundHsla).sort(),
};

fs.writeFileSync('THEME_BASELINE.json', JSON.stringify(baseline, null, 2), 'utf8');
console.log(`Snapshot created in THEME_BASELINE.json with:`);
console.log(`- ${baseline.hexColors.length} unique hex values`);
console.log(`- ${baseline.rgbaColors.length} unique rgba expressions`);
console.log(`- ${Object.keys(baseline.cssVariables).length} CSS variables`);

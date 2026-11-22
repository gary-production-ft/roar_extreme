import fs from 'fs';
import path from 'path';

const logoPath = path.resolve('src/assets/roar/branding/roar-logo.jpg');
const logoBuf = fs.readFileSync(logoPath);

fs.writeFileSync('public/roar-logo.jpg', logoBuf);
fs.writeFileSync('public/favicon.jpg', logoBuf);

const b64 = logoBuf.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <clipPath id="circleClip">
      <circle cx="32" cy="32" r="30" />
    </clipPath>
  </defs>
  <circle cx="32" cy="32" r="31" fill="#080808" stroke="#FF5A1F" stroke-width="2" />
  <image href="data:image/jpeg;base64,${b64}" x="2" y="2" width="60" height="60" clip-path="url(#circleClip)" />
</svg>`;

fs.writeFileSync('public/favicon.svg', svg);
console.log('Successfully installed Roar Extreme logo in public/ and updated favicon.svg!');

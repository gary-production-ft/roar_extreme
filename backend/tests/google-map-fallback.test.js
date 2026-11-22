import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D19: Google Maps Embed Fallback & Resilience', () => {
  const locationPath = path.resolve(process.cwd(), '../src/sections/Location/Location.tsx');
  const backendAppPath = path.resolve(process.cwd(), 'src/app.js');

  const locationContent = fs.readFileSync(locationPath, 'utf8');
  const backendAppContent = fs.readFileSync(backendAppPath, 'utf8');

  it('implements map loading and failure state with load timeout', () => {
    expect(locationContent).toContain('isMapLoaded');
    expect(locationContent).toContain('hasMapFailed');
    expect(locationContent).toContain('setTimeout(');
    expect(locationContent).toContain('5000');
  });

  it('provides an immediate accessible fallback placeholder card with address and navigation links', () => {
    expect(locationContent).toContain('Open in Google Maps');
    expect(locationContent).toContain('Get Directions');
    expect(locationContent).toContain('businessConfig.address.fullFormatted');
    expect(locationContent).toContain('MAP PREVIEW UNAVAILABLE');
  });

  it('attaches onLoad and onError handlers to the map iframe', () => {
    expect(locationContent).toContain('onLoad={() => setIsMapLoaded(true)}');
    expect(locationContent).toContain('onError={() => setHasMapFailed(true)}');
  });

  it('purged all unverified yellow badges and pending confirmation helpline copy', () => {
    expect(locationContent).not.toContain('bg-yellow-500');
    expect(locationContent).not.toContain('text-yellow-400');
    expect(locationContent).not.toContain('Pending Confirmation');
    expect(locationContent).not.toContain('Directory Helpline');
  });

  it('backend Content-Security-Policy permits Google Maps embed iframe sources', () => {
    expect(backendAppContent).toContain("frameSrc: [\"'self'\", 'https://www.google.com', 'https://maps.google.com']");
  });
});

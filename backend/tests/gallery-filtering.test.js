import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D12: Gallery Filtering & Layout Verification', () => {
  const galleryConfigPath = path.resolve(process.cwd(), '../src/config/gallery.ts');
  const galleryComponentPath = path.resolve(process.cwd(), '../src/sections/Gallery/Gallery.tsx');

  const galleryConfigContent = fs.readFileSync(galleryConfigPath, 'utf8');
  const galleryComponentContent = fs.readFileSync(galleryComponentPath, 'utf8');

  it('defines valid single-category union type for gallery items', () => {
    expect(galleryConfigContent).toContain("export type GalleryCategory =");
    expect(galleryConfigContent).toContain("'gym-interior'");
    expect(galleryConfigContent).toContain("'strength'");
    expect(galleryConfigContent).toContain("'cardio'");
    expect(galleryConfigContent).toContain("'group-fitness'");
    expect(galleryConfigContent).toContain("'facilities'");
  });

  it('removes corrupted combat-kickboxing placeholder image', () => {
    expect(galleryConfigContent).not.toContain('combat-kickboxing.jpg');
  });

  it('uses single filter function and popLayout exit handling to avoid lingering cards', () => {
    expect(galleryComponentContent).toContain('selectedCategory === \'all\'');
    expect(galleryComponentContent).toContain('roarGallery.filter((p) => p.category === selectedCategory)');
    expect(galleryComponentContent).toContain('<AnimatePresence mode="popLayout">');
  });

  it('provides accessible tablist, roles, and keyboard navigation support', () => {
    expect(galleryComponentContent).toContain('role="tablist"');
    expect(galleryComponentContent).toContain('role="tab"');
    expect(galleryComponentContent).toContain('aria-selected=');
    expect(galleryComponentContent).toContain('e.key === \'Escape\'');
  });

  it('includes explicit width and height attributes on images to prevent CLS', () => {
    expect(galleryComponentContent).toContain('width={photo.width || 1200}');
    expect(galleryComponentContent).toContain('height={photo.height || 800}');
  });
});

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Instant PDF Download & Fast Generation in Workout Plan Designer', () => {
  const modalPath = path.resolve(process.cwd(), '../src/components/FitnessPlan/FitnessPlanModal.tsx');
  const pdfUtilPath = path.resolve(process.cwd(), '../src/utils/generatePlanPdf.ts');

  const modalContent = fs.readFileSync(modalPath, 'utf8');
  const pdfUtilContent = fs.readFileSync(pdfUtilPath, 'utf8');

  it('provides an instant direct PDF download utility using jsPDF with ROAR branding', () => {
    expect(pdfUtilContent).toContain('export function downloadPlanPdf');
    expect(pdfUtilContent).toContain("doc.save(filename)");
    expect(pdfUtilContent).toContain('ROAR EXTREME');
    expect(pdfUtilContent).toContain('Mifflin-St Jeor & IFCT 2017');
  });

  it('wires instant Save & Download PDF action into the modal actions bar', () => {
    expect(modalContent).toContain('downloadPlanPdf(planResult)');
    expect(modalContent).toContain('Save &amp; Download PDF');
    expect(modalContent).toContain('PDF Downloaded!');
  });

  it('optimizes backend generation timeout to responsive 6s to prevent slow UI lockup', () => {
    expect(modalContent).toContain('setTimeout(() => controller.abort(), 6000)');
    expect(modalContent).not.toContain('setTimeout(() => controller.abort(), 20000)');
  });
});

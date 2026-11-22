import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const REG_FILE = path.resolve(process.cwd(), '../src/pages/Registration/Registration.tsx');

describe('D3: Registration Silent Validation Fix', () => {
  it('has role="alert" and aria-live="assertive" on error summary banner', () => {
    const src = fs.readFileSync(REG_FILE, 'utf8');
    expect(src).toContain('role="alert"');
    expect(src).toContain('aria-live="assertive"');
  });

  it('has aria-invalid on required inputs', () => {
    const src = fs.readFileSync(REG_FILE, 'utf8');
    expect(src).toContain('aria-invalid={Boolean(errors.fullName)}');
    expect(src).toContain('aria-invalid={Boolean(errors.phone)}');
  });

  it('links error messages via aria-describedby', () => {
    const src = fs.readFileSync(REG_FILE, 'utf8');
    expect(src).toContain('aria-describedby={errors.fullName');
    expect(src).toContain('aria-describedby={errors.phone');
  });

  it('uses handleSubmit with second onValidationError argument', () => {
    const src = fs.readFileSync(REG_FILE, 'utf8');
    expect(src).toContain('handleSubmit(onSubmit, onValidationError)');
  });

  it('has double-submit guard using submittingRef', () => {
    const src = fs.readFileSync(REG_FILE, 'utf8');
    expect(src).toContain('submittingRef.current');
  });

  it('uses palette-locked brand orange instead of Tailwind red for validation errors', () => {
    const src = fs.readFileSync(REG_FILE, 'utf8');
    // Should NOT use raw red-500 on error border tokens
    expect(src).not.toContain('border-red-500');
    // Should NOT use red-900 for error backgrounds
    expect(src).not.toContain('bg-red-900');
    // Should use brand orange
    expect(src).toContain('text-[#FF5A1F]');
  });

  it('removes "Phase 1 Frontend Sandbox" placeholder copy from submit area', () => {
    const src = fs.readFileSync(REG_FILE, 'utf8');
    expect(src).not.toContain('Phase 1 Frontend Sandbox');
  });
});

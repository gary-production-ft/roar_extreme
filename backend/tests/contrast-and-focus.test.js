import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('D17: Contrast & Focus Styles within Palette Lock', () => {
  const chatbotWindowPath = path.resolve(process.cwd(), '../src/components/Chatbot/ChatbotWindow.tsx');
  const heroPath = path.resolve(process.cwd(), '../src/sections/Hero/Hero.tsx');
  const trainingPath = path.resolve(process.cwd(), '../src/sections/Training/Training.tsx');
  const animatedButtonPath = path.resolve(process.cwd(), '../src/components/AnimatedButton/AnimatedButton.tsx');
  const navbarPath = path.resolve(process.cwd(), '../src/components/Navbar/Navbar.tsx');

  const chatbotWindowContent = fs.readFileSync(chatbotWindowPath, 'utf8');
  const heroContent = fs.readFileSync(heroPath, 'utf8');
  const trainingContent = fs.readFileSync(trainingPath, 'utf8');
  const animatedButtonContent = fs.readFileSync(animatedButtonPath, 'utf8');
  const navbarContent = fs.readFileSync(navbarPath, 'utf8');

  it('removes stale internal model names (Gemini 3.5 / Gemini 3.5 Live) from Chatbot UI', () => {
    expect(chatbotWindowContent).not.toContain('Gemini 3.5');
    expect(chatbotWindowContent).not.toContain('Gemini 3.5 Live');
  });

  it('marks decorative index numerals in Training section as aria-hidden="true"', () => {
    expect(trainingContent).toContain('aria-hidden="true"');
  });

  it('adds high-contrast text and subtle #080808 scrim text-shadow to Hero description', () => {
    expect(heroContent).toContain('text-white/90');
    expect(heroContent).toContain("textShadow: '0 1px 8px rgba(8,8,8,0.9)'");
  });

  it('adds visible focus rings using brand orange to AnimatedButton and Navbar links', () => {
    expect(animatedButtonContent).toContain('focus-visible:ring-[#FF5A1F]');
    expect(navbarContent).toContain('focus-visible:ring-[#FF5A1F]');
  });
});

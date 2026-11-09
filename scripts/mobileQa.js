import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('./mobile-qa-results');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900, isMobile: false },
  { name: 'tablet-768', width: 768, height: 1024, isMobile: true },
  { name: 'mobile-430-pro-max', width: 430, height: 932, isMobile: true },
  { name: 'mobile-412-galaxy', width: 412, height: 915, isMobile: true },
  { name: 'mobile-390-iphone14', width: 390, height: 844, isMobile: true },
  { name: 'mobile-375-iphonese', width: 375, height: 667, isMobile: true },
  { name: 'mobile-360-android', width: 360, height: 800, isMobile: true },
  { name: 'mobile-320-small', width: 320, height: 568, isMobile: true },
];

async function runQA() {
  console.log('🚀 Starting Comprehensive Mobile & Desktop QA Suite...\n');
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });
    const page = await context.newPage();

    // Disable preloader for faster, consistent testing
    await page.addInitScript(() => {
      sessionStorage.setItem('roar_preloader_seen', 'true');
    });

    console.log(`Testing Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // 1. Check for horizontal overflow
    const overflowCheck = await page.evaluate(() => {
      const docWidth = document.documentElement.offsetWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const windowWidth = window.innerWidth;
      const hasOverflow = scrollWidth > windowWidth + 1 || bodyScrollWidth > windowWidth + 1;

      // Find overflowing elements if any
      const elements = Array.from(document.querySelectorAll('*'));
      const overflowing = elements
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.right > window.innerWidth + 1;
        })
        .map((el) => ({
          tag: el.tagName,
          className: el.className,
          id: el.id,
          right: el.getBoundingClientRect().right,
        }))
        .slice(0, 3);

      return {
        hasOverflow,
        windowWidth,
        scrollWidth,
        overflowing,
      };
    });

    const shotPath = path.join(SCREENSHOT_DIR, `${vp.name}-home.png`);
    await page.screenshot({ path: shotPath, fullPage: false });

    // 2. Test Mobile Menu if on mobile
    let mobileMenuPassed = true;
    if (vp.isMobile && vp.width < 768) {
      try {
        const menuBtn = page.locator('button[aria-label="Open navigation menu"]');
        if (await menuBtn.isVisible()) {
          await menuBtn.click();
          await page.waitForTimeout(400);

          const menuHeading = page.locator('span:text-is("Directory & Facilities")').first();
          const isMenuVisible = await menuHeading.isVisible();

          const menuShot = path.join(SCREENSHOT_DIR, `${vp.name}-menu.png`);
          await page.screenshot({ path: menuShot });

          // Close menu
          const closeBtn = page.locator('button[aria-label="Close navigation menu"]');
          await closeBtn.click();
          await page.waitForTimeout(300);

          mobileMenuPassed = isMenuVisible;
        }
      } catch (err) {
        console.warn(`Menu test warning on ${vp.name}:`, err.message);
        mobileMenuPassed = false;
      }
    }

    // 3. Test Chatbot on mobile
    let chatbotPassed = true;
    try {
      const chatBtn = page.locator('button[aria-label="Open ROAR AI Chat"]');
      if (await chatBtn.isVisible()) {
        await chatBtn.click();
        await page.waitForTimeout(500);

        const chatWindow = page.locator('h3:has-text("ROAR AI COACH")').first();
        const isChatOpen = await chatWindow.isVisible();

        const chatShot = path.join(SCREENSHOT_DIR, `${vp.name}-chat.png`);
        await page.screenshot({ path: chatShot });

        // Close chat
        const closeChat = page.locator('button[aria-label="Close ROAR AI Chat"]').first();
        if (await closeChat.isVisible()) {
          await closeChat.click();
          await page.waitForTimeout(300);
        }

        chatbotPassed = isChatOpen;
      }
    } catch (err) {
      console.warn(`Chatbot test warning on ${vp.name}:`, err.message);
      chatbotPassed = false;
    }

    // 4. Test Registration Page
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const regOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1;
    });

    const regShot = path.join(SCREENSHOT_DIR, `${vp.name}-register.png`);
    await page.screenshot({ path: regShot, fullPage: false });

    results.push({
      viewport: vp.name,
      width: vp.width,
      overflow: overflowCheck.hasOverflow,
      regOverflow,
      mobileMenuPassed,
      chatbotPassed,
      overflowingElements: overflowCheck.overflowing,
    });

    console.log(`  ✓ ${vp.name}: Overflow=${overflowCheck.hasOverflow ? 'FAIL' : 'PASS'} | Menu=${mobileMenuPassed ? 'PASS' : 'N/A'} | Chat=${chatbotPassed ? 'PASS' : 'FAIL'}`);

    await context.close();
  }

  await browser.close();

  console.log('\n================ QA SUMMARY ================');
  console.table(results);

  const allPassed = results.every(
    (r) => !r.overflow && !r.regOverflow && r.mobileMenuPassed && r.chatbotPassed
  );

  if (allPassed) {
    console.log('\n🎉 ALL MOBILE & DESKTOP VIEWPORT TESTS PASSED PERFECTLY WITH ZERO OVERFLOW!');
  } else {
    console.error('\n⚠️ Some viewports had issues. See table above.');
  }
}

runQA().catch((err) => {
  console.error('QA Failed:', err);
  process.exit(1);
});

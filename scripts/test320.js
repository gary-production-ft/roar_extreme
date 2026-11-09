import { chromium } from 'playwright';

async function test320() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  await page.addInitScript(() => sessionStorage.setItem('roar_preloader_seen', 'true'));
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  const chatBtn = page.locator('button[aria-label="Open ROAR AI Chat"]');
  console.log('Chat button visible:', await chatBtn.isVisible());
  await chatBtn.click();
  await page.waitForTimeout(600);

  const h3Check = await page.evaluate(() => {
    const el = document.querySelector('[data-lenis-prevent] h3');
    if (!el) return 'Element not found in DOM';
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return {
      text: el.innerText,
      rect,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
    };
  });
  console.log('H3 check result:', h3Check);

  await page.screenshot({ path: './mobile-qa-results/debug-320.png' });
  await browser.close();
}

test320().catch(console.error);

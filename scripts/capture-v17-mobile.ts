// The V17 evidence capture: the mobile drawer at 390px — the standard open
// shot PLUS the short-viewport (480px) inside-scroll proof (session_25's
// carry-question: the panel scrolls internally when the links don't fit).
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:3101";
const OUT = "docs/screenshots";

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`);
  await page.locator('input[type="email"]').fill("owner@veloxpos.local");
  await page.locator('input[type="password"]').fill("$Abcd1234");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });

  // 1. The drawer open at the standard mobile viewport.
  await page.locator('[data-testid="mobile-menu-button"]').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/mobile-drawer-open.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 2. The short viewport: the drawer's inside scroll, scrolled to the
  //    last link (the proof the panel scrolls internally).
  await page.setViewportSize({ width: 390, height: 480 });
  await page.waitForTimeout(300);
  await page.locator('[data-testid="mobile-menu-button"]').click();
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="mobile-drawer-panel"]') as HTMLElement;
    el.scrollTop = el.scrollHeight;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/v17-mobile-drawer-short-viewport-scrolled.png` });

  console.log("v17 mobile evidence captured");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

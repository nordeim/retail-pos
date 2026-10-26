// Measure the reference GradeTracker stat-card DOM (grid classes, card
// structure, per-card children) at zero data.
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);
  await page.locator("a").filter({ hasText: "Grade Tracker" }).first().click();
  await page.waitForTimeout(2000);
  const m = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    // find the grid holding "Overall Average"
    const label = [...main.querySelectorAll("*")].find((el) => el.children.length === 0 && el.textContent.trim() === "Overall Average");
    let grid = label;
    for (let d = 0; d < 5 && grid; d++) {
      if (/grid/.test(getComputedStyle(grid).display)) break;
      grid = grid.parentElement;
    }
    const s = grid ? getComputedStyle(grid) : null;
    const cards = grid ? [...grid.children] : [];
    return {
      gridCls: grid?.className?.toString().slice(0, 120),
      display: s?.display, cols: s?.gridTemplateColumns, gap: s?.gap,
      cards: cards.map((c) => {
        const cs = getComputedStyle(c);
        return {
          cls: c.className?.toString().slice(0, 110),
          bg: cs.backgroundImage !== "none" ? cs.backgroundImage.slice(0, 80) : cs.backgroundColor,
          radius: cs.borderRadius, w: Math.round(c.getBoundingClientRect().width),
          children: [...c.children].map((ch) => ({
            tag: ch.tagName, cls: ch.className?.toString().slice(0, 60),
            text: ch.textContent.trim().slice(0, 40),
          })),
        };
      }),
    };
  });
  console.log(JSON.stringify(m, null, 1));
} finally {
  await browser.close();
}

// S78 probe: the reference's mobile shape for the 5 overflow views — does
// the ref itself overflow at 390 (its own bug family), or does it wrap its
// header rows? Informs the fix pattern (match the ref's wrapping if it
// wraps; the clone's no-overflow contract wins either way).
// Usage: node scripts/ref-mobile-overflow-s78.mjs
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const VIEWS = ["Timetable", "Exams", "Files", "Calculator", "StudyGroups"];

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);

  for (const v of VIEWS) {
    await page.goto(`${REF}/${v}`, { timeout: 45000 });
    await page.waitForTimeout(2600);
    const report = await page.evaluate(() => {
      const offenders = [];
      const walk = (el) => {
        for (const child of el.children) walk(child);
        const r = el.getBoundingClientRect();
        if (r.right > 391 && r.width > 0) {
          offenders.push({
            tag: el.tagName,
            cls: (el.getAttribute("class") || "").slice(0, 60),
            right: Math.round(r.right),
            w: Math.round(r.width),
            text: (el.textContent || "").trim().slice(0, 26),
          });
        }
      };
      walk(document.body);
      offenders.sort((a, b) => b.right - a.right);
      // Also: does the header row wrap? Find rows with wrapped children.
      return { scrollWidth: document.documentElement.scrollWidth, top: offenders.slice(0, 4) };
    });
    console.log(`=== ${v} (scrollW ${report.scrollWidth}) ===`);
    for (const o of report.top) {
      console.log(`  ${o.tag} right=${o.right} w=${o.w} [${o.cls}] "${o.text}"`);
    }
  }
  await ctx.close();
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

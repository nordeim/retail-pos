// S78 mobile-overflow root-cause probe: for each overflowing view, walk the
// DOM at 390×844 and report every element whose right edge passes 390 (the
// widest offenders with their selectors/classes) — the element-level
// attribution the mobile sweep's scrollWidth counter cannot give.
// Usage: node scripts/mobile-overflow-probe-s78.mjs  (clone :3200 standalone)
import { chromium } from "playwright";

const CLONE = "http://localhost:3200";
const VIEWS = ["Timetable", "Exams", "Files", "Calculator", "StudyGroups"];

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  await page.waitForTimeout(1500);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);

  for (const v of VIEWS) {
    await page.goto(`${CLONE}/${v}`, { timeout: 45000 });
    await page.waitForTimeout(2200);
    const report = await page.evaluate(() => {
      const offenders = [];
      const walk = (el) => {
        for (const child of el.children) walk(child);
        const r = el.getBoundingClientRect();
        if (r.right > 391 && r.width > 0) {
          offenders.push({
            tag: el.tagName,
            cls: (el.getAttribute("class") || "").slice(0, 70),
            right: Math.round(r.right),
            w: Math.round(r.width),
            text: (el.textContent || "").trim().slice(0, 30),
          });
        }
      };
      walk(document.body);
      offenders.sort((a, b) => b.right - a.right);
      return {
        scrollWidth: document.documentElement.scrollWidth,
        top: offenders.slice(0, 6),
      };
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

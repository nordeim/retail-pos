// Session-75 clone-side captures: the SAME views the ref probe measured,
// on the seeded demo account, with the same widened leaf dump — the
// apples-to-apples anatomy comparison for the populated S6 family.
// Usage: node scripts/capture-s75-clone-populated.mjs   (clone :3200 standalone)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const CLONE = "http://localhost:3200";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });
const j = (o) => JSON.stringify(o);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const textDump = () =>
  page.evaluate(() => {
    const out = [];
    const seen = new Set();
    const main = document.querySelector("main") || document.body;
    for (const el of main.querySelectorAll("h1,h2,h3,h4,h5,h6,strong,b,span,div,p")) {
      if (el.children.length > 0) continue;
      const t = (el.textContent || "").trim();
      if (!t || t.length > 60 || t.length < 2) continue;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      const fw = parseInt(cs.fontWeight, 10);
      const isHeading = /^h[1-6]$/.test(el.tagName);
      const fs = parseInt(cs.fontSize, 10);
      if (!isHeading && !(fw >= 600 && fs >= 14) && !(fs >= 12 && t.length >= 3)) continue;
      const key = t + "|" + el.tagName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ t, tag: el.tagName.toLowerCase(), fs: `${fs}px`, fw });
    }
    return out.slice(0, 60);
  });

const visit = async (navText) => {
  await page.locator("a").filter({ hasText: navText }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2000);
};

try {
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);

  const measures = {};
  for (const [key, nav] of [["dashboard", null], ["myday", "My Day"], ["tasks", "Tasks"], ["assignments", "Assignments"], ["exams", "Exams"], ["notes", "Notes"], ["calendar", "Calendar"]]) {
    if (nav) await visit(nav);
    else await page.goto(`${CLONE}/`, { timeout: 45000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/75-clone-populated-${key}.png`, fullPage: false });
    measures[key] = await textDump();
    console.log(`CLONE-${key}: ${measures[key].length} leaves`);
  }
  console.log("CLONE-MEASURES:", j(measures));
  console.log("CLONE-CAPTURE-COMPLETE ok: true");
} catch (err) {
  console.log("ERROR:", String(err).slice(0, 400));
} finally {
  await browser.close();
}

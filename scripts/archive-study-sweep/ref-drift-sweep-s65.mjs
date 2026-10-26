// Session-65 probe: desktop drift sweep of the four never-probed views
// (My Day, Grade Tracker, Practice Tests, Study Groups) on the live reference.
// Captures per view: screenshot + structural fingerprint (headings, buttons,
// selects, filter labels, empty-state copy, card counts) for later comparison
// against the clone's same-view fingerprints.
// Usage: node scripts/ref-drift-sweep-s65.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const REF = "https://omni-study1.base44.app";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const VIEWS = [
  { name: "myday", nav: "My Day" },
  { name: "gradetracker", nav: "Grade Tracker" },
  { name: "practicetests", nav: "Practice Tests" },
  { name: "studygroups", nav: "Study Groups" },
  { name: "settings", nav: "Settings" },
];

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
  await page.waitForTimeout(2500);

  for (const v of VIEWS) {
    // navigate via the sidebar link text
    const link = page.locator(`aside a, nav a, [role=link], a`).filter({ hasText: v.nav }).first();
    await link.click({ timeout: 15000 });
    await page.waitForTimeout(2500);

    const fp = await page.evaluate(() => {
      const t = document.body.innerText;
      const main = document.querySelector("main") || document.body;
      const h1 = [...main.querySelectorAll("h1")].map((h) => h.textContent.trim());
      const h2 = [...main.querySelectorAll("h2")].map((h) => h.textContent.trim()).slice(0, 12);
      const buttons = [...main.querySelectorAll("button")].map((b) => b.textContent.trim()).filter(Boolean).slice(0, 16);
      const selects = [...main.querySelectorAll("select, [role=combobox]")].map((s) => s.getAttribute("aria-label") || s.textContent.trim().slice(0, 40));
      const inputs = [...main.querySelectorAll("input")].map((i) => i.placeholder || i.getAttribute("aria-label") || i.type).slice(0, 10);
      return JSON.stringify({ h1, h2, buttons, selects, inputs, textSample: t.replace(/\s+/g, " ").slice(0, 900) });
    });
    await page.screenshot({ path: `${OUT}/65-ref-desktop-${v.name}.png`, fullPage: false });
    console.log(`=== ${v.name} ===`);
    console.log(JSON.stringify(JSON.parse(fp), null, 1));
  }
  console.log(JSON.stringify({ ok: true }));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

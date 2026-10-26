// Session-65 probe (v2): clone EMPTY-state fingerprints via the s17
// registerFreshUser recipe (API register + verify shares the context cookie).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const CLONE = "http://localhost:3200";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const EMAIL = `s65-empty-${Date.now()}@studyflow.app`;

const VIEWS = [
  { name: "myday-empty", nav: "My Day" },
  { name: "gradetracker-empty", nav: "Grade Tracker" },
  { name: "practicetests-empty", nav: "Practice Tests" },
  { name: "studygroups-empty", nav: "Study Groups" },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

try {
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  const reg = await page.request.post(`${CLONE}/api/auth/register`, {
    data: { email: EMAIL, password: "Fresh1234!", name: "S65 Probe" },
  });
  if (!reg.ok()) throw new Error(`register failed ${reg.status()}`);
  const { code } = await reg.json();
  const verify = await page.request.post(`${CLONE}/api/auth/verify-email`, {
    data: { email: EMAIL, code },
  });
  if (!verify.ok()) throw new Error(`verify failed ${verify.status()}`);

  await page.goto(`${CLONE}/`, { timeout: 45000 });
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);

  for (const v of VIEWS) {
    const link = page.locator("a").filter({ hasText: v.nav }).first();
    await link.click({ timeout: 15000 });
    await page.waitForTimeout(2200);
    const fp = await page.evaluate(() => {
      const main = document.querySelector("main") || document.body;
      const h1 = [...main.querySelectorAll("h1")].map((h) => h.textContent.trim());
      const h2 = [...main.querySelectorAll("h2")].map((h) => h.textContent.trim()).slice(0, 10);
      const h3 = [...main.querySelectorAll("h3")].map((h) => h.textContent.trim()).slice(0, 10);
      const buttons = [...main.querySelectorAll("button")].map((b) => b.textContent.trim()).filter(Boolean).slice(0, 12);
      const inputs = [...main.querySelectorAll("input")].map((i) => i.placeholder || i.type).slice(0, 8);
      return JSON.stringify({
        h1, h2, h3, buttons, inputs,
        textSample: main.innerText.replace(/\s+/g, " ").slice(0, 700),
      });
    });
    await page.screenshot({ path: `${OUT}/65-clone-desktop-${v.name}.png`, fullPage: false });
    console.log(`=== ${v.name} ===`);
    console.log(JSON.stringify(JSON.parse(fp), null, 1));
  }
  console.log(JSON.stringify({ ok: true, email: EMAIL }));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

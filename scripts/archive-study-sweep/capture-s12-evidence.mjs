// S12 evidence captures — the accessibility surfaces the session added:
//  - forced-colors (Windows High Contrast) renders of the key views
//  - print renders (real page.pdf → PNG) of the printable views, light mode
//  - the skip link in its focused (visible) state
// Written to docs/screenshots/s12-*.png alongside the standard captures
// (the 24 light + 7 dark captures stay valid — no default-media visual
// changed this session; the 219 prior chromium pins are the byte-parity
// guarantee).
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
await page.goto(`${BASE}/login`);
await page.fill("input[type=email]", "demo@studyflow.app");
await page.fill("input[type=password]", "Demo1234!");
await page.waitForTimeout(500);
await page.click("button[type=submit]");
await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });

// 1. Forced-colors evidence (Dashboard, Calendar with the selected/today
//    outlines, Settings with the active-tab outline).
await page.emulateMedia({ forcedColors: "active" });
for (const v of ["Dashboard", "Calendar", "Settings", "Timetable"]) {
  await page.goto(`${BASE}/${v}`);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}/s12-forcedcolors-${v}.png` });
  console.error(`fc ${v} done`);
}
await page.emulateMedia({ forcedColors: "none" });

// 2. The skip link in its focused state (the only time it is visible).
await page.goto(`${BASE}/Dashboard`);
await page.waitForTimeout(1500);
await page.keyboard.press("Tab");
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/s12-skip-link-focused.png` });
console.error("skip-link done");

// 3. Print renders (real PDFs → PNG; print media pre-applied = the real
//    Ctrl+P pipeline, see print-audit.mjs).
for (const v of ["Dashboard", "Timetable"]) {
  await page.goto(`${BASE}/${v}`);
  await page.waitForTimeout(1800);
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: `/tmp/s12-${v}.pdf`, format: "A4", printBackground: true });
  await page.emulateMedia({ media: "screen" });
  execSync(`pdftoppm -png -r 100 -f 1 -l 1 /tmp/s12-${v}.pdf ${OUT}/s12-print-${v}`);
  console.error(`print ${v} done`);
}

await browser.close();
console.log("S12 evidence captures complete.");

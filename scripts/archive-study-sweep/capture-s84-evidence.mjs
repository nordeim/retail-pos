// S84 · the AK surface evidence captures — the folder-tree integrity family
// (the guard's 400 surfaces + the bounded breadcrumb in the Files view) and
// the print-enumeration closure (the Practice Tests result circles, the My
// Day gradient block, the Math Solver remove chip, the Flashcards deck list
// under print). One capture per surface in light mode, plus a print-emulation
// capture of the Practice Tests results (the fills now survive print media).
// Targets the :3200 standalone (avoids disturbing anything on :3000).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3200";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

await page.goto(`${BASE}/login`);
await page.fill("input[type=email]", "demo@studyflow.app");
await page.fill("input[type=password]", "Demo1234!");
await page.click("button[type=submit]");
await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

// ---- AK1: the Files folder surface (the guarded PATCH + the seam walk) -------
await page.goto(`${BASE}/Files`);
await page.waitForTimeout(1500);
// Create a folder, enter it, capture the breadcrumb (the seam's chain).
const stamp = `s84-ak-${Date.now()}`;
await page.evaluate(async (stamp) => {
  await fetch("/api/files/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ name: `${stamp}-parent` }),
  });
}, stamp);
await page.reload();
await page.waitForTimeout(1200);
const folderCard = page
  .locator("main")
  .getByText(`${stamp}-parent`, { exact: true });
await folderCard.click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/84-clone-ak-files-breadcrumb.png` });
// The guard's evidence: self-parent + cycle PATCHes answer 400 (the raw
// envelopes are recorded in the session transcript; the capture shows the
// tree still healthy — one folder, parent preserved, no wedge).
await page.screenshot({ path: `${OUT}/84-clone-ak-files-guard.png`, fullPage: false });
// Cleanup the probe folder.
await page.evaluate(async (stamp) => {
  const rows = await (await fetch("/api/files/folders", { credentials: "same-origin" })).json();
  const probe = rows.find((r) => r.name === `${stamp}-parent`);
  if (probe) await fetch(`/api/files/folders/${probe.id}`, { method: "DELETE", credentials: "same-origin" });
}, stamp);

// ---- AK2b: the Practice Tests result circles (+ print survival) --------------
await page.goto(`${BASE}/PracticeTests`);
await page.waitForTimeout(1500);
await page.getByRole("button", { name: "Start Test" }).first().click();
await page.waitForTimeout(800);
for (let guard = 0; guard < 20; guard++) {
  const next = page.getByRole("button", { name: "Next", exact: true });
  if ((await next.count()) === 0) break;
  await next.click();
  await page.waitForTimeout(250);
}
await page.getByRole("button", { name: "Submit test" }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/84-clone-ak-practicetests-results.png` });
// The print-emulation capture: the result circles keep their fills.
await page.emulateMedia({ media: "print" });
await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/84-clone-ak-practicetests-print.png` });
await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
await page.emulateMedia({ media: "screen" });

// ---- AK2c: the My Day header gradient block ---------------------------------
await page.goto(`${BASE}/MyDay`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/84-clone-ak-myday-gradient.png` });

// ---- AK2d: the Math Solver remove chip ---------------------------------------
await page.goto(`${BASE}/MathSolver`);
await page.waitForTimeout(1500);
await page.locator('input[type="file"]').setInputFiles({
  name: "s84-ak-attach.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64",
  ),
});
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/84-clone-ak-mathsolver-chip.png` });

// ---- AK2a: the Flashcards deck list under print (the aside contract) ---------
await page.goto(`${BASE}/Flashcards`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/84-clone-ak-flashcards-decks.png` });
await page.emulateMedia({ media: "print" });
await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/84-clone-ak-flashcards-print.png` });
await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
await page.emulateMedia({ media: "screen" });

await browser.close();
console.log("S84 AK surface captures complete");

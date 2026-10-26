// S83 · the AJ surface evidence captures — the print/focus remediation family
// (the five surfaces that now carry print-color-adjust: exact — the Calendar
// segmented tab, the Timetable today badge, the Exams topic chips, the
// Calculator History pill, the Settings theme tile), the Dashboard SectionLink
// (the AJ6 focus ring), and the Files folder surface (the AJ1 sentKeysPatch
// routing). One capture per surface in light mode, plus a print-emulation
// capture of the Calendar (the fill now survives print media).
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

// ---- AJ5a/AJ5b: the Calendar segmented control + the print survival -----------
await page.goto(`${BASE}/Calendar`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/83-clone-aj-calendar.png` });
// The print-emulation capture: beforeprint un-themes, the active tab keeps
// its violet fill (the print-color-adjust contract the pin asserts).
await page.emulateMedia({ media: "print" });
await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/83-clone-aj-calendar-print.png` });
await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
await page.emulateMedia({ media: "screen" });

await page.goto(`${BASE}/Timetable`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/83-clone-aj-timetable.png` });

// ---- AJ5c: the Exams topic chips -----------------------------------------------
await page.goto(`${BASE}/Exams`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/83-clone-aj-exams.png` });

// ---- AJ5d: the Calculator History pill -----------------------------------------
await page.goto(`${BASE}/Calculator`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/83-clone-aj-calculator.png` });

// ---- AJ5e: the Settings theme tile ----------------------------------------------
await page.goto(`${BASE}/Settings`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/83-clone-aj-settings.png` });

// ---- AJ6: the Dashboard SectionLink focus ring (keyboard focus) ----------------
await page.goto(`${BASE}/Dashboard`);
await page.waitForTimeout(1500);
await page.keyboard.press("Tab");
let focused = false;
for (let i = 0; i < 45 && !focused; i += 1) {
  await page.keyboard.press("Tab");
  focused = await page.evaluate(() => {
    const el = document.activeElement;
    return !!el && el.tagName === "BUTTON" && (el.textContent || "").includes("View All");
  });
}
if (focused) {
  await page.screenshot({ path: `${OUT}/83-clone-aj-viewall-focus.png` });
  console.log("AJ6 focus capture landed");
}

// ---- AJ1: the Files folder surface (the sentKeysPatch routing) ------------------
const stamp = `s83-aj-${Date.now()}`;
const parent = await page.request.post(`${BASE}/api/files/folders`, {
  data: { name: `AJ evidence parent ${stamp}` },
});
const parentRow = await parent.json();
const child = await page.request.post(`${BASE}/api/files/folders`, {
  data: { name: `AJ evidence child ${stamp}`, parentId: parentRow.id },
});
const childRow = await child.json();
// The rename: the partial PATCH that must preserve the parent.
await page.request.patch(`${BASE}/api/files/folders/${childRow.id}`, {
  data: { name: `AJ evidence renamed ${stamp}` },
});
await page.goto(`${BASE}/Files`);
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/83-clone-aj-files-folders.png` });
// Cleanup.
await page.request.delete(`${BASE}/api/files/folders/${childRow.id}`);
await page.request.delete(`${BASE}/api/files/folders/${parentRow.id}`);

await browser.close();
console.log("S83 AJ-surface captures complete");

// S85 · the AL surface evidence captures — the Study Groups members family
// (the AL1 discovery: the seeded members now RENDER in the detail pane, the
// add-member flow PRESERVES them, the edit-dialog save preserves them) and
// the AL2 print closure (the member avatar chip keeps its gradient under
// print emulation). One capture per surface in light mode, desktop +
// mobile. Targets the :3200 standalone (avoids disturbing anything on :3000).
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

// ---- AL1a: the seeded members render (the pre-fix state was "0 members") ----
await page.goto(`${BASE}/StudyGroups`);
await page.waitForTimeout(1500);
await page.getByRole("button", { name: /Calc Crew/ }).first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/85-clone-al-studygroups-members.png` });
// The member count rides the row (the visible "2 members").
await page.screenshot({ path: `${OUT}/85-clone-al-studygroups-row.png`, fullPage: false });

// ---- AL1b: add-member preserves the existing members ------------------------
const stamp = `s85-al-${Date.now()}`;
const probe = await page.evaluate(async (stamp) => {
  const res = await fetch("/api/study-groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      name: `${stamp}-crew`,
      members: [
        { name: "Ari", email: "ari@example.com" },
        { name: "Sam", email: "sam@example.com" },
      ],
    }),
  });
  return (await res.json()).id;
}, stamp);
await page.reload();
await page.waitForTimeout(1200);
await page.getByRole("button", { name: new RegExp(`${stamp}-crew`) }).first().click();
await page.waitForTimeout(600);
await page.locator("#member-name").fill("Pia");
await page.locator("#member-email").fill("pia@example.com");
await page.getByRole("button", { name: "Add", exact: true }).click();
await page.waitForTimeout(1200);
// The post-add state: ALL THREE members render (the pre-fix wipe left one).
await page.screenshot({ path: `${OUT}/85-clone-al-studygroups-addmember.png` });

// ---- AL2: the member avatar chip keeps its gradient under print -------------
await page.emulateMedia({ media: "print" });
await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/85-clone-al-studygroups-print.png` });
await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
await page.emulateMedia({ media: "screen" });

// ---- AL1 mobile: the members render at 390×844 (the stacked layout) -------
// (The drawer-as-vehicle navigation is covered by the resweep + the
// mobile-nav verification; here the members surface is the target — a
// direct goto at the mobile viewport.)
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/StudyGroups`);
await page.waitForTimeout(1500);
await page.getByRole("button", { name: /Calc Crew/ }).first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/85-clone-al-mobile-studygroups-members.png` });

// Cleanup the probe group.
await page.evaluate(async (id) => {
  await fetch(`/api/study-groups/${id}`, { method: "DELETE", credentials: "same-origin" });
}, probe);

await context.close();
await browser.close();
console.log("S85 AL surface captures complete");

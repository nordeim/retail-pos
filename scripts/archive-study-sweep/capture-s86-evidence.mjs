// S86 · the AM surface evidence captures — the members boundary alignment
// (AM1: a padded member name is stored TRIMMED at the server, so the detail
// pane renders the trimmed name — the visible surface of the seam/server
// agreement; the blank-name rejection itself is API-level, pinned in
// parity-session8) + the interaction-driven capture convention (AM2, the
// s86 audit's L1: consecutive frames of the same view are separated by a
// REAL interaction — a group switch — so no two captures are byte-identical;
// the s85 script's "members"/"row" pair was the duplicate-frame class).
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

// ---- AM1: the padded name renders TRIMMED (the server stores it trimmed) --
const stamp = `s86-am-${Date.now()}`;
const probe = await page.evaluate(async (stamp) => {
  const res = await fetch("/api/study-groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      name: `${stamp}-crew`,
      members: [
        // The PADDED name: the pre-fix schema stored "  Padded Ari  "
        // verbatim (the display nit); the AM1 boundary stores "Padded Ari".
        { name: "  Padded Ari  ", email: "padded-ari@example.com" },
        { name: "  Padded Sam  ", email: "padded-sam@example.com" },
      ],
    }),
  });
  return (await res.json()).id;
}, stamp);
await page.goto(`${BASE}/StudyGroups`);
await page.waitForTimeout(1500);
await page.getByRole("button", { name: new RegExp(`${stamp}-crew`) }).first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/86-clone-am-studygroups-trimmed.png` });

// ---- AM2's interaction convention: the NEXT frame of the same view is ------
// ---- separated by a REAL interaction (a group switch), never a re-shoot ---
await page.getByRole("button", { name: /Calc Crew/ }).first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/86-clone-am-studygroups-switched.png` });

// ---- AM1 mobile: the trimmed members render at 390×844 (stacked layout) ---
// (Direct goto at the mobile viewport — the drawer-as-vehicle navigation is
// covered by the resweep + the mobile-nav verification; the s85 lesson.)
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/StudyGroups`);
await page.waitForTimeout(1500);
await page.getByRole("button", { name: new RegExp(`${stamp}-crew`) }).first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/86-clone-am-mobile-studygroups-trimmed.png` });

// Cleanup the probe group (before the context closes — the AL5 convention).
await page.evaluate(async (id) => {
  await fetch(`/api/study-groups/${id}`, { method: "DELETE", credentials: "same-origin" });
}, probe);

await context.close();
await browser.close();
console.log("S86 AM surface captures complete");

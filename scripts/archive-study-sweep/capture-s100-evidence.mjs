// S100 · Batch BA surface evidence captures — the census-count register
// note + the evidence-frame rotation (the BA1 register note: the AZ2-era
// census counts [213 importers / 94 carriers] describe the pre-rider tree —
// the final tree re-derivation is 215/96, the two s99 riders having joined
// the guarded class after the widening measurement; the thresholds absorb
// growth by design, the register exists so the next audit's re-derivation
// has a scoped expectation) rendered live on consumer surfaces the s87–s99
// frames did not cover.
//
// BA frames (the GUARDED surfaces, on the final build): Frame 1: the
// Calculator view in DARK — the CONSUMERS map's sf-pill-red AC key
// (calculator-view.tsx, the AG3-pinned surface [red-950 fill / red-300
// text], a view NO prior evidence frame has covered; zero state
// dependency — the keypad renders on load, no timer, no beacon, no
// seeded-list dependency). Frame 2: the Events view in DARK with the
// create-dialog's error banner LIVE — the CONSUMERS map's sf-alert-red
// family (events-view.tsx, the AU3c-pinned surface), driven
// deterministically the AU3c way: a route-aborted POST on **/api/events
// renders the dialog's role=alert banner (the route unrouted in the
// finally, zero persistent rows — the abort never reaches the server), a
// surface NO prior evidence frame has covered. Both frames md5-DISTINCT
// (the AR7 gate; the s93 I5 shape: the explicit boolean gate, the failure
// path prints its own line, the completion line only on green — the
// S95/AV2 exit-code semantics: process.exitCode = 1 on the failure
// branch; the AX3 catch generalized to EVERY failed path, carried here).
// The S4 restore lesson on EVERY path: the theme back to violet/light
// (this capture creates NO probe rows — the events abort never reaches
// the server, so the finally owns only the state restoration).
//
// Usage: node scripts/capture-s100-evidence.mjs
//        (clone :3200 standalone first — the S86 daemon recipe; node
//        >= 23.6 for uniformity with the resweep class — NOT bun: the
//        S97/AX2 finding observed on the RESWEEP's verify-email POST [a
//        Set-Cookie response], playwright-core's APIRequestContext
//        crashing in _parseSetCookieHeader under bun 1.3.14; this
//        capture flow's own requests are untested under bun — node is
//        the uniform class convention, the AY2-honest scope)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3200";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });
const PREFERENCES = "/api/settings/preferences";

// The env pin — this script owns its own DATABASE_URL, never the caller's
// environment (the cwv-volume-stress convention).
const prisma = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
let md5Failed = false; // the s93 I5 shape: the explicit completion gate
let thrown = false; // the AX3 shape: the catch path's completion-gate boolean
let eventsRouteInstalled = false; // the unroute ownership flag (the S11/S14 leak lessons)

try {
  const demo = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!demo) throw new Error("demo user missing — run bun run db:seed");

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
  await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

  // ============ BA · the guarded surface, leg 1 (dark Calculator) ========
  // DARK mode (the S10 API pattern — the gotoDark spec contract: PATCH the
  // preference, then NAVIGATE; the boot script applies the mode on load).
  // The keypad's AC key — the AG3-pinned sf-pill-red surface (aria-label
  // "Clear: AC"; located by role the way the AG3 spec does) — renders on
  // the Basic tab on load, no state dependency.
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "dark" } });
  await page.goto(`${BASE}/Calculator`);
  await page.waitForFunction(
    () =>
      document.documentElement.classList.contains("dark") &&
      document.documentElement.style.getPropertyValue("--sf-primary") !== "",
    null,
    { timeout: 15000 },
  );
  const acKey = page.getByRole("button", { name: "Clear" });
  await acKey.waitFor({ state: "visible", timeout: 15000 });
  // The AC key carries the pill family live (the CONSUMERS map's
  // calculator-view entry, AG3-pinned — the frame's surface proof).
  await page.waitForFunction(
    () => {
      const keys = [...document.querySelectorAll("button")];
      const ac = keys.find((b) => (b.getAttribute("aria-label") ?? "").startsWith("Clear: AC"));
      return !!ac && ac.classList.contains("sf-pill-red");
    },
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/100-clone-ba-rotation-dark-calculator.png` });

  // ============ BA · leg 2 — the Events dialog error banner ==============
  // Calculator → Events through the sidebar (a real user interaction, the
  // AM2 rule). The create-dialog's error banner (sf-alert-red, the
  // AU3c-pinned family) renders deterministically under the route-aborted
  // POST: the submit never reaches the server (zero persistent rows), the
  // dialog stays open with the banner live.
  await page.locator("nav a").filter({ hasText: "Events" }).first().click();
  await page.waitForURL("**/Events", { timeout: 15000 });
  await page.waitForFunction(() => /events/i.test(document.querySelector("main h1")?.textContent ?? ""), null, { timeout: 15000 });
  await page.getByRole("button", { name: "New Event" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 15000 });
  // The AU3c shape: abort the POST (the create-submit failure path).
  await page.route("**/api/events", async (route) => {
    if (route.request().method() === "POST") await route.abort("failed");
    else await route.continue();
  });
  eventsRouteInstalled = true;
  await dialog.locator("#event-title").fill("s100 ba rotation probe");
  await dialog.getByRole("button", { name: "Create event" }).click();
  const banner = dialog.getByRole("alert");
  await banner.waitFor({ state: "visible", timeout: 15000 });
  // The banner carries the alert family live (the events-view CONSUMERS
  // entry — the frame's surface proof).
  await page.waitForFunction(
    () => {
      const alerts = [...document.querySelectorAll('[role="alert"]')];
      return alerts.some((el) => el.classList.contains("sf-alert-red"));
    },
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/100-clone-ba-rotation-dark-events-error.png` });

  // ---- The distinct-frame verification — the AR7 gate, the s93 I5 shape --
  const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex");
  const frames = [
    `${OUT}/100-clone-ba-rotation-dark-calculator.png`,
    `${OUT}/100-clone-ba-rotation-dark-events-error.png`,
  ].map(md5);
  const distinct = new Set(frames).size === frames.length;
  if (!distinct) {
    // The failure path prints its OWN line — no success-shaped prose on a
    // failed gate. The S95/AV2 semantics: process.exitCode = 1 (the
    // S91/AR7 gate semantics — an exit-code-checking wrapper must see
    // the failure).
    console.log(`S100 BA frames DUPLICATE: ${frames.join(" ")} — the md5 gate FAILS this run`);
    process.exitCode = 1;
    md5Failed = true;
  } else {
    console.log(`S100 BA frames: ${frames.join(" ")} — all DISTINCT`);
  }
} catch (err) {
  // The AX3 shape (the s96 audit's I3): the failure path is gate-OWNED — a
  // mid-run throw exits 1 through this catch with a script-owned failure
  // line, not through node's unhandled-rejection spew. The md5Failed
  // shape generalized: every failure path sets process.exitCode = 1, and
  // the completion line below keys on the explicit booleans.
  console.error(`S100 BA surface captures FAILED: ${err?.message ?? err}`);
  process.exitCode = 1;
  thrown = true;
} finally {
  // The S11/S14 leak lessons: the held route is released BEFORE the
  // context closes (an unroute under a closing context can release the
  // pending request into the void), then the S4 restore — the shared demo
  // surface back to violet/light on EVERY path. No probe-row cleanup is
  // needed this cycle: the events POST never reached the server.
  if (eventsRouteInstalled) {
    await page.unroute("**/api/events").catch(() => {});
  }
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "light" } }).catch(() => {});
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  await prisma.$disconnect().catch(() => {});
}
// The s93 I5 shape: the completion line is gated on the explicit boolean
// (the AX3 shape: both of them — no success-shaped prose on any failed path).
if (!md5Failed && !thrown) console.log("S100 BA surface captures complete");

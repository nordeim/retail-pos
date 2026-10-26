// S98 · Batch AY surface evidence captures — the capture-lineage
// runner-convention reconciliation + the census comment-immunity (the
// AY1 headline: the ten stale bun usage lines swept to node across the
// capture s87–s96 lineage, the whole re-tag script class now guarded by
// the tests/script-conventions.test.ts census pin; the AY3 fix: the
// census counts run on comment-stripped CSS — a prose `@utility` mention
// can no longer inflate the token census into a loud false failure)
// rendered live on consumer surfaces the s97 frames did not cover.
//
// AY frames (the GUARDED surfaces, on the final build): Frame 1: the
// GradeTracker view in DARK — the CONSUMERS map's four-family view
// (sf-pill-emerald / sf-pill-sky / sf-pill-amber / sf-pill-red on the
// seeded assessments) — a surface the s96 frames last covered two cycles
// ago and the s97 frames skipped; gated on the s96-proven
// `[class*='sf-pill-'] >= 4` shape. Frame 2: the Flashcards view in DARK
// — the CONSUMERS map's sf-pill-yellow family on the seeded "Integration
// rules" deck's card grid (the difficulty pills — the S77/AD surface NO
// prior evidence frame has covered), reached through the REAL sidebar
// navigation (the AM2 rule). Both frames md5-DISTINCT (the AR7 gate; the
// s93 I5 shape: the explicit boolean gate, the failure path prints its
// own line, the completion line only on green — the S95/AV2 exit-code
// semantics: process.exitCode = 1 on the failure branch; the AX3 catch
// generalized to EVERY failed path, carried here — and proven live this
// cycle when the leg-2 gate caught the first draft's wrong surface).
//
// No marker fixtures needed (the seeded demo data renders the pills), so
// this script's cleanup owns ONLY the state restoration (the demo surface
// back to violet/light) — the S4 restore lesson on EVERY path.
//
// Usage: node scripts/capture-s98-evidence.mjs
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

try {
  const demo = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!demo) throw new Error("demo user missing — run bun run db:seed");

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
  await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

  // ============ AY · the guarded surface, leg 1 (dark GradeTracker) ========
  // DARK mode (the S10 API pattern — the gotoDark spec contract: PATCH the
  // preference, then NAVIGATE; the boot script applies the mode on load).
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "dark" } });
  await page.goto(`${BASE}/GradeTracker`);
  await page.waitForFunction(
    () =>
      document.documentElement.classList.contains("dark") &&
      document.documentElement.style.getPropertyValue("--sf-primary") !== "",
    null,
    { timeout: 15000 },
  );
  await page.waitForFunction(() => /grade tracker/i.test(document.querySelector("main h1")?.textContent ?? ""), null, { timeout: 15000 });
  // The four-family view — the CONSUMERS map's densest pill surface after
  // Assignments: the seeded assessments render the emerald/sky/amber/red
  // families (the @utility blocks the census guards, live on the surface —
  // the s96-proven gate shape).
  await page.waitForFunction(
    () => document.querySelectorAll("[class*='sf-pill-']").length >= 4,
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/98-clone-ay-censusimmunity-dark-gradetracker.png` });

  // ============ AY · leg 2 — the REAL navigation interaction =============
  // GradeTracker → Flashcards through the sidebar (a real user interaction,
  // the AM2 rule): the seeded "Integration rules" deck is the effective
  // selection on load (the render-derived fallback), and its card grid
  // renders the sf-pill-yellow difficulty pills (one per card, 4 seeded —
  // the CONSUMERS map's flashcards family, a surface NO prior evidence
  // frame has covered). NOTE (the honest record): the first draft of this
  // leg gated on the STUDY pane — wrong surface, the study card carries no
  // pill family; the AX3 catch caught it live (exit 1, the script-owned
  // FAILED line) and this leg was re-designed to the card grid.
  await page.locator("nav a").filter({ hasText: "Flashcards" }).first().click();
  await page.waitForURL("**/Flashcards", { timeout: 15000 });
  await page.waitForFunction(() => /flashcards/i.test(document.querySelector("main h1")?.textContent ?? ""), null, { timeout: 15000 });
  await page.waitForFunction(
    () => document.querySelectorAll(".sf-pill-yellow").length >= 4,
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/98-clone-ay-censusimmunity-dark-flashcards.png` });

  // ---- The distinct-frame verification — the AR7 gate, the s93 I5 shape --
  const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex");
  const frames = [
    `${OUT}/98-clone-ay-censusimmunity-dark-gradetracker.png`,
    `${OUT}/98-clone-ay-censusimmunity-dark-flashcards.png`,
  ].map(md5);
  const distinct = new Set(frames).size === frames.length;
  if (!distinct) {
    // The failure path prints its OWN line — no success-shaped prose on a
    // failed gate. The S95/AV2 semantics: process.exitCode = 1 (the
    // S91/AR7 gate semantics — an exit-code-checking wrapper must see
    // the failure).
    console.log(`S98 AY frames DUPLICATE: ${frames.join(" ")} — the md5 gate FAILS this run`);
    process.exitCode = 1;
    md5Failed = true;
  } else {
    console.log(`S98 AY frames: ${frames.join(" ")} — all DISTINCT`);
  }
} catch (err) {
  // The AX3 shape (the s96 audit's I3): the failure path is gate-OWNED — a
  // mid-run throw exits 1 through this catch with a script-owned failure
  // line, not through node's unhandled-rejection spew. The md5Failed
  // shape generalized: every failure path sets process.exitCode = 1, and
  // the completion line below keys on the explicit booleans.
  console.error(`S98 AY surface captures FAILED: ${err?.message ?? err}`);
  process.exitCode = 1;
  thrown = true;
} finally {
  // The S4 restore lesson: the shared demo surface is restored (accent
  // violet, mode LIGHT) on EVERY path.
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "light" } }).catch(() => {});
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  await prisma.$disconnect().catch(() => {});
}
// The s93 I5 shape: the completion line is gated on the explicit boolean
// (the AX3 shape: both of them — no success-shaped prose on any failed path).
if (!md5Failed && !thrown) console.log("S98 AY surface captures complete");

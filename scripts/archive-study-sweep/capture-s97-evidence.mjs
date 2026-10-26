// S97 · Batch AX surface evidence captures — the @utility census hardening
// (the AX1 headline: the widened header regex + the token-reconciliation
// pin — the shape-variant duplicate whose blind spot was demonstrated live
// [a planted `@utility sf-pill-red{` left all 930 pins green] now trips the
// widened dupe check, and an unparseable header form trips the
// reconciliation pin — rendered live on consumer surfaces the s96 frames
// did not cover) + the AX3 capture-exit ownership (the catch this script
// class now carries — every failure path gate-owned, observed live both
// ways this cycle).
//
// AX frames (the GUARDED surfaces, on the final build): Frame 1: the
// Assignments view in DARK — the CONSUMERS map's densest view — where the
// SOFT subfamily renders on the seeded rows (sf-pill-soft-yellow priority
// pills + sf-pill-soft-blue due pills — the soft steps whose @utility
// blocks the widened census guards). Frame 2: the Exams view in DARK —
// reached through the REAL sidebar navigation (the AM2 rule) — where the
// urgency trio renders on the seeded exams (sf-pill-orange "Tomorrow" +
// sf-pill-yellow "N days" — the orange-300/950 steps the AS1 cycle pinned
// and the widened census now guards in every header shape). Both frames
// md5-DISTINCT (the AR7 gate; the s93 I5 shape: the explicit boolean
// gate, the failure path prints its own line, the completion line only on
// green — the S95/AV2 exit-code semantics: process.exitCode = 1 on the
// failure branch; S97/AX3: the catch generalizes it to EVERY failed path).
//
// No marker fixtures needed (the seeded demo data renders the pills), so
// this script's cleanup owns ONLY the state restoration (the demo surface
// back to violet/light) — the S4 restore lesson on EVERY path.
//
// Usage: node scripts/capture-s97-evidence.mjs
//        (clone :3200 standalone first — the S86 daemon recipe; node
//        >= 23.6 for uniformity with the resweep class — NOT bun: the
//        S97/AX2 finding observed on the RESWEEP's verify-email POST [a
//        Set-Cookie response], playwright-core's APIRequestContext
//        crashing in _parseSetCookieHeader under bun 1.3.14; this
//        capture flow's own requests are untested under bun — node is
//        the uniform class convention. S98/AY2, the s97 audit's I1: the
//        honest re-scope of the crash claim to the observed evidence)
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
let thrown = false; // S97/AX3: the catch path's completion-gate boolean

try {
  const demo = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!demo) throw new Error("demo user missing — run bun run db:seed");

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
  await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

  // ============ AX · the guarded surface, leg 1 (dark Assignments) ========
  // DARK mode (the S10 API pattern — the gotoDark spec contract: PATCH the
  // preference, then NAVIGATE; the boot script applies the mode on load).
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "dark" } });
  await page.goto(`${BASE}/Assignments`);
  await page.waitForFunction(
    () =>
      document.documentElement.classList.contains("dark") &&
      document.documentElement.style.getPropertyValue("--sf-primary") !== "",
    null,
    { timeout: 15000 },
  );
  await page.waitForFunction(() => /assignments/i.test(document.querySelector("main h1")?.textContent ?? ""), null, { timeout: 15000 });
  // The soft subfamily itself — sf-pill-soft-yellow priority pills +
  // sf-pill-soft-blue due pills (the densest consumer view: 6 seeded rows
  // render both soft families — the @utility blocks the S97/AX1 widened
  // census guards, live on the surface).
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".sf-pill-soft-yellow").length >= 1 &&
      document.querySelectorAll(".sf-pill-soft-blue").length >= 1,
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/97-clone-ax-utilitycensus-dark-assignments.png` });

  // ============ AX · leg 2 — the REAL navigation interaction =============
  // Assignments → Exams through the sidebar (a real user interaction, the
  // AM2 rule): the urgency trio — the seeded exams render the orange
  // "Tomorrow" + the yellow "N days" pills (the orange-300/950 steps the
  // AS1 cycle pinned; the yellow family the AT1 cycle put on pills).
  await page.locator("nav a").filter({ hasText: "Exams" }).first().click();
  await page.waitForURL("**/Exams", { timeout: 15000 });
  await page.waitForFunction(() => /exams/i.test(document.querySelector("main h1")?.textContent ?? ""), null, { timeout: 15000 });
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".sf-pill-orange").length >= 1 &&
      document.querySelectorAll(".sf-pill-yellow").length >= 1,
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/97-clone-ax-utilitycensus-dark-exams.png` });

  // ---- The distinct-frame verification — the AR7 gate, the s93 I5 shape --
  const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex");
  const frames = [
    `${OUT}/97-clone-ax-utilitycensus-dark-assignments.png`,
    `${OUT}/97-clone-ax-utilitycensus-dark-exams.png`,
  ].map(md5);
  const distinct = new Set(frames).size === frames.length;
  if (!distinct) {
    // The failure path prints its OWN line — no success-shaped prose on a
    // failed gate. The S95/AV2 semantics: process.exitCode = 1 (the
    // S91/AR7 gate semantics — an exit-code-checking wrapper must see
    // the failure).
    console.log(`S97 AX frames DUPLICATE: ${frames.join(" ")} — the md5 gate FAILS this run`);
    process.exitCode = 1;
    md5Failed = true;
  } else {
    console.log(`S97 AX frames: ${frames.join(" ")} — all DISTINCT`);
  }
} catch (err) {
  // S97/AX3 (the s96 audit's I3): the failure path is gate-OWNED — a
  // mid-run throw exits 1 through this catch with a script-owned failure
  // line, not through node's unhandled-rejection spew. The md5Failed
  // shape generalized: every failure path sets process.exitCode = 1, and
  // the completion line below keys on the explicit booleans.
  console.error(`S97 AX surface captures FAILED: ${err?.message ?? err}`);
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
// (S97/AX3: both of them — no success-shaped prose on any failed path).
if (!md5Failed && !thrown) console.log("S97 AX surface captures complete");

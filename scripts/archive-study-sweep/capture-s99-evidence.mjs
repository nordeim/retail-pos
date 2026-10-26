// S99 · Batch AZ surface evidence captures — the mutation-record shape-true
// re-scope + the playwright-class census widening (the AZ1 headline: the
// S97 inline-comment plant shape NORMALIZES under the AY3 strip — the
// shape-true mutation matrix now machine-checked by the normalization pin;
// the AZ2 widening: the convention census governs every playwright-carrying
// script, 213 importers, the blind spot demonstrated live on a planted
// z-probe-s70.mjs bun line) rendered live on consumer surfaces the s98
// frames did not cover.
//
// AZ frames (the GUARDED surfaces, on the final build): Frame 1: the
// Dashboard view in DARK — the CONSUMERS map's sf-pill-red exam-urgency
// pills + sf-pill-yellow assignment-priority pills on the seeded lists —
// the app's HOME view, a surface NO prior evidence frame has covered
// (seeded data renders the pills deterministically; no timer state, no
// beacon dependency). Frame 2: the RUM panel (/rum) — the
// CONSUMERS map's diagnostics surface (sf-pill-emerald / sf-pill-amber /
// sf-pill-red rating badges), driven the s19-spec way: a deterministic
// API-POSTed batch (LCP poor / CLS needs-improvement / TTFB good) renders
// ALL THREE families — a surface NO prior evidence frame has covered.
// Both frames md5-DISTINCT (the AR7 gate; the s93 I5 shape: the explicit
// boolean gate, the failure path prints its own line, the completion line
// only on green — the S95/AV2 exit-code semantics: process.exitCode = 1
// on the failure branch; the AX3 catch generalized to EVERY failed path,
// carried here). The S4 restore lesson on EVERY path: the theme back to
// violet/light AND the probe RUM rows deleted (this capture runs on the
// PERSISTENT custom.db — the s19 spec's e2e-db luxury does not apply).
//
// Usage: node scripts/capture-s99-evidence.mjs
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
const SESSION_ID = `s99-capture-${Date.now()}`;

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

  // ============ AZ · the guarded surface, leg 1 (dark Dashboard) ==========
  // DARK mode (the S10 API pattern — the gotoDark spec contract: PATCH the
  // preference, then NAVIGATE; the boot script applies the mode on load).
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "dark" } });
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(
    () =>
      document.documentElement.classList.contains("dark") &&
      document.documentElement.style.getPropertyValue("--sf-primary") !== "",
    null,
    { timeout: 15000 },
  );
  await page.waitForFunction(() => /good (morning|afternoon|evening)/i.test(document.body.textContent ?? ""), null, { timeout: 15000 });
  // The HOME view's two pill families — the seeded "Upcoming exams" list
  // renders the sf-pill-red urgency pills and the tasks/assignments list
  // renders the sf-pill-yellow priority pills (the CONSUMERS map's
  // dashboard-view entry, live on the surface — deterministic seed data).
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".sf-pill-red").length >= 1 &&
      document.querySelectorAll(".sf-pill-yellow").length >= 1,
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/99-clone-az-shapetrue-dark-dashboard.png` });

  // ============ AZ · leg 2 — the RUM panel, the s19-deterministic way ====
  // The diagnostics surface at /rum: a POSTed batch with THREE ratings
  // renders all three badge families (the s19 spec's own deterministic
  // pattern — no beacon timing dependency). The probe rows are THIS
  // session's own sessionId, deleted in the finally (the persistent-DB
  // restore).
  const batch = {
    sessionId: SESSION_ID,
    events: [
      { metric: "LCP", value: 4001, rating: "poor", navigationType: "navigate", path: "/s99-capture-probe" },
      { metric: "CLS", value: 0.11, rating: "needs-improvement", navigationType: "navigate", path: "/s99-capture-probe" },
      { metric: "TTFB", value: 799, rating: "good", navigationType: "navigate", path: "/s99-capture-probe" },
    ],
  };
  const post = await page.request.post(`${BASE}/api/rum`, { data: batch });
  if (post.status() !== 200) throw new Error(`RUM batch POST failed: ${post.status()}`);

  await page.goto(`${BASE}/rum`);
  await page.waitForFunction(() => /performance diagnostics/i.test(document.querySelector("main h1")?.textContent ?? document.title), null, { timeout: 15000 });
  // All three rating-badge families render (the CONSUMERS map's rum-panel
  // entry — the emerald/amber/red trio, deterministic through the posted
  // batch).
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".sf-pill-emerald").length >= 1 &&
      document.querySelectorAll(".sf-pill-amber").length >= 1 &&
      document.querySelectorAll(".sf-pill-red").length >= 1,
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/99-clone-az-shapetrue-rum-panel.png` });

  // ---- The distinct-frame verification — the AR7 gate, the s93 I5 shape --
  const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex");
  const frames = [
    `${OUT}/99-clone-az-shapetrue-dark-dashboard.png`,
    `${OUT}/99-clone-az-shapetrue-rum-panel.png`,
  ].map(md5);
  const distinct = new Set(frames).size === frames.length;
  if (!distinct) {
    // The failure path prints its OWN line — no success-shaped prose on a
    // failed gate. The S95/AV2 semantics: process.exitCode = 1 (the
    // S91/AR7 gate semantics — an exit-code-checking wrapper must see
    // the failure).
    console.log(`S99 AZ frames DUPLICATE: ${frames.join(" ")} — the md5 gate FAILS this run`);
    process.exitCode = 1;
    md5Failed = true;
  } else {
    console.log(`S99 AZ frames: ${frames.join(" ")} — all DISTINCT`);
  }
} catch (err) {
  // The AX3 shape (the s96 audit's I3): the failure path is gate-OWNED — a
  // mid-run throw exits 1 through this catch with a script-owned failure
  // line, not through node's unhandled-rejection spew. The md5Failed
  // shape generalized: every failure path sets process.exitCode = 1, and
  // the completion line below keys on the explicit booleans.
  console.error(`S99 AZ surface captures FAILED: ${err?.message ?? err}`);
  process.exitCode = 1;
  thrown = true;
} finally {
  // The S4 restore lesson: the shared demo surface is restored (accent
  // violet, mode LIGHT) on EVERY path — AND this capture's probe RUM rows
  // are deleted (the persistent custom.db, unlike the s19 spec's fresh
  // e2e DB).
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "light" } }).catch(() => {});
  await prisma.rumEvent.deleteMany({ where: { sessionId: SESSION_ID } }).catch(() => {});
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  await prisma.$disconnect().catch(() => {});
}
// The s93 I5 shape: the completion line is gated on the explicit boolean
// (the AX3 shape: both of them — no success-shaped prose on any failed path).
if (!md5Failed && !thrown) console.log("S99 AZ surface captures complete");

// S96 · Batch AW surface evidence captures — the @utility-block uniqueness
// guard (the AW1 headline: the utility families whose duplicate-block blind
// spot was demonstrated live — a planted later `@utility sf-pill-red` block
// left all 923 pins green — now machine-guarded by the completeness pin,
// rendered live on their consumer surfaces).
//
// AW frames (the GUARDED surfaces, on the final build): Frame 1: the
// Dashboard in DARK with the assignments priority pills rendered
// (sf-pill-yellow — the family AT1 put on the dashboard; the s93 DOM
// verification's 6 pills, computed #422006 on #fde047). Frame 2: the
// Grade Tracker in DARK — reached through the REAL sidebar navigation
// (the AM2 rule) — where four more guarded families render on the seeded
// score pills (sf-pill-emerald / sf-pill-sky / sf-pill-amber /
// sf-pill-red, the CONSUMERS map's densest view). Both frames md5-DISTINCT
// (the AR7 gate; the s93 I5 shape: the explicit boolean gate, the failure
// path prints its own line, the completion line only on green — and the
// S95/AV2 exit-code semantics: process.exitCode = 1 on the failure branch).
//
// No marker fixtures needed (the seeded demo data renders the pills), so
// this script's cleanup owns ONLY the state restoration (the demo surface
// back to violet/light) — the S4 restore lesson on EVERY path.
//
// Usage: node scripts/capture-s96-evidence.mjs
//        (clone :3200 standalone first — the S86 daemon recipe)
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

  // ============ AW · the guarded surface, leg 1 (dark Dashboard) =============
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
  await page.waitForFunction(() => /welcome back|good (morning|afternoon|evening)/i.test(document.querySelector("main")?.innerText ?? ""), null, { timeout: 15000 });
  // The priority pills themselves — the sf-pill-yellow family rendered
  // (the dark pair: the 950 bg / the 300 ink — the steps + the utility
  // block the AW1 guard protects, live on the surface).
  await page.waitForFunction(
    () => document.querySelectorAll(".sf-pill-yellow").length >= 1,
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/96-clone-aw-utilityfamilies-dark-dashboard.png` });

  // ============ AW · leg 2 — the REAL navigation interaction =============
  // Dashboard → Grade Tracker through the sidebar (a real user interaction,
  // the AM2 rule): the CONSUMERS map's densest view — four more guarded
  // utility families on the seeded score pills.
  await page.locator("nav a").filter({ hasText: "Grade Tracker" }).first().click();
  await page.waitForURL("**/GradeTracker", { timeout: 15000 });
  await page.waitForFunction(() => /grade tracker/i.test(document.querySelector("main h1")?.textContent ?? ""), null, { timeout: 15000 });
  await page.waitForFunction(
    () => document.querySelectorAll("[class*='sf-pill-']").length >= 4,
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/96-clone-aw-utilityfamilies-dark-gradetracker.png` });

  // ---- The distinct-frame verification — the AR7 gate, the s93 I5 shape --
  const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex");
  const frames = [
    `${OUT}/96-clone-aw-utilityfamilies-dark-dashboard.png`,
    `${OUT}/96-clone-aw-utilityfamilies-dark-gradetracker.png`,
  ].map(md5);
  const distinct = new Set(frames).size === frames.length;
  if (!distinct) {
    // The failure path prints its OWN line — no success-shaped prose on a
    // failed gate. The S95/AV2 semantics: process.exitCode = 1 (the
    // S91/AR7 gate semantics — an exit-code-checking wrapper must see
    // the failure).
    console.log(`S96 AW frames DUPLICATE: ${frames.join(" ")} — the md5 gate FAILS this run`);
    process.exitCode = 1;
    md5Failed = true;
  } else {
    console.log(`S96 AW frames: ${frames.join(" ")} — all DISTINCT`);
  }
} catch (err) {
  // S97/AX3 (the s96 audit's I3): the failure path is gate-OWNED — a
  // mid-run throw exits 1 through this catch with a script-owned failure
  // line, not through node's unhandled-rejection spew. The md5Failed
  // shape generalized: every failure path sets process.exitCode = 1, and
  // the completion line below keys on the explicit booleans.
  console.error(`S96 AW surface captures FAILED: ${err?.message ?? err}`);
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
if (!md5Failed && !thrown) console.log("S96 AW surface captures complete");

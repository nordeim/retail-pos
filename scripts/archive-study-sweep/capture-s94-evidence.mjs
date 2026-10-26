// S94 · Batch AU surface evidence captures — the connectivity trap-10
// closure (the amber-200/amber-800 @theme pins + the sf-connectivity-pill
// utility: the S14 offline banner's hue pair now rides the pinned v3 hexes,
// dark branch included; the s93 residual register's first TREATED site).
//
// AU frames (the GUARDED surface — the offline banner live on the final
// build, where the trap-10 fix is observable): Frame 1: the Dashboard in
// DARK with the offline banner visible (amber-950 bg / amber-200 ink /
// the rgba amber-800/60 border — the pinned dark pair). Frame 2: the
// GradeTracker in DARK with the banner still up — reached through the REAL
// sidebar navigation (the AM2 rule; the banner is a global fixed surface,
// it persists across the client-side route change). Both frames
// md5-DISTINCT (the AR7 gate; the s93 I5 shape: the explicit boolean gate,
// the failure path prints its own line, the completion line only on green).
//
// The banner itself needs no marker fixtures (the offline state is the
// context.setOffline toggle — the A0 spec's own mechanism), so this
// script's cleanup owns ONLY the state restoration (offline off, the demo
// surface back to violet/light) — the S4 restore lesson on EVERY path.
//
// Usage: node scripts/capture-s94-evidence.mjs
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
let md5Failed = false; // S94/AU (the s93 audit's I5): the explicit completion gate

try {
  const demo = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!demo) throw new Error("demo user missing — run bun run db:seed");

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
  await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

  // ============ AU · the guarded surface, leg 1 (dark Dashboard) =========
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
  await page.waitForFunction(() => /good (morning|afternoon|evening)/i.test(document.querySelector("main h1")?.textContent ?? ""), null, { timeout: 15000 });

  // The offline banner — the A0 spec's own mechanism (the context toggle
  // drives useSyncExternalStore; no fixtures, no marker rows).
  await context.setOffline(true);
  const banner = page.getByRole("status").filter({ hasText: /offline/i });
  await banner.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/94-clone-au-connectivity-dark-dashboard.png` });

  // ============ AU · leg 2 — the REAL navigation interaction ============
  // Dashboard → GradeTracker through the sidebar (a real user interaction,
  // the AM2 rule): the banner persists — a global fixed surface outside the
  // view tree — re-rendering the pinned dark pair on the new route.
  await page.locator("nav a").filter({ hasText: "Grade Tracker" }).first().click();
  await page.waitForURL("**/GradeTracker", { timeout: 15000 });
  await page.waitForFunction(() => /grade tracker/i.test(document.querySelector("main h1")?.textContent ?? ""), null, { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/94-clone-au-connectivity-dark-gradetracker.png` });

  // ---- The distinct-frame verification — the AR7 gate, the s93 I5 shape --
  const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex");
  const frames = [
    `${OUT}/94-clone-au-connectivity-dark-dashboard.png`,
    `${OUT}/94-clone-au-connectivity-dark-gradetracker.png`,
  ].map(md5);
  const distinct = new Set(frames).size === frames.length;
  if (!distinct) {
    // The failure path prints its OWN line — no success-shaped prose on a
    // failed gate. S95/AV2 (the s94 audit's L2): process.exitCode = 1
    // restored — the S91/AR7 gate semantics the s93 shape carries (an
    // exit-code-checking wrapper must see the failure).
    console.log(`S94 AU frames DUPLICATE: ${frames.join(" ")} — the md5 gate FAILS this run`);
    process.exitCode = 1;
    md5Failed = true;
  } else {
    console.log(`S94 AU frames: ${frames.join(" ")} — all DISTINCT`);
  }
} finally {
  // The S4 restore lesson: the shared demo surface is restored (accent
  // violet, mode LIGHT, connectivity ONLINE) on EVERY path.
  await context.setOffline(false).catch(() => {});
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "light" } }).catch(() => {});
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  await prisma.$disconnect().catch(() => {});
}
// The s93 I5 shape: the completion line is gated on the explicit boolean.
if (!md5Failed) console.log("S94 AU surface captures complete");

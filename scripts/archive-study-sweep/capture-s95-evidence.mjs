// S95 · Batch AV surface evidence captures — the uniqueness-guard
// completion + the Batch R standing-debt closure (the amber-200/amber-800
// @theme steps — the steps the S95/AV1 extended uniqueness guard now
// protects — rendered live on the offline banner's pinned dark pair; and
// the Tasks view, the longTaskTotal heaviest surface — the Batch R
// closure's own evidence anchor, where the isolated triple's Tasks
// readings came from).
//
// AV frames (the GUARDED surfaces, on the final build): Frame 1: the
// Notes view in DARK with the offline banner visible (amber-950 bg /
// amber-200 ink / the rgba amber-800/60 border — the pinned dark pair
// whose steps the extended guard now covers; a THIRD banner view — the
// s94 pair captured Dashboard + GradeTracker). Frame 2: the Tasks view
// in DARK with the banner still up — reached through the REAL sidebar
// navigation (the AM2 rule; the banner is a global fixed surface, it
// persists across the client-side route change) — the Batch R closure's
// anchor surface (the 300-row volume mount the cwv probe measures).
// Both frames md5-DISTINCT (the AR7 gate; the s93 I5 shape: the
// explicit boolean gate, the failure path prints its own line, the
// completion line only on green — and the S95/AV2 exit-code restore:
// process.exitCode = 1 on the failure branch, the s93 shape the s94
// re-tag dropped).
//
// The banner itself needs no marker fixtures (the offline state is the
// context.setOffline toggle — the A0 spec's own mechanism), so this
// script's cleanup owns ONLY the state restoration (offline off, the demo
// surface back to violet/light) — the S4 restore lesson on EVERY path.
//
// Usage: node scripts/capture-s95-evidence.mjs
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

try {
  const demo = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!demo) throw new Error("demo user missing — run bun run db:seed");

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
  await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

  // ============ AV · the guarded surface, leg 1 (dark Notes) =============
  // DARK mode (the S10 API pattern — the gotoDark spec contract: PATCH the
  // preference, then NAVIGATE; the boot script applies the mode on load).
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "dark" } });
  await page.goto(`${BASE}/Notes`);
  await page.waitForFunction(
    () =>
      document.documentElement.classList.contains("dark") &&
      document.documentElement.style.getPropertyValue("--sf-primary") !== "",
    null,
    { timeout: 15000 },
  );
  await page.waitForFunction(() => /notes/i.test(document.querySelector("main h1")?.textContent ?? ""), null, { timeout: 15000 });

  // The offline banner — the A0 spec's own mechanism (the context toggle
  // drives useSyncExternalStore; no fixtures, no marker rows).
  await context.setOffline(true);
  const banner = page.getByRole("status").filter({ hasText: /offline/i });
  await banner.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/95-clone-av-connectivity-dark-notes.png` });

  // ============ AV · leg 2 — the REAL navigation interaction =============
  // Notes → Tasks through the sidebar (a real user interaction, the AM2
  // rule): the banner persists — a global fixed surface outside the view
  // tree — re-rendering the pinned dark pair on the Batch R closure's
  // anchor surface.
  await page.locator("nav a").filter({ hasText: "Tasks" }).first().click();
  await page.waitForURL("**/Tasks", { timeout: 15000 });
  await page.waitForFunction(() => /tasks/i.test(document.querySelector("main h1")?.textContent ?? ""), null, { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/95-clone-av-connectivity-dark-tasks.png` });

  // ---- The distinct-frame verification — the AR7 gate, the s93 I5 shape --
  const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex");
  const frames = [
    `${OUT}/95-clone-av-connectivity-dark-notes.png`,
    `${OUT}/95-clone-av-connectivity-dark-tasks.png`,
  ].map(md5);
  const distinct = new Set(frames).size === frames.length;
  if (!distinct) {
    // The failure path prints its OWN line — no success-shaped prose on a
    // failed gate. The S95/AV2 restore: process.exitCode = 1 (the S91/AR7
    // gate semantics — an exit-code-checking wrapper must see the failure;
    // the s94 re-tag had dropped it, the s94 audit's L2).
    console.log(`S95 AV frames DUPLICATE: ${frames.join(" ")} — the md5 gate FAILS this run`);
    process.exitCode = 1;
    md5Failed = true;
  } else {
    console.log(`S95 AV frames: ${frames.join(" ")} — all DISTINCT`);
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
if (!md5Failed) console.log("S95 AV surface captures complete");

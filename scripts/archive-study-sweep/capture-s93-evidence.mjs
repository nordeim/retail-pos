// S93 · Batch AT surface evidence captures — the AT1 hue-census completion
// (the s93 audit's L2 closures: the files-view folder tile's missing dark
// half — the latent flashbulb on a swept view the seed never rendered —
// and the dashboard assignments priority pill joining the sf-pill-yellow
// family).
//
// AT1 frames (the GUARDED surfaces, demonstrated on the final build in
// DARK mode where both closures live): Frame 1: the Files view in dark
// with one marker FOLDER (the seed has none — the tile never rendered in
// any standing sweep, the omission class; the amber tile's new
// dark:bg-amber-900/40 + dark:text-amber-300 half now renders). Frame 2:
// the Dashboard in dark with one marker assignment due today (the
// sf-pill-yellow priority pill at the family's 950 dark step — the
// 900/40 divergent step retired). Both frames separated by the REAL
// sidebar navigation interaction (the AM2 rule) and must be md5-DISTINCT.
//
// S93/AS5 hardenings (the s91 audit's I5, baked into this cycle's script):
//   (1) the md5 gate prints the FULL digest (not the 8-char truncation);
//   (2) the final "captures complete" line prints ONLY on the green path —
//       the duplicate-failure path prints its own failure line.
// The S91/AR7 gate semantics ride unchanged: process.exitCode = 1 on a
// duplicate, DATABASE_URL pinned INSIDE the script (the §18 env-pinning
// convention — a wrong env fails loud, not silently).
//
// Usage: node scripts/capture-s93-evidence.mjs
//        (clone :3200 standalone first — the S86 daemon recipe)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3200";
const OUT = "docs/screenshots";
let md5Failed = false; // S93/AT (the s93 audit's I5): the explicit completion gate
mkdirSync(OUT, { recursive: true });
const PREFERENCES = "/api/settings/preferences";
const MARKER = "S93-AT1-";

// The env pin — this script owns its own DATABASE_URL, never the caller's
// environment (the cwv-volume-stress convention).
const prisma = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

try {
  const demo = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!demo) throw new Error("demo user missing — run bun run db:seed");

  // --- the marker fixtures: one folder + one due-today assignment ---------
  // The seed has NO folders — the Files tile never rendered in any standing
  // sweep (the omission class the s93 audit documented). The marker folder
  // makes the tile render; the marker assignment (due today, priority
  // high) makes the dashboard's sf-pill-yellow priority pill render.
  // Both delete in the finally on EVERY path.
  await prisma.fileFolder.create({
    data: { userId: demo.id, name: `${MARKER}folder` },
  });
  const today = new Date();
  today.setHours(17, 0, 0, 0);
  await prisma.assignment.create({
    data: {
      userId: demo.id, title: `${MARKER}assignment due today`, dueDate: today,
      type: "essay", priority: "high", progress: 30,
    },
  });
  const folderCount = await prisma.fileFolder.count({ where: { name: { startsWith: MARKER } } });
  const assignmentCount = await prisma.assignment.count({ where: { title: { startsWith: MARKER } } });
  if (folderCount !== 1 || assignmentCount !== 1) {
    throw new Error(`marker COUNT verification failed: folders ${folderCount}, assignments ${assignmentCount} (expected 1/1)`);
  }

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
  await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

  // ============ AT1 · the guarded surface, leg 1 (Files) ==================
  // DARK mode (the S10 API pattern — the gotoDark spec contract: PATCH the
  // preference, then NAVIGATE; the boot script applies the mode on load):
  // the folder tile's new dark half.
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "dark" } });
  await page.goto(`${BASE}/Files`);
  await page.waitForFunction(
    () =>
      document.documentElement.classList.contains("dark") &&
      document.documentElement.style.getPropertyValue("--sf-primary") !== "",
    null,
    { timeout: 15000 },
  );
  await page.waitForFunction(() => /files/i.test(document.querySelector("main h1")?.textContent ?? ""), null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/93-clone-at-files-dark.png` });

  // ============ AT1 · leg 2 — the REAL navigation interaction ============
  // Files → Dashboard through the sidebar (a real user interaction, the
  // AM2 rule): the priority pill at the family's 950 dark step.
  await page.locator("nav a").filter({ hasText: "Dashboard" }).first().click();
  await page.waitForURL("**/Dashboard", { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/93-clone-at-dashboard-dark.png` });

  // ---- The distinct-frame verification — the AR7 gate, AS5-hardened ------
  const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex");
  const frames = [
    `${OUT}/93-clone-at-files-dark.png`,
    `${OUT}/93-clone-at-dashboard-dark.png`,
  ].map(md5);
  const distinct = new Set(frames).size === frames.length;
  if (!distinct) {
    // S93/AS5 (2): the failure path prints its OWN line — no
    // success-shaped prose on a failed gate.
    console.log(`S93 AT frames DUPLICATE: ${frames.join(" ")} — the md5 gate FAILS this run`);
    process.exitCode = 1;
    md5Failed = true;
  } else {
    console.log(`S93 AT frames: ${frames.join(" ")} — all DISTINCT`);
  }
} finally {
  // The AL5/AN1 cleanup convention: the marker rows delete on EVERY path;
  // the S4 restore lesson: the shared demo surface is restored (accent
  // violet, mode LIGHT) on EVERY path.
  await prisma.fileFolder.deleteMany({ where: { name: { startsWith: MARKER } } }).catch(() => {});
  await prisma.assignment.deleteMany({ where: { title: { startsWith: MARKER } } }).catch(() => {});
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "light" } }).catch(() => {});
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  await prisma.$disconnect().catch(() => {});
}
// S93/AS5 (2): the completion line is gated on the md5 verdict above.
if (!md5Failed) console.log("S93 AT surface captures complete"); // I5: the explicit boolean, never a sniffed exit code

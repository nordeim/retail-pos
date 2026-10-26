// S91 · Batch AR surface evidence captures — the AR1 cwv budget re-anchor
// (the S82/S88 noise-floor standing debt closed: the cwv-volume-stress
// longTaskTotal budget 2000 → 2400ms, re-anchored on the documented
// same-tree healthy band 1821–2288ms — the S47/S51 in-suite-correction
// precedent, the identical coin-flip class).
//
// AR1 frames (the GUARDED surface — the volume-stressed Tasks load window
// the re-anchored budget guards, demonstrated on the final build with the
// S51 volume profile seeded for real): Frame 1: the Tasks view at the
// 300-task volume profile (the budget's own measurement surface, MODE light
// per the cwv contract). Frame 2: the Dashboard under the same volume
// profile (the cross-view comparison — the 7-view sweep's first and last
// surfaces). Both frames separated by the REAL navigation interaction (the
// AM2 rule) and must be md5-DISTINCT.
//
// S91/AR7 hardening (the s90 audit's I2, baked into this cycle's script):
//   (1) the md5 distinct-frame check is now a GATE — a duplicate frame
//       exits NON-ZERO (the AM2 rule becomes enforceable, not an eyeball
//       note printed at the end);
//   (2) DATABASE_URL is pinned INSIDE the script (the §18 env-pinning
//       convention — a wrong env fails loud, not silently).
//
// Usage: node scripts/capture-s91-evidence.mjs
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
const MARKER = "S91-AR1-";

// S91/AR7 (2): the env pin — this script owns its own DATABASE_URL, never
// the caller's environment (the cwv-volume-stress convention).
const prisma = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

try {
  const demo = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!demo) throw new Error("demo user missing — run bun run db:seed");

  // --- the S51 volume profile, seeded for real (the guarded surface) -----
  // 300 marker tasks with the same bucket distribution the cwv probe uses
  // (the day-0/-3/+7 due mix). The rows delete in the finally on EVERY path.
  const today = new Date();
  const dayOffset = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    d.setHours(12, 0, 0, 0);
    return d.toISOString();
  };
  const taskData = [];
  for (let i = 0; i < 300; i++) {
    const bucket = i % 3;
    const due = bucket === 0 ? dayOffset(0) : bucket === 1 ? dayOffset(-3) : dayOffset(7);
    taskData.push({
      userId: demo.id,
      title: `${MARKER}task ${i}`,
      notes: "stress row",
      completed: i % 5 === 0,
      important: i % 7 === 0,
      dueDate: due,
      priority: ["none", "low", "medium", "high"][i % 4],
      repeat: "none",
      myDay: bucket === 0 && i % 2 === 0,
      subtasks: "[]",
    });
  }
  await prisma.task.createMany({ data: taskData });
  const count = await prisma.task.count({ where: { title: { startsWith: MARKER } } });
  if (count !== 300) throw new Error(`volume COUNT verification failed: ${count} (expected 300)`);

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
  await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

  // ============ AR1 · the guarded volume surface, leg 1 (Tasks) ==========
  // MODE light (the cwv-volume-stress contract's own mode), the Tasks view
  // at the 300-row profile — the surface whose load-window longTaskTotal
  // the re-anchored 2400ms budget guards.
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "light" } });
  await page.goto(`${BASE}/Tasks`);
  await page.waitForFunction(() => /tasks/i.test(document.querySelector("main h1")?.textContent ?? ""), null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/91-clone-ar-tasks-volume.png` });

  // ============ AR1 · leg 2 — the REAL navigation interaction ============
  // The sidebar's Dashboard link (a real user interaction, the AM2 rule):
  // Tasks → Dashboard under the same volume profile.
  await page.locator("nav a").filter({ hasText: "Dashboard" }).first().click();
  await page.waitForURL("**/Dashboard", { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/91-clone-ar-dashboard-volume.png` });

  // ---- The distinct-frame verification — the S91/AR7 GATE (1) -----------
  const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex").slice(0, 8);
  const frames = [
    `${OUT}/91-clone-ar-tasks-volume.png`,
    `${OUT}/91-clone-ar-dashboard-volume.png`,
  ].map(md5);
  const distinct = new Set(frames).size === frames.length;
  console.log(`S91 AR frames: ${frames.join(" ")} — ${distinct ? "all DISTINCT" : "DUPLICATE PRESENT"}`);
  if (!distinct) {
    // S91/AR7 (1): the AM2 rule is a gate now — a duplicate frame FAILS the
    // run (exit 1) instead of printing an eyeball note.
    process.exitCode = 1;
  }
} finally {
  // The AL5/AN1 cleanup convention: the marker rows delete on EVERY path;
  // the S4 restore lesson: the shared demo surface is restored (accent
  // violet, mode light) on EVERY path.
  await prisma.task.deleteMany({ where: { title: { startsWith: MARKER } } }).catch(() => {});
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "light" } }).catch(() => {});
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  await prisma.$disconnect().catch(() => {});
}
console.log("S91 AR surface captures complete");

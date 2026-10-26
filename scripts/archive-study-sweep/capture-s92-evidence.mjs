// S92 · Batch AS surface evidence captures — the AS1 hue-consumer token
// cycle (the s80-era L4 standing debt closed: the AG-pinned dark-pill hue
// families centralized as sf-pill-* / sf-alert-* utilities, the five
// missing palette steps pinned to the v3 hexes, the RUM rating badges and
// the PracticeTests timer pill given the dark branch they never had).
//
// AS1 frames (the GUARDED surface — the pill-family showcase, demonstrated
// on the final build in DARK mode, where the pinned palette steps
// serialize and the family's dark branches live): Frame 1: the GradeTracker
// in dark with one marker grade added so all FOUR score-pill hues render
// (emerald ≥90, sky ≥80, amber ≥70, red <70 — the seeded 95/88.5/88/78
// averages plus the 55 marker). Frame 2: the Exams view in dark (the
// seeded Tomorrow/3-days/4-days badges plus one TODAY marker exam — the
// orange/yellow/red badge trio where the new orange-950/orange-300 and
// yellow-300 palette pins land). Both frames separated by the REAL sidebar
// navigation interaction (the AM2 rule) and must be md5-DISTINCT.
//
// S92/AS5 hardenings (the s91 audit's I5, baked into this cycle's script):
//   (1) the md5 gate prints the FULL digest (not the 8-char truncation);
//   (2) the final "captures complete" line prints ONLY on the green path —
//       the duplicate-failure path prints its own failure line.
// The S91/AR7 gate semantics ride unchanged: process.exitCode = 1 on a
// duplicate, DATABASE_URL pinned INSIDE the script (the §18 env-pinning
// convention — a wrong env fails loud, not silently).
//
// Usage: node scripts/capture-s92-evidence.mjs
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
const MARKER = "S92-AS1-";

// The env pin — this script owns its own DATABASE_URL, never the caller's
// environment (the cwv-volume-stress convention).
const prisma = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

try {
  const demo = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!demo) throw new Error("demo user missing — run bun run db:seed");

  // --- the marker fixtures: one red-band grade + one TODAY exam -----------
  // The seed's subject averages render emerald (physics 95) / sky (math
  // 88.5, english 88) / amber (chemistry 78); the history marker grade at
  // 55 adds the red pill so all four hues render. The TODAY marker exam
  // adds the red badge beside the seeded Tomorrow (orange) and N-days
  // (yellow) badges. Both delete in the finally on EVERY path.
  const history = await prisma.subject.findFirst({
    where: { userId: demo.id, name: { contains: "History" } },
  });
  if (!history) throw new Error("history subject missing — run bun run db:seed");
  await prisma.grade.create({
    data: {
      userId: demo.id, title: `${MARKER}grade`, score: 55, maxScore: 100, weight: 1,
      subjectId: history.id,
    },
  });
  const today = new Date();
  today.setHours(9, 0, 0, 0);
  await prisma.exam.create({
    data: {
      userId: demo.id, title: `${MARKER}exam today`, date: today, type: "quiz", duration: 30,
      topics: "[]",
    },
  });
  const gradeCount = await prisma.grade.count({ where: { title: { startsWith: MARKER } } });
  const examCount = await prisma.exam.count({ where: { title: { startsWith: MARKER } } });
  if (gradeCount !== 1 || examCount !== 1) {
    throw new Error(`marker COUNT verification failed: grades ${gradeCount}, exams ${examCount} (expected 1/1)`);
  }

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
  await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

  // ============ AS1 · the guarded family surface, leg 1 (GradeTracker) ====
  // DARK mode (the S10 API pattern — the gotoDark spec contract: PATCH the
  // preference, then NAVIGATE; the boot script applies the mode on load),
  // all four score-pill hues.
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
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/92-clone-as-gradetracker-dark.png` });

  // ============ AS1 · leg 2 — the REAL navigation interaction ============
  // GradeTracker → Exams through the sidebar (a real user interaction, the
  // AM2 rule): the badge trio in dark.
  await page.locator("nav a").filter({ hasText: "Exams" }).first().click();
  await page.waitForURL("**/Exams", { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/92-clone-as-exams-dark.png` });

  // ---- The distinct-frame verification — the AR7 gate, AS5-hardened ------
  const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex");
  const frames = [
    `${OUT}/92-clone-as-gradetracker-dark.png`,
    `${OUT}/92-clone-as-exams-dark.png`,
  ].map(md5);
  const distinct = new Set(frames).size === frames.length;
  if (!distinct) {
    // S92/AS5 (2): the failure path prints its OWN line — no
    // success-shaped prose on a failed gate.
    console.log(`S92 AS frames DUPLICATE: ${frames.join(" ")} — the md5 gate FAILS this run`);
    process.exitCode = 1;
  } else {
    console.log(`S92 AS frames: ${frames.join(" ")} — all DISTINCT`);
  }
} finally {
  // The AL5/AN1 cleanup convention: the marker rows delete on EVERY path;
  // the S4 restore lesson: the shared demo surface is restored (accent
  // violet, mode LIGHT) on EVERY path.
  await prisma.grade.deleteMany({ where: { title: { startsWith: MARKER } } }).catch(() => {});
  await prisma.exam.deleteMany({ where: { title: { startsWith: MARKER } } }).catch(() => {});
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "light" } }).catch(() => {});
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  await prisma.$disconnect().catch(() => {});
}
// S92/AS5 (2): the completion line is gated on the md5 verdict above.
if (process.exitCode !== 1) console.log("S92 AS surface captures complete");

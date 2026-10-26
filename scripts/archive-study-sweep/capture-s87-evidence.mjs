// S87 · the AN surface evidence captures — the read-side trim symmetry
// (AN4: a LEGACY row stored pre-AM1 with padded member values renders
// trimmed through the seam — the visible surface of the read/write
// symmetry). The legacy row is created at the DB level (Prisma direct
// insert) because the AM1 boundary now trims every API write — a padded
// row can ONLY exist as a pre-AM1 artifact, which is exactly the class
// AN4 addresses.
//
// HONEST EVIDENCE POSTURE (the s86 audit's I2, accepted-and-documented
// as AN6): HTML collapses leading/trailing whitespace in text nodes and
// initialFor() trims internally, so a screenshot cannot VISUALLY
// discriminate padded-vs-trimmed on this surface — the capture documents
// the surface renders clean (the member list, the initials, the layout),
// while the two AN4 UNIT pins (tests/group-members.test.ts, RED-first)
// carry the behavioral proof. Frames are separated by REAL interactions
// (the AM2 convention): the desktop pair by a group switch, the mobile
// frame by its viewport journey.
//
// Usage: DATABASE_URL="file:../db/custom.db" node scripts/capture-s87-evidence.mjs
//        (clone :3200 standalone first — the S86 daemon recipe)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3200";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const prisma = new PrismaClient();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

let probeId = null;
try {
  // ---- The LEGACY row: padded members, creatable only at the DB level ----
  // (the AM1 server schema trims every API write — the point of the fix).
  const demo = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!demo) throw new Error("demo user missing — run bun run db:seed");
  const stamp = `s87-an-${Date.now()}`;
  const probe = await prisma.studyGroup.create({
    data: {
      userId: demo.id,
      name: `${stamp}-legacy-crew`,
      color: "#8b5cf6",
      // The PRE-AM1 storage form: padded values the seam now trims on read.
      members: JSON.stringify([
        { name: "  Padded Legacy  ", email: "legacy@example.com" },
        { name: "Legacy Sam", email: "  sam@example.com " },
      ]),
    },
  });
  probeId = probe.id;

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
  await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

  // ---- AN4: the legacy padded members render TRIMMED through the seam ----
  await page.goto(`${BASE}/StudyGroups`);
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: new RegExp(`${stamp}-legacy-crew`) }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/87-clone-an-studygroups-readtrimmed.png` });

  // ---- The AM2 interaction convention: the next frame of the same view is
  // ---- separated by a REAL interaction (a group switch), never a re-shoot.
  await page.getByRole("button", { name: /Calc Crew/ }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/87-clone-an-studygroups-switched.png` });

  // ---- AN4 mobile: the trimmed legacy members at 390×844 (stacked layout)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/StudyGroups`);
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: new RegExp(`${stamp}-legacy-crew`) }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/87-clone-an-mobile-studygroups-readtrimmed.png` });

  // ---- The distinct-frame verification (the AM2 closure: print the md5s) --
  const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex").slice(0, 8);
  const frames = [
    `${OUT}/87-clone-an-studygroups-readtrimmed.png`,
    `${OUT}/87-clone-an-studygroups-switched.png`,
    `${OUT}/87-clone-an-mobile-studygroups-readtrimmed.png`,
  ].map(md5);
  const distinct = new Set(frames).size === frames.length;
  console.log(`S87 AN frames: ${frames.join(" ")} — ${distinct ? "all DISTINCT" : "DUPLICATE PRESENT"}`);
} finally {
  // The AL5/S42 cleanup convention: the probe row is deleted in EVERY path
  // (the finally completes BEFORE the browser/prisma close below).
  if (probeId) {
    await prisma.studyGroup.delete({ where: { id: probeId } }).catch(() => {});
  }
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  await prisma.$disconnect().catch(() => {});
}
console.log("S87 AN surface captures complete");

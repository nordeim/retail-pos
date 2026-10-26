// S51 evidence capture — the CWV × volume story in one frame: the Tasks
// view at the FULL 300-row volume profile rendering at the S16 canonical
// stress viewport (390×844) with the density + overflow contracts verified
// in-frame — the visual half of the audit whose measurement half
// (scripts/cwv-volume-stress.mjs) reads the five field metrics under the
// Lighthouse throttle against the :3200 standalone build.
//
// Inserts the 300/200/250 marker rows (the STRESS-S51- lifecycle — the
// same Prisma inserts the probe uses, COUNT-verified), opens /Tasks at
// 390×844 on the dev server (the capture is the visual-density story, not
// the throttled measurement — the probe owns that), verifies the shell
// (the Tasks h1 + the "{N} tasks" subtitle ≥ 300 — the density evidence),
// verifies the scrollWidth 390 (the S16/S34 overflow class: the dense list
// must live inside the mobile canvas, never widen the document), reads the
// main-node count (the Tasks density signature ~7,900 at volume), captures
// the frame, and cleans the marker rows in a finally.
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots/s51-cwv-volume-stress-tasks-390.png";
const MARKER = "STRESS-S51-";

const prisma = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });

const user = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
if (!user) throw new Error("demo user missing — run bun run db:seed");

// The S51 volume inserts (the probe's lifecycle verbatim).
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
    userId: user.id,
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
const noteData = [];
for (let i = 0; i < 200; i++) {
  noteData.push({
    userId: user.id,
    title: `${MARKER}note ${i}`,
    content: "Stress note body ".repeat(8),
    tags: JSON.stringify(["stress"]),
  });
}
const eventData = [];
for (let i = 0; i < 250; i++) {
  const start = new Date(today);
  start.setDate(start.getDate() + (i % 7));
  start.setHours(8 + (i % 10), 0, 0, 0);
  const end = new Date(start.getTime() + 3600000);
  eventData.push({
    userId: user.id,
    title: `${MARKER}event ${i}`,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    color: "#8b5cf6",
    reminders: "[]",
    repeat: "none",
  });
}

const browser = await chromium.launch();
try {
  await prisma.task.createMany({ data: taskData });
  await prisma.note.createMany({ data: noteData });
  await prisma.event.createMany({ data: eventData });
  const counts = {
    tasks: await prisma.task.count({ where: { title: { startsWith: MARKER } } }),
    notes: await prisma.note.count({ where: { title: { startsWith: MARKER } } }),
    events: await prisma.event.count({ where: { title: { startsWith: MARKER } } }),
  };
  if (counts.tasks !== 300 || counts.notes !== 200 || counts.events !== 250) {
    throw new Error(`volume COUNT verification failed: ${JSON.stringify(counts)}`);
  }
  console.error(`[capture-s51] inserted + verified ${JSON.stringify(counts)}`);

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });

  // /Tasks at the stress viewport — the SPA rewrite boots the Tasks view.
  await page.goto(`${BASE}/Tasks`, { waitUntil: "load" });
  await page.waitForFunction(
    () => /tasks/i.test(document.querySelector("main h1")?.textContent ?? ""),
    undefined,
    { timeout: 30000 },
  );
  await page.waitForTimeout(2500); // the data-fetch + render settle band

  // The in-frame verification: the density evidence + the overflow contract.
  const verify = await page.evaluate(() => {
    const h1 = document.querySelector("main h1")?.textContent?.trim() ?? "";
    const subtitle = document.querySelector("main h1 + p, main h1 ~ p")?.textContent?.trim() ?? "";
    return {
      h1,
      subtitle,
      mainNodes: document.querySelectorAll("main *").length,
      scrollWidth: document.documentElement.scrollWidth,
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
  });
  console.error(`[capture-s51] verified: ${JSON.stringify(verify)}`);
  if (!/tasks/i.test(verify.h1)) throw new Error(`the Tasks h1 did not render: "${verify.h1}"`);
  if (verify.scrollWidth > 390) {
    throw new Error(`the dense list widened the document: scrollWidth ${verify.scrollWidth} > 390`);
  }
  if (verify.mainNodes < 5000) {
    throw new Error(`the volume density did not render: mainNodes ${verify.mainNodes} < 5000`);
  }

  await page.screenshot({ path: OUT, fullPage: false });
  console.error(`[capture-s51] saved ${OUT}`);
  console.log(JSON.stringify({ captured: OUT, verified: verify }, null, 2));
} finally {
  await browser.close();
  const del = await prisma.$transaction([
    prisma.task.deleteMany({ where: { title: { startsWith: MARKER } } }),
    prisma.note.deleteMany({ where: { title: { startsWith: MARKER } } }),
    prisma.event.deleteMany({ where: { title: { startsWith: MARKER } } }),
  ]);
  console.error(`[capture-s51] cleaned ${del.map((d) => d.count).join("/")} rows`);
  await prisma.$disconnect();
}

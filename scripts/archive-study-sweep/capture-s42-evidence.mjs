// S42 evidence capture — the data-volume × dark × accent story in one
// frame: the Tasks view at 300 rows in DARK mode under a non-violet accent
// (teal) at 1280×800, with the SIDEBAR's ACTIVE LINK on the navigated
// Tasks view and the dense task list rendering clean (the S41 capture
// pattern, extended with the volume lifecycle). PATCHes dark + teal through
// the settings API (the real lifecycle, self-verified on <html
// data-accent> + the dark class), inserts the S13 volume profile through
// Prisma (marker rows, COUNT-verified), navigates to Tasks THROUGH THE
// SIDEBAR (the desktop vehicle — the interaction under test), verifies the
// INVERTED chrome contract (the sidebar visible + the hamburger hidden at
// 1280), verifies the sidebar's active link is TASKS with the teal
// NAV_ACTIVE_GRADIENT_STOPS tint (the never-read dark cell), verifies the
// rendered row density (the volume actually visible in the frame), verifies
// zero flashbulbs (the dark doctrine), captures the frame, cleans up every
// marker row, and restores the resting state (light + violet, verified via
// Prisma by the caller).
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots/s42-accent-volume-dark-teal-tasks-1280.png";
const MARKER = "STRESS-S42-CAP-";
const prisma = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
try {
  // --- the volume lifecycle (the S42 probe's own family, marker-isolated --
  // the STRESS-S42-CAP- prefix never collides with the probe's STRESS-S42-) --
  await prisma.task.deleteMany({ where: { title: { startsWith: MARKER } } });
  const user = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!user) throw new Error("the demo user is missing — run bun run db:seed first.");
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
  await prisma.task.createMany({ data: taskData });
  const count = await prisma.task.count({ where: { title: { startsWith: MARKER } } });
  if (count !== 300) throw new Error(`the volume verification read ${count} marker rows, expected 300.`);
  console.error(`[capture] volume verified: ${count} marker tasks`);

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });

  // dark + teal through the real lifecycle, self-verified
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "dark", accentColor: "teal" } });
  await page.goto(`${BASE}/Dashboard`, { waitUntil: "load" });
  await page.waitForFunction(
    () => document.documentElement.dataset.accent === "teal" && document.documentElement.classList.contains("dark"),
    undefined,
    { timeout: 30000 },
  );

  // the INVERTED chrome contract at 1280 — the sidebar is the desktop vehicle
  // (getClientRects for the fixed-position sidebar — offsetParent reads null
  // for fixed elements even when rendered, the Chromium quirk)
  const chrome = await page.evaluate(() => ({
    sidebarVisible: (() => { const a = document.querySelector("aside"); return !!a && a.getClientRects().length > 0; })(),
    hamburgerVisible: (() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Open navigation menu"); return !!b && b.offsetParent !== null; })(),
  }));
  if (!chrome.sidebarVisible || chrome.hamburgerVisible) {
    throw new Error(`the INVERTED chrome contract broke at 1280 — ${JSON.stringify(chrome)}`);
  }

  // navigate to Tasks THROUGH THE SIDEBAR (the desktop vehicle — the
  // interaction under test)
  const nav = page.locator("aside nav");
  const t0 = Date.now();
  await nav.getByRole("link", { name: "Tasks", exact: true }).click();
  await page.locator("main h1:visible").first().waitFor({ state: "visible", timeout: 15000 });
  const clickLatencyMs = Date.now() - t0;
  await page.waitForTimeout(1500); // the 300-row fetch + render settle band

  // scroll the dense list a little so the frame shows the volume (the first
  // rows render at the top; the list is the story — keep the top)
  const rec = await page.evaluate(() => {
    const aside = document.querySelector("aside");
    const active = aside?.querySelector('a[aria-current="page"]');
    const inner = active ? active.querySelector("span") : null;
    const heading = document.querySelector("main h1");
    const main = document.querySelector("main");
    // the dark doctrine's flashbulb probe, main-scoped (the frame's own
    // surfaces): any light surface on the dark canvas fails the capture.
    let flashbulbs = 0;
    for (const el of main.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none") continue;
      const m = cs.backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) continue;
      const [r, g, b] = [+m[1], +m[2], +m[3]];
      const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      const L = 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      if (L > 0.80) flashbulbs += 1;
    }
    const rows = [...main.querySelectorAll("*")].filter((el) => (el.textContent || "").includes("STRESS-S42-CAP-task")).length;
    return {
      linkCount: aside ? aside.querySelectorAll("nav a").length : 0,
      activeLabel: active ? (active.textContent || "").trim() : null,
      activeTint: inner ? getComputedStyle(inner).backgroundImage.slice(0, 90) : null,
      headingText: heading ? heading.textContent.trim() : null,
      headingLeft: heading ? Math.round(heading.getBoundingClientRect().left) : null,
      darkClass: document.documentElement.classList.contains("dark"),
      accent: document.documentElement.dataset.accent,
      scrollWidth: document.documentElement.scrollWidth,
      mainNodes: main ? main.querySelectorAll("*").length : 0,
      stressRows: rows,
      flashbulbs,
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
  });
  console.error(JSON.stringify({ ...rec, clickLatencyMs }));
  if (rec.activeLabel !== "Tasks") {
    throw new Error(`the active link was "${rec.activeLabel}", expected "Tasks" — the interaction did not follow the navigation`);
  }
  if (!rec.activeTint || rec.activeTint === "none") {
    throw new Error(`the active-link gradient computed to "${rec.activeTint}" — the S8 no-var rot class`);
  }
  if (rec.headingText !== "All Tasks") {
    throw new Error(`the identity heading was "${rec.headingText}", expected "All Tasks"`);
  }
  if (rec.stressRows < 100) {
    throw new Error(`only ${rec.stressRows} stress-row surfaces rendered in the Tasks main — the volume is not visible in the frame`);
  }
  if (rec.flashbulbs > 0) {
    throw new Error(`${rec.flashbulbs} light surface(s) on the dark canvas — the flashbulb doctrine`);
  }
  await page.screenshot({ path: OUT });
  console.error(`saved ${OUT}`);

  // restore the resting state + clean the marker rows
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(
    () => document.documentElement.dataset.accent === "violet" && !document.documentElement.classList.contains("dark"),
    undefined,
    { timeout: 30000 },
  );
  writeFileSync("/tmp/s42-evidence-record.json", JSON.stringify({ ...rec, clickLatencyMs }, null, 1));
} catch (e) {
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } }).catch(() => {});
  console.error(`S42 EVIDENCE CAPTURE FAILED: ${e}`);
  process.exit(1);
} finally {
  await browser.close();
  const del = await prisma.task.deleteMany({ where: { title: { startsWith: MARKER } } }).catch(() => null);
  if (del) console.error(`[capture] cleaned ${del.count} marker tasks`);
  await prisma.$disconnect();
}

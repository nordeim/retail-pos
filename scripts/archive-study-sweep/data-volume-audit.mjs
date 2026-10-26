// Data-volume stress audit — session-13 (S13).
// The seed's datasets are small (tens of rows). This audit inserts hundreds
// of rows for the demo user directly through Prisma (marker-prefixed titles,
// cleaned up at the end), then measures:
//  - API payload size + latency for the fat collections (tasks, notes, events)
//  - client render cost on the heavy views (Tasks, Events, Notes, Dashboard,
//    MyDay, Analytics) — DOM node counts + long tasks + input latency
//  - whether the views stay functionally interactive at 300+ rows
// The dev server (custom.db) is used; all inserted rows carry the
// "STRESS-S13-" prefix and are deleted in a finally block.
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3000";
const MARKER = "STRESS-S13-";
const prisma = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });

const findings = [];
const nonGaps = [];
const note = (family, surface, detail) => findings.push({ family, surface, ...detail });
const ok = (surface, detail) => nonGaps.push({ surface, detail });

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  // S81/AH10 (the audit-tools repair): the login wait must prove
  // AUTHENTICATION, not main-element presence — the LOGIN PAGE itself has a
  // <main>, so this wait resolved pre-auth and the next goto raced the
  // login POST (ERR_ABORTED on the auth-gate bounce). The sweeps' pattern:
  // wait for the post-login /Dashboard redirect.
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
}

async function openView(page, _title, path) {
  await page.goto(`${BASE}/${path}`);
  // Wait for the view shell to render (h1 exists), then settle.
  await page.waitForFunction(() => !!document.querySelector("main h1"), null, { timeout: 20000 });
}

// Measure a view: DOM nodes, long tasks during a 3s quiet window, scroll height.
async function measure(page, label) {
  return page.evaluate(
    async (label) => {
      const nodes = document.querySelectorAll("*").length;
      const mainNodes = document.querySelectorAll("main *").length;
      const scrollH = document.querySelector("main")?.scrollHeight ?? 0;
      // Long-task observer over 1.5s.
      const longTasks = [];
      try {
        const po = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) longTasks.push(Math.round(e.duration));
        });
        po.observe({ entryTypes: ["longtask"] });
        await new Promise((r) => setTimeout(r, 1500));
        po.disconnect();
      } catch {}
      return { label, nodes, mainNodes, scrollH, longTasks: longTasks.slice(0, 8), longTaskTotal: longTasks.reduce((a, b) => a + b, 0) };
    },
    label,
  );
}

// Measure API latency/payload via fetch inside the page (cookie rides along).
async function apiStats(page, path) {
  return page.evaluate(async (path) => {
    const t0 = performance.now();
    const res = await fetch(path, { credentials: "same-origin" });
    const text = await res.text();
    return { path, ms: Math.round(performance.now() - t0), bytes: text.length, status: res.status };
  }, path);
}

let inserted = { tasks: 0, notes: 0, events: 0 };
try {
  const user = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!user) throw new Error("demo user missing — run bun run db:seed");

  // Baseline (pre-stress) measurements.
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await login(page);

  const baselineApi = await apiStats(page, "/api/tasks");
  await openView(page, "Tasks", "Tasks");
  await page.waitForTimeout(1500);
  const baselineView = await measure(page, "Tasks-baseline");
  ok("baseline captured", { baselineApi, baselineView: { nodes: baselineView.nodes, mainNodes: baselineView.mainNodes } });

  // -----------------------------------------------------------------------
  // Insert 300 tasks (mix: 100 today/MyDay, 100 overdue, 100 future),
  // 200 notes, 250 events (spread over the visible 7-day window).
  // -----------------------------------------------------------------------
  const today = new Date();
  // Prisma DateTime fields require full ISO-8601 datetimes (date-only strings
  // throw "premature end of input").
  const iso = (d) => d.toISOString();
  const dayOffset = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    d.setHours(12, 0, 0, 0);
    return iso(d);
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
  inserted.tasks = taskData.length;

  const noteData = [];
  for (let i = 0; i < 200; i++) {
    noteData.push({
      userId: user.id,
      title: `${MARKER}note ${i}`,
      content: "Stress note body ".repeat(8),
      tags: JSON.stringify(["stress"]),
    });
  }
  await prisma.note.createMany({ data: noteData });
  inserted.notes = noteData.length;

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
  await prisma.event.createMany({ data: eventData });
  inserted.events = eventData.length;

  console.error(`[stress] inserted ${JSON.stringify(inserted)}`);

  // -----------------------------------------------------------------------
  // Stressed measurements — API first.
  // -----------------------------------------------------------------------
  const stressedApi = {};
  for (const path of ["/api/tasks", "/api/notes", "/api/events"]) {
    stressedApi[path] = await apiStats(page, path);
  }
  const growth = stressedApi["/api/tasks"].bytes / Math.max(1, baselineApi.bytes);
  if (stressedApi["/api/tasks"].bytes > 500_000) {
    note("B1", "GET /api/tasks payload", {
      finding: "unbounded list payloads: 300 tasks serialize to a fat JSON body with no pagination/take",
      baseline: baselineApi,
      stressed: stressedApi["/api/tasks"],
    });
  } else {
    ok("task payload bounded", { bytes: stressedApi["/api/tasks"].bytes });
  }

  // -----------------------------------------------------------------------
  // Stressed view renders.
  // -----------------------------------------------------------------------
  const viewResults = {};
  for (const [label, title, path] of [
    ["Tasks", "Tasks", "Tasks"],
    ["Dashboard", "Dashboard", "Dashboard"],
    ["MyDay", "My Day", "MyDay"],
    ["Notes", "Notes", "Notes"],
    ["Events", "Events & Reminders", "Events"],
    ["Analytics", "Analytics", "Analytics"],
    ["Calendar", "Calendar", "Calendar"],
  ]) {
    await openView(page, title, path);
    await page.waitForTimeout(1800); // let data fetch + render settle
    viewResults[label] = await measure(page, label);
    // Interactivity probe: can we still click a nav link quickly?
    const t0 = Date.now();
    await page.evaluate(() => {
      const link = [...document.querySelectorAll("aside a, nav a")].find((a) => (a.textContent || "").trim() === "Dashboard");
      if (link) link.click();
    });
    await page.waitForTimeout(400);
    const clickLatency = Date.now() - t0;
    viewResults[label].clickLatencyMs = clickLatency;
    if (clickLatency > 800) {
      note("B2", `${label} interactivity`, { finding: "nav click took > 800ms under stress", clickLatencyMs: clickLatency });
    }
    await page.waitForTimeout(300);
  }

  // Long-task totals: flag views blocking the main thread hard.
  for (const [label, r] of Object.entries(viewResults)) {
    if (r.longTaskTotal > 1500) {
      note("B3", `${label} main-thread blocking`, {
        finding: "long tasks during render exceed 1.5s total",
        longTasks: r.longTasks,
        longTaskTotal: r.longTaskTotal,
        mainNodes: r.mainNodes,
      });
    } else {
      ok(`${label} render`, { longTaskTotal: r.longTaskTotal, mainNodes: r.mainNodes, clickLatencyMs: r.clickLatencyMs });
    }
  }

  // Events view: does the 7-day terminal panel stay usable with 250 events?
  await openView(page, "Events & Reminders", "Events");
  await page.waitForTimeout(2000);
  const eventsStats = await page.evaluate(() => {
    const sections = [...document.querySelectorAll("main h3")].length;
    const rows = document.querySelectorAll("main li, main [class*=border-l]").length;
    return { sections, approxRows: rows, scrollH: document.querySelector("main")?.scrollHeight ?? 0 };
  });
  console.error(`[stress] events view: ${JSON.stringify(eventsStats)}`);
  ok("events view rendered under stress", eventsStats);

  await browser.close();
} finally {
  // Cleanup — remove ALL marker rows (idempotent even after partial runs).
  const del = await prisma.$transaction([
    prisma.task.deleteMany({ where: { title: { startsWith: MARKER } } }),
    prisma.note.deleteMany({ where: { title: { startsWith: MARKER } } }),
    prisma.event.deleteMany({ where: { title: { startsWith: MARKER } } }),
  ]);
  console.error(`[stress] cleaned ${del.map((d) => d.count).join("/")} rows`);
  await prisma.$disconnect();
}

console.log(JSON.stringify({ findings, nonGaps, inserted }, null, 2));

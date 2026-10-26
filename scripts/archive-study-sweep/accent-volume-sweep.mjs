// S42 data-volume × dark × accent stress — the S13 volume profile (300
// tasks / 200 notes / 250 events) swept through the theme space's
// dark-accent half, as a standing, executable guarantee (the S41 summary's
// own named next step: "the data-volume × dark × accent stress").
//
// Run with NODE (the accent-desktop-sweep precedent — imports no TS seam;
// the standing-suite runner classifies the envelope through suite-verdict):
//
//   node scripts/accent-volume-sweep.mjs
//
// The coverage gap this closes, verified against the standing scripts:
//   - data-volume-audit (S13): the 300/200/250 profile, the payload/long-
//     task/click-latency budgets — LIGHT + VIOLET only (zero theme
//     references), once, at 1280×800
//   - dark-sweep (S27): all 20 views in dark — violet only, seed volume
//   - accent-dark-sweep (S38): 7 accents × 20 views × desktop+mobile —
//     dark, SEED volume, DIRECT GOTO (never reads the sidebar's active
//     link)
//   - accent-light/midband/landscape/desktop (S37/S39/S40/S41): 7 accents
//     × 20 views in light — seed volume
//   So: the cross-axis cell (300+ rows × dark × accent) is ZERO-coverage
//   at every accent, AND the SIDEBAR's active-link tint has never been
//   read through the real navigation lifecycle in DARK mode (S41 proved it
//   in light; accent-dark's goto pass never reads it).
//
// What it asserts, per accent (7), at 1280×800 in DARK mode under the
// verified 300/200/250 profile, navigated THROUGH THE SIDEBAR (the desktop
// vehicle — the click doubles as the interactivity measurement):
//   1. the VOLUME self-verification (a PRECONDITION): the marker rows are
//      inserted through Prisma and COUNT-verified (300/200/250 exactly) —
//      a sweep that silently measured seed volume must never run
//   2. the INVERTED chrome contract (a PRECONDITION): the desktop sidebar
//      visible (getClientRects — the fixed-position offsetParent quirk) +
//      the hamburger hidden
//   3. the sidebar-own scroll contract (re-measured per accent)
//   4. the accent APPLIES through the real lifecycle (PATCHed + self-
//      verified on <html data-accent> + html.dark)
//   5. per view (the 7 volume-affected views — the S13 set): the sidebar
//      click navigates → clickLatencyMs (click → identity heading visible;
//      the S13 B2 budget) → the heading renders + headingOffset (the
//      lg:ml-[260px] clearance) → sidebarVisible (the vehicle persists) →
//      scrollWidth ≤ 1280 → the ACTIVE-LINK reading in DARK (activeLabel
//      === the view; activeTint a linear-gradient — never "none") → the
//      S38 DARK checker (flashbulbs — always findings; unreadable < 2.2
//      with the CTA-face exemption only; lowcontrast < 3.2 = WARN) → the
//      S13 measure (nodes/mainNodes/longTaskTotal — the B3 budget) → zero
//      console errors (the 429-RUM backpressure exact-text filter)
//   6. the sidebar record per accent (the aside-scoped checker on the
//      final navigated view) + linkCount === 20
//   7. the API stats once (theme-invariant): /api/tasks /api/notes
//      /api/events — the /api/tasks bytes ≤ 500 KB bound (the S13 B1)
//
// The S42 envelope shape (unit-pinned by tests/suite-verdict.test.ts):
//   { source: "accent-volume-sweep", mode: "dark",
//     viewport: {width: 1280, height: 800},
//     volume: {tasks: 300, notes: 200, events: 250},
//     chrome: {sidebarVisible, hamburgerVisible, sidebarNavScrollable},
//     api: {"/api/tasks": {ms, bytes, status}, ...},
//     accents: {accent → {applied, views: {label → {heading, scrollWidth,
//       sidebarVisible, headingOffset, flashbulbs, unreadable, lowcontrast,
//       consoleErrors, activeTint, activeLabel, nodes, mainNodes,
//       longTaskTotal, clickLatencyMs}}, sidebar: {linkCount, unreadable,
//       lowcontrast, activeView, activeTint, error?}}},
//     findings: [] } — EVERY view is recorded explicitly (the S38
//   retirement of omission-means-clean, applied to the volume axis from
//   birth), so the seam's ALL-ACCENTS + ALL-VIEWS + volume-exact guards
//   make every silently-skipped dimension a LOUD shape-error.
//
// Restores light + violet at the end AND deletes every marker row (the
// finally block — idempotent), with the failure-path restore in the catch.
// The S39-F flush-callback ending (the AP-85 lesson): the envelope
// measures ~100KB+ at volume — the exit code is computed FIRST, then the
// write carries the exit in its flush callback so it can never cut the
// pipe.
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3000";
const W = 1280;
const H = 800;
const VIEWPORT = { width: W, height: H };
const MAX_WIDTH = W;
const SIDEBAR_W = 260;
const MARKER = "STRESS-S42-";
const prisma = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });

const ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"];

// The 7 volume-affected views (the S13 data-volume audit's own set — the
// views that render task/note/event rows) with each view's identity
// heading. Dashboard's greeting is time-aware: a regex, never hardcoded.
const VIEWS = [
  { label: "Dashboard", heading: null },
  { label: "My Day", heading: "My Day" },
  { label: "Tasks", heading: "All Tasks" },
  { label: "Calendar", heading: "Calendar" },
  { label: "Events", heading: "Events & Reminders" },
  { label: "Notes", heading: "Notes" },
  { label: "Analytics", heading: "Analytics" },
];
const GREETING_RE = /good (morning|afternoon|evening)/i;

// The S13 volume budgets (this probe's own constants — mirrored at the
// seam): the B3 main-thread budget and the B2 interactivity budget.
const LONG_TASK_BUDGET_MS = 1500;
const CLICK_BUDGET_MS = 1500;

class PreconditionError extends Error {}
function fail(msg) {
  // Thrown, never a bare exit: the catch-path restore + the marker-row
  // cleanup run for EVERY failure (a leftover accent or 750 stress rows
  // must never poison the dev user's state).
  throw new PreconditionError(`ACCENT-VOLUME-SWEEP PRECONDITION FAILED: ${msg}`);
}

// The active-link reader — reads the SIDEBAR's active link DIRECTLY (the
// sidebar is always in the DOM at desktop): the label of the aside's
// aria-current=page link + the INNER span's inline backgroundImage (the
// 10%-alpha NAV_ACTIVE_GRADIENT_STOPS gradient — accent-driven; a "none"
// is the S8 no-var rot class). The FIRST dark-mode reading of the
// sidebar's active-link tint through the navigation lifecycle.
const ACTIVE_READER = `(() => {
  const aside = document.querySelector('aside');
  if (!aside) return JSON.stringify({ error: 'no sidebar' });
  const active = aside.querySelector('a[aria-current="page"]');
  if (!active) return JSON.stringify({ error: 'no active link' });
  const inner = active.querySelector('span');
  const style = inner ? getComputedStyle(inner) : null;
  return JSON.stringify({
    label: (active.textContent || '').trim(),
    tint: style ? style.backgroundImage.slice(0, 90) : null,
  });
})()`;

// The S38 DARK checker verbatim — flashbulbs (light surfaces on the dark
// canvas — ALWAYS findings) + unreadable (< 2.2) + lowcontrast (< 3.2)
// with the effective-background walk over main/aside/header/dialog.
const CHECKER = `(() => {
  const lum = (r, g, b) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const parse = (c) => {
    if (!c) return null;
    let m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(',').map(s => parseFloat(s));
    if (parts.length < 3 || parts.some(p => isNaN(p))) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const effectiveBg = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      const bg = parse(cs.backgroundColor);
      if (bg && bg.a > 0.85) return bg;
      node = node.parentElement;
    }
    const bodyBg = parse(getComputedStyle(document.body).backgroundColor);
    // S81/AH10 (audit-tools repair): the body fallback must fire on a
    // TRANSPARENT body too — parse() returns a truthy {0,0,0,a:0} for
    // rgba(0,0,0,0), so the bodyBg-or-fallback form NEVER fell back and every
    // glass-backed (alpha 0.8 < 0.85) text measured against phantom
    // BLACK — false unreadable detections across the LIGHT sweep family
    // (the dark family's own fallback is near-black, masking the bug).
    return bodyBg && bodyBg.a > 0.85 ? bodyBg : { r: 9, g: 9, b: 11, a: 1 };
  };
  const flashbulbs = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('main *, aside *, header *, [role=dialog] *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const bg = parse(cs.backgroundColor);
    if (!bg || bg.a <= 0.9) continue;
    const L = lum(bg.r, bg.g, bg.b);
    if (L <= 0.80) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 40 || rect.height < 20) continue;
    const cls = (el.className && el.className.toString) ? el.className.toString() : '';
    if (/sf-gradient|UserAvatar|avatar/.test(cls)) continue;
    const key = cls.slice(0, 60) + '|' + Math.round(rect.width) + 'x' + Math.round(rect.height);
    if (seen.has(key)) continue;
    seen.add(key);
    flashbulbs.push({ cls: cls.slice(0, 70), bg: cs.backgroundColor, tag: el.tagName, w: Math.round(rect.width), h: Math.round(rect.height), text: (el.textContent || '').trim().slice(0, 30) });
    if (flashbulbs.length >= 12) break;
  }
  const unreadable = [];
  const lowcontrast = [];
  for (const el of document.querySelectorAll('main *, aside *, header *, [role=dialog] *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') continue;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) continue;
    const bg = effectiveBg(el);
    const c = contrast(lum(fg.r, fg.g, fg.b), lum(bg.r, bg.g, bg.b));
    const cls = (el.className && el.className.toString) ? el.className.toString() : '';
    const entry = { text: (el.textContent || '').trim().slice(0, 26), color: cs.color, bgEff: 'rgb(' + bg.r + ',' + bg.g + ',' + bg.b + ')', contrast: +c.toFixed(2), cls: cls.slice(0, 66) };
    if (c < 2.2) { unreadable.push(entry); if (unreadable.length >= 10) continue; }
    else if (c < 3.2) { lowcontrast.push(entry); if (lowcontrast.length >= 14) continue; }
  }
  return JSON.stringify({ flashbulbs, unreadable, lowcontrast, scrollWidth: document.documentElement.scrollWidth });
})()`;

// The S13 measure — the DOM census + the 1.5s long-task observer window
// (the data-volume audit's own measurement family).
const MEASURE = `(async () => {
  const nodes = document.querySelectorAll('*').length;
  const mainNodes = document.querySelectorAll('main *').length;
  const longTasks = [];
  try {
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) longTasks.push(Math.round(e.duration));
    });
    po.observe({ entryTypes: ['longtask'] });
    await new Promise((r) => setTimeout(r, 1500));
    po.disconnect();
  } catch {}
  return JSON.stringify({ nodes, mainNodes, longTasks: longTasks.slice(0, 8), longTaskTotal: longTasks.reduce((a, b) => a + b, 0) });
})()`;

// The sidebar-scoped dark checker — the S38 detector family scoped to the
// desktop sidebar (the brand header, the nav links, the clock chip, the
// user footer must all read dark-clean in EVERY accent at volume) + the
// active-link reading on the final navigated view.
const SIDEBAR_CHECKER = `(() => {
  const aside = document.querySelector('aside');
  if (!aside) return JSON.stringify({ error: 'no sidebar' });
  const lum = (r, g, b) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const parse = (c) => {
    if (!c) return null;
    let m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(',').map(s => parseFloat(s));
    if (parts.length < 3 || parts.some(p => isNaN(p))) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const unreadable = [];
  const lowcontrast = [];
  for (const el of aside.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') continue;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) continue;
    let bgEff = { r: 9, g: 9, b: 11, a: 1 };
    let node = el;
    while (node && node !== document.documentElement) {
      const cs2 = getComputedStyle(node);
      const bg = parse(cs2.backgroundColor);
      if (bg && bg.a > 0.85) { bgEff = bg; break; }
      node = node.parentElement;
    }
    const c = contrast(lum(fg.r, fg.g, fg.b), lum(bgEff.r, bgEff.g, bgEff.b));
    const entry = { text: (el.textContent || '').trim().slice(0, 26), color: cs.color, contrast: +c.toFixed(2) };
    if (c < 2.2) { unreadable.push(entry); if (unreadable.length >= 12) continue; }
    else if (c < 3.2) { lowcontrast.push(entry); if (lowcontrast.length >= 14) continue; }
  }
  const active = aside.querySelector('a[aria-current="page"]');
  const activeInner = active ? active.querySelector('span') : null;
  const activeStyle = activeInner ? getComputedStyle(activeInner) : null;
  return JSON.stringify({
    linkCount: aside.querySelectorAll('nav a').length,
    unreadable, lowcontrast,
    activeView: active ? (active.textContent || '').trim() : null,
    activeTint: activeStyle ? activeStyle.backgroundImage.slice(0, 90) : null,
  });
})()`;

// ---------------------------------------------------------------------------
// The volume lifecycle — the S13 profile through Prisma, COUNT-verified.
// ---------------------------------------------------------------------------
async function insertVolume(user) {
  // Pre-clean (idempotent — a prior crashed run may have left rows).
  await prisma.task.deleteMany({ where: { title: { startsWith: MARKER } } });
  await prisma.note.deleteMany({ where: { title: { startsWith: MARKER } } });
  await prisma.event.deleteMany({ where: { title: { startsWith: MARKER } } });

  const today = new Date();
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

  // The COUNT verification — the volume self-verification precondition:
  // the sweep refuses to measure the wrong density.
  const counts = {
    tasks: await prisma.task.count({ where: { title: { startsWith: MARKER } } }),
    notes: await prisma.note.count({ where: { title: { startsWith: MARKER } } }),
    events: await prisma.event.count({ where: { title: { startsWith: MARKER } } }),
  };
  return counts;
}

async function cleanupVolume() {
  const del = await prisma.$transaction([
    prisma.task.deleteMany({ where: { title: { startsWith: MARKER } } }),
    prisma.note.deleteMany({ where: { title: { startsWith: MARKER } } }),
    prisma.event.deleteMany({ where: { title: { startsWith: MARKER } } }),
  ]);
  console.error(`[stress] cleaned ${del.map((d) => d.count).join("/")} marker rows`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });

const consoleLog = [];
let logCursor = 0;
// The RUM beacon's designed backpressure (S18/ADR-016): the 1000/15-min
// per-user budget, when exhausted by a heavy sweep session, surfaces as the
// BROWSER's network-layer console line. The exact-text signature filter
// keeps the genuine console-error class loud (the S33+ doctrine).
const RUM_BACKPRESSURE_RE = /Failed to load resource: the server responded with a status of 429 \(Too Many Requests\)/;
page.on("console", (msg) => {
  if (msg.type() !== "error") return;
  const text = msg.text().slice(0, 200);
  if (RUM_BACKPRESSURE_RE.test(text)) return; // the documented S18 class
  consoleLog.push(text);
});
page.on("pageerror", (err) => {
  consoleLog.push(`pageerror: ${String(err).slice(0, 180)}`);
});

try {
  // --- login (the demo account; one login — the rate-limiter convention) ---
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });

  // --- precondition: the viewport (BOTH axes) -------------------------------
  const inner = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  if (inner.w !== W || inner.h !== H) {
    fail(`the viewport applied as ${inner.w}×${inner.h}, expected ${W}×${H} — the sweep refuses to measure another device class.`);
  }

  // --- the volume lifecycle + the COUNT verification ------------------------
  const user = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!user) fail("the demo user is missing — run bun run db:seed first.");
  const volume = await insertVolume(user);
  if (volume.tasks !== 300 || volume.notes !== 200 || volume.events !== 250) {
    fail(`the volume verification read ${volume.tasks}/${volume.notes}/${volume.events} marker rows, expected 300/200/250 — the sweep refuses to measure the wrong density.`);
  }
  console.error(`[stress] volume verified: ${JSON.stringify(volume)}`);

  // --- the API stats (theme-invariant, measured once at volume) -------------
  const api = {};
  for (const path of ["/api/tasks", "/api/notes", "/api/events"]) {
    api[path] = await page.evaluate(async (path) => {
      const t0 = performance.now();
      const res = await fetch(path, { credentials: "same-origin" });
      const text = await res.text();
      return { ms: Math.round(performance.now() - t0), bytes: text.length, status: res.status };
    }, path);
  }
  console.error(`[stress] api stats: ${JSON.stringify(api)}`);

  // --- precondition: dark mode through the REAL lifecycle (S27) -------------
  const patch0 = await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "dark" } });
  if (!patch0.ok()) {
    fail(`the settings PATCH answered ${patch0.status()} — the sweep refuses to measure an unverified mode.`);
  }
  await page.goto(`${BASE}/Dashboard`);
  // NOTE (the S47 field correction — the AP-90 shell-presence race applied to
  // the INITIAL gate): `html.dark` alone is NOT a shell gate — the theme
  // lifecycle's applyToDocument can flip the dark class when /api/auth/me
  // resolves while React has not yet COMMITTED the shell DOM, so the chrome
  // read below can race the aside mount (observed ONCE in the S47 arrival
  // suite after the 17-min accent-dark stage had heated the server: the
  // sidebar read absent → the precondition fired; green standalone, zero
  // app bytes changed — the race, not a regression). The gate folds the
  // SHELL-PRESENCE condition in: the aside nav exists only after the auth
  // gate mounts the shell (the S43 per-accent-gate correction, applied to
  // this probe's initial gate — the same fix S43 back-ported to the
  // per-accent gates).
  await page.waitForFunction(
    () => document.documentElement.classList.contains("dark") && !!document.querySelector("aside nav"),
    undefined,
    { timeout: 30000 },
  );
  const mode = await page.evaluate(() => (document.documentElement.classList.contains("dark") ? "dark" : "light"));
  if (mode !== "dark") {
    fail(`the applied mode is ${mode}, expected dark — the sweep refuses to measure the wrong mode.`);
  }

  // --- precondition: the INVERTED chrome contract (the S41 model) -----------
  // NOTE: the sidebar is position:fixed — offsetParent reads null for fixed
  // elements even when rendered (the Chromium quirk), so the rendered check
  // is getClientRects().length > 0 (the S41 lesson).
  const chromeRec = await page.evaluate(() => ({
    sidebarVisible: (() => { const a = document.querySelector("aside"); return !!a && a.getClientRects().length > 0; })(),
    hamburgerVisible: (() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Open navigation menu"); return !!b && b.offsetParent !== null; })(),
  }));
  if (!chromeRec.sidebarVisible || chromeRec.hamburgerVisible) {
    fail(`the INVERTED chrome contract broke at 1280 — sidebarVisible=${chromeRec.sidebarVisible}, hamburgerVisible=${chromeRec.hamburgerVisible} (the lg contract: the sidebar is the desktop vehicle; the app bar is lg:hidden).`);
  }

  const findings = [];
  const accents = {};
  let navScrollableAll = true;

  for (const accent of ACCENTS) {
    // --- precondition: the accent through the REAL lifecycle (S27) ----------
    // NOTE (the S43 shell-presence lesson, back-ported): `data-accent ===
    // accent` alone is NOT a shell gate — the theme boot script applies the
    // CACHED accent pre-hydration, so the wait can pass at first paint while
    // the auth gate has not yet mounted the shell (the aside) — and the
    // immediate nav-geometry evaluate then reads `aside nav` as null. The
    // gate folds the SHELL-PRESENCE condition in (the aside nav exists only
    // after the shell mounts). Latent in this dark probe (never fired in
    // three suite runs) but the same race the S43 light probe crashed on.
    const patch = await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "dark", accentColor: accent } });
    if (!patch.ok()) {
      fail(`the settings PATCH answered ${patch.status()} for accent ${accent} — the sweep refuses to measure an unverified accent.`);
    }
    await page.goto(`${BASE}/Dashboard`);
    let applied = "";
    try {
      await page.waitForFunction(
        (a) =>
          document.documentElement.dataset.accent === a &&
          document.documentElement.classList.contains("dark") &&
          !!document.querySelector("aside nav"),
        accent,
        { timeout: 30000 },
      );
      applied = await page.evaluate(() => document.documentElement.dataset.accent);
    } catch {
      fail(`the accent ${accent} never applied through the real lifecycle (data-accent=${await page.evaluate(() => document.documentElement.dataset.accent)}) — the sweep refuses to measure the wrong accent.`);
    }
    if (applied !== accent) {
      fail(`the applied accent is ${applied}, expected ${accent} — the sweep refuses to measure the wrong accent.`);
    }

    const accentRec = { applied, views: {}, sidebar: null };
    accents[accent] = accentRec;

    // --- the sidebar-own scroll contract (re-measured per accent) -----------
    const navGeom = await page.evaluate(() => {
      const nav = document.querySelector("aside nav");
      return { scrollHeight: nav.scrollHeight, clientHeight: nav.clientHeight };
    });
    const navScrollable = navGeom.scrollHeight > navGeom.clientHeight;
    if (!navScrollable) {
      navScrollableAll = false;
      findings.push({ accent, kind: "nav-scroll", detail: `the sidebar nav is NOT scrollable at 800 height under accent ${accent} (scrollHeight ${navGeom.scrollHeight} vs clientHeight ${navGeom.clientHeight}) — links beyond the fold would be unreachable at desktop` });
    }

    // --- the 7-view sweep, navigated THROUGH THE SIDEBAR ---------------------
    // The click doubles as the interactivity measurement: clickLatencyMs is
    // the elapsed from the link click to the identity heading visible (the
    // S13 B2 budget, recalibrated for the click→heading form).
    for (const v of VIEWS) {
      const viewStart = logCursor;
      const nav = page.locator("aside nav");
      const t0 = Date.now();
      await nav.getByRole("link", { name: v.label, exact: true }).click();

      const rec = { heading: "", scrollWidth: 0, sidebarVisible: false, headingOffset: false, flashbulbs: [], unreadable: [], lowcontrast: [], consoleErrors: [], activeTint: "", activeLabel: "", nodes: 0, mainNodes: 0, longTaskTotal: 0, clickLatencyMs: 0 };
      accentRec.views[v.label] = rec;

      // The identity heading renders (the click→heading latency — the S13
      // B2 interactivity budget under volume).
      try {
        const heading = page.locator("main h1:visible").first();
        await heading.waitFor({ state: "visible", timeout: 15000 });
        rec.clickLatencyMs = Date.now() - t0;
        if (rec.clickLatencyMs > CLICK_BUDGET_MS) {
          findings.push({ accent, view: v.label, kind: "click-latency", detail: `the sidebar click → heading visible took ${rec.clickLatencyMs}ms (budget ${CLICK_BUDGET_MS}ms) — the S13 B2 interactivity class under volume` });
        }
        await page.waitForTimeout(1200); // data-fetch settle (the S41 band)
        rec.heading = (await heading.textContent())?.trim() ?? "";
        const headingOk = v.heading ? rec.heading === v.heading : GREETING_RE.test(rec.heading);
        if (!headingOk) {
          findings.push({ accent, view: v.label, kind: "no-heading", detail: `expected "${v.heading ?? "the greeting"}", rendered "${rec.heading.slice(0, 40)}"` });
        }

        // The desktop clearance (the lg:ml-[260px] contract).
        const left = await heading.evaluate((el) => el.getBoundingClientRect().left);
        rec.headingOffset = left >= SIDEBAR_W - 1; // 1px sub-pixel tolerance
        if (!rec.headingOffset) {
          findings.push({ accent, view: v.label, kind: "heading-offset", detail: `the identity heading's left is x=${Math.round(left)} < ${SIDEBAR_W} — under the fixed sidebar` });
        }
      } catch {
        rec.clickLatencyMs = Date.now() - t0;
        findings.push({ accent, view: v.label, kind: "no-heading", detail: "the identity heading never rendered" });
      }

      // The vehicle persists through navigation (the fixed-position quirk:
      // getClientRects, not offsetParent).
      rec.sidebarVisible = await page.evaluate(() => { const a = document.querySelector("aside"); return !!a && a.getClientRects().length > 0; });
      if (!rec.sidebarVisible) {
        findings.push({ accent, view: v.label, kind: "sidebar-vanished", detail: "the sidebar did not stay visible through the navigation — the desktop vehicle contract broke" });
      }

      // No horizontal overflow (a 300-row list must never widen the doc).
      rec.scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      if (rec.scrollWidth > MAX_WIDTH) {
        findings.push({ accent, view: v.label, kind: "overflow", detail: `scrollWidth ${rec.scrollWidth} > ${MAX_WIDTH}` });
      }

      // The active-link interaction evidence in DARK — the never-read cell.
      const activeRead = JSON.parse(await page.evaluate(ACTIVE_READER));
      if (activeRead.error) {
        findings.push({ accent, view: v.label, kind: "active-read", detail: `the active-link reader failed: ${activeRead.error}` });
      } else {
        rec.activeLabel = activeRead.label ?? "";
        rec.activeTint = activeRead.tint ?? "";
        if (activeRead.label !== v.label) {
          findings.push({ accent, view: v.label, kind: "active-label", detail: `the sidebar's active link was "${activeRead.label}" while "${v.label}" was the active view — the active state did not follow the navigation` });
        }
        if (!activeRead.tint || activeRead.tint === "none") {
          findings.push({ accent, view: v.label, kind: "active-tint", detail: `the active-link gradient computed to "${activeRead.tint}" — the S8 no-var rot class (the NAV_ACTIVE_GRADIENT_STOPS pair did not resolve)` });
        }
      }

      // The S38 DARK detector family (flashbulbs/unreadable/lowcontrast).
      const dark = JSON.parse(await page.evaluate(CHECKER));
      rec.flashbulbs = dark.flashbulbs;
      rec.unreadable = dark.unreadable;
      rec.lowcontrast = dark.lowcontrast;
      if (dark.scrollWidth > MAX_WIDTH && rec.scrollWidth <= MAX_WIDTH) {
        rec.scrollWidth = dark.scrollWidth;
        findings.push({ accent, view: v.label, kind: "overflow", detail: `scrollWidth ${dark.scrollWidth} > ${MAX_WIDTH} (the checker's own reading)` });
      }

      // The S13 measure (the DOM census + the long-task window).
      const measure = JSON.parse(await page.evaluate(MEASURE));
      rec.nodes = measure.nodes;
      rec.mainNodes = measure.mainNodes;
      rec.longTaskTotal = measure.longTaskTotal;
      if (measure.longTaskTotal > LONG_TASK_BUDGET_MS) {
        findings.push({ accent, view: v.label, kind: "long-task", detail: `long tasks during render total ${measure.longTaskTotal}ms (budget ${LONG_TASK_BUDGET_MS}ms) — the S13 B3 main-thread class under volume` });
      }

      // Console errors surfaced during THIS view's navigation + settle.
      rec.consoleErrors = consoleLog.slice(viewStart);
      logCursor = consoleLog.length;
      if (rec.consoleErrors.length > 0) {
        findings.push({ accent, view: v.label, kind: "console-error", detail: `${rec.consoleErrors.length} console error(s): ${rec.consoleErrors.slice(0, 2).join(" | ").slice(0, 160)}` });
      }
    }

    // --- the sidebar record per accent (on the FINAL navigated view) ---------
    try {
      await page.waitForTimeout(300); // the final view's settle band
      const sidebarRec = JSON.parse(await page.evaluate(SIDEBAR_CHECKER));
      if (sidebarRec.error) {
        findings.push({ accent, kind: "sidebar-missing", detail: sidebarRec.error });
        accentRec.sidebar = { linkCount: 0, unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: sidebarRec.error };
      } else {
        accentRec.sidebar = sidebarRec;
        if (sidebarRec.linkCount !== 20) {
          findings.push({ accent, kind: "link-count", detail: `sidebar carried ${sidebarRec.linkCount} links (expected 20)` });
        }
        if (sidebarRec.activeView !== VIEWS[VIEWS.length - 1].label) {
          findings.push({ accent, kind: "active-label", detail: `the sidebar record's active link was "${sidebarRec.activeView}" while "${VIEWS[VIEWS.length - 1].label}" was the final navigated view` });
        }
        if (!sidebarRec.activeTint || sidebarRec.activeTint === "none") {
          findings.push({ accent, kind: "active-tint", detail: `the sidebar record's active-link gradient computed to "${sidebarRec.activeTint}" — the S8 no-var rot class` });
        }
      }
    } catch (e) {
      findings.push({ accent, kind: "sidebar-error", detail: String(e).slice(0, 140) });
      accentRec.sidebar = accentRec.sidebar ?? { linkCount: 0, unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: String(e).slice(0, 140) };
    }
    console.error(`accent ${accent} (${applied}) done — findings so far: ${findings.length}`);
  }

  // --- the closing restore (explicit + awaited + verified) -------------------
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(
    () => document.documentElement.dataset.accent === "violet" && !document.documentElement.classList.contains("dark"),
    undefined,
    { timeout: 30000 },
  );

  // --- the cleanup BEFORE the exit-carrying write (the finally-race fix: ---
  // the flush callback carries the exit, so every cleanup must complete
  // BEFORE the write — a finally block would race the callback).
  await browser.close();
  await cleanupVolume();
  await prisma.$disconnect();

  const envelope = {
    source: "accent-volume-sweep",
    mode,
    viewport: VIEWPORT,
    volume,
    chrome: { ...chromeRec, sidebarNavScrollable: navScrollableAll },
    api,
    accents,
    findings,
  };
  // exit 0 iff the structural findings are empty AND every non-exempt
  // contrast detection is zero AND zero flashbulbs. The DOCUMENTED non-gap
  // signature (mirrored at the seam — suite-verdict's
  // classifyAccentVolumeSweep): the CTA-face (white on accent-500 — the S11
  // family-2 non-gap). The LIGHT-mode exemptions (calendar adjacent-day
  // slate-300 + yellow priority-pill yellow-500) do NOT apply in dark —
  // those surfaces re-theme, so any unreadable hit is genuine.
  const isCtaFace = (e) => e && e.color === "rgb(255, 255, 255)";
  let detections = 0;
  let flashbulbCount = 0;
  for (const a of ACCENTS) {
    const rec = accents[a];
    for (const v of Object.keys(rec.views)) {
      flashbulbCount += rec.views[v].flashbulbs.length;
      for (const e of rec.views[v].unreadable) {
        if (isCtaFace(e)) continue;
        detections += 1;
      }
    }
    if (rec.sidebar) {
      for (const e of rec.sidebar.unreadable ?? []) {
        if (isCtaFace(e)) continue;
        detections += 1;
      }
    }
  }
  const exitCode = findings.length === 0 && detections === 0 && flashbulbCount === 0 ? 0 : 1;
  // S39-F (the stdout-flush race, AP-85): this envelope measures ~100KB+ at
  // volume — a bare process.exit() after console.log can truncate the
  // ASYNC pipe write mid-flush. The trailing-write callback fires only
  // after every prior byte has flushed to the pipe, so the exit can never
  // cut the envelope.
  process.stdout.write(JSON.stringify(envelope, null, 1) + "\n", () => process.exit(exitCode));
} catch (e) {
  // The failure path: the theme restore + the browser close + the marker-
  // row cleanup ALL run for every failure class (a PreconditionError, a
  // crash mid-sweep, a timeout) — an aborted run must never leave the dev
  // user in dark × a random accent, nor 750 stress rows in the DB.
  try {
    await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } }).catch(() => {});
  } catch {}
  await browser.close().catch(() => {});
  await cleanupVolume().catch((ce) => console.error(`[stress] cleanup failed: ${String(ce).slice(0, 140)}`));
  await prisma.$disconnect().catch(() => {});
  console.error(e instanceof PreconditionError ? e.message : `ACCENT-VOLUME-SWEEP ABORTED: ${String(e).slice(0, 300)}`);
  process.exit(1);
}

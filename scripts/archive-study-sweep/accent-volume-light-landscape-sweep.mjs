// S49 light × landscape × volume stress — the S13 volume profile (300 tasks /
// 200 notes / 250 events) swept through the theme space's light half at the
// LANDSCAPE viewport (844×390, the iPhone-class landscape — the 390–430px-tall
// band's canonical width, the LAST viewport band), navigated through the
// DRAWER (the only vehicle below 1024), as a standing, executable guarantee
// (the S48 summary's own named next candidate — the S49 mirror, completing
// the volume × theme × viewport cross-axis's last band: the
// S42→S43 / S44→S45 / S46→S47 / S48→S49 family pattern).
//
// Run with NODE (the accent-volume-sweep precedent — imports no TS seam;
// the standing-suite runner classifies the envelope through suite-verdict):
//
//   node scripts/accent-volume-light-landscape-sweep.mjs
//
// The coverage gap this closes, verified against the standing scripts:
//   - data-volume-audit (S13): the 300/200/250 profile, the payload/long-
//     task/click-latency budgets — 1280×800, LIGHT + VIOLET only (zero
//     theme references), once
//   - landscape-sweep (S35) + accent-landscape-sweep (S40): the landscape
//     viewport family at 844×390 — SEED volume (no STRESS markers, no
//     countMany, no prisma inserts — verified by grep) AND LIGHT only
//     (S35 violet; S40's every PATCH carries themeMode: "light" — the
//     volume axis is the blind spot)
//   - accent-volume-sweep (S42) + accent-volume-light-sweep (S43): 7
//     accents × the 7 volume views — 1280×800 only (their VIEWPORT
//     constants grep-verified at W=1280/H=800)
//   - accent-volume-dark-mobile-sweep (S44) + accent-volume-light-mobile-
//     sweep (S45): the mobile halves — 390×844 only (W=390)
//   - accent-volume-dark-midband-sweep (S46) + accent-volume-light-midband-
//     sweep (S47): the mid-band halves — 768×1024 only (W=768)
//   - accent-volume-dark-landscape-sweep (S48): the landscape half — 844×390
//     DARK only (its mode precondition requires dark; its own seam's
//     rot-guard comment names this light family as "the documented S49
//     mirror")
//   So: the cross-axis cell (300+ rows × light × accent × 844×390) is
//   ZERO-coverage at every accent, AND the DRAWER's active-link tint has
//   never been read through the real navigation lifecycle in LIGHT at
//   LANDSCAPE at VOLUME (S35 proved landscape light+violet at seed; S40
//   accent × landscape at seed light; S43 light × volume at desktop; S45
//   light × volume at mobile; S47 light × volume at mid-band; S48 dark ×
//   volume at landscape).
//
// What it asserts, per accent (7), at 844×390 in LIGHT mode under the
// verified 300/200/250 profile, navigated THROUGH THE DRAWER (the landscape
// vehicle — the drawer-link click doubles as the interactivity measurement):
//   1. the VOLUME self-verification (a PRECONDITION): the marker rows are
//      inserted through Prisma and COUNT-verified (300/200/250 exactly) —
//      a sweep that silently measured seed volume must never run
//   2. the LANDSCAPE chrome contract (a PRECONDITION): the desktop sidebar
//      hidden (the sidebar is hidden lg:flex — below 1024 the drawer is
//      the only vehicle) + the hamburger visible (the vehicle's handle)
//   3. the drawer-own nav-scroll contract (re-measured per accent at the
//      first drawer open): at 390 height the 20 nav rows (scrollHeight
//      ~1068) cannot fit the ~301px nav area (the 390 viewport minus the
//      ~89px brand header) — the nav MUST be scrollable; links ~8–20 sit
//      below the fold (the S35/S40/S48 landscape geometry, re-verified
//      empirically this session BEFORE the pins were finalized)
//   4. the accent APPLIES through the real lifecycle (PATCHed + self-
//      verified on <html data-accent> + !html.dark, with the shell-presence
//      guard folded into the wait — the AP-90 lesson applied to the
//      landscape vehicle from birth: the header (the app bar) exists only
//      after the auth gate mounts the shell; the S43/S45/S47 light lesson:
//      !html.dark is TRUE at first paint, so the shell-presence condition
//      is what makes the gate post-mount)
//   5. per view (the 7 volume-affected views — the S13 set): the drawer
//      opens (reading the PREVIOUS view's active link — the pendingView
//      pattern: while view N is active, the drawer's active link MUST be
//      view N's link, its inner span a linear-gradient) → the link click
//      navigates → clickLatencyMs (click → identity heading visible; the
//      S13 B2 budget over the drawer-close + view-mount path) → the drawer
//      CLOSES on navigation → the heading renders (h1 OR h2 — the two-pane
//      mobile stacks render an h2 below lg, the S8-H pattern) + headingClearance
//      (the heading's box top ≥ the fixed 64px bar — at its tightest here,
//      the bar covers 16% of the 390px viewport) + the app bar (brand +
//      the 2-digit-hour clock — lg:hidden, identical at 844) → scrollWidth
//      ≤ 844 → the LIGHT checker (unreadable < 2.2 with the THREE
//      signature-strict light exemptions — the CTA-face + the calendar
//      adjacent-day + the yellow priority-pill, the reference's own design
//      in light; lowcontrast < 3.2 = WARN; NO flashbulbs — the class exists
//      only in dark, a light surface on the light canvas is by-design) →
//      the S13 measure (nodes/mainNodes/longTaskTotal — the B3 budget) →
//      zero console errors (the 429-RUM backpressure exact-text filter)
//   6. the drawer record per accent (the drawer-scoped LIGHT checker on the
//      final navigated view — the open drawer's own rendering: the light
//      panel, the nav links, the active-link tint) + linkCount === 20
//   7. the API stats once (theme-invariant): /api/tasks /api/notes
//      /api/events — the /api/tasks bytes ≤ 500 KB bound (the S13 B1)
//
// The S49 envelope shape (unit-pinned by tests/suite-verdict.test.ts):
//   { source: "accent-volume-light-landscape-sweep", mode: "light",
//     viewport: {width: 844, height: 390},
//     volume: {tasks: 300, notes: 200, events: 250},
//     chrome: {sidebarVisible, hamburgerVisible, drawerNavScrollable},
//     api: {"/api/tasks": {ms, bytes, status}, ...},
//     accents: {accent → {applied, views: {label → {heading, scrollWidth,
//       drawerClosed, appBar, headingClearance, unreadable,
//       lowcontrast, consoleErrors, activeTint, activeLabel, nodes,
//       mainNodes, longTaskTotal, clickLatencyMs}}, drawer: {linkCount,
//       unreadable, lowcontrast, activeView, activeTint,
//       error?}}},
//     findings: [] } — EVERY view is recorded explicitly (the S38
//   retirement of omission-means-clean, applied to the volume axis from
//   birth), so the seam's ALL-ACCENTS + ALL-VIEWS + volume-exact guards
//   make every silently-skipped dimension a LOUD shape-error.
//
// Restores light + violet at the end AND deletes every marker row (the
// pre-exit cleanup — idempotent), with the failure-path restore in the
// catch. The S39-F flush-callback ending (the AP-85 lesson) with the S42
// finally-race fix: the cleanup + browser close + Prisma disconnect ALL
// complete BEFORE the exit-carrying write.
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3000";
const W = 844;
const H = 390;
const VIEWPORT = { width: W, height: H };
const MAX_WIDTH = W;
const APP_BAR = 64; // h-16 — the fixed glass bar (16% of a 390px viewport, the S40 constant)
const MARKER = "STRESS-S49-";
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
  throw new PreconditionError(`ACCENT-VOLUME-LIGHT-LANDSCAPE-SWEEP PRECONDITION FAILED: ${msg}`);
}

// The active-link reader — runs inside the OPEN drawer (the S40 pattern):
// the label of the dialog's aria-current=page link + the INNER span's
// inline backgroundImage (the 10%-alpha NAV_ACTIVE_GRADIENT_STOPS gradient
// — accent-driven; a "none" is the S8 no-var rot class). The light ×
// landscape × volume interaction cell: S35 proved landscape light+violet
// at seed, S40 accent × landscape at seed light, S43 light × volume at
// desktop, S45 light × volume at mobile, S47 light × volume at mid-band —
// this is the first per-view light reading at the landscape at volume.
const ACTIVE_READER = `(() => {
  const dlg = document.querySelector('[role=dialog]');
  if (!dlg) return JSON.stringify({ error: 'no dialog' });
  const active = dlg.querySelector('a[aria-current="page"]');
  if (!active) return JSON.stringify({ error: 'no active link' });
  const inner = active.querySelector('span');
  const style = inner ? getComputedStyle(inner) : null;
  return JSON.stringify({
    label: (active.textContent || '').trim(),
    tint: style ? style.backgroundImage.slice(0, 90) : null,
  });
})()`;

// The LIGHT checker (the S43/S45/S47 light detector family, verbatim):
// unreadable (< 2.2) + lowcontrast (< 3.2) with the effective-background
// walk over main/aside/header/dialog — NO flashbulbs (the flashbulb class,
// a light surface on the dark canvas, exists only in dark; in light mode
// light surfaces are by-design). The display:none guard handles the hidden
// desktop sidebar (hidden lg:flex at 844) and the closed drawer.
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
    return bodyBg && bodyBg.a > 0.85 ? bodyBg : { r: 248, g: 250, b: 252, a: 1 };
  };
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
  return JSON.stringify({ unreadable, lowcontrast, scrollWidth: document.documentElement.scrollWidth });
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

// The drawer-scoped LIGHT checker — the S43/S45/S47 light detector family
// scoped to the OPEN drawer (the drawer's brand header, nav links, and
// close button must all read light-clean in EVERY accent at volume — the
// light panel) + the active-link reading on the final navigated view (the
// active link may sit below the fold at 390 height — links ~8–20 —
// but it stays in the DOM with computed styles, so the read is
// scroll-independent — the S40 note). NO flashbulbs — the class exists
// only in dark.
const DRAWER_CHECKER = `(() => {
  const dlg = document.querySelector('[role=dialog]');
  if (!dlg) return JSON.stringify({ error: 'no dialog' });
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
  for (const el of dlg.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') continue;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) continue;
    let bgEff = { r: 248, g: 250, b: 252, a: 1 };
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
  const active = dlg.querySelector('a[aria-current="page"]');
  const activeInner = active ? active.querySelector('span') : null;
  const activeStyle = activeInner ? getComputedStyle(activeInner) : null;
  return JSON.stringify({
    linkCount: dlg.querySelectorAll('a').length,
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

  // --- precondition: the viewport (BOTH axes — the landscape is the TRANSPOSED pair) ---
  const inner = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  if (inner.w !== W || inner.h !== H) {
    fail(`the viewport applied as ${inner.w}×${inner.h}, expected ${W}×${H} — the sweep refuses to measure another device class (the landscape is the transposed 844×390, BOTH axes).`);
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

  // --- precondition: LIGHT mode through the REAL lifecycle (S27) -------------
  // The S43/S45/S47 lesson: in LIGHT mode `!html.dark` is TRUE at first
  // paint — BEFORE hydration + the auth gate resolve the shell, so the
  // chrome contract check races. The light-mode hydration gate is a
  // POST-HYDRATION observable: the greeting heading (`main h1` only
  // renders after the auth gate resolves and the shell mounts).
  const patch0 = await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });
  if (!patch0.ok()) {
    fail(`the settings PATCH answered ${patch0.status()} — the sweep refuses to measure an unverified mode.`);
  }
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(() => /good (morning|afternoon|evening)/i.test(document.querySelector("main h1")?.textContent ?? ""), undefined, { timeout: 30000 });
  const mode = await page.evaluate(() => (document.documentElement.classList.contains("dark") ? "dark" : "light"));
  if (mode !== "light") {
    fail(`the applied mode is ${mode}, expected light — the sweep refuses to measure the wrong mode.`);
  }

  // --- precondition: the LANDSCAPE chrome contract (the S35/S40/S48 model) --
  // The desktop sidebar must be hidden (hidden lg:flex = below 1024) and
  // the hamburger visible — the drawer is the navigation vehicle at 844.
  // A broken lg contract means the sweep cannot run.
  const chromeRec = await page.evaluate(() => ({
    sidebarVisible: (() => { const a = document.querySelector("aside"); return !!a && a.getClientRects().length > 0; })(),
    hamburgerVisible: (() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Open navigation menu"); return !!b && b.offsetParent !== null; })(),
  }));
  if (chromeRec.sidebarVisible || !chromeRec.hamburgerVisible) {
    fail(`the LANDSCAPE chrome contract broke at 844 — sidebarVisible=${chromeRec.sidebarVisible}, hamburgerVisible=${chromeRec.hamburgerVisible} (the lg contract: the sidebar renders only ≥1024; below that the drawer is the vehicle).`);
  }

  const findings = [];
  const accents = {};
  const dialog = page.getByRole("dialog");
  let navScrollableAll = true; // the aggregate drawer-own scroll contract

  for (const accent of ACCENTS) {
    // --- precondition: the accent through the REAL lifecycle (S27) ----------
    // NOTE (the shell-presence lesson, AP-90, applied to the landscape
    // vehicle from birth): `data-accent === accent && !html.dark` alone is
    // NOT a shell gate — the theme boot script applies the CACHED accent +
    // mode to <html> pre-hydration (and !html.dark is TRUE at first paint
    // in the dev-default light cache), so the wait can pass at first paint
    // while the auth gate has not yet mounted the shell. The gate folds
    // the SHELL-PRESENCE condition in: the header (the below-lg app bar)
    // exists only after the auth gate resolves and the shell mounts.
    const patch = await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: accent } });
    if (!patch.ok()) {
      fail(`the settings PATCH answered ${patch.status()} for accent ${accent} — the sweep refuses to measure an unverified accent.`);
    }
    await page.goto(`${BASE}/Dashboard`);
    let applied = "";
    try {
      await page.waitForFunction(
        (a) =>
          document.documentElement.dataset.accent === a &&
          !document.documentElement.classList.contains("dark") &&
          !!document.querySelector("header"),
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

    const accentRec = { applied, views: {}, drawer: null };
    accents[accent] = accentRec;

    // --- the drawer-own nav-scroll contract (re-measured per accent at the
    // first drawer open — the S35/S40/S48 pattern carried to volume in
    // light): at 390 height the 20 nav rows measure scrollHeight ~1068
    // vs the ~301px nav area (the 390 viewport minus the ~89px brand
    // header) — the nav MUST be scrollable. If it fits, the link geometry
    // changed (a parity-relevant regression); if the nav cannot scroll,
    // links ~8–20 are unreachable in landscape.
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    const navGeom = await dialog.locator("nav").evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    const navScrollable = navGeom.scrollHeight > navGeom.clientHeight;
    if (!navScrollable) {
      navScrollableAll = false;
      findings.push({ accent, kind: "nav-scroll", detail: `the drawer nav is NOT scrollable at 390 height under accent ${accent} (scrollHeight ${navGeom.scrollHeight} vs clientHeight ${navGeom.clientHeight}) — links ~8–20 would be unreachable in landscape` });
    }
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden", timeout: 10000 });

    // The active-tint interaction readings: each drawer open reads the
    // active link while the PREVIOUS view is still active. views[v] carries
    // the reading taken while v was the active view: the loop open for view
    // N+1 reads view N's record; the FIRST view (Dashboard, the goto
    // landing) is read at the first open; the LAST view (Analytics) is read
    // at the dedicated drawer-record open after the loop (the S40
    // pendingView pattern).
    let pendingView = null; // the view whose record still needs its tint

    // --- the 7-view sweep, navigated THROUGH THE DRAWER (the S35/S40 vehicle)
    for (const v of VIEWS) {
      const viewStart = logCursor;
      await page.getByRole("button", { name: "Open navigation menu" }).click();
      await dialog.waitFor({ state: "visible", timeout: 10000 });
      await page.waitForTimeout(300); // the panel slide settles; the span's inline style is static

      // The interaction evidence: the active link in the OPEN drawer must
      // be the previously-active view (pendingView; Dashboard for the first
      // open after the goto landing).
      const activeRead = JSON.parse(await page.evaluate(ACTIVE_READER));
      if (activeRead.error) {
        findings.push({ accent, view: v.label, kind: "active-read", detail: `the active-link reader failed: ${activeRead.error}` });
      } else if (pendingView) {
        const rec = accentRec.views[pendingView.label];
        if (rec) {
          rec.activeLabel = activeRead.label;
          rec.activeTint = activeRead.tint ?? "";
          if (activeRead.label !== pendingView.label) {
            findings.push({ accent, view: pendingView.label, kind: "active-label", detail: `the drawer's active link was "${activeRead.label}" while "${pendingView.label}" was the active view — the active state did not follow the navigation` });
          }
          if (!activeRead.tint || activeRead.tint === "none") {
            findings.push({ accent, view: pendingView.label, kind: "active-tint", detail: `the active-link gradient computed to "${activeRead.tint}" — the S8 no-var rot class (the NAV_ACTIVE_GRADIENT_STOPS pair did not resolve)` });
          }
        }
      }

      // The drawer-link click — doubles as the B2 measurement (the
      // drawer-close + view-mount + heading-render path).
      const t0 = Date.now();
      await dialog.getByRole("link", { name: v.label, exact: true }).click();

      const rec = { heading: "", scrollWidth: 0, drawerClosed: false, appBar: false, headingClearance: false, unreadable: [], lowcontrast: [], consoleErrors: [], activeTint: "", activeLabel: "", nodes: 0, mainNodes: 0, longTaskTotal: 0, clickLatencyMs: 0 };
      accentRec.views[v.label] = rec;
      pendingView = v;

      // The drawer closes on navigation (the observable end state — S8/S16).
      try {
        await dialog.waitFor({ state: "hidden", timeout: 10000 });
        rec.drawerClosed = true;
      } catch {
        findings.push({ accent, view: v.label, kind: "drawer-stuck", detail: "the drawer dialog did not close after link navigation" });
      }

      // The identity heading renders (Dashboard = the time-aware greeting).
      // h1 OR h2 — the two-pane views' stacks render an h2 below lg
      // (the S8-H pattern); the copy sweep gates on the same union.
      try {
        const heading = page.locator("main h1:visible, main h2:visible").first();
        await heading.waitFor({ state: "visible", timeout: 15000 });
        rec.clickLatencyMs = Date.now() - t0;
        if (rec.clickLatencyMs > CLICK_BUDGET_MS) {
          findings.push({ accent, view: v.label, kind: "click-latency", detail: `the drawer click → heading visible took ${rec.clickLatencyMs}ms (budget ${CLICK_BUDGET_MS}ms) — the S13 B2 interactivity class under volume` });
        }
        await page.waitForTimeout(1200); // data-fetch settle (the S40 band)
        rec.heading = (await heading.textContent())?.trim() ?? "";
        const headingOk = v.heading ? rec.heading === v.heading : GREETING_RE.test(rec.heading);
        if (!headingOk) {
          findings.push({ accent, view: v.label, kind: "no-heading", detail: `expected "${v.heading ?? "the greeting"}", rendered "${rec.heading.slice(0, 40)}"` });
        }

        // The fixed-bar clearance: the heading's box top must sit
        // at/below the fixed app bar (64px — the S35/S40/S48 contract; the
        // below-lg chrome is identical at 844, the bar 16% of the short
        // viewport — the tightest clearance in the whole matrix).
        const top = await heading.evaluate((el) => el.getBoundingClientRect().top);
        rec.headingClearance = top >= APP_BAR - 1; // 1px sub-pixel tolerance
        if (!rec.headingClearance) {
          findings.push({ accent, view: v.label, kind: "heading-clearance", detail: `the identity heading's top is y=${Math.round(top)} < ${APP_BAR} — under the fixed app bar` });
        }
      } catch {
        rec.clickLatencyMs = Date.now() - t0;
        findings.push({ accent, view: v.label, kind: "no-heading", detail: "the identity heading never rendered" });
      }

      // No horizontal overflow — the S16 class at the landscape width (a
      // 300-row list must never widen the 844px document).
      rec.scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      if (rec.scrollWidth > MAX_WIDTH) {
        findings.push({ accent, view: v.label, kind: "overflow", detail: `scrollWidth ${rec.scrollWidth} > ${MAX_WIDTH}` });
      }

      // The fixed glass app bar: brand + the 2-digit-hour clock (lg:hidden —
      // visible at the landscape, identical to mobile).
      try {
        const bar = page.getByRole("banner");
        rec.appBar = await bar.isVisible();
        if (rec.appBar) {
          await bar.getByText("StudyFlow", { exact: true }).waitFor({ state: "visible", timeout: 4000 });
          const clock = await bar.textContent();
          rec.appBar = /\d{2}:\d{2} (AM|PM)/.test(clock ?? "");
        }
      } catch {
        rec.appBar = false;
      }
      if (!rec.appBar) {
        findings.push({ accent, view: v.label, kind: "app-bar", detail: "the fixed glass app bar (brand + 2-digit-hour clock) did not render" });
      }

      // The LIGHT detector family (unreadable + lowcontrast — the
      // S43/S45/S47 checker verbatim; the THREE light exemptions apply at
      // the exit-code computation below; NO flashbulbs in light).
      const light = JSON.parse(await page.evaluate(CHECKER));
      rec.unreadable = light.unreadable;
      rec.lowcontrast = light.lowcontrast;
      if (light.scrollWidth > MAX_WIDTH && rec.scrollWidth <= MAX_WIDTH) {
        rec.scrollWidth = light.scrollWidth;
        findings.push({ accent, view: v.label, kind: "overflow", detail: `scrollWidth ${light.scrollWidth} > ${MAX_WIDTH} (the checker's own reading)` });
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

    // --- the drawer record per accent (on the FINAL navigated view) ---------
    try {
      await page.getByRole("button", { name: "Open navigation menu" }).click();
      await dialog.waitFor({ state: "visible", timeout: 10000 });
      await page.waitForTimeout(700);
      const drawerRec = JSON.parse(await page.evaluate(DRAWER_CHECKER));
      if (drawerRec.error) {
        findings.push({ accent, kind: "drawer-missing", detail: drawerRec.error });
        accentRec.drawer = { linkCount: 0, unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: drawerRec.error };
      } else {
        accentRec.drawer = drawerRec;
        if (drawerRec.linkCount !== 20) {
          findings.push({ accent, kind: "link-count", detail: `drawer carried ${drawerRec.linkCount} links (expected 20)` });
        }
        // The LAST view's interaction record (Analytics): the drawer's
        // active link must be the final navigated view, its tint the
        // accent gradient.
        const lastView = VIEWS[VIEWS.length - 1];
        const lastRec = accentRec.views[lastView.label];
        if (lastRec) {
          lastRec.activeLabel = drawerRec.activeView ?? "";
          lastRec.activeTint = drawerRec.activeTint ?? "";
          if (drawerRec.activeView !== lastView.label) {
            findings.push({ accent, view: lastView.label, kind: "active-label", detail: `the drawer's active link was "${drawerRec.activeView}" while "${lastView.label}" was the active view — the active state did not follow the navigation` });
          }
          if (!drawerRec.activeTint || drawerRec.activeTint === "none") {
            findings.push({ accent, view: lastView.label, kind: "active-tint", detail: `the active-link gradient computed to "${drawerRec.activeTint}" — the S8 no-var rot class` });
          }
        }
      }
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden", timeout: 10000 });
    } catch (e) {
      findings.push({ accent, kind: "drawer-error", detail: String(e).slice(0, 140) });
      accentRec.drawer = accentRec.drawer ?? { linkCount: 0, unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: String(e).slice(0, 140) };
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
    source: "accent-volume-light-landscape-sweep",
    mode,
    viewport: VIEWPORT,
    volume,
    chrome: { ...chromeRec, drawerNavScrollable: navScrollableAll },
    api,
    accents,
    findings,
  };
  // exit 0 iff the structural findings are empty AND every non-exempt
  // contrast detection is zero. The DOCUMENTED non-gap signatures (mirrored
  // at the seam — suite-verdict's classifyAccentVolumeLightLandscapeSweep):
  // the THREE light exemptions (the reference's own design in light) — the
  // CTA-face (white on accent-500 — the S11 family-2 non-gap), the calendar
  // adjacent-month day numbers (slate-300, 1–2-digit text), and the yellow
  // priority-pill (yellow-500, high/medium/low). NO flashbulb term — the
  // class exists only in dark.
  const isCtaFace = (e) => e && e.color === "rgb(255, 255, 255)";
  const isCalendarAdjacentDay = (e) => e && e.color === "rgb(203, 213, 225)" && /^\d{1,2}$/.test(String(e.text || "").trim());
  const isYellowPriorityPill = (e) => e && e.color === "rgb(234, 179, 8)" && /^(high|medium|low)$/i.test(String(e.text || "").trim());
  let detections = 0;
  for (const a of ACCENTS) {
    const rec = accents[a];
    for (const v of Object.keys(rec.views)) {
      for (const e of rec.views[v].unreadable) {
        if (isCtaFace(e)) continue;
        if (isCalendarAdjacentDay(e)) continue;
        if (isYellowPriorityPill(e)) continue;
        detections += 1;
      }
    }
    if (rec.drawer) {
      for (const e of rec.drawer.unreadable ?? []) {
        if (isCtaFace(e)) continue;
        if (isCalendarAdjacentDay(e)) continue;
        if (isYellowPriorityPill(e)) continue;
        detections += 1;
      }
    }
  }
  const exitCode = findings.length === 0 && detections === 0 ? 0 : 1;
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
  // user in a random accent, nor 750 stress rows in the DB.
  try {
    await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } }).catch(() => {});
  } catch {}
  await browser.close().catch(() => {});
  await cleanupVolume().catch((ce) => console.error(`[stress] cleanup failed: ${String(ce).slice(0, 140)}`));
  await prisma.$disconnect().catch(() => {});
  console.error(e instanceof PreconditionError ? e.message : `ACCENT-VOLUME-LIGHT-LANDSCAPE-SWEEP ABORTED: ${String(e).slice(0, 300)}`);
  process.exit(1);
}

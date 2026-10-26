// S50 dark × landscape × SEED sweep for the 13 volume-invariant views — the
// S46 plan's carried note + the S49 plan's own non-gap entry, closed as the
// standing next candidate (the S48/S49 volume closes carried the landscape
// band; this sweep closes its dark half at SEED volume for the views the
// volume sweeps never navigated).
//
// Run with NODE (the accent-landscape-sweep precedent — imports no TS seam;
// the standing-suite runner classifies the envelope through suite-verdict):
//
//   node scripts/accent-dark-landscape-seed-sweep.mjs
//
// The coverage gap this closes, verified against the standing scripts:
//   - landscape-sweep (S35): 20 views at 844×390 through the drawer —
//     LIGHT + violet ONLY (zero accentColor references)
//   - accent-landscape-sweep (S40): 7 accents × 20 views at 844×390 through
//     the drawer — LIGHT only (its every PATCH carries themeMode "light";
//     the mode axis is its blind spot)
//   - dark-mobile-sweep (S36): dark × 390×844 only (the MOBILE portrait)
//   - accent-dark-sweep (S38): 7 accents × 20 views in dark at 1280×800 +
//     390×844 ONLY — the 844×390 width is in NEITHER surface
//   - accent-volume-dark-landscape-sweep (S48): dark × 844×390 × 7 accents
//     — the 7 volume-affected views ONLY (Dashboard, My Day, Tasks,
//     Calendar, Events, Notes, Analytics) under the 300/200/250 profile
//   - accent-volume-light-landscape-sweep (S49): the light mirror — the
//     same 7-view volume set
// So: the 13 volume-invariant views (Timetable, Assignments, Exams,
// Flashcards, Practice Tests, Study Groups, Grade Tracker, Files,
// Calculator, Math Solver, AI Assistant, Focus Timer, Settings — they render
// no task/note/event rows) had NEVER been rendered in DARK at the 844×390
// landscape layout under ANY accent, and the DRAWER's active-link tint had
// never been read through the real navigation lifecycle in DARK at LANDSCAPE
// at SEED on those 13 views.
//
// What it asserts, per accent (7), at 844×390 (the iPhone-class landscape —
// the 390–430px-tall band's canonical width; the short-viewport structures:
// the drawer nav whose scroll is the ONLY path to links 8–20 at 390 height
// [measured S35/S48: scrollHeight 1068 vs clientHeight ~301], the fixed
// h-16 app bar covering 16% of the viewport, the pt-* heading clearance
// under it), in DARK mode at SEED volume, navigated THROUGH THE DRAWER (the
// only vehicle below 1024):
//   1. the chrome contract (a PRECONDITION): the desktop aside sidebar is
//      hidden AND the hamburger is visible at 844 — a broken lg contract
//      aborts loudly (no findings)
//   2. the SHORT-VIEWPORT contract (measured at the first drawer open of
//      EVERY accent): the nav MUST be scrollable at 390 height — the 20
//      reference-measured ~40px rows cannot fit the ~300px nav area, so a
//      non-scrolling reading means the drawer geometry changed (links
//      beyond the fold would be unreachable in landscape); any accent whose
//      nav reads non-scrollable is a FINDING + the top-level
//      chrome.drawerNavScrollable reads false
//   3. the accent APPLIES through the real lifecycle (PATCHed through the
//      settings API + self-verified on <html data-accent> + html.dark, with
//      the shell-presence guard folded into the wait — the AP-90 lesson
//      applied to the landscape vehicle: the header (the app bar) exists
//      only after the auth gate mounts the shell); the applied reading
//      rides the envelope (the seam's mismatch guard)
//   4. per view (the 13 volume-invariant views): the drawer opens (reading
//      the PREVIOUS view's active link — the pendingView pattern: while
//      view N is active, the drawer's active link MUST be view N's link,
//      its inner span a linear-gradient) → the link click navigates → the
//      drawer CLOSES on navigation → the view renders its identity heading
//      (h1 OR h2 — the S8-H union) → the heading CLEARANCE holds (the
//      heading's box top at/below the fixed 64px bar — 1px sub-pixel
//      tolerance) → scrollWidth ≤ 844 (the Timetable canvas lives INSIDE
//      its overflow-x-auto container) → the fixed glass app bar (brand +
//      2-digit-hour clock) → the DARK checker (flashbulbs — a light
//      surface on the dark canvas, ALWAYS findings; unreadable < 2.2 with
//      the CTA-face exemption ONLY — the calendar-day and yellow-pill light
//      exemptions do NOT apply in dark, those surfaces re-theme;
//      lowcontrast < 3.2 = WARN) → zero console errors (the 429-RUM
//      backpressure exact-text filter)
//   5. the drawer record per accent (the drawer-scoped DARK checker on the
//      final navigated view — the open drawer's own rendering: the
//      dark:bg-slate-950 panel, the nav links, the active-link tint) +
//      linkCount === 20 (the drawer always carries ALL 20 links even
//      though only the 13 are navigated)
//
// The S50 envelope shape (unit-pinned by tests/suite-verdict.test.ts):
//   { source: "accent-dark-landscape-seed-sweep", mode: "dark",
//     viewport: {width: 844, height: 390},
//     chrome: {sidebarVisible, hamburgerVisible, drawerNavScrollable},
//     accents: {accent → {applied, views: {label → {heading, scrollWidth,
//       drawerClosed, appBar, headingClearance, flashbulbs, unreadable,
//       lowcontrast, consoleErrors, activeTint, activeLabel}}, drawer:
//       {linkCount, flashbulbs, unreadable, lowcontrast, activeView,
//       activeTint, error?}}},
//     findings: [] } — EVERY view is recorded explicitly (the S38
//   retirement of omission-means-clean, applied from birth), so the seam's
//   ALL-ACCENTS + ALL-VIEWS + drawer-present guards make every
//   silently-skipped dimension a LOUD shape-error, never green-by-omission.
//
// Restores light + violet at the end (the demo resting state — explicit,
// awaited, VERIFIED), with the failure-path restore in the catch.
// The S39-F flush-callback ending (the AP-85 lesson): the exit code is
// computed FIRST, then the write carries the exit in its flush callback so
// it can never cut the pipe.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const W = 844;
const H = 390;
const VIEWPORT = { width: W, height: H };
const MAX_WIDTH = W;
const APP_BAR = 64; // h-16 — the fixed glass bar (16% of a 390px viewport, the S40 constant)

const ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"];

// The 13 volume-invariant views (the S13 data-volume audit's own set
// EXCLUDES them — they render no task/note/event rows; the 7 volume views
// at dark × landscape are the S48 audit's own at volume) with each view's
// identity heading — the h1 the ViewHeader (or the two-pane stack) renders.
const VIEWS = [
  { label: "Timetable", path: "/Timetable", heading: "Timetable" },
  { label: "Assignments", path: "/Assignments", heading: "Assignments" },
  { label: "Exams", path: "/Exams", heading: "Exams" },
  { label: "Flashcards", path: "/Flashcards", heading: "Flashcards" },
  { label: "Practice Tests", path: "/PracticeTests", heading: "Practice Tests" },
  { label: "Study Groups", path: "/StudyGroups", heading: "Study Groups" },
  { label: "Grade Tracker", path: "/GradeTracker", heading: "Grade Tracker" },
  { label: "Files", path: "/Files", heading: "Files" },
  { label: "Calculator", path: "/Calculator", heading: "Calculator Suite" },
  { label: "Math Solver", path: "/MathSolver", heading: "Math Solver" },
  { label: "AI Assistant", path: "/AIAssistant", heading: "AI Study Assistant" },
  { label: "Focus Timer", path: "/FocusTimer", heading: "Focus Timer" },
  { label: "Settings", path: "/Settings", heading: "Settings" },
];

function fail(msg) {
  console.error(`ACCENT-DARK-LANDSCAPE-SEED-SWEEP PRECONDITION FAILED: ${msg}`);
  process.exit(1);
}

// The active-link reader — runs inside the OPEN drawer (the S40 pattern):
// the label of the dialog's aria-current=page link + the INNER span's
// inline backgroundImage (the 10%-alpha NAV_ACTIVE_GRADIENT_STOPS gradient
// — accent-driven; a "none" is the S8 no-var rot class). The dark ×
// landscape × seed interaction cell on the 13 views: S35 proved landscape
// light+violet at seed; S40 accent × landscape at seed light; S48 dark ×
// landscape at volume (the 7 volume views) — this is the first per-view
// dark reading at the landscape at SEED on the volume-invariant set.
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

// The DARK checker (the S42/S44/S46/S48 dark detector family, verbatim): flashbulbs
// (bg luminance > 0.80 at alpha > 0.9, ≥40×20px — a light surface on the
// dark canvas, the sf-gradient/UserAvatar classes exempt by design) +
// unreadable (< 2.2) + lowcontrast (< 3.2) with the effective-background
// walk over main/aside/header/dialog. The display:none guard handles the
// hidden desktop sidebar (hidden lg:flex at 844) and the closed drawer.
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

// The drawer-scoped DARK checker — the S42/S44/S46/S48 dark detector family scoped
// to the OPEN drawer (the drawer's brand header, nav links, and close
// button must all read dark-clean in EVERY accent — the panel is
// dark:bg-slate-950) + the active-link reading on the final navigated view
// (the active link may sit below the fold at 390 height — links ~8–20 —
// but it stays in the DOM with computed styles, so the read is
// scroll-independent — the S40 note).
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
  const flashbulbs = [];
  for (const el of dlg.querySelectorAll('*')) {
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
    flashbulbs.push({ cls: cls.slice(0, 70), bg: cs.backgroundColor, tag: el.tagName, w: Math.round(rect.width), h: Math.round(rect.height), text: (el.textContent || '').trim().slice(0, 30) });
    if (flashbulbs.length >= 12) break;
  }
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
  const active = dlg.querySelector('a[aria-current="page"]');
  const activeInner = active ? active.querySelector('span') : null;
  const activeStyle = activeInner ? getComputedStyle(activeInner) : null;
  return JSON.stringify({
    linkCount: dlg.querySelectorAll('a').length,
    flashbulbs, unreadable, lowcontrast,
    activeView: active ? (active.textContent || '').trim() : null,
    activeTint: activeStyle ? activeStyle.backgroundImage.slice(0, 90) : null,
  });
})()`;

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

  // --- precondition: the viewport (BOTH axes — the HEIGHT is this audit's
  // axis; a viewport that applied as anything else means the sweep would
  // measure the wrong device class) --------------------------------------
  const inner = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  if (inner.w !== W || inner.h !== H) {
    fail(`the viewport applied as ${inner.w}×${inner.h}, expected ${W}×${H} — the sweep refuses to measure another orientation.`);
  }

  // --- precondition: DARK mode through the REAL lifecycle (S27) -------------
  // The dark gate is itself post-hydration (the dark class is applied by
  // the theme lifecycle after /api/auth/me resolves — the S42/S48 note:
  // no first-paint race in dark; the greeting heading is the shell-
  // presence observable — the S47 initial-gate field correction).
  const patch0 = await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "dark" } });
  if (!patch0.ok()) {
    fail(`the settings PATCH answered ${patch0.status()} — the sweep refuses to measure an unverified mode.`);
  }
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(() => document.documentElement.classList.contains("dark") && !!document.querySelector("main h1"), undefined, { timeout: 30000 });
  const mode = await page.evaluate(() => (document.documentElement.classList.contains("dark") ? "dark" : "light"));
  if (mode !== "dark") {
    fail(`the applied mode is ${mode}, expected dark — the sweep refuses to measure the wrong mode.`);
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
    // vehicle): `data-accent === accent && html.dark` alone is NOT a shell
    // gate — the theme boot script applies the CACHED accent + the cached
    // mode to <html> pre-hydration, so the wait can pass at first paint
    // while the auth gate has not yet mounted the shell. The gate folds
    // the SHELL-PRESENCE condition in: the header (the below-lg app bar)
    // exists only after the auth gate resolves and the shell mounts.
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
    // first drawer open — the S35/S40/S48 pattern): at 390 height the 20
    // nav rows measure scrollHeight ~1068 vs the ~301px nav area (the 390
    // viewport minus the ~89px brand header) — the nav MUST be scrollable.
    // If it fits, the link geometry changed (a parity-relevant regression);
    // if the nav cannot scroll, links ~8–20 are unreachable in landscape.
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
    // active link while the PREVIOUS view is active. views[v] carries
    // the reading taken while v was the active view: the loop open for view
    // N+1 reads view N's record; the FIRST open (after the goto landing on
    // Dashboard — not in this sweep's 13-view set) reads nothing; the LAST
    // view (Settings) is read at the dedicated drawer-record open after
    // the loop (the S40 pendingView pattern).
    let pendingView = null; // the view whose record still needs its tint

    // --- the 13-view sweep, navigated THROUGH THE DRAWER (the S35/S40 vehicle)
    for (const v of VIEWS) {
      const viewStart = logCursor;
      await page.getByRole("button", { name: "Open navigation menu" }).click();
      await dialog.waitFor({ state: "visible", timeout: 10000 });
      await page.waitForTimeout(300); // the panel slide settles; the span's inline style is static

      // The interaction evidence: the active link in the OPEN drawer must
      // be the previously-active view (pendingView; null for the first
      // open after the goto landing — Dashboard, the S48 audit's own).
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

      await dialog.getByRole("link", { name: v.label, exact: true }).click();

      const rec = { heading: "", scrollWidth: 0, drawerClosed: false, appBar: false, headingClearance: false, flashbulbs: [], unreadable: [], lowcontrast: [], consoleErrors: [], activeTint: "", activeLabel: "" };
      accentRec.views[v.label] = rec;
      pendingView = v;

      // The drawer closes on navigation (the observable end state — S8/S16).
      try {
        await dialog.waitFor({ state: "hidden", timeout: 10000 });
        rec.drawerClosed = true;
      } catch {
        findings.push({ accent, view: v.label, kind: "drawer-stuck", detail: "the drawer dialog did not close after link navigation" });
      }

      // The identity heading renders (h1 OR h2 — the two-pane views'
      // stacks render an h2 below lg, the S8-H pattern; the copy sweep
      // gates on the same union).
      try {
        const heading = page.locator("main h1:visible, main h2:visible").first();
        await heading.waitFor({ state: "visible", timeout: 15000 });
        await page.waitForTimeout(1200); // data-fetch settle (the S40 band)
        rec.heading = (await heading.textContent())?.trim() ?? "";
        const headingOk = rec.heading === v.heading;
        if (!headingOk) {
          findings.push({ accent, view: v.label, kind: "no-heading", detail: `expected "${v.heading}", rendered "${rec.heading.slice(0, 40)}"` });
        }

        // The fixed-bar clearance: the heading's box top must sit
        // at/below the fixed app bar (64px — the S35/S40/S48/S49 contract;
        // the below-lg chrome is identical at 844, the bar 16% of the
        // short viewport — the tightest clearance in the whole matrix).
        const top = await heading.evaluate((el) => el.getBoundingClientRect().top);
        rec.headingClearance = top >= APP_BAR - 1; // 1px sub-pixel tolerance
        if (!rec.headingClearance) {
          findings.push({ accent, view: v.label, kind: "heading-clearance", detail: `the identity heading's top is y=${Math.round(top)} < ${APP_BAR} — under the fixed app bar` });
        }
      } catch {
        findings.push({ accent, view: v.label, kind: "no-heading", detail: "the identity heading never rendered" });
      }

      // No horizontal overflow — same family as the S33/S34/S35/S39/S40
      // sweeps (the Timetable's min-w-[900px] canvas must live INSIDE its
      // overflow-x-auto container, never widen the document — at 844 it is
      // 56px shy of fit).
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

      // The DARK detector family (flashbulbs + unreadable + lowcontrast —
      // the S42/S44/S46/S48 checker verbatim; the CTA-face exemption applies
      // at the exit-code computation below).
      const dark = JSON.parse(await page.evaluate(CHECKER));
      rec.flashbulbs = dark.flashbulbs;
      rec.unreadable = dark.unreadable;
      rec.lowcontrast = dark.lowcontrast;
      if (dark.scrollWidth > MAX_WIDTH && rec.scrollWidth <= MAX_WIDTH) {
        rec.scrollWidth = dark.scrollWidth;
        findings.push({ accent, view: v.label, kind: "overflow", detail: `scrollWidth ${dark.scrollWidth} > ${MAX_WIDTH} (the checker's own reading)` });
      }
      if (dark.flashbulbs.length > 0) {
        findings.push({ accent, view: v.label, kind: "flashbulb", detail: `${dark.flashbulbs.length} flashbulb detection(s): ${dark.flashbulbs.slice(0, 2).map((f) => f.cls.slice(0, 40)).join(" | ")}` });
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
        accentRec.drawer = { linkCount: 0, flashbulbs: [], unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: drawerRec.error };
      } else {
        accentRec.drawer = drawerRec;
        // The drawer always carries ALL 20 links even though only the 13
        // volume-invariant views are navigated (the full NAV).
        if (drawerRec.linkCount !== 20) {
          findings.push({ accent, kind: "link-count", detail: `drawer carried ${drawerRec.linkCount} links (expected 20)` });
        }
        // The LAST view's interaction record (Settings): the drawer's
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
        if (drawerRec.flashbulbs.length > 0) {
          findings.push({ accent, kind: "flashbulb", detail: `${drawerRec.flashbulbs.length} flashbulb detection(s) in the drawer record: ${drawerRec.flashbulbs.slice(0, 2).map((f) => f.cls.slice(0, 40)).join(" | ")}` });
        }
      }
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden", timeout: 10000 });
    } catch (e) {
      findings.push({ accent, kind: "drawer-error", detail: String(e).slice(0, 140) });
      accentRec.drawer = accentRec.drawer ?? { linkCount: 0, flashbulbs: [], unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: String(e).slice(0, 140) };
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
  await browser.close();

  const envelope = {
    source: "accent-dark-landscape-seed-sweep",
    mode,
    viewport: VIEWPORT,
    chrome: { ...chromeRec, drawerNavScrollable: navScrollableAll },
    accents,
    findings,
  };
  // exit 0 iff the structural findings are empty AND every non-exempt
  // contrast detection is zero AND no flashbulb fired. The DOCUMENTED
  // non-gap signature (mirrored at the seam — suite-verdict's
  // classifyAccentDarkLandscapeSeedSweep): the CTA-face (white on
  // accent-500 — the S11 family-2 non-gap). The light-mode exemptions (the
  // calendar adjacent-day slate-300 + the yellow priority-pill yellow-500)
  // do NOT apply — those surfaces re-theme in dark (the S42/S44/S46/S48
  // doctrine).
  const isCtaFace = (e) => e && e.color === "rgb(255, 255, 255)";
  let detections = 0;
  let flashbulbCount = 0;
  for (const a of ACCENTS) {
    const rec = accents[a];
    for (const v of Object.keys(rec.views)) {
      flashbulbCount += (rec.views[v].flashbulbs ?? []).length;
      for (const e of rec.views[v].unreadable) {
        if (isCtaFace(e)) continue;
        detections += 1;
      }
    }
    if (rec.drawer) {
      flashbulbCount += (rec.drawer.flashbulbs ?? []).length;
      for (const e of rec.drawer.unreadable ?? []) {
        if (isCtaFace(e)) continue;
        detections += 1;
      }
    }
  }
  const exitCode = findings.length === 0 && detections === 0 && flashbulbCount === 0 ? 0 : 1;
  // S39-F (the stdout-flush race, AP-85): a bare process.exit() after
  // console.log can truncate the ASYNC pipe write mid-flush. The
  // trailing-write callback fires only after every prior byte has flushed
  // to the pipe, so the exit can never cut the envelope.
  process.stdout.write(JSON.stringify(envelope, null, 1) + "\n", () => process.exit(exitCode));
} catch (e) {
  // The failure-path restore (the theme-spec lesson — an aborted restore
  // persists the accent and poisons every later violet pin).
  try {
    await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });
  } catch {}
  console.error(`ACCENT-DARK-LANDSCAPE-SEED-SWEEP ABORTED: ${String(e).slice(0, 300)}`);
  process.exit(1);
} finally {
  await browser.close();
}

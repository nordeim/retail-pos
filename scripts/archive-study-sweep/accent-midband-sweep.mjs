// S39 accent × mid-band drawer-navigation sweep — the 391–1023px band's
// accent half, navigated through the drawer (the vehicle), as a standing,
// executable guarantee (the S38 summary's own named next step: "the
// drawer-navigation × accent interaction at mid-band").
//
// Run with NODE (the midband-sweep/accent-light-sweep precedent — imports
// no TS seam; the standing-suite runner classifies the envelope through
// suite-verdict):
//
//   node scripts/accent-midband-sweep.mjs
//
// The coverage gap this closes, verified against the standing scripts:
//   - midband-sweep (S34): 20 views at 768×1024 through the drawer —
//     LIGHT + violet ONLY (zero accentColor references)
//   - accent-light-sweep (S37): 7 accents × 20 views — 390×844 ONLY,
//     DIRECT GOTO (the drawer's active tint read on the DASHBOARD link
//     alone, once per accent)
//   - accent-dark-sweep (S38): 7 accents × 20 views at 1280×800 + 390×844
//     — dark ONLY, DIRECT GOTO; the 768 width is in NEITHER surface
//   So: the accent × mid-band cell is ZERO-coverage, and the active-link
//   accent tint on a NON-Dashboard view (applied through the real
//   navigation lifecycle — aria-current moves, .sf-nav-active re-tints)
//   is verified at ZERO views, ZERO accents, in either mode.
//
// What it asserts, per accent (7), at 768×1024 (the md breakpoint — the
// switchiest width in the band: the Tasks md:flex aside, the two-pane
// Notes/Flashcards w-80 layouts, the Timetable min-w-[900px] canvas),
// navigated THROUGH THE DRAWER (the only vehicle below 1024):
//   1. the chrome contract (a PRECONDITION): the desktop aside sidebar is
//      hidden AND the hamburger is visible at 768 — a broken lg contract
//      aborts loudly (no findings)
//   2. the accent APPLIES through the real lifecycle (PATCHed through the
//      settings API + self-verified on <html data-accent>); the applied
//      reading rides the envelope (the seam's mismatch guard)
//   3. per view: the drawer opens → the CURRENT active link's label +
//      tint are read (the previously-navigated view's interaction
//      evidence — activeLabel MUST equal that view; the tint MUST read a
//      linear-gradient, never "none" — the S8 no-var rot class) → the
//      link click navigates → the drawer CLOSES on navigation → the view
//      renders its identity heading (h1 OR h2 — the S8-H union) →
//      scrollWidth ≤ 768 (the Timetable canvas lives INSIDE its
//      overflow-x-auto container) → the fixed glass app bar (brand +
//      2-digit-hour clock) → the LIGHT contrast detector family
//      (unreadable < 2.2 / lowcontrast < 3.2 — the S37 checker verbatim;
//      the flashbulb class does not apply on the light canvas) → zero
//      console errors (the 429-RUM backpressure exact-text filter)
//   4. the drawer record per accent (the S37 DRAWER_CHECKER pattern): the
//      dialog-scoped detectors + linkCount === 20 + the active tint on
//      the FINAL navigated view (a NON-Dashboard view — the first
//      standing reading of the tint on a navigated link per accent)
//
// The S39 envelope shape (unit-pinned by tests/suite-verdict.test.ts):
//   { source: "accent-midband-sweep", mode: "light",
//     viewport: {width: 768, height: 1024},
//     chrome: {sidebarVisible, hamburgerVisible},
//     accents: {accent → {applied, views: {label → {heading, scrollWidth,
//       drawerClosed, appBar, unreadable, lowcontrast, consoleErrors,
//       activeTint, activeLabel}}, drawer: {linkCount, unreadable,
//       lowcontrast, activeTint, activeView, error?}}},
//     findings: [] } — EVERY view is recorded explicitly (clean views
//   carry empty detector arrays — the S38 retirement of
//   omission-means-clean, applied from birth), so the seam's ALL-ACCENTS
//   + ALL-VIEWS + drawer-present guards make every silently-skipped
//   dimension a LOUD shape-error, never green-by-omission.
//
// Restores light + violet at the end (the demo resting state — explicit,
// awaited, VERIFIED), with the failure-path restore in the catch.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const W = 768;
const H = 1024;
const VIEWPORT = { width: W, height: H };
const MAX_WIDTH = W;

const ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"];

// The documented NAV order (src/lib/router.ts) with each view's identity
// heading — the h1 the ViewHeader (or the two-pane stack) renders.
// Dashboard's greeting is time-aware: a regex, never a hardcoded bucket.
const VIEWS = [
  { label: "Dashboard", path: "/Dashboard", heading: null },
  { label: "My Day", path: "/MyDay", heading: "My Day" },
  { label: "Tasks", path: "/Tasks", heading: "All Tasks" },
  { label: "Calendar", path: "/Calendar", heading: "Calendar" },
  { label: "Events", path: "/Events", heading: "Events & Reminders" },
  { label: "Timetable", path: "/Timetable", heading: "Timetable" },
  { label: "Assignments", path: "/Assignments", heading: "Assignments" },
  { label: "Exams", path: "/Exams", heading: "Exams" },
  { label: "Notes", path: "/Notes", heading: "Notes" },
  { label: "Flashcards", path: "/Flashcards", heading: "Flashcards" },
  { label: "Practice Tests", path: "/PracticeTests", heading: "Practice Tests" },
  { label: "Study Groups", path: "/StudyGroups", heading: "Study Groups" },
  { label: "Grade Tracker", path: "/GradeTracker", heading: "Grade Tracker" },
  { label: "Analytics", path: "/Analytics", heading: "Analytics" },
  { label: "Files", path: "/Files", heading: "Files" },
  { label: "Calculator", path: "/Calculator", heading: "Calculator Suite" },
  { label: "Math Solver", path: "/MathSolver", heading: "Math Solver" },
  { label: "AI Assistant", path: "/AIAssistant", heading: "AI Study Assistant" },
  { label: "Focus Timer", path: "/FocusTimer", heading: "Focus Timer" },
  { label: "Settings", path: "/Settings", heading: "Settings" },
];
const GREETING_RE = /good (morning|afternoon|evening)/i;

function fail(msg) {
  console.error(`ACCENT-MIDBAND-SWEEP PRECONDITION FAILED: ${msg}`);
  process.exit(1);
}

// The active-link reader — runs inside the OPEN drawer: the label of the
// aria-current=page link + the INNER span's inline backgroundImage (the
// 10%-alpha NAV_ACTIVE_GRADIENT_STOPS gradient — accent-driven; a "none"
// is the S8 no-var rot class). This is the navigation-interaction evidence:
// while view N is active, the drawer's active link MUST be view N's link.
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

// The light contrast checker — the S37 accent-light CHECKER verbatim: the
// effective-background walk, the unreadable (< 2.2) + lowcontrast (< 3.2)
// detectors over every text-bearing element (the flashbulb class does not
// apply on the light canvas).
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
  const unreadable = [];
  const lowcontrast = [];
  for (const el of document.querySelectorAll('main *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') continue;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) continue;
    let bgEff = { r: 255, g: 255, b: 255, a: 1 };
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
  return JSON.stringify({ unreadable, lowcontrast });
})()`;

// The drawer-scoped light checker — the S37 DRAWER_CHECKER verbatim: the
// same contrast detectors scoped to the open dialog (the drawer's brand
// header, nav links, and close button must all read light-clean in EVERY
// accent; the active link's accent tint is recorded).
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
    let bgEff = { r: 255, g: 255, b: 255, a: 1 };
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

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });

// S83/AJ7: the Next.js dev overlay portal (dev-only — absent from the
// production build) intercepts pointer events at the drawer's scrolled
// bottom region and hangs the drawer-link clicks. Suppressed for the
// sweep's lifetime; a no-op against production (the element never exists).
await page.addInitScript(() => {
  const style = document.createElement("style");
  style.textContent = "nextjs-portal { display: none !important; }";
  document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
});


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
    fail(`the viewport applied as ${inner.w}×${inner.h}, expected ${W}×${H} — the sweep refuses to measure at another size.`);
  }

  // --- precondition: light mode through the REAL lifecycle (S27) -----------
  const patch0 = await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });
  if (!patch0.ok()) {
    fail(`the settings PATCH answered ${patch0.status()} — the sweep refuses to measure an unverified mode.`);
  }
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(() => /good (morning|afternoon|evening)/i.test(document.querySelector("main h1")?.textContent ?? ""), null, { timeout: 30000 });
  const mode = await page.evaluate(() => (document.documentElement.classList.contains("dark") ? "dark" : "light"));
  if (mode !== "light") {
    await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });
    fail(`the applied mode is ${mode}, expected light — the sweep refuses to measure the wrong mode.`);
  }

  // --- precondition: the chrome contract (the vehicle model at 768) --------
  // The desktop sidebar must be hidden (lg:flex = visible only >= 1024) and
  // the hamburger visible — the drawer is the navigation vehicle through
  // the whole 391-1023 band. A broken lg contract means the sweep cannot
  // run (the S34 vehicle-contract class).
  const chromeRec = await page.evaluate(() => ({
    sidebarVisible: (() => { const a = document.querySelector("aside"); return !!a && a.offsetParent !== null; })(),
    hamburgerVisible: (() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Open navigation menu"); return !!b && b.offsetParent !== null; })(),
  }));
  if (chromeRec.sidebarVisible || !chromeRec.hamburgerVisible) {
    fail(`the chrome contract broke at 768 — sidebarVisible=${chromeRec.sidebarVisible}, hamburgerVisible=${chromeRec.hamburgerVisible} (the lg contract: the sidebar renders only >=1024; below that the drawer is the vehicle).`);
  }

  const findings = [];
  const accents = {};
  const dialog = page.getByRole("dialog");

  for (const accent of ACCENTS) {
    // --- precondition: the accent through the REAL lifecycle (S27) ----------
    const patch = await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: accent } });
    if (!patch.ok()) {
      await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });
      fail(`the settings PATCH answered ${patch.status()} for accent ${accent} — the sweep refuses to measure an unverified accent.`);
    }
    await page.goto(`${BASE}/Dashboard`);
    let applied = "";
    try {
      await page.waitForFunction(
        (a) => document.documentElement.dataset.accent === a && !document.documentElement.classList.contains("dark"),
        accent,
        { timeout: 30000 },
      );
      applied = await page.evaluate(() => document.documentElement.dataset.accent);
    } catch {
      await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });
      fail(`the accent ${accent} never applied through the real lifecycle (data-accent=${await page.evaluate(() => document.documentElement.dataset.accent)}) — the sweep refuses to measure the wrong accent.`);
    }
    if (applied !== accent) {
      await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });
      fail(`the applied accent is ${applied}, expected ${accent} — the sweep refuses to measure the wrong accent.`);
    }

    const accentRec = { applied, views: {}, drawer: null };
    accents[accent] = accentRec;

    // The active-tint interaction readings: each drawer open reads the
    // active link while the PREVIOUS view is still active. views[v] carries
    // the reading taken while v was the active view: the loop open for view
    // N+1 reads view N's record; the FIRST view (Dashboard, the goto
    // landing) is read at the first open; the LAST view (Settings) is read
    // at the dedicated drawer-record open after the loop.
    let pendingView = null; // the view whose record still needs its tint

    // --- the 20-view sweep, navigated THROUGH THE DRAWER (the S34 vehicle) --
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

      await dialog.getByRole("link", { name: v.label, exact: true }).click();

      const rec = { heading: "", scrollWidth: 0, drawerClosed: false, appBar: false, unreadable: [], lowcontrast: [], consoleErrors: [], activeTint: "", activeLabel: "" };
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
      // h1 OR h2 — the two-pane views' stacks render an h2 through the
      // whole band (the S8-H pattern); the copy sweep gates on the union.
      try {
        const heading = page.locator("main h1:visible, main h2:visible").first();
        await heading.waitFor({ state: "visible", timeout: 15000 });
        await page.waitForTimeout(1200); // data-fetch settle (copy-sweep/dark-sweep band)
        rec.heading = (await heading.textContent())?.trim() ?? "";
        const headingOk = v.heading ? rec.heading === v.heading : GREETING_RE.test(rec.heading);
        if (!headingOk) {
          findings.push({ accent, view: v.label, kind: "no-heading", detail: `expected "${v.heading ?? "the greeting"}", rendered "${rec.heading.slice(0, 40)}"` });
        }
      } catch {
        findings.push({ accent, view: v.label, kind: "no-heading", detail: "the identity heading never rendered" });
      }

      // No horizontal overflow — the Timetable's min-w-[900px] canvas must
      // live INSIDE its overflow-x-auto container, never widen the document.
      rec.scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      if (rec.scrollWidth > MAX_WIDTH) {
        findings.push({ accent, view: v.label, kind: "overflow", detail: `scrollWidth ${rec.scrollWidth} > ${MAX_WIDTH}` });
      }

      // The fixed glass app bar: brand + the 2-digit-hour clock (lg:hidden —
      // visible through the whole band).
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

      // The light contrast detector family (the S37 checker verbatim).
      const light = JSON.parse(await page.evaluate(CHECKER));
      rec.unreadable = light.unreadable;
      rec.lowcontrast = light.lowcontrast;

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
        if (drawerRec.linkCount !== VIEWS.length) {
          findings.push({ accent, kind: "link-count", detail: `drawer carried ${drawerRec.linkCount} links (expected ${VIEWS.length})` });
        }
        // The LAST view's interaction record (Settings): the drawer's active
        // link must be the final navigated view, its tint the accent gradient.
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

  const envelope = {
    source: "accent-midband-sweep",
    mode,
    viewport: VIEWPORT,
    chrome: chromeRec,
    accents,
    findings,
  };
  // exit 0 iff the structural findings are empty AND every non-exempt
  // contrast detection is zero. The three DOCUMENTED non-gap signatures
  // (mirrored at the seam — suite-verdict's classifyAccentMidbandSweep):
  // the CTA-face (white on accent-500 — the S11 family-2 non-gap), the
  // calendar adjacent-month day numbers (slate-300 1-2 digit text — the
  // S6-G reference-measured pin), and the yellow priority-pill vocabulary
  // (yellow-500 {high,medium,low} — the S6/S8 reference-measured pin).
  const isCtaFace = (e) => e && e.color === "rgb(255, 255, 255)";
  const isCalendarAdjacentDay = (e) => e && e.color === "rgb(203, 213, 225)" && /^\d{1,2}$/.test(String(e.text ?? "").trim());
  const isYellowPriorityPill = (e) => e && e.color === "rgb(234, 179, 8)" && /^(high|medium|low)$/i.test(String(e.text ?? "").trim());
  let detections = 0;
  for (const a of ACCENTS) {
    const rec = accents[a];
    for (const v of Object.keys(rec.views)) {
      for (const e of rec.views[v].unreadable) {
        if (isCtaFace(e) || isCalendarAdjacentDay(e) || isYellowPriorityPill(e)) continue;
        detections += 1;
      }
    }
    if (rec.drawer) {
      for (const e of rec.drawer.unreadable ?? []) {
        if (isCtaFace(e) || isCalendarAdjacentDay(e) || isYellowPriorityPill(e)) continue;
        detections += 1;
      }
    }
  }
  const exitCode = findings.length === 0 && detections === 0 ? 0 : 1;
  // S39-F (the stdout-flush race): this envelope measures ~130KB — a bare
  // process.exit() after console.log can truncate the ASYNC pipe write
  // mid-flush (the S39 validation run caught the accent-light sibling
  // truncated at 146176 bytes with findings 0 — the runner read a false
  // "stdout did not parse"). The trailing-write callback fires only after
  // every prior byte has flushed to the pipe, so the exit can never cut
  // the envelope.
  process.stdout.write(JSON.stringify(envelope, null, 1) + "\n", () => process.exit(exitCode));
} catch (e) {
  // The failure-path restore (the theme-spec lesson — an aborted restore
  // persists the accent and poisons every later violet pin).
  try {
    await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });
  } catch {}
  console.error(`ACCENT-MIDBAND-SWEEP ABORTED: ${String(e).slice(0, 300)}`);
  process.exit(1);
} finally {
  await browser.close();
}

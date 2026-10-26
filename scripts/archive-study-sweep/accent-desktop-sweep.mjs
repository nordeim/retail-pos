// S41 desktop light-accent sidebar-navigation sweep — the desktop family's
// light half (1280×800), navigated through the SIDEBAR (the desktop
// vehicle), as a standing, executable guarantee (the S40 summary's own
// named next step: "the desktop light-accent family (currently the
// documented bracketed non-gap)").
//
// Run with NODE (the accent-landscape-sweep/accent-midband-sweep precedent
// — imports no TS seam; the standing-suite runner classifies the envelope
// through suite-verdict):
//
//   node scripts/accent-desktop-sweep.mjs
//
// The coverage gap this closes, verified against the standing scripts:
//   - accent-dark-sweep (S38): 7 accents × 20 views at 1280×800 — DARK
//     only (its own name is the blind spot), DIRECT GOTO, and its desktop
//     pass never reads the sidebar's active link at all
//   - accent-light-sweep (S37): 7 accents × 20 views — 390×844 ONLY
//   - accent-midband-sweep (S39): 7 accents × 20 views — 768×1024 only,
//     through the drawer (the drawer-vehicle interaction proof lives THERE)
//   - accent-landscape-sweep (S40): 7 accents × 20 views — 844×390 only,
//     through the drawer
//   - the e2e layer: the S8 gradient pin reads the tint on the DASHBOARD
//     link only, violet only; navigation.spec.ts moves aria-current but
//     never reads the TINT on the navigated link
//   So: the desktop light-accent cell is ZERO-coverage, AND the SIDEBAR's
//   active-link accent tint on a NON-Dashboard view through the real
//   navigation lifecycle is verified at ZERO views, ZERO accents, in
//   EITHER mode — the desktop vehicle's own interaction proof.
//
// What it asserts, per accent (7), at 1280×800 (the canonical desktop
// width the dark family already sweeps), navigated THROUGH THE SIDEBAR
// (the only chrome ≥1024 — the S33–S40 vehicle contract INVERTS here):
//   1. the INVERTED chrome contract (a PRECONDITION): the desktop sidebar
//      is visible AND the hamburger is hidden at 1280 — a broken lg
//      contract aborts loudly (no findings)
//   2. the sidebar-own scroll contract (measured at the start of EVERY
//      accent's pass): the nav MUST be scrollable at 800 height — the 20
//      reference-measured ~44px rows cannot fit the ~534px nav area
//      [measured: scrollHeight 1068 vs clientHeight 534], so a
//      non-scrolling reading means the sidebar geometry changed (links
//      ~13–20 beyond the fold would be unreachable); any accent whose
//      nav reads non-scrollable is a FINDING + the top-level
//      chrome.sidebarNavScrollable reads false
//   3. the accent APPLIES through the real lifecycle (PATCHed through the
//      settings API + self-verified on <html data-accent>); the applied
//      reading rides the envelope (the seam's mismatch guard)
//   4. per view: the sidebar link click navigates (Playwright auto-scrolls
//      below-fold links into the nav's scroll — the S35 proof, the desktop
//      sibling) → the view renders its identity heading (h1 — the desktop
//      ViewHeader) → the heading OFFSET holds (box left ≥ 260px − 1 — the
//      content clears the fixed sidebar; a lg:ml-[260px] regression would
//      slide the content UNDER the glass sidebar) → the sidebar STILL
//      VISIBLE (the vehicle persists through navigation) → scrollWidth ≤
//      1280 (the Timetable's min-w-[900px] canvas fits the 956px desktop
//      content area — it must live INSIDE its overflow-x-auto container)
//      → the ACTIVE-LINK READING while THIS view is active (the sidebar is
//      always in the DOM — no next-open indirection: activeLabel MUST
//      equal the view's own label; the tint MUST read a linear-gradient,
//      never "none" — the S8 no-var rot class) → the LIGHT contrast
//      detector family (unreadable < 2.2 / lowcontrast < 3.2 — the S37
//      checker verbatim; the flashbulb class does not apply on the light
//      canvas) → zero console errors (the 429-RUM backpressure
//      exact-text filter)
//   5. the sidebar record per accent (the S37/S39/S40 DRAWER_CHECKER
//      pattern, aside-scoped): the aside-scoped detectors (the brand
//      header, the nav links, the clock chip, the user footer) +
//      linkCount === 20 + the active tint on the FINAL navigated view (a
//      NON-Dashboard view — the first standing reading of the tint on a
//      navigated SIDEBAR link per accent)
//
// The S41 envelope shape (unit-pinned by tests/suite-verdict.test.ts):
//   { source: "accent-desktop-sweep", mode: "light",
//     viewport: {width: 1280, height: 800},
//     chrome: {sidebarVisible, hamburgerVisible, sidebarNavScrollable},
//     accents: {accent → {applied, views: {label → {heading, scrollWidth,
//       sidebarVisible, headingOffset, unreadable, lowcontrast,
//       consoleErrors, activeTint, activeLabel}}, sidebar: {linkCount,
//       unreadable, lowcontrast, activeTint, activeView, error?}}},
//     findings: [] } — EVERY view is recorded explicitly (clean views
//   carry empty detector arrays — the S38 retirement of
//   omission-means-clean, applied from birth), so the seam's ALL-ACCENTS
//   + ALL-VIEWS + sidebar-present guards make every silently-skipped
//   dimension a LOUD shape-error, never green-by-omission.
//
// Restores light + violet at the end (the demo resting state — explicit,
// awaited, VERIFIED), with the failure-path restore in the catch.
// The S39-F flush-callback ending (the AP-85 lesson): the envelope
// measures ~130KB — the exit code is computed FIRST, then the write
// carries the exit in its flush callback so it can never cut the pipe.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const W = 1280;
const H = 800;
const VIEWPORT = { width: W, height: H };
const MAX_WIDTH = W;
const SIDEBAR_W = 260; // the expanded sidebar width (w-[260px]) — the lg:ml-[260px] content offset

const ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"];

// The documented NAV order (src/lib/router.ts) with each view's identity
// heading — the h1 the desktop ViewHeader renders.
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
  console.error(`ACCENT-DESKTOP-SWEEP PRECONDITION FAILED: ${msg}`);
  process.exit(1);
}

// The active-link reader — reads the SIDEBAR's active link DIRECTLY (the
// sidebar is always in the DOM at desktop — no next-open indirection like
// the drawer family): the label of the aside's aria-current=page link +
// the INNER span's inline backgroundImage (the 10%-alpha
// NAV_ACTIVE_GRADIENT_STOPS gradient — accent-driven; a "none" is the S8
// no-var rot class). This is the navigation-interaction evidence: while
// view N is active, the sidebar's active link MUST be view N's link.
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

// The sidebar-scoped light checker — the S37/S39/S40 DRAWER_CHECKER
// pattern, aside-scoped: the same contrast detectors scoped to the desktop
// sidebar (the brand header, the nav links, the clock chip, and the user
// footer must all read light-clean in EVERY accent; the active link's
// accent tint is recorded — the active link may sit below the fold at 800
// height, but it stays in the DOM with computed styles, so the read is
// scroll-independent).
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

  // --- precondition: the viewport (BOTH axes — the WIDTH is this audit's
  // axis; a viewport that applied as anything else means the sweep would
  // measure the wrong device class) --------------------------------------
  const inner = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  if (inner.w !== W || inner.h !== H) {
    fail(`the viewport applied as ${inner.w}×${inner.h}, expected ${W}×${H} — the sweep refuses to measure another device class.`);
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

  // --- precondition: the INVERTED chrome contract (the vehicle model at
  // 1280): the desktop sidebar MUST be visible (lg:flex = ≥1024) and the
  // hamburger MUST be hidden (the app bar is lg:hidden) — the sidebar is
  // the navigation vehicle at desktop. A broken lg contract means the
  // sweep cannot run. NOTE: the sidebar is position:fixed — offsetParent
  // reads null for fixed elements even when rendered (the Chromium
  // quirk), so the rendered check is getClientRects().length > 0 (0 when
  // display:none — the below-1024 state the drawer-vehicle sweeps assert
  // through offsetParent).
  const chromeRec = await page.evaluate(() => ({
    sidebarVisible: (() => { const a = document.querySelector("aside"); return !!a && a.getClientRects().length > 0; })(),
    hamburgerVisible: (() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Open navigation menu"); return !!b && b.offsetParent !== null; })(),
  }));
  if (!chromeRec.sidebarVisible || chromeRec.hamburgerVisible) {
    fail(`the INVERTED chrome contract broke at 1280 — sidebarVisible=${chromeRec.sidebarVisible}, hamburgerVisible=${chromeRec.hamburgerVisible} (the lg contract: the sidebar is the desktop vehicle; the app bar is lg:hidden).`);
  }

  const findings = [];

  const accents = {};
  let navScrollableAll = true; // the aggregate sidebar-own scroll contract

  for (const accent of ACCENTS) {
    // --- precondition: the accent through the REAL lifecycle (S27) ----------
    // NOTE (the S43 shell-presence lesson, back-ported): `data-accent ===
    // accent` alone is NOT a shell gate — the theme boot script applies the
    // CACHED accent pre-hydration, so the wait can pass at first paint while
    // the auth gate has not yet mounted the shell (the aside) — and the
    // immediate nav-geometry evaluate then reads `aside nav` as null. The
    // gate folds the SHELL-PRESENCE condition in (the aside nav exists only
    // after the shell mounts). Latent in this seed-volume probe (never fired
    // in any suite run) but the same race the S43 volume probe crashed on.
    const patch = await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: accent } });
    if (!patch.ok()) {
      await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });
      fail(`the settings PATCH answered ${patch.status()} for accent ${accent} — the sweep refuses to measure an unverified accent.`);
    }
    await page.goto(`${BASE}/Dashboard`);
    let applied = "";
    try {
      await page.waitForFunction(
        (a) =>
          document.documentElement.dataset.accent === a &&
          !document.documentElement.classList.contains("dark") &&
          !!document.querySelector("aside nav"),
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

    const accentRec = { applied, views: {}, sidebar: null };
    accents[accent] = accentRec;

    // --- the sidebar-own scroll contract at the start of THIS accent's pass
    // (the S35/S40 pattern, re-measured per accent): at 800 height the 20
    // nav rows CANNOT fit the ~534px nav area — the nav MUST be scrollable.
    // If it fits, the link geometry changed (a parity-relevant regression);
    // if the nav cannot scroll, links beyond the fold are unreachable at
    // desktop. Any accent whose nav reads non-scrollable is a FINDING and
    // flips the aggregate chrome.sidebarNavScrollable.
    const navGeom = await page.evaluate(() => {
      const nav = document.querySelector("aside nav");
      return { scrollHeight: nav.scrollHeight, clientHeight: nav.clientHeight };
    });
    const navScrollable = navGeom.scrollHeight > navGeom.clientHeight;
    if (!navScrollable) {
      navScrollableAll = false;
      findings.push({ accent, kind: "nav-scroll", detail: `the sidebar nav is NOT scrollable at 800 height under accent ${accent} (scrollHeight ${navGeom.scrollHeight} vs clientHeight ${navGeom.clientHeight}) — links beyond the fold would be unreachable at desktop` });
    }

    // --- the 20-view sweep, navigated THROUGH THE SIDEBAR (the desktop
    // vehicle — the S33-S40 family's vehicle INVERSION). The active-tint
    // interaction readings happen DIRECTLY after each view settles (the
    // sidebar is always in the DOM — no next-open indirection): views[v]
    // carries the reading taken while v was the active view, from the
    // Dashboard goto landing through the final navigated view.
    for (const v of VIEWS) {
      const viewStart = logCursor;
      const nav = page.locator("aside nav");
      await nav.getByRole("link", { name: v.label, exact: true }).click();

      const rec = { heading: "", scrollWidth: 0, sidebarVisible: false, headingOffset: false, unreadable: [], lowcontrast: [], consoleErrors: [], activeTint: "", activeLabel: "" };
      accentRec.views[v.label] = rec;

      // The identity heading renders (Dashboard = the time-aware greeting).
      // At desktop every view renders the ViewHeader h1.
      try {
        const heading = page.locator("main h1:visible").first();
        await heading.waitFor({ state: "visible", timeout: 15000 });
        await page.waitForTimeout(1200); // data-fetch settle (copy-sweep/dark-sweep band)
        rec.heading = (await heading.textContent())?.trim() ?? "";
        const headingOk = v.heading ? rec.heading === v.heading : GREETING_RE.test(rec.heading);
        if (!headingOk) {
          findings.push({ accent, view: v.label, kind: "no-heading", detail: `expected "${v.heading ?? "the greeting"}", rendered "${rec.heading.slice(0, 40)}"` });
        }

        // The desktop clearance: the heading's box left must sit
        // at/right of the fixed 260px sidebar. A lg:ml-[260px] regression
        // would slide the content UNDER the glass sidebar while every
        // portrait probe stayed green (the content is the only thing that
        // moves — the sidebar is fixed).
        const left = await heading.evaluate((el) => el.getBoundingClientRect().left);
        rec.headingOffset = left >= SIDEBAR_W - 1; // 1px sub-pixel tolerance
        if (!rec.headingOffset) {
          findings.push({ accent, view: v.label, kind: "heading-offset", detail: `the identity heading's left is x=${Math.round(left)} < ${SIDEBAR_W} — under the fixed sidebar` });
        }
      } catch {
        findings.push({ accent, view: v.label, kind: "no-heading", detail: "the identity heading never rendered" });
      }

      // The vehicle persists through navigation (the sidebar stays visible —
      // the desktop vehicle contract per view; the drawer-closes sibling).
      // getClientRects: the fixed-position offsetParent quirk (above).
      rec.sidebarVisible = await page.evaluate(() => { const a = document.querySelector("aside"); return !!a && a.getClientRects().length > 0; });
      if (!rec.sidebarVisible) {
        findings.push({ accent, view: v.label, kind: "sidebar-vanished", detail: "the sidebar did not stay visible through the navigation — the desktop vehicle contract broke" });
      }

      // No horizontal overflow — same family as the S33/S34/S35/S39/S40
      // sweeps (the Timetable's min-w-[900px] canvas fits the 956px desktop
      // content area; it must live INSIDE its overflow-x-auto container,
      // never widen the document).
      rec.scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      if (rec.scrollWidth > MAX_WIDTH) {
        findings.push({ accent, view: v.label, kind: "overflow", detail: `scrollWidth ${rec.scrollWidth} > ${MAX_WIDTH}` });
      }

      // The active-link interaction evidence, read DIRECTLY while THIS view
      // is active (the sidebar is always in the DOM): the aside's
      // aria-current link must be THIS view's link, its inner span's
      // gradient the accent tint (a "none" is the S8 no-var rot class).
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

    // --- the sidebar record per accent (on the FINAL navigated view) ---------
    try {
      await page.waitForTimeout(300); // the final view's settle band
      const sidebarRec = JSON.parse(await page.evaluate(SIDEBAR_CHECKER));
      if (sidebarRec.error) {
        findings.push({ accent, kind: "sidebar-missing", detail: sidebarRec.error });
        accentRec.sidebar = { linkCount: 0, unreadable: [], lowcontrast: [], activeView: null, activeTint: null, error: sidebarRec.error };
      } else {
        accentRec.sidebar = sidebarRec;
        if (sidebarRec.linkCount !== VIEWS.length) {
          findings.push({ accent, kind: "link-count", detail: `sidebar carried ${sidebarRec.linkCount} links (expected ${VIEWS.length})` });
        }
        // The LAST view's interaction record (Settings): the sidebar's
        // active link must be the final navigated view, its tint the
        // accent gradient — the aside-scoped confirmation of the per-view
        // reading (already recorded above; this is the dedicated record).
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

  const envelope = {
    source: "accent-desktop-sweep",
    mode,
    viewport: VIEWPORT,
    chrome: { ...chromeRec, sidebarNavScrollable: navScrollableAll },
    accents,
    findings,
  };
  // exit 0 iff the structural findings are empty AND every non-exempt
  // contrast detection is zero. The three DOCUMENTED non-gap signatures
  // (mirrored at the seam — suite-verdict's classifyAccentDesktopSweep):
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
    if (rec.sidebar) {
      for (const e of rec.sidebar.unreadable ?? []) {
        if (isCtaFace(e) || isCalendarAdjacentDay(e) || isYellowPriorityPill(e)) continue;
        detections += 1;
      }
    }
  }
  const exitCode = findings.length === 0 && detections === 0 ? 0 : 1;
  // S39-F (the stdout-flush race, AP-85): this envelope measures ~130KB — a
  // bare process.exit() after console.log can truncate the ASYNC pipe write
  // mid-flush. The trailing-write callback fires only after every prior
  // byte has flushed to the pipe, so the exit can never cut the envelope.
  process.stdout.write(JSON.stringify(envelope, null, 1) + "\n", () => process.exit(exitCode));
} catch (e) {
  // The failure-path restore (the theme-spec lesson — an aborted restore
  // persists the accent and poisons every later violet pin).
  try {
    await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });
  } catch {}
  console.error(`ACCENT-DESKTOP-SWEEP ABORTED: ${String(e).slice(0, 300)}`);
  process.exit(1);
} finally {
  await browser.close();
}

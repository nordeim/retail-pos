// S37 accent × light sweep — the ACCENT axis in LIGHT mode as a standing,
// executable guarantee (the AP-82 doctrine: an accent never varied in light
// is a blind half of the theme space). The coverage map this audit closes
// (all verified against the standing scripts in session 80/81):
//   - accent-dark-sweep: all 7 accents × 20 desktop views + 6 mobile views
//                        + the drawer — DARK mode ONLY (its own name is the
//                        blind spot)
//   - mobile-sweep (S33): 20 views at 390×844 — LIGHT, violet only
//   - midband-sweep (S34): 20 views at 768×1024 — LIGHT, violet only
//   - landscape-sweep (S35): 20 views at 844×390 — LIGHT, violet only
//   - dark-mobile-sweep (S36): 20 views at 390×844 — DARK, violet only
//   => NO standing audit renders ANY view in a non-violet accent in LIGHT
//      mode (the only light × non-violet rendering in any standing artifact
//      is ONE desktop calculator e2e view). This probe is the mobile sweep's
//      accent sibling in light mode.
//
// The reference's accent picker saves but never re-themes (re-verified live
// in session 3; the S4 remediation's own table) — the reference is
// permanently violet, so this is a SUPERSET-quality contract (the clone's
// own working accent system is the functional superset), not a parity
// contract.
//
// Run with NODE (the mobile-family precedent — imports no TS seam; the
// standing-suite runner classifies the envelope through suite-verdict):
//
//   node scripts/accent-light-sweep.mjs
//
// What it asserts, per accent (all 7, the documented order: violet, blue,
// green, orange, pink, red, teal), at 390×844 in LIGHT mode set through the
// REAL lifecycle (PATCHed via the settings API, self-verified on
// <html data-accent> + the light class — the S27 doctrine):
//   1. the chrome contract (sidebar hidden < 1024, hamburger visible) —
//      once, before the accent loop
//   2. per view (all 20, direct goto — the accent-dark-sweep's navigation
//      pattern; the drawer-navigation structural family is mobile-sweep's
//      contract): the identity heading (h1||h2 — the S8-H union; Dashboard
//      is the time-aware greeting regex), scrollWidth <= 390, the LIGHT
//      contrast detector family (unreadable < 2.2 / lowcontrast < 3.2 —
//      the accent-dark-sweep CHECKER's effectiveBg walk; the flashbulb
//      class does not apply on the light canvas), zero console errors
//   3. the drawer per accent (once): 20 links, the dialog-scoped contrast
//      detectors, the active-link tint recorded (the 10%-alpha accent
//      gradient — accent-driven)
//
// Self-verifying preconditions (the S27/S32/S33–S36 doctrine — a probe
// that cannot verify its own state fails loudly and emits NO findings):
//   - the viewport IS 390×844 (asserted on BOTH axes after launch)
//   - every accent APPLIES through the real lifecycle (PATCHed + verified
//     on <html data-accent>; the applied reading rides the envelope)
//   - the mode IS light (verified on <html>; the dark accent family
//     belongs to accent-dark-sweep)
//   - the closing restore: an explicit, awaited violet/light PATCH (the
//     demo resting state — never RELY on it being already correct)
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const W = 390;
const H = 844;
const VIEWPORT = { width: W, height: H };
const MAX_WIDTH = W;

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
const ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"];

function fail(msg) {
  console.error(`ACCENT-LIGHT-SWEEP PRECONDITION FAILED: ${msg}`);
  process.exit(1);
}

// The LIGHT-mode contrast checker (the accent-dark-sweep's CHECKER family,
// flashbulb dropped — an opaque light background is the light canvas
// itself, not a detection; the unreadable/lowcontrast thresholds are the
// accent-dark contract: FAIL < 2.2, WARN < 3.2). Scope includes the mobile
// chrome (header * — the app bar's brand + clock) and the open dialog.
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
    return bodyBg && bodyBg.a > 0.85 ? bodyBg : { r: 255, g: 255, b: 255, a: 1 };
  };
  const unreadable = [];
  const lowcontrast = [];
  for (const el of document.querySelectorAll('main *, aside *, header *, [role=dialog] *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
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
  return JSON.stringify({ unreadable, lowcontrast });
})()`;

// The drawer-scoped light checker — the same contrast detectors, scoped to
// the open dialog (the drawer's brand header, nav links, and close button
// must all read light-clean in EVERY accent; the active link's accent tint
// is recorded).
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
  // The active tint rides the INNER span (nav-items.tsx): the <a> itself is
  // transparent; the 10%-alpha accent gradient is the span's inline
  // backgroundImage (NAV_ACTIVE_GRADIENT_STOPS — accent-driven).
  const activeInner = active ? active.querySelector('span') : null;
  const activeStyle = activeInner ? getComputedStyle(activeInner) : null;
  return JSON.stringify({
    linkCount: dlg.querySelectorAll('a').length,
    unreadable, lowcontrast,
    activeTint: activeStyle ? activeStyle.backgroundImage.slice(0, 90) : null,
  });
})()`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT, hasTouch: true });

const consoleLog = [];
let logCursor = 0;
// The RUM beacon's designed backpressure (S18/ADR-016): the 1000/15-min
// per-user budget, when exhausted by a heavy sweep session, surfaces as the
// BROWSER's network-layer console line ("Failed to load resource: ... 429")
// — the beacon itself swallows the failure by design (no toast, no app
// console spam), and the browser's resource log is not suppressable from
// the app. The probe never sends AI/upload/auth-limited requests (one
// login, zero AI by construction), so within THIS probe's action space a
// 429 can only be the beacon's designed backpressure — verified against
// the dev log (every 429 in the log is POST /api/rum). The exact-text
// signature filter keeps the genuine console-error class loud.
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

  // --- the chrome contract (the vehicle below lg) ----------------------------
  // Wait for the shell first (the S16 hydration lesson): the auth gate +
  // pre-warm flip renders the hamburger only after hydration — a chrome
  // read right after waitForURL races the Splash.
  await page.waitForFunction(
    () => {
      const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Open navigation menu");
      return !!b && b.offsetParent !== null;
    },
    undefined,
    { timeout: 30000 },
  );
  const chromeRec = await page.evaluate(() => ({
    sidebarVisible: (() => { const a = document.querySelector("aside"); return !!a && a.offsetParent !== null; })(),
    hamburgerVisible: (() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Open navigation menu"); return !!b && b.offsetParent !== null; })(),
  }));
  if (chromeRec.sidebarVisible || !chromeRec.hamburgerVisible) {
    fail(`the chrome contract broke at 390 — sidebarVisible=${chromeRec.sidebarVisible}, hamburgerVisible=${chromeRec.hamburgerVisible} (the lg contract: below 1024 the drawer is the vehicle).`);
  }

  const findings = [];
  const accents = {};

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

    // --- the 20-view sweep (direct goto — the accent-dark-sweep pattern) ----
    for (const v of VIEWS) {
      const viewStart = logCursor;
      await page.goto(`${BASE}${v.path}`, { waitUntil: "load", timeout: 30000 });
      const rec = { heading: "", scrollWidth: 0, unreadable: [], lowcontrast: [], consoleErrors: [] };

      try {
        // The S33 proven pattern: the FIRST visible h1/h2 in DOM order.
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

      rec.scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      if (rec.scrollWidth > MAX_WIDTH) {
        findings.push({ accent, view: v.label, kind: "overflow", detail: `scrollWidth ${rec.scrollWidth} > ${MAX_WIDTH}` });
      }

      // The light contrast detector family (flashbulb does not apply).
      const light = JSON.parse(await page.evaluate(CHECKER));
      rec.unreadable = light.unreadable;
      rec.lowcontrast = light.lowcontrast;

      rec.consoleErrors = consoleLog.slice(viewStart);
      logCursor = consoleLog.length;
      if (rec.consoleErrors.length > 0) {
        findings.push({ accent, view: v.label, kind: "console-error", detail: `${rec.consoleErrors.length} console error(s): ${rec.consoleErrors.slice(0, 2).join(" | ").slice(0, 160)}` });
      }

      accentRec.views[v.label] = rec;
    }

    // --- the drawer per accent ------------------------------------------------
    try {
      await page.goto(`${BASE}/Dashboard`, { waitUntil: "load" });
      await page.waitForTimeout(900);
      await page.getByRole("button", { name: "Open navigation menu" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor({ state: "visible", timeout: 10000 });
      await page.waitForTimeout(700);
      const drawerRec = JSON.parse(await page.evaluate(DRAWER_CHECKER));
      if (drawerRec.error) {
        findings.push({ accent, kind: "drawer-missing", detail: drawerRec.error });
      } else {
        accentRec.drawer = drawerRec;
        if (drawerRec.linkCount !== VIEWS.length) {
          findings.push({ accent, kind: "link-count", detail: `drawer carried ${drawerRec.linkCount} links (expected ${VIEWS.length})` });
        }
      }
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden", timeout: 10000 });
    } catch (e) {
      findings.push({ accent, kind: "drawer-error", detail: String(e).slice(0, 140) });
      accentRec.drawer = accentRec.drawer ?? { linkCount: 0, unreadable: [], lowcontrast: [], activeTint: null };
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
    source: "accent-light-sweep",
    mode: "light",
    viewport: VIEWPORT,
    chrome: chromeRec,
    accents,
    findings,
  };
  // exit 0 iff the structural findings are empty AND every non-exempt
  // contrast detection is zero. The three DOCUMENTED non-gap signatures
  // (mirrored at the seam — suite-verdict's classifyAccentLightSweep): the
  // CTA-face (white on accent-500 — the S11 family-2 non-gap), the calendar
  // adjacent-month day numbers (slate-300 1-2 digit text — the S6-G
  // reference-measured pin, re-verified live on the reference), and the
  // yellow priority-pill vocabulary (yellow-500 {high,medium,low} — the
  // S6/S8 reference-measured pin). The seam re-derives the same counts.
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
      for (const e of rec.drawer.unreadable) {
        if (isCtaFace(e) || isCalendarAdjacentDay(e) || isYellowPriorityPill(e)) continue;
        detections += 1;
      }
    }
  }
  const exitCode = findings.length === 0 && detections === 0 ? 0 : 1;
  // S39-F (the stdout-flush race): this envelope measures ~150KB — a bare
  // process.exit() after console.log can truncate the ASYNC pipe write
  // mid-flush (the S39 validation run caught this probe truncated at
  // 146176 bytes with findings 0 — the runner read a false "stdout did not
  // parse"). The trailing-write callback fires only after every prior byte
  // has flushed to the pipe, so the exit can never cut the envelope.
  process.stdout.write(JSON.stringify(envelope, null, 1) + "\n", () => process.exit(exitCode));
} catch (e) {
  // The failure-path restore (the theme-spec lesson — an aborted restore
  // persists the accent and poisons every later violet pin).
  try {
    await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });
  } catch {}
  console.error(`ACCENT-LIGHT-SWEEP ABORTED: ${String(e).slice(0, 300)}`);
  process.exit(1);
}

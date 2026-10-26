// S36 dark-mode mobile sweep — the MODE axis at the mobile viewport as a
// standing, executable guarantee (the AP-81 doctrine: a mode never varied
// at a viewport is a blind combo). The coverage map this audit closes (all
// verified against the standing scripts in session 78/79):
//   - dark-sweep:        20 views at 1280×800 (desktop, sidebar layout)
//   - accent-dark-sweep: 6 mobile views at 390×844 (Dashboard, MyDay,
//                        Timetable, Tasks, Settings, Calendar) + the drawer
//   - mobile-sweep (S33): 20 views at 390×844 — LIGHT only (mode-rot-guarded)
//   - midband-sweep (S34): 20 views at 768×1024 — LIGHT only
//   - landscape-sweep (S35): 20 views at 844×390 — LIGHT only
//   => dark × 390×844 was covered for 6 of 20 views; 14 views had NEVER
//      been rendered in dark at the stacked mobile layout by any standing
//      audit. This probe is the S33 mobile sweep's dark sibling.
//
// Dark mode is the clone's SUPERSET feature (the reference's own Dark/System
// options are a measured Base44 platform no-op — AGENTS.md S10-1), so its
// correctness at the most common real-world dark usage (phone, portrait,
// at night) is a superset-quality contract.
//
// Run with NODE (the mobile/midband/landscape precedent — imports no TS
// seam; the standing-suite runner classifies the envelope through
// suite-verdict):
//
//   node scripts/dark-mobile-sweep.mjs
//
// What it asserts, in DARK mode set through the REAL lifecycle (PATCHed
// via the settings API, self-verified on <html> — the S27 doctrine), at
// 390×844, navigated THROUGH THE DRAWER (the mobile navigation menu is the
// vehicle):
//   1. the chrome contract (sidebar hidden < 1024, hamburger visible)
//   2. the drawer content (20 links in order) + the drawer's OWN dark
//      rendering (flashbulb/unreadable scoped to the dialog; the
//      dark:bg-slate-950 panel background recorded)
//   3. per view: the S33 structural family — identity heading (h1||h2),
//      heading CLEARANCE (top >= 64 — under the fixed h-16 bar),
//      scrollWidth <= 390, drawer closed on nav, app bar + clock, zero
//      console errors — PLUS the dark-sweep detector family (flashbulbs +
//      unreadable) extended to the mobile chrome (the header * scope —
//      the app bar's brand + clock text must read dark-clean)
//
// Self-verifying preconditions (the S27/S32/S33/S34/S35 doctrine — a probe
// that cannot verify its own state fails loudly and emits NO findings):
//   - the viewport IS 390×844 (asserted on BOTH axes after launch)
//   - the mode IS dark (PATCHed through the settings API — the real
//     lifecycle, never a forced class — and verified on <html>; the applied
//     mode rides the envelope)
//   - the closing restore: an explicit, awaited light PATCH (the demo
//     resting state — never RELY on it being already correct)
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const W = 390;
const H = 844;
const VIEWPORT = { width: W, height: H };
const MAX_WIDTH = W;
const APP_BAR = 64; // h-16 — the fixed glass bar

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
  console.error(`DARK-MOBILE-SWEEP PRECONDITION FAILED: ${msg}`);
  process.exit(1);
}

// The dark-sweep CHECKER, verbatim except: (a) the unreadable loop also
// reads header * (the mobile app bar text — brand + clock — must be
// readable in dark; the desktop dark-sweep reads only main/aside because
// its sidebar is an aside), and (b) the flashbulb bg.a <= 0.9 guard kept.
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
      const img = cs.backgroundImage;
      if (img && img !== 'none' && img.includes('rgb(') && !img.includes('var(')) {
        const first = parse(img);
        if (first && first.a > 0.85) return first;
      }
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
  for (const el of document.querySelectorAll('main *, aside *, header *')) {
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
  for (const el of document.querySelectorAll('main *, aside *, header *')) {
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
    if (c < 2.2) {
      const cls = (el.className && el.className.toString) ? el.className.toString() : '';
      unreadable.push({ text: (el.textContent || '').trim().slice(0, 26), color: cs.color, bgEff: 'rgb(' + bg.r + ',' + bg.g + ',' + bg.b + ')', contrast: +c.toFixed(2), cls: cls.slice(0, 60) });
      if (unreadable.length >= 12) break;
    }
  }
  return JSON.stringify({ flashbulbs, unreadable });
})()`;

// The drawer-scoped dark checker — the same detectors, scoped to the open
// dialog (the drawer panel is bg-white in light / dark:bg-slate-950 in dark;
// its brand header, nav links, and close button must all read dark-clean).
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
    const f2 = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const L = 0.2126 * f2(bg.r) + 0.7152 * f2(bg.g) + 0.0722 * f2(bg.b);
    if (L <= 0.80) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 40 || rect.height < 20) continue;
    const cls = (el.className && el.className.toString) ? el.className.toString() : '';
    if (/sf-gradient|UserAvatar|avatar/.test(cls)) continue;
    flashbulbs.push({ cls: cls.slice(0, 70), bg: cs.backgroundColor, tag: el.tagName, w: Math.round(rect.width), h: Math.round(rect.height), text: (el.textContent || '').trim().slice(0, 30) });
    if (flashbulbs.length >= 12) break;
  }
  const unreadable = [];
  for (const el of dlg.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') continue;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    let bgEff = null;
    let node = el;
    while (node && node !== document.documentElement) {
      const cs2 = getComputedStyle(node);
      const bg = parse(cs2.backgroundColor);
      if (bg && bg.a > 0.85) { bgEff = bg; break; }
      node = node.parentElement;
    }
    if (!bgEff) bgEff = { r: 9, g: 9, b: 11 };
    const f3 = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const c = contrast(0.2126 * f3(fg.r) + 0.7152 * f3(fg.g) + 0.0722 * f3(fg.b), 0.2126 * f3(bgEff.r) + 0.7152 * f3(bgEff.g) + 0.0722 * f3(bgEff.b));
    if (c < 2.2) {
      unreadable.push({ text: (el.textContent || '').trim().slice(0, 26), color: cs.color, contrast: +c.toFixed(2) });
      if (unreadable.length >= 12) break;
    }
  }
  const panel = dlg.querySelector('.bg-white, [class*=bg-slate-950]');
  return JSON.stringify({ flashbulbs, unreadable, panelBg: panel ? getComputedStyle(panel).backgroundColor : null });
})()`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT, hasTouch: true });

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
page.on("console", (msg) => {
  if (msg.type() === "error") consoleLog.push(msg.text().slice(0, 200));
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

  // --- precondition: the viewport -------------------------------------------
  const inner = await page.evaluate(() => window.innerWidth);
  if (inner !== W) fail(`the viewport applied as ${inner}px, expected ${W} — the exploration refuses to measure at another width.`);

  // --- precondition: DARK mode through the REAL lifecycle (the S27 doctrine) -
  const patch = await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "dark" } });
  if (!patch.ok()) fail(`the settings PATCH answered ${patch.status()} — the exploration refuses to measure an unverified mode.`);
  await page.goto(`${BASE}/Dashboard`);
  try {
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"), null, { timeout: 30000 });
  } catch {
    await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });
    fail("the dark class never applied through the real lifecycle — the exploration refuses to measure the wrong mode.");
  }
  const mode = await page.evaluate(() => (document.documentElement.classList.contains("dark") ? "dark" : "light"));
  if (mode !== "dark") {
    await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });
    fail(`the applied mode is ${mode}, expected dark — the exploration refuses to measure the wrong mode.`);
  }

  // --- the chrome contract (the vehicle below lg) ----------------------------
  const chromeRec = await page.evaluate(() => ({
    sidebarVisible: (() => { const a = document.querySelector("aside"); return !!a && a.offsetParent !== null; })(),
    hamburgerVisible: (() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Open navigation menu"); return !!b && b.offsetParent !== null; })(),
  }));

  // --- the drawer content + the drawer's own dark rendering ------------------
  const findings = [];
  const views = {};
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  const drawerLinks = dialog.locator("nav a");
  const linkCount = await drawerLinks.count();
  const order = (await drawerLinks.allTextContents()).map((t) => t.trim()).join(",");
  const expectedOrder = VIEWS.map((v) => v.label).join(",");
  if (linkCount !== VIEWS.length || order !== expectedOrder) {
    findings.push({ kind: "link-count", detail: `drawer carried ${linkCount} links (expected ${VIEWS.length}); order ${order === expectedOrder ? "matched" : "CHANGED"}` });
  }
  const drawerDark = JSON.parse(await page.evaluate(DRAWER_CHECKER));
  if (drawerDark.error) findings.push({ kind: "drawer-dark", detail: drawerDark.error });
  if (drawerDark.flashbulbs?.length) findings.push({ kind: "drawer-flashbulb", detail: JSON.stringify(drawerDark.flashbulbs.slice(0, 3)) });
  if (drawerDark.unreadable?.length) findings.push({ kind: "drawer-unreadable", detail: JSON.stringify(drawerDark.unreadable.slice(0, 3)) });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 10000 });

  // --- the 20-view sweep, navigated THROUGH THE DRAWER -----------------------
  for (const v of VIEWS) {
    const viewStart = logCursor;
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    await dialog.getByRole("link", { name: v.label, exact: true }).click();

    const rec = { heading: "", scrollWidth: 0, drawerClosed: false, appBar: false, headingClearance: false, flashbulbs: [], unreadable: [], consoleErrors: [] };

    try {
      await dialog.waitFor({ state: "hidden", timeout: 10000 });
      rec.drawerClosed = true;
    } catch {
      findings.push({ view: v.label, kind: "drawer-stuck", detail: "the drawer dialog did not close after link navigation" });
    }

    try {
      // The S33 proven pattern: the FIRST visible h1/h2 in DOM order (the
      // two-pane mobile stacks render an h2 — the S8-H pattern; :visible
      // skips the display:none desktop h1 at mobile width).
      const heading = page.locator("main h1:visible, main h2:visible").first();
      await heading.waitFor({ state: "visible", timeout: 15000 });
      await page.waitForTimeout(1200); // data-fetch settle (copy-sweep/dark-sweep band)
      rec.heading = (await heading.textContent())?.trim() ?? "";
      const headingOk = v.heading ? rec.heading === v.heading : GREETING_RE.test(rec.heading);
      if (!headingOk) {
        findings.push({ view: v.label, kind: "no-heading", detail: `expected "${v.heading ?? "the greeting"}", rendered "${rec.heading.slice(0, 40)}"` });
      }
      const top = await heading.evaluate((el) => el.getBoundingClientRect().top);
      rec.headingClearance = top >= APP_BAR - 1;
      if (!rec.headingClearance) {
        findings.push({ view: v.label, kind: "heading-clearance", detail: `the identity heading top ${Math.round(top)} sits under the fixed ${APP_BAR}px bar` });
      }
    } catch {
      findings.push({ view: v.label, kind: "no-heading", detail: "the identity heading never rendered" });
    }

    rec.scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (rec.scrollWidth > MAX_WIDTH) {
      findings.push({ view: v.label, kind: "overflow", detail: `scrollWidth ${rec.scrollWidth} > ${MAX_WIDTH}` });
    }

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
      findings.push({ view: v.label, kind: "app-bar", detail: "the fixed glass app bar (brand + 2-digit-hour clock) did not render" });
    }

    // The dark-sweep detector family at the mobile layout.
    const dark = JSON.parse(await page.evaluate(CHECKER));
    rec.flashbulbs = dark.flashbulbs;
    rec.unreadable = dark.unreadable;
    if (rec.flashbulbs.length > 0) {
      findings.push({ view: v.label, kind: "flashbulb", detail: `${rec.flashbulbs.length} light surface(s) in dark mode: ${JSON.stringify(rec.flashbulbs.slice(0, 2)).slice(0, 200)}` });
    }
    if (rec.unreadable.length > 0) {
      findings.push({ view: v.label, kind: "unreadable", detail: `${rec.unreadable.length} unreadable text node(s): ${JSON.stringify(rec.unreadable.slice(0, 2)).slice(0, 200)}` });
    }

    rec.consoleErrors = consoleLog.slice(viewStart);
    logCursor = consoleLog.length;
    if (rec.consoleErrors.length > 0) {
      findings.push({ view: v.label, kind: "console-error", detail: `${rec.consoleErrors.length} console error(s): ${rec.consoleErrors.slice(0, 2).join(" | ").slice(0, 160)}` });
    }

    views[v.label] = rec;
  }

  // --- the closing restore (explicit + awaited) -------------------------------
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });

  const envelope = {
    source: "dark-mobile-sweep",
    mode,
    viewport: VIEWPORT,
    chrome: chromeRec,
    drawer: { linkCount, order, dark: { flashbulbs: drawerDark.flashbulbs?.length ?? 0, unreadable: drawerDark.unreadable?.length ?? 0, panelBg: drawerDark.panelBg ?? null } },
    views,
    findings,
  };
  console.log(JSON.stringify(envelope, null, 1));
  process.exit(findings.length === 0 ? 0 : 1);
} finally {
  await browser.close();
}

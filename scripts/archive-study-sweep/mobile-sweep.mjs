// S33 mobile light-mode sweep — the mobile navigation menu's executable
// guarantee (the AP-78 doctrine: the manual 390×844 walkthrough every session
// narrative recorded as prose, encoded as a standing probe).
//
// Run with NODE (the dark-sweep/forced-colors precedent — imports no TS seam;
// the standing-suite runner classifies the envelope through suite-verdict):
//
//   node scripts/mobile-sweep.mjs
//
// What it asserts, navigated THROUGH THE DRAWER (the mobile navigation menu
// is the vehicle, not a bystander):
//   1. the drawer opens from the hamburger and carries exactly 20 links in
//      the documented NAV order (checked once, on the first open — the
//      GEOMETRY stays in drawer-check-s14, which compares both apps)
//   2. per view: the link click navigates (URL), the drawer CLOSES on
//      navigation, the view renders its identity heading, there is NO
//      horizontal overflow (documentElement.scrollWidth <= 390 — the S16
//      lesson: mobile-only gaps hide behind desktop pins), ZERO console
//      errors surface during the view, and the fixed glass app bar renders
//      (brand + the 2-digit-hour clock)
//
// Self-verifying preconditions (the S27/S32 doctrine — a probe that cannot
// verify its own state fails loudly and emits NO findings):
//   - the viewport IS 390×844 (asserted after launch — a viewport that
//     failed to apply must never be swept)
//   - the mode IS light (PATCHed through the settings API — the real
//     lifecycle, never a forced class — and verified on <html>; the applied
//     mode rides the envelope; the dark/accent mobile surfaces belong to
//     their own audits)
//   - the closing restore: an explicit, awaited light PATCH (the demo
//     resting state — never RELY on it being already correct)
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const VIEWPORT = { width: 390, height: 844 };
const MAX_WIDTH = 390;

// The documented NAV order (src/lib/router.ts) with each view's identity
// heading — the h1 the ViewHeader (or the two-pane left pane) renders.
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
  console.error(`MOBILE-SWEEP PRECONDITION FAILED: ${msg}`);
  process.exit(1);
}

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


// Per-view console errors: a page-level listener from before the first
// navigation; each view's count is the delta since its navigation began.
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

  // --- precondition: the viewport IS the mobile 390×844 --------------------
  const inner = await page.evaluate(() => window.innerWidth);
  if (inner !== VIEWPORT.width) {
    fail(`the viewport applied as ${inner}px, expected ${VIEWPORT.width} — the sweep refuses to measure at another width.`);
  }

  // --- precondition: light mode through the REAL lifecycle (dark-sweep) ---
  const patch = await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });
  if (!patch.ok()) {
    fail(`the settings PATCH answered ${patch.status()} — the sweep refuses to measure an unverified mode.`);
  }
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(() => /good (morning|afternoon|evening)/i.test(document.querySelector("main h1")?.textContent ?? ""), null, { timeout: 30000 });
  const mode = await page.evaluate(() => (document.documentElement.classList.contains("dark") ? "dark" : "light"));
  if (mode !== "light") {
    await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });
    fail(`the applied mode is ${mode}, expected light — the sweep refuses to measure the wrong mode.`);
  }

  // --- the drawer-content check (once, on the first open) -------------------
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
  // Close the drawer before the sweep — every loop iteration opens it fresh
  // through the hamburger (the overlay would otherwise intercept the click;
  // the e2e drawer spec documents the same interception).
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 10000 });

  // --- the 20-view sweep, navigated THROUGH THE DRAWER ----------------------
  for (const v of VIEWS) {
    const viewStart = logCursor;
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    await dialog.getByRole("link", { name: v.label, exact: true }).click();

    const rec = { heading: "", scrollWidth: 0, drawerClosed: false, appBar: false, consoleErrors: [] };

    // The drawer closes on navigation (the observable end state — S8/S16).
    try {
      await dialog.waitFor({ state: "hidden", timeout: 10000 });
      rec.drawerClosed = true;
    } catch {
      findings.push({ view: v.label, kind: "drawer-stuck", detail: "the drawer dialog did not close after link navigation" });
    }

    // The identity heading renders (Dashboard = the time-aware greeting).
    // h1 OR h2 — the two-pane views' mobile stacks render an h2 (the S8-H
    // pattern: the single h1 lives in the hidden desktop pane below lg);
    // the copy sweep gates on the same h1||h2 union. :visible skips the
    // display:none desktop h1 at mobile width.
    try {
      const heading = page.locator("main h1:visible, main h2:visible").first();
      await heading.waitFor({ state: "visible", timeout: 15000 });
      await page.waitForTimeout(1200); // data-fetch settle (copy-sweep/dark-sweep band)
      rec.heading = (await heading.textContent())?.trim() ?? "";
      const headingOk = v.heading ? rec.heading === v.heading : GREETING_RE.test(rec.heading);
      if (!headingOk) {
        findings.push({ view: v.label, kind: "no-heading", detail: `expected "${v.heading ?? "the greeting"}", rendered "${rec.heading.slice(0, 40)}"` });
      }
    } catch {
      findings.push({ view: v.label, kind: "no-heading", detail: "the identity heading never rendered" });
    }

    // No horizontal overflow — the S16 mobile-only-gap guarantee.
    rec.scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (rec.scrollWidth > MAX_WIDTH) {
      findings.push({ view: v.label, kind: "overflow", detail: `scrollWidth ${rec.scrollWidth} > ${MAX_WIDTH}` });
    }

    // The fixed glass app bar: brand + the 2-digit-hour clock (the mobile chrome).
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

    // Console errors surfaced during THIS view's navigation + settle.
    rec.consoleErrors = consoleLog.slice(viewStart);
    logCursor = consoleLog.length;
    if (rec.consoleErrors.length > 0) {
      findings.push({ view: v.label, kind: "console-error", detail: `${rec.consoleErrors.length} console error(s): ${rec.consoleErrors.slice(0, 2).join(" | ").slice(0, 160)}` });
    }

    views[v.label] = rec;
  }

  // --- the closing restore (explicit + awaited — the theme-spec lesson) -----
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });

  const envelope = {
    source: "mobile-sweep",
    mode,
    viewport: VIEWPORT,
    drawer: { linkCount, order },
    views,
    findings,
  };
  console.log(JSON.stringify(envelope, null, 1));
  process.exit(findings.length === 0 ? 0 : 1);
} finally {
  await browser.close();
}

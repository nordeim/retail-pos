// S34 mid-band light-mode sweep — the 391–1023px viewport continuum's
// executable guarantee (the AP-79 doctrine: a viewport band between pinned
// widths is a blind band — the mobile sweep pins 390, the desktop audits pin
// 1280/1440, and the lg pin covers only the sidebar appearance on Dashboard
// at 1024; nothing probed the band between, where the sm/md breakpoints
// switch real structure and the drawer remains the only navigation vehicle).
//
// Run with NODE (the mobile-sweep precedent — imports no TS seam; the
// standing-suite runner classifies the envelope through suite-verdict):
//
//   node scripts/midband-sweep.mjs
//
// The band's representative width: 768×1024 — the md breakpoint (the
// switchiest width in the band: the Timetable swaps its mobile accordion
// for the min-w-[900px] scroll canvas, grids go multi-column, headers go
// flex-row) and iPad portrait, a real device class.
//
// What it asserts, navigated THROUGH THE DRAWER (the navigation vehicle
// through the whole band — the sidebar is lg:flex, so below 1024 the drawer
// is the only vehicle):
//   1. the chrome contract (a PRECONDITION): the desktop aside sidebar is
//      hidden AND the hamburger is visible at 768 — if the lg contract
//      broke, the probe refuses to measure (loud exit 1, no findings)
//   2. the drawer opens and carries exactly 20 links in the documented NAV
//      order (checked once, on the first open)
//   3. per view: the link click navigates, the drawer CLOSES on navigation,
//      the view renders its identity heading (h1 OR h2 — the two-pane
//      mobile stacks render h2s through the whole band, the S8-H pattern),
//      there is NO horizontal overflow (documentElement.scrollWidth <= 768 —
//      the Timetable's min-w-[900px] canvas must live INSIDE its
//      overflow-x-auto container, never widen the document), ZERO console
//      errors, and the fixed glass app bar renders (brand + the
//      2-digit-hour clock — the app bar is lg:hidden, visible through the
//      whole band)
//
// Self-verifying preconditions (the S27/S32/S33 doctrine — a probe that
// cannot verify its own state fails loudly and emits NO findings):
//   - the viewport IS 768×1024 (asserted after launch)
//   - the mode IS light (PATCHed through the settings API — the real
//     lifecycle, never a forced class — and verified on <html>)
//   - the closing restore: an explicit, awaited light PATCH (the demo
//     resting state — never RELY on it being already correct)
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const VIEWPORT = { width: 768, height: 1024 };
const MAX_WIDTH = 768;

// The documented NAV order (src/lib/router.ts) with each view's identity
// heading — the h1 the ViewHeader (or the two-pane mobile stack) renders.
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
  console.error(`MIDBAND-SWEEP PRECONDITION FAILED: ${msg}`);
  process.exit(1);
}

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

  // --- precondition: the viewport IS the mid-band 768×1024 ------------------
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

  // --- precondition: the chrome contract (the vehicle model at 768) --------
  // The desktop sidebar must be hidden (lg:flex = visible only >= 1024) and
  // the hamburger visible — the drawer is the navigation vehicle through the
  // whole 391-1023 band. A broken lg contract means the sweep cannot run.
  const sidebarVisible = await page.locator("aside").isVisible().catch(() => false);
  const hamburgerVisible = await page.getByRole("button", { name: "Open navigation menu" }).isVisible().catch(() => false);
  if (sidebarVisible || !hamburgerVisible) {
    fail(`the chrome contract broke at 768 — sidebarVisible=${sidebarVisible}, hamburgerVisible=${hamburgerVisible} (the lg contract: the sidebar renders only >=1024; below that the drawer is the vehicle).`);
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
    // h1 OR h2 — the two-pane views' mobile stacks render an h2 through the
    // whole band (the S8-H pattern: the single h1 lives in the hidden
    // desktop pane below lg); the copy sweep gates on the same h1||h2 union.
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

    // No horizontal overflow — the Timetable's min-w-[900px] canvas must
    // live INSIDE its overflow-x-auto container, never widen the document.
    rec.scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (rec.scrollWidth > MAX_WIDTH) {
      findings.push({ view: v.label, kind: "overflow", detail: `scrollWidth ${rec.scrollWidth} > ${MAX_WIDTH}` });
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
    source: "midband-sweep",
    mode,
    viewport: VIEWPORT,
    chrome: { sidebarVisible, hamburgerVisible },
    drawer: { linkCount, order },
    views,
    findings,
  };
  console.log(JSON.stringify(envelope, null, 1));
  process.exit(findings.length === 0 ? 0 : 1);
} finally {
  await browser.close();
}

// Regenerate the docs/screenshots catalog from the DEV server (:3000).
// Session-3 refresh: login + all 20 desktop views (1440×900) + 3 mobile
// captures (390×844: dashboard, navigation drawer open, tasks).
// Usage: node scripts/capture-studyflow.mjs   (dev server must be running)
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = new URL("../docs/screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const DEMO_EMAIL = "demo@studyflow.app";
const DEMO_PASSWORD = "Demo1234!";

const browser = await chromium.launch();

// Sign in once via the login page (page-based keeps the flow honest and
// avoids API-context quirks under bun); reuse the session cookie after.
const loginCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const lp = await loginCtx.newPage();
await lp.goto(BASE + "/login", { waitUntil: "load" });
// networkidle never fires against the dev server (persistent dev-tools
// connections) — wait for React hydration instead: the login button's
// disabled state is React-managed, so poll until the inputs' values are
// reflected (fill, then wait, re-fill once if hydration raced us).
await lp.waitForTimeout(2000);
// S78 fix: the S15 auth rework renamed the ids (email → auth-email) —
// select by type, which survives id churn.
await lp.fill('input[type="email"]', DEMO_EMAIL);
await lp.fill('input[type="password"]', DEMO_PASSWORD);
await lp.click('button[type="submit"]');
await lp.waitForURL(/\/Dashboard/, { timeout: 20_000 });
const cookies = await loginCtx.cookies(BASE);
const session = cookies.find((c) => c.name === "sf_session");
if (!session) throw new Error("no sf_session cookie after login");
console.log("login: ok");
await loginCtx.close();

// The captures are LIGHT-mode by contract — force the demo user's persisted
// themeMode to light first (the dev user may have been left dark by a prior
// session-10 audit probe).
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addCookies([{ name: "sf_session", value: session.value, url: BASE }]);
  const page = await ctx.newPage();
  await page.goto(BASE + "/Dashboard", { waitUntil: "load" });
  const res = await page.request.patch(BASE + "/api/settings/preferences", {
    data: { themeMode: "light" },
  });
  if (!res.ok()) throw new Error("light-mode guard PATCH failed");
  await ctx.close();
  console.log("theme: light (guard)");
}

// The login page capture + desktop views run against the FIRST browser
// instance; the mobile phase relaunches a fresh one — long capture runs
// degrade the shared Chromium (memory pressure) and the drawer tap timed
// out at the tail of the run (session-7 finding).
let currentBrowser = browser;

async function relaunchBrowser() {
  await currentBrowser.close();
  currentBrowser = await chromium.launch();
}

const VIEWS = [
  "Dashboard", "MyDay", "Tasks", "Calendar", "Events", "Timetable",
  "Assignments", "Exams", "Notes", "Flashcards", "PracticeTests",
  "StudyGroups", "GradeTracker", "Analytics", "Files", "Calculator",
  "MathSolver", "AIAssistant", "FocusTimer", "Settings",
];

async function shot(name, ctxOptions, path, run) {
  const ctx = await currentBrowser.newContext({ deviceScaleFactor: 1, ...ctxOptions });
  await ctx.addCookies([{ name: "sf_session", value: session.value, url: BASE }]);
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  if (run) await run(page);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("captured", name);
  await ctx.close();
}

const desktop = { viewport: { width: 1440, height: 900 } };
const mobile = { viewport: { width: 390, height: 844 } };
const mobileTouch = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

// 01 — the login card (logged-out context).
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/login", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/01-login.png` });
  console.log("captured 01-login");
  await ctx.close();
}

// 02–21 — every desktop view. The Flashcards capture opens the seeded
// "Integration rules" deck first so the card grid + study controls show
// (session-7: the view defaults to its "Select a deck" empty state).
// The browser relaunches every 7 views — long-lived shared Chromium
// instances degrade under the container's memory ceiling and late-run
// locators time out (session-7 finding).
for (let i = 0; i < VIEWS.length; i++) {
  if (i > 0 && i % 7 === 0) await relaunchBrowser();
  const view = VIEWS[i];
  const run =
    view === "Flashcards"
      ? async (page) => {
          await page
            .locator('[aria-label="Deck rows"] > div', { hasText: "Integration rules" })
            .first()
            .click();
          await page.waitForTimeout(900);
        }
      : undefined;
  await shot(`desktop-${view}`, desktop, `/${view}`, run);
}

// Fresh browser for the mobile phase (see relaunchBrowser note above).
await relaunchBrowser();

// 22–24 — mobile chrome: dashboard (fixed glass bar + content at 80px),
// the navigation drawer open (288px panel), and the Tasks view.
await shot("mobile-dashboard", mobile, "/Dashboard");
await shot("mobile-navigation-drawer", mobileTouch, "/Dashboard", async (page) => {
  await page.getByRole("button", { name: "Open navigation menu" }).tap();
  await page.waitForTimeout(700);
});
await shot("mobile-tasks", mobile, "/Tasks");

// 25–30 — session-10 DARK-mode captures: the same dev server with the demo
// user PATCHed to dark mode (restored to light afterward). The reference's
// own Dark option is a measured platform no-op, so these captures document
// the clone's dark-mode superset — every surface re-themes (token utilities,
// the overdue banner, the clock chip, chart axes).
{
  const ctx = await currentBrowser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addCookies([{ name: "sf_session", value: session.value, url: BASE }]);
  const page = await ctx.newPage();
  await page.goto(BASE + "/Dashboard", { waitUntil: "load" });
  const res = await page.request.patch(BASE + "/api/settings/preferences", {
    data: { themeMode: "dark" },
  });
  if (!res.ok()) throw new Error("dark-mode PATCH failed");
  await ctx.close();
  console.log("theme: dark");
}
const darkHydrated = async (page) => {
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
};
for (const view of ["Dashboard", "Tasks", "Calendar", "Analytics", "Settings"]) {
  await shot(`dark-${view}`, desktop, `/${view}`, darkHydrated);
}
await shot("dark-mobile-navigation-drawer", mobileTouch, "/Dashboard", async (page) => {
  await darkHydrated(page);
  await page.getByRole("button", { name: "Open navigation menu" }).tap();
  await page.waitForTimeout(700);
});
// 31 — session-11 dark-LOGIN capture: a FRESH visitor (no session cookie,
// empty localStorage) on a dark-OS device — the pre-paint boot script themes
// the login route via the prefers-color-scheme fallback.
{
  const ctx = await currentBrowser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/login", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/dark-Login.png` });
  console.log("captured dark-Login");
  await ctx.close();
}
// Restore light for the demo user (the dev server's resting state).
{
  const ctx = await currentBrowser.newContext();
  await ctx.addCookies([{ name: "sf_session", value: session.value, url: BASE }]);
  const page = await ctx.newPage();
  await page.goto(BASE + "/Dashboard", { waitUntil: "load" });
  const res = await page.request.patch(BASE + "/api/settings/preferences", {
    data: { themeMode: "light" },
  });
  if (!res.ok()) throw new Error("light-restore PATCH failed");
  await ctx.close();
  console.log("theme: light (restored)");
}

await currentBrowser.close();
console.log("done — " + (VIEWS.length + 11) + " captures in " + OUT);

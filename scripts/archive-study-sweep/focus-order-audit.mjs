// Keyboard-only focus-order audit — session-12 (the two-pane views + shell).
// For each audited view: Tab through the first N stops recording tag/label/
// in-viewport/outline-visibility; assert no stop lands on an invisible or
// off-screen element and every stop has a visible focus indicator.
// Also: dialog focus trap + Escape close; mobile drawer focus trap.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const VIEWS = ["Dashboard", "Tasks", "Notes", "StudyGroups", "Flashcards", "Calendar", "Settings"];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
await page.goto(`${BASE}/login`);
await page.fill("input[type=email]", "demo@studyflow.app");
await page.fill("input[type=password]", "Demo1234!");
await page.click("button[type=submit]");
await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
await page.waitForTimeout(1200);

const STOP = `(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return { body: true };
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const inVp = r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth && r.width > 0 && r.height > 0;
  const outlineVisible = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
  const ring = cs.boxShadow !== 'none';
  return {
    tag: el.tagName,
    label: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 28),
    inVp,
    outlineVisible,
    ring,
    indicator: outlineVisible || ring,
  };
})()`;

const out = { views: {}, dialogs: {}, drawer: {}, skipLink: null };

for (const v of VIEWS) {
  await page.goto(`${BASE}/${v}`);
  await page.waitForTimeout(1500);
  const stops = [];
  let anomalies = [];
  for (let i = 0; i < 26; i++) {
    await page.keyboard.press("Tab");
    const s = await page.evaluate(STOP);
    stops.push(s);
    if (s.body) break;
    if (!s.inVp) anomalies.push({ i, ...s });
    if (!s.indicator) anomalies.push({ i, issue: "no-indicator", ...s });
  }
  out.views[v] = {
    stopCount: stops.filter((s) => !s.body).length,
    reachedBody: stops.some((s) => s.body),
    firstMainStop: stops.findIndex((s) => !s.body && s.label && !/dashboard|my day|tasks|calendar|events|timetable|assignments|exams|notes|flashcards|practice|study|grade|analytics|files|calculator|math|ai|focus|settings/i.test(s.label || "")),
    anomalies: anomalies.slice(0, 6),
    sequence: stops.filter((s) => !s.body).map((s) => `${s.tag}:${s.label}`).slice(0, 26),
  };
  console.error(`view ${v} done (${out.views[v].stopCount} stops, ${anomalies.length} anomalies)`);
}

// Skip link presence
out.skipLink = await page.evaluate(`(() => {
  const skip = document.querySelector('a[href="#main"], a[class*=skip], a:is([aria-label*=skip i])');
  const main = document.querySelector('main');
  return JSON.stringify({ skipLink: !!skip, mainHasId: main ? !!main.id : false, mainTabIndex: main ? main.getAttribute('tabindex') : null });
})()`);

// Dialog focus trap + Escape (Tasks view, New Task dialog)
await page.goto(`${BASE}/Tasks`);
await page.waitForTimeout(1500);
try {
  await page.getByRole("button", { name: /add task/i }).click();
  await page.waitForSelector("[role=dialog]", { timeout: 5000 });
  await page.waitForTimeout(600);
  const dialogStops = [];
  let escaped = false;
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    const s = await page.evaluate(`(() => {
      const el = document.activeElement;
      const dlg = document.querySelector('[role=dialog]');
      const inDialog = !!(el && dlg && dlg.contains(el));
      return JSON.stringify({ tag: el?.tagName, label: (el?.getAttribute('aria-label') || el?.textContent || '').trim().slice(0, 20), inDialog });
    })()`);
    dialogStops.push(JSON.parse(s));
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  escaped = await page.evaluate(`!document.querySelector('[role=dialog]')`);
  out.dialogs.newTask = { stops: dialogStops, allTrapped: dialogStops.every((s) => s.inDialog), escapeCloses: escaped };
} catch (e) {
  out.dialogs.newTask = { error: String(e).slice(0, 150) };
}

// Mobile drawer focus trap
const mobile = await context.newPage();
await mobile.setViewportSize({ width: 390, height: 844 });
await mobile.goto(`${BASE}/Dashboard`);
await mobile.waitForTimeout(1200);
try {
  await mobile.getByRole("button", { name: "Open navigation menu" }).click();
  await mobile.waitForTimeout(700);
  const drawerStops = [];
  for (let i = 0; i < 12; i++) {
    await mobile.keyboard.press("Tab");
    const s = await mobile.evaluate(`(() => {
      const el = document.activeElement;
      const dlg = document.querySelector('[role=dialog]');
      const inDrawer = !!(el && dlg && dlg.contains(el));
      return JSON.stringify({ tag: el?.tagName, label: (el?.getAttribute('aria-label') || el?.textContent || '').trim().slice(0, 20), inDrawer });
    })()`);
    drawerStops.push(JSON.parse(s));
  }
  await mobile.keyboard.press("Escape");
  await mobile.waitForTimeout(500);
  const closed = await mobile.evaluate(`!document.querySelector('[role=dialog]')`);
  out.drawer = { stops: drawerStops, allTrapped: drawerStops.every((s) => s.inDrawer), escapeCloses: closed };
} catch (e) {
  out.drawer = { error: String(e).slice(0, 150) };
}
await mobile.close();

writeFileSync("/tmp/focus-audit.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await browser.close();

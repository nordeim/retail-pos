// S36 evidence capture — the drawer OPEN at 390×844 in DARK mode: the
// dark-mobile story in one frame — the dark glass app bar, the
// dark:bg-slate-950 drawer panel with its nav links, the dark canvas.
// The capture opens the drawer from the Dashboard in dark mode (set through
// the settings API — the real lifecycle) and screenshots the open state;
// the measured dark geometry rides the JSON envelope (the panel's computed
// background, the app-bar visibility, the scrollWidth).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots/s36-dark-mobile-drawer-390.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });

  // Dark mode through the real lifecycle (the S27 doctrine) — self-verified.
  const patch = await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "dark" } });
  if (!patch.ok()) throw new Error(`the settings PATCH answered ${patch.status()}`);
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"), null, { timeout: 30000 });

  // Open the drawer (the mobile navigation vehicle).
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(600);

  // The dark geometry, measured in the open state.
  const panelBg = await dialog.locator(".bg-white, [class*=bg-slate-950]").first().evaluate((el) => getComputedStyle(el).backgroundColor);
  const linkCount = await dialog.locator("nav a").count();
  const appBarVisible = await page.getByRole("banner").isVisible();
  const appBarText = await page.getByRole("banner").textContent();
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  const mode = await page.evaluate(() => (document.documentElement.classList.contains("dark") ? "dark" : "light"));

  await page.screenshot({ path: OUT });

  // The closing restore (explicit + awaited — the demo resting state).
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 10000 });
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });

  console.log(JSON.stringify({
    source: "capture-s36-evidence",
    out: OUT,
    mode,
    viewport: { width: 390, height: 844 },
    drawer: { linkCount, panelBg },
    appBar: { visible: appBarVisible, brandClock: /StudyFlow/.test(appBarText ?? "") && /\d{2}:\d{2} (AM|PM)/.test(appBarText ?? "") },
    scrollWidth: scrollW,
  }, null, 1));
} finally {
  await browser.close();
}

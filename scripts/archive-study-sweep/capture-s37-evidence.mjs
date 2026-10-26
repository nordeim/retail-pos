// S37 evidence capture — the drawer OPEN at 390×844 in LIGHT mode under the
// TEAL accent: the accent-light story in one frame — the light glass app
// bar, the white drawer panel with its nav links, and the TEAL-tinted
// active Dashboard link (the 10%-alpha NAV_ACTIVE_GRADIENT_STOPS gradient)
// — the accent the standing surface had never varied in light mode, now
// applied and rendered. The capture PATCHes teal + light through the
// settings API (the real lifecycle), opens the drawer from the Dashboard,
// and screenshots the open state; the measured accent geometry rides the
// JSON envelope (the active link's computed gradient + text color, the
// panel's background, the <html data-accent> reading, the scrollWidth).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots/s37-accent-light-drawer-teal-390.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });

  // Teal + light through the real lifecycle (the S27 doctrine) — self-verified.
  const patch = await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "teal" } });
  if (!patch.ok()) throw new Error(`the settings PATCH answered ${patch.status()}`);
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(
    () => document.documentElement.dataset.accent === "teal" && !document.documentElement.classList.contains("dark"),
    undefined,
    { timeout: 30000 },
  );

  // Wait for the shell (the S16 hydration lesson) before the drawer click.
  await page.waitForFunction(
    () => {
      const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Open navigation menu");
      return !!b && b.offsetParent !== null;
    },
    undefined,
    { timeout: 30000 },
  );

  // Open the drawer (the mobile navigation vehicle).
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(600);

  // The accent geometry, measured in the open state (the INNER-span read —
  // the active tint rides the span inside the aria-current link).
  const activeRead = await dialog.locator("a[aria-current=page] span").first().evaluate((el) => ({
    tint: getComputedStyle(el).backgroundImage.slice(0, 110),
    color: getComputedStyle(el).color,
  }));
  const linkCount = await dialog.locator("nav a").count();
  const panelBg = await dialog.locator(".bg-white").first().evaluate((el) => getComputedStyle(el).backgroundColor);
  const appBarVisible = await page.getByRole("banner").isVisible();
  const appBarText = await page.getByRole("banner").textContent();
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  const applied = await page.evaluate(() => document.documentElement.dataset.accent);
  const mode = await page.evaluate(() => (document.documentElement.classList.contains("dark") ? "dark" : "light"));

  await page.screenshot({ path: OUT });

  // The closing restore (explicit + awaited — the demo resting state).
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 10000 });
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });

  console.log(JSON.stringify({
    source: "capture-s37-evidence",
    out: OUT,
    mode,
    appliedAccent: applied,
    viewport: { width: 390, height: 844 },
    drawer: { linkCount, panelBg, activeTint: activeRead.tint, activeText: activeRead.color },
    appBar: { visible: appBarVisible, brandClock: /StudyFlow/.test(appBarText ?? "") && /\d{2}:\d{2} (AM|PM)/.test(appBarText ?? "") },
    scrollWidth: scrollW,
  }, null, 1));
} finally {
  await browser.close();
}

// S40 evidence capture — the drawer OPEN at 844×390 (the iPhone-class
// landscape) in LIGHT mode under a non-violet accent with the ACTIVE LINK
// ON A NAVIGATED VIEW and the nav SCROLLED (the short-viewport story in
// one frame): the accent × landscape drawer-navigation story (the S39
// capture pattern, extended with the short-viewport contract). PATCHes
// light + teal through the settings API (the real lifecycle, self-verified
// on <html data-accent> + the light class), navigates to Notes THROUGH THE
// DRAWER (the vehicle — the interaction under test), re-opens the drawer,
// scrolls the nav so the active link sits IN VIEW (links 8–20 live below
// the fold at 390 height — the nav scroll is the only path), verifies the
// nav IS scrollable (the short-viewport contract), verifies the active
// link is NOTES with the teal NAV_ACTIVE_GRADIENT_STOPS tint, captures
// the frame, restores the resting state (light + violet, verified via
// Prisma by the caller).
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots/s40-accent-landscape-drawer-teal-notes-844.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
try {
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });

  // light + teal through the real lifecycle, self-verified
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "teal" } });
  await page.goto(`${BASE}/Dashboard`, { waitUntil: "load" });
  await page.waitForFunction(
    () => document.documentElement.dataset.accent === "teal" && !document.documentElement.classList.contains("dark"),
    undefined,
    { timeout: 30000 },
  );

  // the chrome contract at 844 — the drawer is the only vehicle below 1024
  const chrome = await page.evaluate(() => ({
    sidebarVisible: (() => { const a = document.querySelector("aside"); return !!a && a.offsetParent !== null; })(),
    hamburgerVisible: (() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Open navigation menu"); return !!b && b.offsetParent !== null; })(),
  }));
  if (chrome.sidebarVisible || !chrome.hamburgerVisible) {
    throw new Error(`the chrome contract broke at 844 — ${JSON.stringify(chrome)}`);
  }

  // navigate to Notes THROUGH THE DRAWER (the vehicle — the interaction)
  const dialog = page.getByRole("dialog");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  await dialog.getByRole("link", { name: "Notes", exact: true }).click();
  await dialog.waitFor({ state: "hidden", timeout: 10000 });
  await page.waitForTimeout(1200); // the view settle band

  // re-open the drawer — the active link must be the NAVIGATED view (Notes)
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(700);

  // the short-viewport contract + scroll the active link into view (links
  // 8–20 live below the fold at 390 height — the nav scroll is the only
  // path; the frame must show the ACTIVE link, so scroll it into view)
  const nav = dialog.locator("nav");
  const navGeom = await nav.evaluate((el) => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }));
  const navScrollable = navGeom.scrollHeight > navGeom.clientHeight;
  if (!navScrollable) {
    throw new Error(`the drawer nav is NOT scrollable at 390 height (scrollHeight ${navGeom.scrollHeight} vs clientHeight ${navGeom.clientHeight}) — the short-viewport contract broke`);
  }
  await dialog.getByRole("link", { name: "Notes", exact: true }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const rec = await page.evaluate((scrollable) => {
    const dlg = document.querySelector('[role=dialog]');
    const active = dlg?.querySelector('a[aria-current="page"]');
    const inner = active ? active.querySelector('span') : null;
    return {
      linkCount: dlg ? dlg.querySelectorAll("a").length : 0,
      activeLabel: active ? (active.textContent || "").trim() : null,
      activeTint: inner ? getComputedStyle(inner).backgroundImage.slice(0, 90) : null,
      navScrollable: scrollable,
      darkClass: document.documentElement.classList.contains("dark"),
      accent: document.documentElement.dataset.accent,
      scrollWidth: document.documentElement.scrollWidth,
    };
  }, navScrollable);
  console.error(JSON.stringify(rec));
  if (rec.activeLabel !== "Notes") {
    throw new Error(`the active link was "${rec.activeLabel}", expected "Notes" — the interaction did not follow the navigation`);
  }
  if (!rec.activeTint || rec.activeTint === "none") {
    throw new Error(`the active-link gradient computed to "${rec.activeTint}" — the S8 no-var rot class`);
  }
  await page.screenshot({ path: OUT });
  console.error(`saved ${OUT}`);

  // restore the resting state
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(
    () => document.documentElement.dataset.accent === "violet" && !document.documentElement.classList.contains("dark"),
    undefined,
    { timeout: 30000 },
  );
  writeFileSync("/tmp/s40-evidence-record.json", JSON.stringify(rec, null, 1));
} catch (e) {
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } }).catch(() => {});
  console.error(`S40 EVIDENCE CAPTURE FAILED: ${e}`);
  process.exit(1);
} finally {
  await browser.close();
}

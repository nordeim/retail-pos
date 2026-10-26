// S39 evidence capture — the drawer OPEN at 768×1024 (the md breakpoint)
// in LIGHT mode under a non-violet accent with the ACTIVE LINK ON A
// NAVIGATED VIEW: the accent × mid-band drawer-navigation story in one
// frame (the S38 capture pattern, extended with the navigation
// interaction). PATCHes light + teal through the settings API (the real
// lifecycle, self-verified on <html data-accent> + the light class),
// navigates to Notes THROUGH THE DRAWER (the vehicle — the interaction
// under test), re-opens the drawer, verifies the active link is NOTES
// with the teal NAV_ACTIVE_GRADIENT_STOPS tint, captures the frame,
// restores the resting state (light + violet, verified via Prisma by the
// caller).
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots/s39-accent-midband-drawer-teal-notes-768.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 768, height: 1024 } });
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

  // the chrome contract at 768 — the drawer is the only vehicle below 1024
  const chrome = await page.evaluate(() => ({
    sidebarVisible: (() => { const a = document.querySelector("aside"); return !!a && a.offsetParent !== null; })(),
    hamburgerVisible: (() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Open navigation menu"); return !!b && b.offsetParent !== null; })(),
  }));
  if (chrome.sidebarVisible || !chrome.hamburgerVisible) {
    throw new Error(`the chrome contract broke at 768 — ${JSON.stringify(chrome)}`);
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

  const rec = await page.evaluate(() => {
    const dlg = document.querySelector('[role=dialog]');
    const active = dlg?.querySelector('a[aria-current="page"]');
    const inner = active ? active.querySelector('span') : null;
    return {
      linkCount: dlg ? dlg.querySelectorAll("a").length : 0,
      activeLabel: active ? (active.textContent || "").trim() : null,
      activeTint: inner ? getComputedStyle(inner).backgroundImage.slice(0, 90) : null,
      darkClass: document.documentElement.classList.contains("dark"),
      accent: document.documentElement.dataset.accent,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
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
  writeFileSync("/tmp/s39-evidence-record.json", JSON.stringify(rec, null, 1));
} catch (e) {
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } }).catch(() => {});
  console.error(`S39 EVIDENCE CAPTURE FAILED: ${e}`);
  process.exit(1);
} finally {
  await browser.close();
}

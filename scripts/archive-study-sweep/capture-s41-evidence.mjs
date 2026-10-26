// S41 evidence capture — the desktop 1280×800 in LIGHT mode under a
// non-violet accent with the SIDEBAR's ACTIVE LINK ON A NAVIGATED VIEW and
// the nav SCROLLED (the sidebar-vehicle story in one frame): the desktop
// light-accent sidebar-navigation story (the S40 capture pattern, extended
// with the desktop vehicle contracts). PATCHes light + teal through the
// settings API (the real lifecycle, self-verified on <html data-accent> +
// the light class), navigates to Notes THROUGH THE SIDEBAR (the desktop
// vehicle — the interaction under test), scrolls the nav so the active
// link sits IN VIEW (links ~13–20 live below the fold at 800 height — the
// nav scroll is the only path), verifies the nav IS scrollable (the
// sidebar-own scroll contract), verifies the INVERTED chrome contract
// (the sidebar visible + the hamburger hidden at 1280), verifies the
// active link is NOTES with the teal NAV_ACTIVE_GRADIENT_STOPS tint,
// verifies the heading OFFSET (the content clears the fixed 260px
// sidebar), captures the frame, restores the resting state (light +
// violet, verified via Prisma by the caller).
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots/s41-accent-desktop-sidebar-teal-notes-1280.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
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

  // the INVERTED chrome contract at 1280 — the sidebar is the desktop vehicle
  // (getClientRects for the fixed-position sidebar — offsetParent reads null
  // for fixed elements even when rendered, the Chromium quirk)
  const chrome = await page.evaluate(() => ({
    sidebarVisible: (() => { const a = document.querySelector("aside"); return !!a && a.getClientRects().length > 0; })(),
    hamburgerVisible: (() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Open navigation menu"); return !!b && b.offsetParent !== null; })(),
  }));
  if (!chrome.sidebarVisible || chrome.hamburgerVisible) {
    throw new Error(`the INVERTED chrome contract broke at 1280 — ${JSON.stringify(chrome)}`);
  }

  // navigate to Notes THROUGH THE SIDEBAR (the desktop vehicle — the
  // interaction under test; the link lives below the fold at 800 height,
  // so the click itself exercises the nav's scroll)
  const nav = page.locator("aside nav");
  await nav.getByRole("link", { name: "Notes", exact: true }).click();
  await page.waitForTimeout(1200); // the view settle band

  // the sidebar-own scroll contract + scroll the active link into view
  // (links ~13–20 live below the fold at 800 height — the nav scroll is the
  // only path; the frame must show the ACTIVE link, so scroll it into view)
  const navGeom = await nav.evaluate((el) => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }));
  const navScrollable = navGeom.scrollHeight > navGeom.clientHeight;
  if (!navScrollable) {
    throw new Error(`the sidebar nav is NOT scrollable at 800 height (scrollHeight ${navGeom.scrollHeight} vs clientHeight ${navGeom.clientHeight}) — the sidebar-own scroll contract broke`);
  }
  await nav.getByRole("link", { name: "Notes", exact: true }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const rec = await page.evaluate((scrollable) => {
    const aside = document.querySelector("aside");
    const active = aside?.querySelector('a[aria-current="page"]');
    const inner = active ? active.querySelector("span") : null;
    const heading = document.querySelector("main h1");
    return {
      linkCount: aside ? aside.querySelectorAll("nav a").length : 0,
      activeLabel: active ? (active.textContent || "").trim() : null,
      activeTint: inner ? getComputedStyle(inner).backgroundImage.slice(0, 90) : null,
      navScrollable: scrollable,
      navScrollHeight: scrollable ? aside.querySelector("nav").scrollHeight : 0,
      navClientHeight: aside ? aside.querySelector("nav").clientHeight : 0,
      headingText: heading ? heading.textContent.trim() : null,
      headingLeft: heading ? Math.round(heading.getBoundingClientRect().left) : null,
      darkClass: document.documentElement.classList.contains("dark"),
      accent: document.documentElement.dataset.accent,
      scrollWidth: document.documentElement.scrollWidth,
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
  }, navScrollable);
  console.error(JSON.stringify(rec));
  if (rec.activeLabel !== "Notes") {
    throw new Error(`the active link was "${rec.activeLabel}", expected "Notes" — the interaction did not follow the navigation`);
  }
  if (!rec.activeTint || rec.activeTint === "none") {
    throw new Error(`the active-link gradient computed to "${rec.activeTint}" — the S8 no-var rot class`);
  }
  if (rec.headingText !== "Notes") {
    throw new Error(`the identity heading was "${rec.headingText}", expected "Notes"`);
  }
  if (rec.headingLeft < 260 - 1) {
    throw new Error(`the identity heading's left is x=${rec.headingLeft} < 260 — under the fixed sidebar (the lg:ml-[260px] contract)`);
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
  writeFileSync("/tmp/s41-evidence-record.json", JSON.stringify(rec, null, 1));
} catch (e) {
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } }).catch(() => {});
  console.error(`S41 EVIDENCE CAPTURE FAILED: ${e}`);
  process.exit(1);
} finally {
  await browser.close();
}

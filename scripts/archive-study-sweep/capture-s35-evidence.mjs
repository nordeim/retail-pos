// S35 evidence capture — the drawer OPEN at 844×390 (the iPhone-class
// landscape): the short-viewport story in one frame — the fixed glass app
// bar (16% of the viewport), the 390px-tall panel, and the nav SCROLLED
// (the only path to links 8–20 in landscape; measured: scrollHeight 1068
// vs clientHeight 301). The capture scrolls the nav to its middle so the
// mid-list links (Analytics/Files/Calculator) are in-frame above the fold.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots/s35-landscape-drawer-844.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 844, height: 390 } });

try {
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });

  // Light mode through the real lifecycle (the S27 doctrine).
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(
    () => /good (morning|afternoon|evening)/i.test(document.querySelector("main h1")?.textContent ?? ""),
    null,
    { timeout: 30000 }
  );

  // Open the drawer (the landscape navigation vehicle).
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 10000 });

  // The short-viewport geometry, measured in the open state.
  const navGeom = await dialog.locator("nav").evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    scrollTop: el.scrollTop,
  }));
  // Scroll the nav to its middle — the mid-list links in-frame.
  await dialog.locator("nav").evaluate((el) => {
    el.scrollTop = Math.floor((el.scrollHeight - el.clientHeight) / 2);
  });
  await page.waitForTimeout(400);
  const midLinkVisible = await dialog.getByRole("link", { name: "Analytics", exact: true }).isVisible();
  const appBarVisible = await page.getByRole("banner").isVisible();
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);

  await page.screenshot({ path: OUT, fullPage: false });
  console.log(
    JSON.stringify(
      {
        out: OUT,
        viewport: "844x390",
        navScrollRequired: navGeom.scrollHeight > navGeom.clientHeight,
        navScrollHeight: navGeom.scrollHeight,
        navClientHeight: navGeom.clientHeight,
        midListLinkVisibleAfterScroll: midLinkVisible,
        appBarVisible,
        scrollWidth: scrollW,
      },
      null,
      1
    )
  );

  // The closing restore (explicit + awaited).
  await page.keyboard.press("Escape");
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });
} finally {
  await browser.close();
}

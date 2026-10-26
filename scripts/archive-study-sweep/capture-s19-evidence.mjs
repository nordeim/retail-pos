// S19 evidence captures — the RUM diagnostics panel, saved to
// docs/screenshots/s19-*.png (follows the capture-s18 precedent: dev server
// on :3000, the demo account, deterministic states).
// The captured surfaces:
//   1. The /rum panel, desktop LIGHT — the p75 cards + the recent table.
//   2. The /rum panel, desktop DARK — themed through the production code
//      path (the /api/auth/me response fulfilled with themeMode "dark" —
//      loadFromUser applies it exactly as the shell would).
//   3. The /rum panel, mobile 390px — the responsive stacking.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
try {
  // Sign in once; reuse the cookie via a saved storage state.
  const boot = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const bpage = await boot.newPage();
  await bpage.goto(`${BASE}/login`);
  await bpage.fill("input[type=email]", "demo@studyflow.app");
  await bpage.fill("input[type=password]", "Demo1234!");
  await bpage.click("button[type=submit]");
  await bpage.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 30000 });
  await bpage.waitForTimeout(2500); // let the beacon post TTFB/FCP
  const state = await boot.storageState();
  await boot.close();

  const openPanel = async (viewport, fulfillDark) => {
    const ctx = await browser.newContext({ viewport, storageState: state });
    const page = await ctx.newPage();
    if (fulfillDark) {
      // Theme the panel dark through the PRODUCTION path: fulfill
      // /api/auth/me with the real payload, themeMode overridden.
      await page.route(`${BASE}/api/auth/me`, async (route) => {
        const real = await route.fetch();
        const body = (await real.json());
        if (body?.user) body.user.themeMode = "dark";
        await route.fulfill({ status: real.status(), contentType: "application/json", body: JSON.stringify(body) });
      });
    }
    await page.goto(`${BASE}/rum`);
    await page.getByRole("heading", { name: "Performance Diagnostics" }).waitFor({ timeout: 30000 });
    await page.waitForTimeout(1500); // cards + table settle
    return { ctx, page };
  };

  // 1. Desktop light.
  const light = await openPanel({ width: 1280, height: 800 }, false);
  await light.page.screenshot({ path: `${OUT}/s19-rum-panel-light.png`, fullPage: true });
  const lightHtml = await light.page.evaluate(() => document.documentElement.className);
  await light.ctx.close();

  // 2. Desktop dark (themed via the production loadFromUser path).
  const dark = await openPanel({ width: 1280, height: 800 }, true);
  await dark.page.screenshot({ path: `${OUT}/s19-rum-panel-dark.png`, fullPage: true });
  const darkClass = await dark.page.evaluate(() => document.documentElement.className);
  await dark.ctx.close();

  // 3. Mobile 390x844 — the responsive stacking.
  const mobile = await openPanel({ width: 390, height: 844 }, false);
  await mobile.page.screenshot({ path: `${OUT}/s19-rum-panel-mobile.png`, fullPage: true });
  const cardCount = await mobile.page.evaluate(
    () => document.querySelectorAll('[aria-label="Core Web Vitals at p75"] > div').length,
  );
  await mobile.ctx.close();

  console.log(
    JSON.stringify(
      {
        ok: true,
        captured: ["s19-rum-panel-light.png", "s19-rum-panel-dark.png", "s19-rum-panel-mobile.png"],
        lightRootClass: lightHtml || "(none)",
        darkRootClass: darkClass || "(none)",
        mobileCardCount: cardCount,
      },
      null,
      2,
    ),
  );
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 300) }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}

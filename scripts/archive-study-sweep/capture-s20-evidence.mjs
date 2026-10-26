// S20 evidence captures — the RUM panel v3 (trends + export), saved to
// docs/screenshots/s20-*.png (follows the capture-s19 precedent: dev server
// on :3000, the demo account, deterministic states).
// The captured surfaces:
//   1. The /rum panel, desktop LIGHT — the p75 cards WITH sparklines +
//      the Export CSV action + the recent table.
//   2. The /rum panel, desktop DARK — themed through the production code
//      path (the /api/auth/me response fulfilled with themeMode "dark").
//   3. The /rum panel, mobile 390px — the responsive stacking (sparklines
//      full-width inside the stacked cards).
//   4. The exported CSV body (head) as evidence — the download contract.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

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

  // Deterministic trend-rich data: five sequential values per metric so
  // every sparkline has a recognizable shape (a rising TTFB, a falling
  // LCP, a flat CLS, a spiky FCP, a step INP). Each value rides its OWN
  // sessionId batch — the (sessionId, metric) upsert would collapse a
  // same-session repost into one row (final value wins) — and each batch
  // stays under the 10-event cap.
  const stamp = Date.now();
  const series = {
    TTFB: [400, 500, 600, 700, 780],
    FCP: [1200, 1900, 1500, 2400, 1700],
    LCP: [3800, 3200, 2900, 2600, 2350],
    CLS: [0.04, 0.04, 0.05, 0.04, 0.04],
    INP: [90, 140, 110, 190, 160],
  };
  const ctx0 = await browser.newContext({ viewport: { width: 1280, height: 800 }, storageState: state });
  const p0 = await ctx0.newPage();
  let posted = 0;
  for (const [metric, values] of Object.entries(series)) {
    for (let i = 0; i < values.length; i++) {
      const post = await p0.request.post(`${BASE}/api/rum`, {
        data: {
          sessionId: `s20-${stamp}-${metric}-${i}`,
          events: [{ metric, value: values[i], rating: "good", navigationType: "navigate", path: "/s20-capture" }],
        },
      });
      if (post.status() !== 200) throw new Error(`probe POST failed (${metric}#${i}): ${post.status()}`);
      posted++;
    }
  }

  // 4. The export round-trip (evidence FIRST — the body is small).
  const exportRes = await p0.request.get(`${BASE}/api/rum/export`);
  const csvBody = await exportRes.text();
  const csvHead = csvBody.split("\n").slice(0, 12).join("\n");
  writeFileSync(`${OUT}/s20-rum-export-head.txt`, csvHead + "\n…\n");
  await ctx0.close();

  const openPanel = async (viewport, fulfillDark) => {
    const ctx = await browser.newContext({ viewport, storageState: state });
    const page = await ctx.newPage();
    if (fulfillDark) {
      // Theme the panel dark through the PRODUCTION path: fulfill
      // /api/auth/me with the real payload, themeMode overridden.
      await page.route(`${BASE}/api/auth/me`, async (route) => {
        const real = await route.fetch();
        const body = await real.json();
        if (body?.user) body.user.themeMode = "dark";
        await route.fulfill({ status: real.status(), contentType: "application/json", body: JSON.stringify(body) });
      });
    }
    await page.goto(`${BASE}/rum`);
    await page.getByRole("heading", { name: "Performance Diagnostics" }).waitFor({ timeout: 30000 });
    await page.waitForTimeout(1500); // cards + sparklines + table settle
    return { ctx, page };
  };

  const readChrome = (page) =>
    page.evaluate(() => ({
      sparklines: document.querySelectorAll('[aria-label="Core Web Vitals at p75"] polyline').length,
      exportLink: !!document.querySelector('a[href="/api/rum/export"]'),
    }));

  // 1. Desktop light.
  const light = await openPanel({ width: 1280, height: 800 }, false);
  await light.page.screenshot({ path: `${OUT}/s20-rum-panel-light.png`, fullPage: true });
  const lightHtml = await light.page.evaluate(() => document.documentElement.className);
  const lightChrome = await readChrome(light.page);
  await light.ctx.close();

  // 2. Desktop dark (themed via the production loadFromUser path).
  const dark = await openPanel({ width: 1280, height: 800 }, true);
  await dark.page.screenshot({ path: `${OUT}/s20-rum-panel-dark.png`, fullPage: true });
  const darkClass = await dark.page.evaluate(() => document.documentElement.className);
  const darkChrome = await readChrome(dark.page);
  await dark.ctx.close();

  // 3. Mobile 390x844 — the responsive stacking.
  const mobile = await openPanel({ width: 390, height: 844 }, false);
  await mobile.page.screenshot({ path: `${OUT}/s20-rum-panel-mobile.png`, fullPage: true });
  const mobileChrome = await readChrome(mobile.page);
  const overflow = await mobile.page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  await mobile.ctx.close();

  console.log(
    JSON.stringify(
      {
        ok: true,
        captured: [
          "s20-rum-panel-light.png",
          "s20-rum-panel-dark.png",
          "s20-rum-panel-mobile.png",
          "s20-rum-export-head.txt",
        ],
        lightRootClass: lightHtml || "(none)",
        darkRootClass: darkClass || "(none)",
        light: lightChrome,
        dark: darkChrome,
        mobile: { ...mobileChrome, horizontalOverflow: overflow },
        exportStatus: exportRes.status(),
        exportContentType: exportRes.headers()["content-type"],
        exportDisposition: exportRes.headers()["content-disposition"],
        csvRows: csvBody.trim().split("\n").length - 1,
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

// S21 evidence captures — the data-export page + the JSON download, saved
// to docs/screenshots/s21-*.png (follows the capture-s20 precedent: dev
// server on :3000, the demo account, deterministic states).
// The captured surfaces:
//   1. The /export page, desktop LIGHT — the count grid + the Download
//      JSON action + the format documentation.
//   2. The /export page, desktop DARK — themed through the production
//      code path (the /api/auth/me response fulfilled with themeMode
//      "dark").
//   3. The /export page, mobile 390px — the responsive stacking.
//   4. The downloaded JSON body (head) as evidence — the download
//      contract (the versioned envelope).
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
  await bpage.waitForTimeout(1500);
  const state = await boot.storageState();
  await boot.close();

  // The download round-trip (evidence FIRST — the body is compact at
  // demo scale). Assert the contract while we hold it: the versioned
  // envelope + the S13/S14 download headers.
  const ctx0 = await browser.newContext({ viewport: { width: 1280, height: 800 }, storageState: state });
  const p0 = await ctx0.newPage();
  const res = await p0.request.get(`${BASE}/api/export/data`);
  const jsonBody = await res.text();
  const parsed = JSON.parse(jsonBody);
  if (parsed.format !== "studyflow-data-export" || parsed.version !== 1) {
    throw new Error(`unexpected envelope: ${parsed.format} v${parsed.version}`);
  }
  if (jsonBody.includes("passwordHash")) throw new Error("SECRET LEAK: passwordHash rides the export");
  // A compact head: the envelope meta + the first task row.
  const head = {
    format: parsed.format,
    version: parsed.version,
    exportedAt: parsed.exportedAt,
    user: parsed.user,
    counts: parsed.counts,
    firstTask: parsed.data.tasks?.[0] ?? null,
  };
  writeFileSync(`${OUT}/s21-data-export-head.json`, JSON.stringify(head, null, 2) + "\n");
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
    await page.goto(`${BASE}/export`);
    await page.getByRole("heading", { name: "Export Your Data" }).waitFor({ timeout: 30000 });
    await page.waitForTimeout(1200); // the count grid + theme settle
    return { ctx, page };
  };

  const readChrome = (page) =>
    page.evaluate(() => ({
      countCards: document.querySelectorAll('[aria-label="What\'s included"] > div').length,
      downloadLink: !!document.querySelector('a[href="/api/export/data"]'),
      backLink: !!document.querySelector('a[href="/"]'),
    }));

  // 1. Desktop light.
  const light = await openPanel({ width: 1280, height: 800 }, false);
  await light.page.screenshot({ path: `${OUT}/s21-export-page-light.png`, fullPage: true });
  const lightHtml = await light.page.evaluate(() => document.documentElement.className);
  const lightChrome = await readChrome(light.page);
  await light.ctx.close();

  // 2. Desktop dark (themed via the production loadFromUser path).
  const dark = await openPanel({ width: 1280, height: 800 }, true);
  await dark.page.screenshot({ path: `${OUT}/s21-export-page-dark.png`, fullPage: true });
  const darkClass = await dark.page.evaluate(() => document.documentElement.className);
  const darkChrome = await readChrome(dark.page);
  await dark.ctx.close();

  // 3. Mobile 390x844 — the responsive stacking.
  const mobile = await openPanel({ width: 390, height: 844 }, false);
  await mobile.page.screenshot({ path: `${OUT}/s21-export-page-mobile.png`, fullPage: true });
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
          "s21-export-page-light.png",
          "s21-export-page-dark.png",
          "s21-export-page-mobile.png",
          "s21-data-export-head.json",
        ],
        lightRootClass: lightHtml || "(none)",
        darkRootClass: darkClass || "(none)",
        light: lightChrome,
        dark: darkChrome,
        mobile: { ...mobileChrome, horizontalOverflow: overflow },
        exportStatus: res.status(),
        exportContentType: res.headers()["content-type"],
        exportDisposition: res.headers()["content-disposition"],
        exportNosniff: res.headers()["x-content-type-options"],
        exportCache: res.headers()["cache-control"],
        collectionCount: Object.keys(parsed.counts).length,
        totalRows: Object.values(parsed.counts).reduce((a, b) => a + b, 0),
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

// S18 evidence captures — the RUM hook + the Docker packaging, saved to
// docs/screenshots/s18-*.png (follows the capture-s15/s16/s17 precedent:
// dev server on :3000, the demo account, deterministic states).
// The captured surfaces:
//   1. The dashboard with the beacon LIVE — visual parity intact (the
//      beacon renders null; the capture doubles as the byte-parity proof).
//      The evidence JSON (the beacon's captured POST payloads) is written
//      alongside as s18-rum-beacon-posts.json.
//   2. GET /api/rum rendered in the browser — the owner's observability
//      surface (p75 per metric + recent events).
//   3. Mobile dashboard 390px — the parity + load-stability state with
//      the beacon mounted (the standing mobile surface).
//   4. The login page — the UN-instrumented surface (the documented
//      scope decision).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Capture the beacon's outbound POSTs (the network evidence).
  const beaconPosts = [];
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().includes("/api/rum")) {
      try {
        beaconPosts.push({ url: req.url(), body: JSON.parse(req.postData() ?? "{}") });
      } catch {
        beaconPosts.push({ url: req.url(), body: req.postData() });
      }
    }
  });

  // Sign in as the demo user.
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 30000 });
  await page.waitForTimeout(4000); // let TTFB/FCP (+LCP post-interaction) flush

  // 1. Dashboard with the beacon live — parity chrome intact.
  await page.screenshot({ path: `${OUT}/s18-rum-dashboard.png` });
  writeFileSync(`${OUT}/s18-rum-beacon-posts.json`, JSON.stringify(beaconPosts, null, 2));

  // 2. GET /api/rum in the browser — the observability surface.
  const aggregate = await ctx.request.get(`${BASE}/api/rum`);
  const aggText = await aggregate.text();
  const aggPage = await ctx.newPage();
  await aggPage.setContent(
    `<html><body style="font-family: ui-monospace, monospace; background: #0f172a; color: #e2e8f0; padding: 24px; margin: 0;">` +
      `<h2 style="font-family: system-ui; color: #a78bfa; margin-top: 0;">GET /api/rum — the RUM aggregate (S18)</h2>` +
      `<pre style="white-space: pre-wrap; font-size: 12px;">${aggText
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")}</pre></body></html>`,
  );
  await aggPage.waitForTimeout(400);
  await aggPage.screenshot({ path: `${OUT}/s18-rum-aggregate.png` });

  // 3. Mobile dashboard 390px — parity + load stability with the beacon.
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mpage = await mobile.newPage();
  await mpage.goto(`${BASE}/login`);
  await mpage.fill("input[type=email]", "demo@studyflow.app");
  await mpage.fill("input[type=password]", "Demo1234!");
  await mpage.click("button[type=submit]");
  await mpage.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 30000 });
  await mpage.waitForTimeout(2500);
  await mpage.screenshot({ path: `${OUT}/s18-rum-dashboard-mobile.png` });
  await mobile.close();

  // 4. The login page — deliberately un-instrumented (the scope decision).
  const anon = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const apage = await anon.newPage();
  await apage.goto(`${BASE}/login`);
  await apage.waitForTimeout(1500);
  await apage.screenshot({ path: `${OUT}/s18-login-uninstrumented.png` });
  await anon.close();

  console.log(
    JSON.stringify(
      {
        ok: true,
        captured: [
          "s18-rum-dashboard.png",
          "s18-rum-aggregate.png",
          "s18-rum-dashboard-mobile.png",
          "s18-login-uninstrumented.png",
        ],
        beaconPostsObserved: beaconPosts.length,
        aggregateStatus: aggregate.status(),
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

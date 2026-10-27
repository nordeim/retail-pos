// ---------------------------------------------------------------------------
// Evidence capture: the V13 chart-hover micro-interactions
// (docs/remediation-plan-v13.md B4.1) → docs/screenshots/*.png.
//
// Run against a live server (the probe posture works — production build on
// :3101 with db/custom.db):
//   bun scripts/capture-hover-shots.ts
// (CAPTURE_BASE_URL overrides the target, same as capture-screenshots.ts)
//
// Captures the two hover states the standard sweep can't (its screenshots
// are resting states): the dashboard sales chart with the tooltip + the
// activeDot + the #ccc cursor, and the donut with its RAW default tooltip.
// ---------------------------------------------------------------------------

import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.CAPTURE_BASE_URL ?? "http://localhost:3000";
const OUT = path.resolve(import.meta.dirname, "..", "docs", "screenshots");
const EMAIL = process.env.SEED_OWNER_EMAIL ?? "owner@veloxpos.local";
const PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "$Abcd1234";

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByTestId("login-submit").click();
  await page.waitForURL(`${BASE}/`);
  await page.locator("html[data-app-hydrated=true]").waitFor();

  // ---- the sales chart hover (tooltip + activeDot + cursor) ---------------
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForLoadState("networkidle");
  const chart = page.getByTestId("weekly-chart-card");
  // ATTACHED, not visible — the flat $0 area path is a 0-height shape
  // (an empty Playwright bounding box, the same lesson as the e2e).
  await chart.locator('svg path[fill="url(#salesGrad)"]').waitFor({ state: "attached" });
  const chartBox = (await chart.locator("svg").boundingBox())!;
  await page.mouse.move(chartBox.x + chartBox.width * 0.5, chartBox.y + 130);
  await chart.locator('[data-testid="chart-tooltip"]').waitFor({ state: "visible" });
  await page.waitForTimeout(500); // the 400ms glide settle
  await chart.screenshot({ path: path.join(OUT, "desktop-dashboard-chart-hover.png") });
  console.log("[capture] desktop-dashboard-chart-hover.png");

  // ---- the donut hover (the RAW default tooltip on a sector) --------------
  const donut = page.getByTestId("category-chart-card");
  await donut.locator("div.space-y-2 > div").first().waitFor();
  const donutBox = (await donut.locator("svg").boundingBox())!;
  const mid = (30 * Math.PI) / 180;
  await page.mouse.move(
    donutBox.x + donutBox.width / 2 + Math.cos(mid) * 65,
    donutBox.y + donutBox.height / 2 - Math.sin(mid) * 65,
  );
  await donut.locator('[data-testid="donut-tooltip"]').waitFor({ state: "visible" });
  await page.waitForTimeout(500);
  await donut.screenshot({ path: path.join(OUT, "desktop-donut-hover.png") });
  console.log("[capture] desktop-donut-hover.png");
} finally {
  await browser.close();
}

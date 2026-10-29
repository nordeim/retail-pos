// v30 evidence set — the cycle's captures (remediation-plan-v30 B4).
// Follows the standing capture-v29-shots.ts patterns (login, settle,
// shot), pinned to the reference-mirror SEEDED state (no live sales —
// the dashboard renders flat and the terminal renders its idle state,
// matching the reference's own zero-today posture for the 15th cycle).
// Five shots: desktop terminal (the cycle's own subject — the runtime
// validation chain's most visible face, the sale surface whose every
// write goes through the zod layer this cycle floored), desktop
// dashboard, desktop ventas, mobile terminal, mobile drawer open (the
// spine freeze's face, 15th confirmation).
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.CAPTURE_BASE_URL ?? "http://localhost:3000";
const OUT = path.resolve(import.meta.dirname, "..", "docs", "screenshots");
const EMAIL = process.env.SEED_OWNER_EMAIL ?? "owner@veloxpos.local";
const PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "$Abcd1234";

mkdirSync(OUT, { recursive: true });

async function login(page: import("playwright").Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByTestId("login-submit").click();
  await page.waitForURL(`${BASE}/`);
  await page.locator("html[data-app-hydrated=true]").waitFor();
}

async function settleAndShot(
  page: import("playwright").Page,
  route: string,
  name: string,
  settleMs = 700,
) {
  await page.goto(`${BASE}${route}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(settleMs);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(`[capture] ${name}.png`);
}

const browser = await chromium.launch();
try {
  // Desktop set at 1280×800 (the audit's measurement width).
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const dp = await desktop.newPage();
  await login(dp);
  await settleAndShot(dp, "/", "v30-desktop-terminal-1280", 900);
  await settleAndShot(dp, "/Dashboard", "v30-desktop-dashboard-1280");
  await settleAndShot(dp, "/Ventas", "v30-desktop-ventas-1280");
  await desktop.close();

  // Mobile set at TRUE 390×844 (the spine-freeze width).
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mobile.newPage();
  await login(mp);
  await settleAndShot(mp, "/", "v30-mobile-terminal-390");
  await mp.getByTestId("mobile-menu-button").click();
  await mp.getByTestId("mobile-drawer-panel").waitFor();
  await mp.waitForTimeout(600); // the slide-in settle (the v25 starved-read idiom)
  await mp.screenshot({ path: path.join(OUT, "v30-mobile-drawer-open-390.png") });
  console.log("[capture] v30-mobile-drawer-open-390.png");
  await mobile.close();
} finally {
  await browser.close();
}
console.log("[capture] v30 set complete");

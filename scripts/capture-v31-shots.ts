// v31 evidence set — the cycle's captures (remediation-plan-v31 B4).
// Follows the standing capture-v30-shots.ts patterns (login, settle,
// shot), pinned to the reference-mirror SEEDED state. Five shots:
// desktop product-dialog OPEN (the cycle's own subject — the a11y
// catch's most visible face: the create dialog whose Categoría/Unidad
// selects carried the critical button-name violations this cycle
// cured), desktop terminal, desktop dashboard, mobile terminal, mobile
// drawer open (the spine freeze's face, 16th confirmation).
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
  await settleAndShot(dp, "/", "v31-desktop-terminal-1280", 900);
  await settleAndShot(dp, "/Dashboard", "v31-desktop-dashboard-1280");

  // The cycle's subject: the product create dialog OPEN — the two selects
  // (Categoría + Unidad) whose label associations are this cycle's cure.
  // The v14 dialog-motion settle: the enter run is the tw-animate .15s
  // default — a 500ms settle-wait covers it (a getAnimations().finished
  // await rejects on cancelled animations; the plain settle is the stable
  // form for captures).
  await dp.goto(`${BASE}/Inventory`);
  await dp.waitForLoadState("networkidle");
  await dp.getByTestId("new-product-button").click();
  await dp.getByRole("dialog").waitFor();
  await dp.waitForTimeout(500);
  const dialog = dp.getByRole("dialog");
  await dialog.screenshot({ path: path.join(OUT, "v31-desktop-product-dialog-1280.png") });
  console.log("[capture] v31-desktop-product-dialog-1280.png");
  await dp.keyboard.press("Escape");
  await desktop.close();

  // Mobile set at TRUE 390×844 (the spine-freeze width).
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mobile.newPage();
  await login(mp);
  await settleAndShot(mp, "/", "v31-mobile-terminal-390");
  await mp.getByTestId("mobile-menu-button").click();
  await mp.getByTestId("mobile-drawer-panel").waitFor();
  await mp.waitForTimeout(600); // the slide-in settle (the v25 starved-read idiom)
  await mp.screenshot({ path: path.join(OUT, "v31-mobile-drawer-open-390.png") });
  console.log("[capture] v31-mobile-drawer-open-390.png");
  await mobile.close();
} finally {
  await browser.close();
}
console.log("[capture] v31 set complete");

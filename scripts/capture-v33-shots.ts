// v33 evidence set — the cycle's captures (remediation-plan-v33 B4).
// Follows the standing capture-v32-shots.ts patterns (login, settle,
// shot), pinned to the reference-mirror SEEDED state. Five shots — the
// width-scope cycle's subject set: the phone Cajeros view (the cured
// surface — the scrollable-region catch), the phone dashboard (the
// newly-registered phone landing), the phone login (the public phone
// family), the reset-password FORM state (the shape-probe token face,
// never captured in a prior evidence set), and the mobile drawer open
// (the standing mobile-nav face, the operator's standing ask).
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
  // The phone set at TRUE 390×844 (the spine-freeze width — this cycle's
  // own axis). The cycle's subject first: the Cajeros view with the cured
  // scrollable region (the recent-shifts table rides its named region;
  // the seeded two shifts render the dense table).
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mobile.newPage();
  await login(mp);
  await settleAndShot(mp, "/Cashiers", "v33-phone-cashiers-390", 900);
  await settleAndShot(mp, "/Dashboard", "v33-phone-dashboard-390");
  await mp.goto(`${BASE}/`);
  await mp.waitForLoadState("networkidle");
  await mp.waitForTimeout(700);
  await mp.getByTestId("mobile-menu-button").click();
  await mp.getByTestId("mobile-drawer-panel").waitFor();
  await mp.waitForTimeout(600); // the slide-in settle (the v25 starved-read idiom)
  await mp.screenshot({ path: path.join(OUT, "v33-mobile-drawer-open-390.png") });
  console.log("[capture] v33-mobile-drawer-open-390.png");
  await mobile.close();

  // The public phone face (logged out): the login card at 390.
  const anon = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const ap = await anon.newPage();
  await ap.goto(`${BASE}/login`);
  await ap.waitForLoadState("networkidle");
  await ap.waitForTimeout(700);
  await ap.screenshot({ path: path.join(OUT, "v33-phone-login-390.png") });
  console.log("[capture] v33-phone-login-390.png");
  await anon.close();

  // The reset-password FORM state at desktop (the shape-probe token —
  // the richer face, never captured before; any non-empty token renders
  // the form).
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const dp = await desktop.newPage();
  await dp.goto(`${BASE}/reset-password?token=e2e-shape-probe`);
  await dp.waitForLoadState("networkidle");
  await dp.waitForTimeout(700);
  await dp.screenshot({ path: path.join(OUT, "v33-reset-form-1280.png") });
  console.log("[capture] v33-reset-form-1280.png");
  await desktop.close();
} finally {
  await browser.close();
}
console.log("[capture] v33 set complete");

// ---------------------------------------------------------------------------
// Evidence capture: screenshots of the REMEDIATED app (remediation-plan-v3
// R5.1) → docs/screenshots/*.png, overwriting the pre-remediation set in
// place (same names — git history keeps the originals).
//
// Run against a live dev server:
//   bun run dev            # terminal A (db/custom.db, seeded)
//   bun scripts/capture-screenshots.ts   # terminal B
//
// State shape: opens a real shift on Caja 1, sells Coca-Cola ×2 + Sabritas ×1
// (so terminal/cobrar/sales/ventas/dashboard show LIVE data), then sweeps
// every desktop view, the 404, and the mobile set (incl. the drawer open —
// the functional superset the reference never shipped).
// ---------------------------------------------------------------------------

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
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log(`[capture] ${name}.png`);
}

const browser = await chromium.launch();
try {
  // ---- desktop sweep -----------------------------------------------------
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await desktop.newPage();
  await login(page);

  await settleAndShot(page, "/", "desktop-terminal-empty");

  // Open a shift on Caja 1 (the seeded register) — the terminal goes live.
  // Idempotent: a shift may already be open from a prior capture run.
  await page.goto(`${BASE}/Registers`);
  await page.waitForLoadState("networkidle");
  const openButtons = page.locator('[data-testid^="open-shift-"]');
  if ((await openButtons.count()) > 0) {
    await openButtons.first().click();
    await page.getByTestId("shift-cashier-select").click();
    await page.getByRole("option").first().click();
    await page.getByTestId("shift-float-input").fill("500");
    await page.getByTestId("shift-submit").click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }

  // Ticket: Coca-Cola ×2 + Sabritas ×1 → the cobrar dialog → complete the
  // sale (stock decrements; today's dashboard/reports show live revenue).
  await page.goto(`${BASE}/`);
  await page.getByTestId("terminal-grid").waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(OUT, "desktop-terminal-live.png"),
    fullPage: true,
  });
  console.log("[capture] desktop-terminal-live.png");

  const coke = page.locator('[data-testid^="terminal-product-"]', {
    hasText: "Coca-Cola 600ml",
  });
  const sabritas = page.locator('[data-testid^="terminal-product-"]', {
    hasText: "Sabritas Original 45g",
  });
  await coke.click();
  await coke.click();
  await sabritas.click();
  await page.getByTestId("ticket-total").waitFor();
  await page.screenshot({
    path: path.join(OUT, "desktop-terminal-ticket.png"),
    fullPage: true,
  });
  console.log("[capture] desktop-terminal-ticket.png");

  await page.getByTestId("cobrar-button").click();
  await page.getByTestId("pay-total").waitFor();
  await page.screenshot({
    path: path.join(OUT, "desktop-cobrar-dialog.png"),
    fullPage: true,
  });
  console.log("[capture] desktop-cobrar-dialog.png");
  await page.getByTestId("method-efectivo").click();
  await page.getByTestId("pay-cash").fill("200");
  await page.getByTestId("pay-change").waitFor();
  await page.getByRole("button", { name: /confirmar/i }).click();
  await page.getByTestId("ticket-panel").waitFor();
  await page.waitForTimeout(500);

  // The sale exists in history — capture the Ventas table + its detail dialog.
  await page.goto(`${BASE}/Sales`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  await page.locator('[data-testid^="view-sale-"]').first().click();
  await page.getByRole("dialog").waitFor();
  await page.screenshot({
    path: path.join(OUT, "desktop-ventas.png"),
    fullPage: true,
  });
  console.log("[capture] desktop-ventas.png");
  await page.keyboard.press("Escape");

  for (const [route, name] of [
    ["/Dashboard", "desktop-dashboard"],
    ["/Inventory", "desktop-inventario"],
    ["/Registers", "desktop-cajas"],
    ["/Cashiers", "desktop-cajeros"],
    ["/Reports", "desktop-reportes"],
    ["/StoreSettings", "desktop-ajustes"],
  ] as const) {
    await settleAndShot(page, route, name, 900);
  }

  // The logged-out login card + the 404 (fresh contexts for clean chrome).
  const anon = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const anonPage = await anon.newPage();
  await settleAndShot(anonPage, "/login", "desktop-login");
  await settleAndShot(anonPage, "/esta-ruta-no-existe", "desktop-404");
  await anon.close();

  // ---- mobile sweep (the drawer is the superset) --------------------------
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mPage = await mobile.newPage();
  await login(mPage);

  await settleAndShot(mPage, "/", "mobile-terminal", 600);
  await mPage.getByTestId("mobile-menu-button").click();
  await mPage.getByTestId("mobile-drawer-panel").waitFor();
  await mPage.waitForTimeout(350); // settle the slide-in
  await mPage.screenshot({
    path: path.join(OUT, "mobile-drawer-open.png"),
    fullPage: true,
  });
  console.log("[capture] mobile-drawer-open.png");
  await mPage.getByTestId("mobile-drawer-close").click();
  await mPage.waitForTimeout(250);

  await settleAndShot(mPage, "/Dashboard", "mobile-dashboard", 900);
  await settleAndShot(mPage, "/Sales", "mobile-ventas", 700);

  // The cobrar dialog on the phone (ticket already has state via the app
  // store — rebuild one for the dialog frame).
  await mPage.goto(`${BASE}/`);
  await mPage.getByTestId("terminal-grid").waitFor();
  const mCoke = mPage.locator('[data-testid^="terminal-product-"]', {
    hasText: "Coca-Cola 600ml",
  });
  await mCoke.click();
  await mCoke.click();
  await mPage.getByTestId("cobrar-button").click();
  await mPage.getByTestId("pay-total").waitFor();
  await mPage.screenshot({
    path: path.join(OUT, "mobile-cobrar.png"),
    fullPage: true,
  });
  console.log("[capture] mobile-cobrar.png");

  await mobile.close();
  await desktop.close();
  console.log("[capture] complete →", OUT);
} finally {
  await browser.close();
}

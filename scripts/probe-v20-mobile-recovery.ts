// V20 evidence + live verification — SELF-CONTAINED (the sandbox kills
// background processes between tool invocations, so this probe owns its
// server's whole lifecycle).
//
// 1. Spawns the standalone production server on :3101 (random AUTH_SECRET,
//    seeded db/custom.db) and waits for /api/health.
// 2. Live mobile-drawer contract re-verification at 390×844 (the task's
//    standing mobile-navigation mandate): the app bar, the drawer open/
//    geometry/8-links/44px pitch/scroll-lock/focus-in, Esc + backdrop +
//    route close with focus return, aria-expanded cycle, zero horizontal
//    overflow on all 8 routes.
// 3. The mobile-width (390) error-recovery captures — the V20 refresh of
//    the V19 evidence set: the Spanish recovery card with the shell's app
//    bar alive, and the healed view after Reintentar, both saved to
//    docs/screenshots/ under v20-* names (the cycle-stamped evidence
//    convention — every cycle captures its own set).
//
// Usage: bun scripts/probe-v20-mobile-recovery.ts
import { chromium } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";

const BASE = "http://localhost:3101";
const PORT = 3101;
const OUT = resolve(import.meta.dirname, "../docs/screenshots");
const MOBILE = { width: 390, height: 844 };
const ROUTES = [
  { path: "/", heading: "No hay turno activo" },
  { path: "/Dashboard", heading: "Dashboard" },
  { path: "/Inventory", heading: "Inventario" },
  { path: "/Sales", heading: "Historial de Ventas" },
  { path: "/Registers", heading: "Cajas Registradoras" },
  { path: "/Cashiers", heading: "Cajeros" },
  { path: "/Reports", heading: "Reportes" },
  { path: "/StoreSettings", heading: "Ajustes de la Tienda" },
] as const;

const results: Array<{ check: string; pass: boolean; detail: string }> = [];
const record = (check: string, pass: boolean, detail: string) => {
  results.push({ check, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${check} — ${detail}`);
};

let server: ChildProcess | null = null;

async function startServer(): Promise<void> {
  const secret = randomBytes(32).toString("hex");
  server = spawn("bun", [".next/standalone/server.js"], {
    cwd: resolve(import.meta.dirname, ".."),
    env: {
      ...process.env,
      AUTH_SECRET: secret,
      PORT: String(PORT),
      DATABASE_URL: "file:../db/custom.db",
      NODE_ENV: "production",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const deadline = Date.now() + 45_000;
  for (;;) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) {
        const body = (await res.json()) as { status: string; db: string };
        if (body.status === "ok" && body.db === "up") return;
      }
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) throw new Error("probe server never became healthy");
    await new Promise((r) => setTimeout(r, 500));
  }
}

function stopServer(): void {
  if (!server) return;
  server.kill("SIGTERM");
  server = null;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  await startServer();
  console.log("probe server healthy on :3101");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: MOBILE });
  page.setDefaultTimeout(20_000);

  try {
    // ---- Login (mobile-width auth surface). ----
    await page.goto(`${BASE}/login`);
    await page.fill("input[type=email]", "owner@veloxpos.local");
    await page.fill("input[type=password]", "$Abcd1234");
    await page.click("button[type=submit]");
    await page.waitForURL(`${BASE}/`);
    await page.getByTestId("mobile-app-bar").waitFor();
    record("login + mobile app bar", true, "logged in at 390×844, app bar visible");

    // ---- The drawer contract (live). ----
    const hamburger = page.getByTestId("mobile-menu-button");
    const expandedBefore = await hamburger.getAttribute("aria-expanded");
    await hamburger.click();
    const panel = page.getByTestId("mobile-drawer-panel");
    await panel.waitFor();
    const expandedAfter = await hamburger.getAttribute("aria-expanded");

    // Geometry settles after the 200ms slide-in.
    let geo = { width: 0, height: 0 };
    for (let i = 0; i < 40; i += 1) {
      const box = await panel.boundingBox();
      geo = { width: box?.width ?? 0, height: box?.height ?? 0 };
      if (geo.width === 288 && geo.height === MOBILE.height) break;
      await page.waitForTimeout(100);
    }
    record(
      "drawer geometry + aria",
      geo.width === 288 && geo.height === MOBILE.height && expandedBefore === "false" && expandedAfter === "true",
      `panel ${geo.width}×${geo.height}, aria-expanded ${expandedBefore}→${expandedAfter}`,
    );

    // 8 links + uniform 44px pitch (TRAP-4 guard).
    const links = panel.getByRole("link");
    const linkCount = await links.count();
    const tops = await links.evaluateAll((els) =>
      (els as HTMLElement[]).map((el) => el.getBoundingClientRect().top),
    );
    const gaps = tops.slice(1).map((t, i) => t - tops[i]);
    const uniform = gaps.every((g) => Math.abs(g - gaps[0]) < 0.5);
    const pitch44 = Math.abs(gaps[0] - 44) < 3;
    record(
      "8 links + 44px uniform pitch",
      linkCount === 8 && uniform && pitch44,
      `${linkCount} links, pitch ${gaps[0].toFixed(1)}px, uniform=${uniform}`,
    );

    // Scroll lock + focus in.
    const locked = await page.evaluate(() => document.body.style.overflow);
    const focusIn = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="mobile-drawer-panel"]');
      if (!panel) return false;
      return panel === document.activeElement || panel.contains(document.activeElement);
    });
    record(
      "scroll lock + focus in",
      locked === "hidden" && focusIn,
      `body overflow="${locked}", focus inside panel=${focusIn}`,
    );

    // The open drawer evidence shot.
    await page.waitForTimeout(600); // settle the slide-in fully
    await page.screenshot({ path: `${OUT}/v20-mobile-drawer-open-390.png` });
    console.log("saved v20-mobile-drawer-open-390.png");

    // Esc close → focus returns to the hamburger, body unlocked.
    await page.keyboard.press("Escape");
    await page.waitForSelector('[data-testid="mobile-drawer-panel"]', { state: "detached" });
    const focusReturned = await page.evaluate(
      () => document.activeElement?.getAttribute("data-testid") === "mobile-menu-button",
    );
    const unlocked = await page.evaluate(() => document.body.style.overflow);
    record(
      "Esc close + focus return + unlock",
      focusReturned && unlocked === "",
      `focus on hamburger=${focusReturned}, overflow="${unlocked}"`,
    );

    // Backdrop close.
    await hamburger.click();
    await panel.waitFor();
    await page
      .getByTestId("mobile-drawer-overlay")
      .locator("button")
      .first()
      .click({ position: { x: 360, y: 400 } });
    await page.waitForSelector('[data-testid="mobile-drawer-panel"]', { state: "detached" });
    record("backdrop close", true, "overlay tap removed the panel");

    // Route navigation from the drawer.
    await hamburger.click();
    await panel.waitFor();
    await page.getByTestId("mobile-drawer-panel").getByTestId("nav-ajustes").click();
    await page.waitForURL(/\/StoreSettings$/);
    await page.waitForSelector('[data-testid="mobile-drawer-panel"]', { state: "detached" });
    const h1 = await page.locator("main h1").innerText();
    record(
      "drawer route navigation",
      h1 === "Ajustes de la Tienda",
      `/StoreSettings reached, h1="${h1}", drawer closed`,
    );

    // Zero horizontal overflow on all 8 routes. The gate is the hydration
    // marker (the shell's commit) — the Terminal's no-shift heading is an
    // h2, not an h1 (the e2e helpers' "heading" values are copy, not tags).
    const overflows: Record<string, number> = {};
    let overflowOk = true;
    for (const route of ROUTES) {
      await page.goto(`${BASE}${route.path}`);
      await page.waitForSelector("html[data-app-hydrated]", { timeout: 20_000 });
      await page.waitForTimeout(300); // let the active view paint
      const of = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      overflows[route.path] = of;
      if (of > 1) overflowOk = false;
    }
    record("zero horizontal overflow (8 routes)", overflowOk, JSON.stringify(overflows));

    // ---- The mobile-width error-recovery captures (the V20 refresh). ----
    // Discover the settings chunk from the chunks this page load pulled.
    const urls: string[] = [];
    page.on("response", (res) => {
      const url = res.url();
      if (url.includes("/_next/static/chunks/") && url.endsWith(".js")) urls.push(url);
    });
    await page.goto(`${BASE}/StoreSettings`);
    await page.locator("main h1").waitFor();
    let settingsChunk: string | null = null;
    for (const url of urls) {
      const body = await (await page.request.get(url)).text();
      if (body.includes("Ajustes de la Tienda")) {
        settingsChunk = url;
        break;
      }
    }
    if (!settingsChunk) throw new Error("settings chunk not found");
    console.log("settings chunk:", settingsChunk);

    // The card at 390: persistent block + pre-seeded cooldown (no reload).
    await page.goto(`${BASE}/Dashboard`);
    await page.locator("main h1").waitFor();
    await page.evaluate(() => {
      sessionStorage.setItem("veloxpos:chunk-reload-at", String(Date.now()));
    });
    let allow = false;
    await page.route(settingsChunk, (route) => {
      if (allow) route.continue();
      else route.abort("failed");
    });
    // SPA-navigate from the DRAWER (the mobile path to the failure).
    await hamburger.click();
    await panel.waitFor();
    await page.getByTestId("mobile-drawer-panel").getByTestId("nav-ajustes").click();
    await page.waitForSelector("[data-testid=view-error-card]", { timeout: 20_000 });
    await page.waitForTimeout(500);

    const shellAlive = await page.getByTestId("mobile-app-bar").isVisible();
    const cardText = await page.locator("[data-testid=view-error-card]").innerText();
    const cardOk = cardText.includes("No se pudo cargar la vista") && cardText.includes("Reintentar");
    record(
      "mobile recovery card + shell alive",
      shellAlive && cardOk,
      `app bar visible=${shellAlive}, card copy ok=${cardOk}`,
    );
    await page.screenshot({ path: `${OUT}/v20-view-recovery-card-390.png` });
    console.log("saved v20-view-recovery-card-390.png");

    // The heal at 390: lift the block, Reintentar, the view renders in place.
    allow = true;
    await page.getByRole("button", { name: "Reintentar" }).click();
    await page.locator("main h1").waitFor({ timeout: 20_000 });
    const healedH1 = await page.locator("main h1").innerText();
    await page.waitForTimeout(500);
    record(
      "mobile Reintentar heals in place",
      healedH1 === "Ajustes de la Tienda",
      `h1 after Reintentar="${healedH1}"`,
    );
    await page.screenshot({ path: `${OUT}/v20-view-recovery-healed-390.png` });
    console.log("saved v20-view-recovery-healed-390.png");
  } finally {
    await browser.close().catch(() => undefined);
    stopServer();
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) {
    console.error("FAILED CHECKS:");
    for (const f of failed) console.error(`  - ${f.check}: ${f.detail}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  stopServer();
  process.exit(1);
});

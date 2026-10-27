// V18 evidence capture: the view-recovery surfaces on the booted
// standalone build (:3101) — the Spanish recovery card (the
// cooldown-suppressed persistent-block case, shell alive) and the
// healed view after Reintentar. Saves to docs/screenshots/.
// Usage: bun scripts/capture-v18-recovery.ts
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3101";
const OUT = resolve(import.meta.dirname, "../docs/screenshots");

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "owner@veloxpos.local");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/`);
  await page.waitForSelector("[data-testid=desktop-sidebar]");

  // Discover the settings chunk.
  const urls: string[] = [];
  page.on("response", (res) => {
    const url = res.url();
    if (url.includes("/_next/static/chunks/") && url.endsWith(".js")) urls.push(url);
  });
  await page.goto(`${BASE}/StoreSettings`);
  await page.waitForSelector("h1");
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

  // The recovery card: persistent block + pre-seeded cooldown (the card
  // is the surface — no reload fires).
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForSelector("h1");
  await page.evaluate(() => {
    sessionStorage.setItem("veloxpos:chunk-reload-at", String(Date.now()));
  });
  let allow = false;
  await page.route(settingsChunk, (route) => {
    if (allow) route.continue();
    else route.abort("failed");
  });
  await page.getByTestId("nav-ajustes").click();
  await page.waitForSelector("[data-testid=view-error-card]", { timeout: 15_000 });
  await page.waitForTimeout(500); // settle the card
  await page.screenshot({ path: `${OUT}/v18-view-recovery-card.png`, fullPage: false });
  console.log("saved v18-view-recovery-card.png");

  // The heal: lift the block, Reintentar, the view renders in place.
  allow = true;
  await page.getByRole("button", { name: "Reintentar" }).click();
  await page.waitForSelector("main h1", { timeout: 15_000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/v18-view-recovery-healed.png`, fullPage: false });
  console.log("saved v18-view-recovery-healed.png");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

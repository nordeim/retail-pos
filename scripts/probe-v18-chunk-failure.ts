// V18 audit probe: reproduce the failed-chunk failure mode on the live
// standalone build (:3101) — the exact Turbopack error message form + the
// user-visible state after a view chunk fails to load (the V17 lazy
// registry has no error boundary; this probe is the "reproduce" step for
// the remediation-plan-v18 F1 finding).
//
// Usage: bunx playwright test --config /dev/null 2>/dev/null; or simply:
//   bun scripts/probe-v18-chunk-failure.ts
import { chromium } from "@playwright/test";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3101";
const EMAIL = "owner@veloxpos.local";
const PASSWORD = "$Abcd1234";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => pageErrors.push(String(e)));

  // Sign in.
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", EMAIL);
  await page.fill("input[type=password]", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/`);
  await page.waitForSelector("[data-testid=desktop-sidebar]");
  console.log("signed in:", page.url());

  // Discover the settings chunk URL from the network while navigating.
  const chunkUrls = new Set<string>();
  page.on("response", (r) => {
    const url = r.url();
    if (url.includes("/_next/static/chunks/") && url.endsWith(".js")) {
      chunkUrls.add(url);
    }
  });

  // Warm the app on Dashboard (a view whose chunk loads fine).
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForSelector("h1");
  console.log("dashboard loaded");

  // Find the settings chunk: fetch each loaded chunk body and look for the
  // settings view's own H1 string (it only lives in the settings chunk).
  let settingsChunk: string | null = null;
  for (const url of chunkUrls) {
    try {
      const body = await (await page.request.get(url)).text();
      if (body.includes("Ajustes de la Tienda")) {
        settingsChunk = url;
        break;
      }
    } catch {
      /* ignore */
    }
  }
  console.log("settings chunk:", settingsChunk);

  if (!settingsChunk) {
    // Fall back: probe a navigation to /StoreSettings and capture which
    // NEW chunk URLs appear (the on-demand fetch), then reload and block.
    await page.goto(`${BASE}/StoreSettings`);
    await page.waitForSelector("h1");
    for (const url of chunkUrls) {
      const body = await (await page.request.get(url)).text();
      if (body.includes("Ajustes de la Tienda")) {
        settingsChunk = url;
        break;
      }
    }
    console.log("settings chunk (on-demand):", settingsChunk);
  }

  if (!settingsChunk) {
    console.error("SETTINGS CHUNK NOT FOUND — aborting probe");
    await browser.close();
    process.exit(1);
  }

  // The SPA switch: sit on Dashboard, block the settings chunk, click the
  // sidebar link — the lazy import fires on the soft navigation.
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForSelector("[data-testid=desktop-sidebar]");

  await page.route(settingsChunk, (route) => route.abort("failed"));
  await page.click("a[href='/StoreSettings']");
  await page.waitForTimeout(4000);

  const state = await page.evaluate(() => ({
    path: location.pathname,
    title: document.title,
    h1: document.querySelector("h1")?.textContent ?? null,
    bodySnippet: document.body.innerText.replace(/\s+/g, " ").slice(0, 160),
    reactRootChildren: document.getElementById("__next")?.children.length
      ?? document.body.children.length,
  }));
  console.log("POST-FAILURE STATE:", JSON.stringify(state, null, 2));
  console.log("PAGE ERRORS:", JSON.stringify(pageErrors, null, 2));
  console.log("CONSOLE ERRORS:", JSON.stringify(consoleErrors.slice(0, 6), null, 2));

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

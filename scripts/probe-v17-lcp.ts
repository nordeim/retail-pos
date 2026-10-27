// The V17 LCP probe: identifies the dashboard's largest-contentful-paint
// element + the phase timings, against the booted standalone server.
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:3101";

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`);
  await page.locator('input[type="email"]').fill("owner@veloxpos.local");
  await page.locator('input[type="password"]').fill("$Abcd1234");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE}/`);

  // Reload /Dashboard cold (the LCP measurement surface).
  await page.goto(`${BASE}/Dashboard`);
  const lcp = await page.evaluate(
    () =>
      new Promise<{ entries: unknown[] }>((resolve) => {
        const entries: unknown[] = [];
        const po = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) entries.push(e);
        });
        po.observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => resolve({ entries }), 6000);
      }),
  );
  const es = lcp.entries as Array<{ startTime: number; size: number; url?: string; element?: unknown }>;
  const last = es[es.length - 1];
  interface LcpEntry {
    startTime: number;
    size: number;
    element?: Element | null;
  }
  const lastTyped = last as unknown as LcpEntry;
  const el = lastTyped.element as HTMLElement | null;
  console.log(
    "LCP entries:",
    es.length,
    "| last:",
    Math.round(lastTyped.startTime),
    "ms size:",
    lastTyped.size,
  );
  if (el) {
    console.log("LCP element tag:", el.tagName);
    console.log("LCP element classes:", (el.className || "").toString().slice(0, 150));
    console.log("LCP element text:", (el.textContent || "").trim().slice(0, 60));
  }
  // Resource timing for the boot chain.
  const res = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((r) => r.name.includes("/_next/") || r.name.includes("/api/"))
      .map((r) => ({ n: r.name.split("/").slice(-1)[0].slice(0, 28), s: Math.round(r.startTime), d: Math.round(r.duration) })),
  );
  console.log("boot chain (start ms / dur ms):");
  for (const r of res.slice(0, 18)) console.log(`  ${r.n.padEnd(30)} start=${r.s} dur=${r.d}`);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

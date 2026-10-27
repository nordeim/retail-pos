// V18 audit probe: INP-style interaction latency on the Terminal product
// grid (session_27's suggested next step) — click→ticket-update latency,
// measured ENTIRELY in-page (one evaluate per sample, no round-trip
// pollution): the click fires, the probe waits for the ticket panel's
// line-count textContent to change, and performance.now() brackets it.
// Usage: bun scripts/probe-v18-inp.ts
import { chromium } from "@playwright/test";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3101";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "owner@veloxpos.local");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/`);
  await page.waitForSelector("[data-testid=terminal-grid]", { timeout: 20_000 });
  console.log("terminal mounted (shift open, grid visible)");

  // In-page measurement: click product card N, wait for the ticket panel
  // text to change (a line was added), bracket with performance.now().
  const samples: number[] = [];
  for (let i = 0; i < 10; i++) {
    const ms = await page.evaluate(async (idx) => {
      const panel = document.querySelector<HTMLElement>("[data-testid=ticket-panel]");
      const grid = document.querySelector<HTMLElement>("[data-testid=terminal-grid]");
      if (!panel || !grid) return -1;
      const before = panel.innerText;
      const cards = grid.querySelectorAll("button");
      const card = cards[idx % Math.min(cards.length, 6)];
      if (!card) return -2;
      const t0 = performance.now();
      card.click();
      await new Promise<void>((resolve) => {
        const check = () => {
          if (panel.innerText !== before || performance.now() - t0 > 3000) resolve();
          else requestAnimationFrame(check);
        };
        check();
      });
      return Math.round((performance.now() - t0) * 10) / 10;
    }, i);
    samples.push(ms);
  }
  const ok = samples.filter((s) => s >= 0).sort((a, b) => a - b);
  console.log(
    JSON.stringify({
      clickToTicketMs: {
        min: ok[0],
        median: ok[Math.floor(ok.length / 2)],
        max: ok[ok.length - 1],
        all: ok,
      },
      note: "in-page rAF-bracketed click→ticket-paint latency (the INP-style signal)",
    }),
  );

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

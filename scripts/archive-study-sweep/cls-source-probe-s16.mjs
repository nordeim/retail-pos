// S16 CLS source diagnosis — records layout-shift entries WITH their
// sources (node + rects + startTime) on the dashboard cold load, so the
// shift can be attributed to a specific element instead of guessed.
import { chromium } from "playwright";

const BASE = process.env.CWV_BASE ?? "http://localhost:3200";

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, {
    timeout: 30000,
  });
}

async function main() {
  const browser = await chromium.launch();
  for (const vp of [
    { name: "mobile", viewport: { width: 390, height: 844 } },
    { name: "desktop", viewport: { width: 1280, height: 800 } },
  ]) {
    const context = await browser.newContext({ viewport: vp.viewport });
    const page = await context.newPage();
    await login(page);
    await page.addInitScript(() => {
      window.__shifts = [];
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (e.hadRecentInput) continue;
          const sources = (e.sources || [])
            .map((s) => {
              const n = s.node;
              const desc = n
                ? `${n.tagName}${
                    typeof n.className === "string" && n.className
                      ? "." + n.className.split(" ").slice(0, 4).join(".")
                      : ""
                  }${n.textContent ? " text=" + n.textContent.trim().slice(0, 40) : ""}`
                : "(detached)";
              const r = s.currentRect || s.previousRect || {};
              return `${desc} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`;
            })
            .join(" | ");
          window.__shifts.push({
            t: Math.round(e.startTime),
            value: Math.round(e.value * 1000) / 1000,
            sources,
          });
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(`${BASE}/Dashboard`, { waitUntil: "load" });
    await page.waitForTimeout(5000);
    const shifts = await page.evaluate(() => window.__shifts);
    const cls = shifts.reduce((a, b) => a + b.value, 0);
    console.log(`\n=== ${vp.name} (CLS ${Math.round(cls * 1000) / 1000}, ${shifts.length} shifts) ===`);
    for (const s of shifts.slice(0, 14)) {
      console.log(`  t=${s.t}ms +${s.value}: ${s.sources.slice(0, 220)}`);
    }
    await context.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

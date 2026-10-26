// Session-66 isolation probe: does the clone's EMPTY Events page render the
// day-focus strip (big date + CW line)? Prints the full main text + the
// strip's own fingerprint. Reference-vs-clone same-page check.
import { chromium } from "playwright";

const CLONE = "http://localhost:3200";

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const email = `s66-events-${Date.now()}@studyflow.app`;
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  const reg = await page.request.post(`${CLONE}/api/auth/register`, {
    data: { email, password: "Fresh1234!", name: "S66 Events" },
  });
  const { code } = await reg.json();
  await page.request.post(`${CLONE}/api/auth/verify-email`, { data: { email, code } });
  await page.goto(`${CLONE}/`, { timeout: 45000 });
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.locator("a").filter({ hasText: "Events" }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2500);

  const fp = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const strip = document.querySelector('[aria-label*="Day focus" i], [aria-label*="day focus" i]');
    return {
      text: main.innerText.replace(/\s+/g, " "),
      stripAria: strip ? strip.getAttribute("aria-label") : null,
      stripText: strip ? strip.innerText.replace(/\s+/g, " ") : null,
      cwAnywhere: /CW ?\d+/.test(main.innerText),
      controls: [...main.querySelectorAll("button[aria-label]")].map((b) => b.getAttribute("aria-label")).filter((l) => /previous|next|today|collapse|day/i.test(l)).slice(0, 8),
    };
  });
  console.log(JSON.stringify(fp, null, 1));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

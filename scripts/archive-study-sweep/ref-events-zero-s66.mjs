// Session-66: fingerprint the REFERENCE's empty Events page precisely —
// the day-focus strip at zero (overline/controls row, big date, CW line,
// day list, New Event) — for the RED pin's expected values.
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.locator("a").filter({ hasText: "Events" }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2500);

  const fp = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const btns = [...main.querySelectorAll("button")].map((b) => ({
      label: b.getAttribute("aria-label") || b.textContent.trim().slice(0, 30),
      cls: b.className.slice(0, 60),
    }));
    return {
      text: main.innerText.replace(/\s+/g, " "),
      cw: (main.innerText.match(/CW ?\d+/) || [null])[0],
      buttons: btns.slice(0, 18),
      // the big date block: find text-4xl-ish headings
      bigs: [...main.querySelectorAll("[class*='text-4xl'],[class*='text-3xl']")].map((e) => e.textContent.trim()).slice(0, 4),
      weekday: [...main.querySelectorAll("[class*='text-lg']")].map((e) => e.textContent.trim()).slice(0, 4),
    };
  });
  console.log(JSON.stringify(fp, null, 1));
  await page.screenshot({ path: "docs/screenshots/66-ref-desktop-events-zero.png", fullPage: false });
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

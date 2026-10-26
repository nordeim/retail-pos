// Session-65 orphan-grade deletion — the grade survived subject deletion as
// a dangling row. Find its entry on Grade Tracker and delete it.
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);
  await page.locator("a").filter({ hasText: "Grade Tracker" }).first().click();
  await page.waitForTimeout(2000);
  // FULL text, no truncation
  const full = await page.evaluate(() => (document.querySelector("main") || document.body).innerText);
  console.log("FULL MAIN TEXT:", JSON.stringify(full));
  // all buttons with labels
  const btns = await page.evaluate(() =>
    [...document.querySelectorAll("main button")].map((b) => ({
      label: b.getAttribute("aria-label") || b.textContent.trim().slice(0, 40),
      visible: b.offsetParent !== null,
    })),
  );
  console.log("BUTTONS:", JSON.stringify(btns, null, 1));
} finally {
  await browser.close();
}

// Session-65 residue verification — reload + full account sweep.
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
  await page.waitForTimeout(2500);
  for (const v of ["Grade Tracker", "Settings"]) {
    await page.locator("a").filter({ hasText: v }).first().click();
    await page.waitForTimeout(1500);
    if (v === "Settings") {
      await page.locator("button").filter({ hasText: "Subjects" }).first().click();
      await page.waitForTimeout(1000);
    }
    const t = await page.evaluate(() => (document.querySelector("main") || document.body).innerText.replace(/\s+/g, " ").slice(0, 400));
    console.log(`${v}:`, JSON.stringify(t));
  }
} finally {
  await browser.close();
}

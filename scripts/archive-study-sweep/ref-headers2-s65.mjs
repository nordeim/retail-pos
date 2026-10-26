// Capture ALL entity API calls (GET included) with headers.
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const seen = [];
page.on("request", (req) => {
  if (/\/entities\//.test(req.url()) && !seen.some((s) => s.url === req.url() && s.method === req.method())) {
    const h = req.headers();
    seen.push({
      method: req.method(),
      url: req.url().replace(REF, ""),
      headers: {
        authorization: h["authorization"] || null,
        "x-api-key": h["x-api-key"] || null,
        "x-session-token": h["x-session-token"] || null,
        cookie_present: !!h["cookie"],
        cookie_names: h["cookie"] ? h["cookie"].split(";").map((c) => c.trim().split("=")[0]) : [],
      },
    });
  }
});

try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.locator("a").filter({ hasText: "Grade Tracker" }).first().click();
  await page.waitForTimeout(2500);
  console.log(JSON.stringify(seen, null, 1));
} finally {
  await browser.close();
}

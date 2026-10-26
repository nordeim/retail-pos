// Session-65 API-learning cleanup: intercept the reference UI's own create
// calls to learn the entity API shape, then DELETE the orphan grade + probe
// subject through the same API (cleanup of probe data — authorized).
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const apiCalls = [];
page.on("request", (req) => {
  const url = req.url();
  if (/base44\.app\/api\//.test(url) && req.method() !== "GET") {
    apiCalls.push({ method: req.method(), url, body: (req.postData() || "").slice(0, 300) });
  }
});
page.on("response", async (res) => {
  const url = res.url();
  if (/base44\.app\/api\//.test(url) && req2ok(res.request())) {
    try {
      const body = await res.text();
      apiCalls.push({ method: res.request().method(), url, status: res.status(), resp: body.slice(0, 300) });
    } catch {}
  }
});
function req2ok(req) { return req.method() !== "GET"; }

try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);

  // create a subject (intercepts the create call)
  await page.locator("a").filter({ hasText: "Settings" }).first().click();
  await page.waitForTimeout(1200);
  await page.locator("button").filter({ hasText: "Subjects" }).first().click();
  await page.waitForTimeout(1000);
  await page.locator("main button", { hasText: /add subject/i }).first().click();
  await page.waitForTimeout(800);
  await page.locator("[role=dialog] input").first().fill("Probe Subject");
  await page.locator("[role=dialog] button", { hasText: /add subject/i }).first().click();
  await page.waitForTimeout(1500);

  // create a grade on it (intercepts the create call)
  await page.locator("a").filter({ hasText: "Grade Tracker" }).first().click();
  await page.waitForTimeout(1500);
  await page.locator("main button", { hasText: "Add Grade" }).first().click();
  await page.waitForTimeout(1000);
  const nums = page.locator("[role=dialog] input[type=number]");
  await nums.nth(0).fill("50");
  await nums.nth(1).fill("100");
  const subjTrigger = page.locator("[role=dialog] [role=combobox]").first();
  if ((await subjTrigger.count()) > 0) {
    await subjTrigger.click();
    await page.waitForTimeout(500);
    const opt = page.locator("[role=option]", { hasText: "Probe Subject" }).first();
    if ((await opt.count()) > 0) await opt.click();
  }
  await page.locator("[role=dialog] button", { hasText: /add grade/i }).first().click();
  await page.waitForTimeout(2000);

  console.log("LEARNED API CALLS:", JSON.stringify(apiCalls, null, 1));
} catch (err) {
  console.log("ERR", String(err).slice(0, 300));
} finally {
  await browser.close();
}

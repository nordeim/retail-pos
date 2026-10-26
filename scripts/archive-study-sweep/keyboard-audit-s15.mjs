// S15 keyboard audit — probes the CLONE calculator (dev server :3000) with
// PHYSICAL keyboard events. Pre-fix: the display ignores them (click-only,
// parity with the reference). Post-fix: the superset listener maps them.
import { chromium } from "playwright";

const CLONE = "http://localhost:3000";
const DEMO = { email: "demo@studyflow.app", password: "Demo1234!" };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto(`${CLONE}/login`);
await page.waitForSelector("input[type=email]");
await page.fill("input[type=email]", DEMO.email);
await page.fill("input[type=password]", DEMO.password);
await page.click("button[type=submit]");
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 30000 });
await page.goto(`${CLONE}/Calculator`);
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 30000 });
await page.waitForTimeout(1200);

// Focus-free physical typing (the listener is on window)
await page.keyboard.type("12+3", { delay: 60 });
await page.waitForTimeout(400);
const afterTyping = await page.evaluate(() => {
  const display = [...document.querySelectorAll("div, input")].find(
    (el) => el.textContent.trim() === "12+3",
  );
  return display ? "12+3" : null;
});
await page.keyboard.press("Enter");
await page.waitForTimeout(900);
const afterEnter = await page.evaluate(() => {
  const display = [...document.querySelectorAll("div, input")].find(
    (el) => el.textContent.trim() === "15",
  );
  return display ? "15" : null;
});
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
const afterEscape = await page.evaluate(() => {
  const display = [...document.querySelectorAll("div, input")].find(
    (el) => el.textContent.trim() === "0",
  );
  return display ? "0" : null;
});

await browser.close();
const result = {
  typed: afterTyping,
  evaluated: afterEnter,
  cleared: afterEscape,
  supersetWorking: afterTyping === "12+3" && afterEnter === "15" && afterEscape === "0",
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.supersetWorking ? 0 : 1);

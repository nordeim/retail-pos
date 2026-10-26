// Session-67 evidence: the FIXED brand header — clone drawer open at
// 390×844 (subtitle now one line) + desktop sidebar at 1440×900.
import { chromium } from "playwright";

const CLONE = "http://localhost:3200";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(`${CLONE}/login`, { timeout: 45000 });
await page.fill("input[type=email]", "demo@studyflow.app");
await page.fill("input[type=password]", "Demo1234!");
await page.click("button[type=submit]");
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
await page.waitForTimeout(2500);

await page.getByRole("button", { name: "Open navigation menu" }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: "docs/screenshots/67-clone-drawer-brand-fixed.png" });
await browser.close();

const browser2 = await chromium.launch();
const ctx2 = await browser2.newContext({ viewport: { width: 1440, height: 900 } });
const page2 = await ctx2.newPage();
await page2.goto(`${CLONE}/login`, { timeout: 45000 });
await page2.fill("input[type=email]", "demo@studyflow.app");
await page2.fill("input[type=password]", "Demo1234!");
await page2.click("button[type=submit]");
await page2.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
await page2.waitForTimeout(2500);
await page2.screenshot({ path: "docs/screenshots/67-clone-desktop-sidebar-fixed.png" });
await browser2.close();
console.log("captures done");

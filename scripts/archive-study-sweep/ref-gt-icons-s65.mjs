// Measure the reference GradeTracker stat card icon colors + value colors.
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
  const m = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const label = [...main.querySelectorAll("*")].find((el) => el.children.length === 0 && el.textContent.trim() === "Overall Average");
    const grid = label.closest("[class*=grid]");
    return [...grid.children].map((c) => {
      const svg = c.querySelector("svg");
      const ss = svg ? getComputedStyle(svg) : null;
      const value = [...c.querySelectorAll("p")].pop();
      return {
        iconColor: ss?.color,
        iconSize: svg ? Math.round(svg.getBoundingClientRect().width) : null,
        iconCls: svg?.getAttribute("class"),
        valueCls: value?.getAttribute("class"),
        valueColor: value ? getComputedStyle(value).color : null,
        valueSize: value ? getComputedStyle(value).fontSize : null,
      };
    });
  });
  console.log(JSON.stringify(m, null, 1));
} finally {
  await browser.close();
}

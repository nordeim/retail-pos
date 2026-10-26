// Measure the reference right-pane "Select a group" nodes precisely.
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
  await page.locator("a").filter({ hasText: "Study Groups" }).first().click();
  await page.waitForTimeout(2000);
  const m = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const nodes = [...main.querySelectorAll("*")].filter((el) =>
      el.children.length === 0 && /Select a group|Choose a study group from/.test(el.textContent.trim()),
    );
    return nodes.map((el) => {
      const s = getComputedStyle(el);
      return {
        tag: el.tagName, text: el.textContent.trim().slice(0, 60),
        fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color,
        cls: (el.className || "").toString().slice(0, 90),
        parentCls: (el.parentElement?.className || "").toString().slice(0, 90),
        parentTag: el.parentElement?.tagName,
      };
    });
  });
  console.log(JSON.stringify(m, null, 1));
} finally {
  await browser.close();
}

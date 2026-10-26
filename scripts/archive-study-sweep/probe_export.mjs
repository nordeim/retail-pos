import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  storageState: "tests/e2e/.auth/user.json",
});
const page = await ctx.newPage();
await page.goto("http://localhost:3100/export");
await page.waitForTimeout(2000);
const diag = await page.evaluate(() => {
  const region = document.querySelector('[aria-label="What\'s included"]');
  const chips = region ? [...region.querySelectorAll("span")].slice(0, 8).map((s) => s.textContent) : null;
  return {
    url: location.pathname,
    h1: document.querySelector("h1")?.textContent ?? null,
    regionFound: !!region,
    chips,
  };
});
console.log(JSON.stringify(diag, null, 1));
await browser.close();

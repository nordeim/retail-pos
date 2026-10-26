import { chromium } from "@playwright/test";

const probe = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    storageState: "tests/e2e/.auth/user.json",
    baseURL: "http://localhost:3100",
  });
  const page = await ctx.newPage();
  await page.goto("/Calendar");
  await page.waitForFunction(
    () => document.documentElement.dataset.appHydrated === "true",
    undefined,
    { timeout: 15000 },
  );
  const info = await page.evaluate(() => {
    const head = document.querySelector('[aria-label="Calendar weekdays"]');
    if (!head) return { found: false };
    return {
      found: true,
      tag: head.tagName,
      cls: head.className,
      childTags: Array.from(head.children).map((c) => c.tagName),
      spanCount: head.querySelectorAll("span").length,
      html: head.outerHTML.slice(0, 300),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
};
probe();

import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + "/login");
  await page.fill('input[type="email"]', "demo@studyflow.app");
  await page.fill('input[type="password"]', "Demo1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/Dashboard", { timeout: 20000 }).catch(() => {});
  console.log("after login url:", page.url());

  await page.goto(BASE + "/Calendar");
  await page.waitForSelector('[aria-label="Calendar days"]', { timeout: 30000 });
  await page.waitForTimeout(1500);

  const probe = async (label) => {
    const info = await page.evaluate(() => {
      const grid = document.querySelector('[aria-label="Calendar days"]');
      const today = grid?.querySelector("button[data-today]");
      const sel = grid?.querySelector("button[aria-pressed=true]");
      const sel15 = Array.from(grid?.querySelectorAll("button") ?? []).find(
        (b) => b.textContent?.trim() === "15",
      );
      const cs = (el) => (el ? getComputedStyle(el).backgroundColor : "n/a");
      return {
        todayExists: !!today,
        todayAria: today?.getAttribute("aria-label"),
        todayPressed: today?.getAttribute("aria-pressed"),
        todayBg: cs(today),
        todayCls: today?.className?.slice(0, 200),
        selAria: sel?.getAttribute("aria-label"),
        selBg: cs(sel),
        day15Aria: sel15?.getAttribute("aria-label"),
        day15Pressed: sel15?.getAttribute("aria-pressed"),
      };
    });
    console.log(label, JSON.stringify(info, null, 2));
  };

  await probe("BEFORE-CLICK:");
  const day15 = page
    .locator('[aria-label="Calendar days"] button')
    .filter({ hasText: "15" })
    .first();
  await day15.click();
  await page.waitForTimeout(800);
  await probe("AFTER-CLICK:");
  await browser.close();
}

main().catch((e) => {
  console.error("PROBE FAILED:", e.message);
  process.exit(1);
});

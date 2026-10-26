// Session-76 evidence capture: the remediated clone surfaces on the DEV
// server (:3000, the seeded demo account) — the Batch AC anatomy before
// the commit. Desktop: Dashboard, Assignments (the new inline pill +
// chip + bell priority row), Exams (the new card anatomy + location +
// topics chips), Tasks (the date-form pills). Mobile 390×844: the drawer
// (the user-flagged surface) + the Assignments row stack.
// Usage: node scripts/capture-s76-clone.mjs  (dev server on :3000 first)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const CLONE = "http://localhost:3000";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const visit = async (navText) => {
  await page.locator("a").filter({ hasText: navText }).first().click({ timeout: 15000 });
  await page.waitForTimeout(1800);
};

try {
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);

  await page.screenshot({ path: `${OUT}/76-clone-dashboard.png` });
  await visit("Assignments");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/76-clone-assignments.png` });
  await visit("Exams");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/76-clone-exams.png` });
  await visit("Tasks");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/76-clone-tasks.png` });
  // The Add Exam dialog with the Location field.
  await visit("Exams");
  await page.getByRole("button", { name: "Add Exam" }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/76-clone-exam-dialog-location.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // Mobile 390×844: the drawer (the user-flagged surface) + assignments.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(900);
  await page.goto(`${CLONE}/Dashboard`);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/76-clone-mobile-dashboard.png` });
  const burger = page.locator('button[aria-label="Open navigation menu"]');
  if ((await burger.count()) > 0) {
    await burger.click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/76-clone-mobile-drawer.png` });
    await page.keyboard.press("Escape");
  }
  await page.goto(`${CLONE}/Assignments`);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/76-clone-mobile-assignments.png` });
  console.log("CAPTURED: 8 surfaces (4 desktop views + exam dialog + 3 mobile)");
} catch (e) {
  console.log("FATAL:", String(e).slice(0, 300));
} finally {
  await browser.close();
}

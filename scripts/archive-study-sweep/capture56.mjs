import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";

async function authed(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/login");
  await page.fill('input[type="email"]', "demo@studyflow.app");
  await page.fill('input[type="password"]', "Demo1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/Dashboard", { timeout: 20000 });
  return { ctx, page };
}

async function shot(page, path) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${path}`, fullPage: false });
  console.log("saved", path);
}

async function main() {
  const browser = await chromium.launch();

  // ---- demo user surfaces ----
  const { ctx, page } = await authed(browser);

  await page.goto(BASE + "/Settings");
  await page.waitForTimeout(1500);
  await shot(page, "56-settings-appearance.png");

  await page.getByRole("tab", { name: /profile/i }).click();
  await shot(page, "56-settings-profile.png");

  await page.getByRole("tab", { name: /notifications/i }).click();
  await shot(page, "56-settings-notifications.png");

  await page.getByRole("tab", { name: /subjects/i }).click();
  await shot(page, "56-settings-subjects.png");

  await page.getByRole("tab", { name: /holidays/i }).click();
  await shot(page, "56-settings-holidays.png");

  await page.goto(BASE + "/Analytics");
  await page.waitForTimeout(1800);
  await shot(page, "56-analytics.png");

  await page.goto(BASE + "/GradeTracker");
  await page.waitForTimeout(1500);
  await shot(page, "56-gradetracker.png");

  await page.goto(BASE + "/Calendar");
  await page.waitForTimeout(1500);
  await shot(page, "56-calendar.png");
  await ctx.close();

  // ---- fresh user zero states ----
  const zctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const zp = await zctx.newPage();
  const email = `s56-shot-${Date.now()}@studyflow.app`;
  const res = await zp.request.post(BASE + "/api/auth/register", {
    data: { email, password: "Fresh1234!", name: "Shot Probe" },
  });
  const code = (await res.json()).code;
  await zp.request.post(BASE + "/api/auth/verify-email", { data: { email, code } });
  await zp.goto(BASE + "/Dashboard");
  await zp.waitForTimeout(1500);

  await zp.goto(BASE + "/GradeTracker");
  await zp.waitForTimeout(1500);
  await shot(zp, "56-gradetracker-zero.png");

  await zp.goto(BASE + "/Analytics");
  await zp.waitForTimeout(1800);
  await shot(zp, "56-analytics-zero.png");

  await zp.setViewportSize({ width: 390, height: 844 });
  await zp.goto(BASE + "/StudyGroups");
  await zp.waitForTimeout(1500);
  await shot(zp, "56-studygroups-mobile-zero.png");

  await zp.goto(BASE + "/Tasks");
  await zp.waitForTimeout(1200);
  await shot(zp, "56-tasks-empty.png");
  await zctx.close();

  // ---- auth sub-screen geometry (mobile) ----
  const actx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const ap = await actx.newPage();
  await ap.goto(BASE + "/login");
  await ap.waitForTimeout(800);
  await ap.getByRole("button", { name: /sign up/i }).click();
  await ap.waitForTimeout(500);
  await shot(ap, "56-signup-mobile.png");
  await actx.close();

  await browser.close();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});

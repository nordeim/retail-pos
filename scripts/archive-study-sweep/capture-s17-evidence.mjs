// S17 evidence captures — the fresh-user journey fixes + the Settings depth,
// saved to docs/screenshots/s17-*.png (follows the capture-s15/s16 precedent:
// dev server on :3000, deterministic states, ONE registered fresh account).
// The captured surfaces:
//   1. Analytics at ZERO data — the stat cards render (the reference's own
//      zero-state behavior; the old "No data yet" EmptyState is gone).
//   2. Grade Tracker at zero grades — the stat cards only.
//   3. Tasks/Notes empty states — the reference-measured hint copy.
//   4. Settings → Profile — School Name / Grade Level / Daily Study Goal /
//      Account created (filled to show the save flow).
//   5. Settings → Notifications — the Enable Notifications master toggle.
//   6. Study Groups at mobile 390px — the reference's measured empty copy.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const EMAIL = `s17-evidence-${Date.now()}@example.com`;
const PASSWORD = "Evidence1234!";

const browser = await chromium.launch();
try {
  // ---- one fresh registration (desktop context) --------------------------
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`);
  await page.getByRole("button", { name: /sign up/i }).click();
  await page.waitForTimeout(600);
  await page.getByLabel("Email", { exact: true }).fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm Password").fill(PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForTimeout(1500);
  const code = await page.evaluate(() => {
    const m = document.body.innerText.match(/your code is[^]*?(\d{6})/i) ?? document.body.innerText.match(/\b(\d{6})\b/);
    return m?.[1] ?? null;
  });
  const boxes = page.locator("input[inputmode=numeric]");
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill(code.charAt(i));
  await page.getByRole("button", { name: /verify email/i }).click();
  await page.waitForFunction(
    () => /good (morning|afternoon|evening)/i.test(document.querySelector("main h1")?.textContent ?? ""),
    null, { timeout: 30000 },
  );

  // 1. Analytics at zero data — the unconditional stat cards.
  await page.goto(`${BASE}/Analytics`);
  await page.waitForFunction(() => document.documentElement.style.getPropertyValue("--sf-primary") !== "");
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/s17-analytics-zero.png` });

  // 2. Grade Tracker at zero grades — the stat cards only.
  await page.goto(`${BASE}/GradeTracker`);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/s17-gradetracker-zero.png` });

  // 3. The Tasks + Notes empty states with the reference-measured hints.
  await page.goto(`${BASE}/Tasks`);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/s17-tasks-empty.png` });
  await page.goto(`${BASE}/Notes`);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/s17-notes-empty.png` });

  // 4. Settings → Profile with the study fields filled.
  await page.goto(`${BASE}/Settings`);
  await page.waitForFunction(() => document.documentElement.style.getPropertyValue("--sf-primary") !== "");
  await page.getByRole("tab", { name: /profile/i }).click();
  await page.getByLabel("School Name").fill("Evidence High School");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "College Freshman", exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/s17-settings-profile.png` });
  await page.getByRole("button", { name: /save profile/i }).click();
  await page.waitForTimeout(1200);

  // 5. Settings → Notifications — the master toggle structure.
  await page.getByRole("tab", { name: /notifications/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/s17-settings-notifications.png` });

  // 6. Study Groups at mobile (390px) — the reference's measured copy.
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    storageState: await ctx.storageState(),
  });
  const mpage = await mctx.newPage();
  await mpage.goto(`${BASE}/StudyGroups`);
  await mpage.waitForFunction(() => document.documentElement.style.getPropertyValue("--sf-primary") !== "");
  await mpage.waitForTimeout(900);
  await mpage.screenshot({ path: `${OUT}/s17-studygroups-mobile.png` });

  console.log(JSON.stringify({ captured: 7, email: EMAIL }, null, 2));
} finally {
  await browser.close();
}

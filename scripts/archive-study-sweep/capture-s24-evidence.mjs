// S24 evidence captures — the change-password flow, saved to
// docs/screenshots/s24-* (follows the capture-s21/s22/s23 precedents: dev
// server on :3000, the demo account, the production theme path).
// The captured evidence:
//   1. The API round-trip proof (JSON): the guard family on the demo
//      session (wrong current 400 / same password 400 / short new 400 —
//      the stored hash untouched: the demo login still succeeds), the
//      anon 401 gate, and the FULL rotation on a fresh user (register →
//      verify → sign in → rotate → the old password login 401 → the new
//      password login 200 → the session SURVIVES /api/auth/me 200).
//   2. Dev-server screenshots of the remediated codebase: the Settings
//      Profile tab with the Change password card — desktop light, desktop
//      DARK (themed through the production loadFromUser path), the
//      success-note state after a real panel submission (rotated + RESTORED
//      through the panel), and mobile 390px (no overflow).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
try {
  // ---- 1. The API round-trip proof ----------------------------------------
  // The demo session rides the context (the guard family runs pre-write).
  const ctx0 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page0 = await ctx0.newPage();
  await page0.goto(`${BASE}/login`);
  await page0.fill("input[type=email]", "demo@studyflow.app");
  await page0.fill("input[type=password]", "Demo1234!");
  await page0.click("button[type=submit]");
  await page0.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 30000 });
  await page0.waitForTimeout(800);

  const post = (body) =>
    page0.request.post(`${BASE}/api/auth/change-password`, { data: body }).then(async (res) => ({
      status: res.status(),
      body: await res.json(),
    }));

  const wrongCurrent = await post({ currentPassword: "WrongPass99!", newPassword: "NewPass5678!" });
  const samePassword = await post({ currentPassword: "Demo1234!", newPassword: "Demo1234!" });
  const shortNew = await post({ currentPassword: "Demo1234!", newPassword: "short" });
  // The guards ran BEFORE any write: the demo user still signs in.
  const demoStillSignsIn = await page0.request
    .post(`${BASE}/api/auth/login`, { data: { email: "demo@studyflow.app", password: "Demo1234!" } })
    .then((r) => r.status());
  await ctx0.close();

  // The anon gate (a session-free context).
  const anonCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const anonPage = await anonCtx.newPage();
  const anon = await anonPage.request
    .post(`${BASE}/api/auth/change-password`, {
      data: { currentPassword: "Demo1234!", newPassword: "NewPass5678!" },
    })
    .then(async (res) => ({ status: res.status(), body: await res.json() }));
  await anonCtx.close();

  // The FULL rotation on a fresh user (the S17 registerFreshUser pattern).
  const freshEmail = `s24-capture-${Date.now()}@studyflow.app`;
  const reg = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const regPage = await reg.newPage();
  const regRes = await regPage.request.post(`${BASE}/api/auth/register`, {
    data: { email: freshEmail, password: "Fresh1234!", name: "S24 Capture" },
  });
  const regBody = await regRes.json();
  await regPage.request.post(`${BASE}/api/auth/verify-email`, {
    data: { email: freshEmail, code: regBody.code },
  });
  const freshLogin = await regPage.request
    .post(`${BASE}/api/auth/login`, { data: { email: freshEmail, password: "Fresh1234!" } })
    .then((r) => r.status());
  const rotate = await regPage.request
    .post(`${BASE}/api/auth/change-password`, {
      data: { currentPassword: "Fresh1234!", newPassword: "Captured5678!" },
    })
    .then(async (r) => ({ status: r.status(), body: await r.json() }));
  // The session SURVIVES the rotation (stateless HMAC — documented).
  const sessionSurvives = await regPage.request.get(`${BASE}/api/auth/me`).then((r) => r.status());
  // The OLD password no longer signs in; the NEW one does.
  const oldLogin = await regPage.request
    .post(`${BASE}/api/auth/login`, { data: { email: freshEmail, password: "Fresh1234!" } })
    .then(async (r) => ({ status: r.status(), body: await r.json() }));
  const newLogin = await regPage.request
    .post(`${BASE}/api/auth/login`, { data: { email: freshEmail, password: "Captured5678!" } })
    .then((r) => r.status());
  await reg.close();

  writeFileSync(
    `${OUT}/s24-change-password-evidence.json`,
    JSON.stringify(
      {
        guardFamily: { wrongCurrent, samePassword, shortNew },
        demoStillSignsIn: demoStillSignsIn === 200,
        anonGate: anon,
        freshUserRotation: {
          registered: regRes.status(),
          verifiedLogin: freshLogin,
          rotate,
          sessionSurvivesMe: sessionSurvives,
          oldPasswordLogin: oldLogin,
          newPasswordLogin: newLogin,
        },
      },
      null,
      2,
    ) + "\n",
  );

  // ---- 2. Dev-server screenshots (the remediated codebase) ---------------
  const openProfile = async (viewport, fulfillDark) => {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`);
    await page.fill("input[type=email]", "demo@studyflow.app");
    await page.fill("input[type=password]", "Demo1234!");
    await page.click("button[type=submit]");
    await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 30000 });
    if (fulfillDark) {
      // Theme the page dark through the PRODUCTION path: fulfill
      // /api/auth/me with the real payload, themeMode overridden.
      await page.route(`${BASE}/api/auth/me`, async (route) => {
        const real = await route.fetch();
        const body = await real.json();
        if (body?.user) body.user.themeMode = "dark";
        await route.fulfill({
          status: real.status(),
          contentType: "application/json",
          body: JSON.stringify(body),
        });
      });
    }
    await page.goto(`${BASE}/Settings`);
    await page.getByRole("tab", { name: /profile/i }).click();
    await page.waitForTimeout(1200); // the tab + theme settle
    return { ctx, page };
  };

  const readChrome = (page) =>
    page.evaluate(() => ({
      pinnedHeader: !!([...document.querySelectorAll("h3")].find((h) => h.textContent?.trim() === "Your account and study information")),
      schoolInput: !!document.querySelector("#school-name"),
      saveProfileButton: !!([...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Save Profile")),
      changePasswordCard: !!document.querySelector('section[aria-label="Change password"]'),
      cardFields: ["current-password", "new-password", "confirm-new-password"].filter(
        (id) => !!document.querySelector(`#${id}`),
      ),
      updateButton: !!([...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Update Password")),
    }));

  // 2a. Desktop light.
  const light = await openProfile({ width: 1280, height: 800 }, false);
  await light.page.screenshot({ path: `${OUT}/s24-change-password-light.png`, fullPage: true });
  const lightChrome = await readChrome(light.page);
  await light.ctx.close();

  // 2b. Desktop DARK (themed through the production path).
  const dark = await openProfile({ width: 1280, height: 800 }, true);
  await dark.page.screenshot({ path: `${OUT}/s24-change-password-dark.png`, fullPage: true });
  const darkClass = await dark.page.evaluate(() => document.documentElement.className);
  const darkChrome = await readChrome(dark.page);
  await dark.ctx.close();

  // 2c. The success-note state (a real panel submission — rotated then
  //     RESTORED through the panel, so the demo account ends unchanged).
  const result = await openProfile({ width: 1280, height: 800 }, false);
  const card = result.page.locator('section[aria-label="Change password"]');
  await card.getByLabel("Current password").fill("Demo1234!");
  await card.getByLabel("New password", { exact: true }).fill("Captured5678!");
  await card.getByLabel("Confirm new password").fill("Captured5678!");
  await card.getByRole("button", { name: /update password/i }).click();
  await result.page.getByRole("status").waitFor({ timeout: 30000 });
  await result.page.waitForTimeout(500);
  await result.page.screenshot({ path: `${OUT}/s24-change-password-success.png`, fullPage: true });
  const successText = await result.page.getByRole("status").textContent();
  // The restore (the panel again — the account ends with its own password).
  await card.getByLabel("Current password").fill("Captured5678!");
  await card.getByLabel("New password", { exact: true }).fill("Demo1234!");
  await card.getByLabel("Confirm new password").fill("Demo1234!");
  await card.getByRole("button", { name: /update password/i }).click();
  await result.page.getByRole("status").waitFor({ timeout: 30000 });
  const restoredLogin = await result.page.request
    .post(`${BASE}/api/auth/login`, { data: { email: "demo@studyflow.app", password: "Demo1234!" } })
    .then((r) => r.status());
  await result.ctx.close();

  // 2d. Mobile 390px (no horizontal overflow).
  const mobile = await openProfile({ width: 390, height: 844 }, false);
  await mobile.page.screenshot({ path: `${OUT}/s24-change-password-mobile.png`, fullPage: true });
  const mobileOverflow = await mobile.page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  const mobileChrome = await readChrome(mobile.page);
  await mobile.ctx.close();

  writeFileSync(
    `${OUT}/s24-change-password-evidence.json`,
    JSON.stringify(
      {
        guardFamily: { wrongCurrent, samePassword, shortNew },
        demoStillSignsIn: demoStillSignsIn === 200,
        anonGate: anon,
        freshUserRotation: {
          registered: regRes.status(),
          verifiedLogin: freshLogin,
          rotate,
          sessionSurvivesMe: sessionSurvives,
          oldPasswordLogin: oldLogin,
          newPasswordLogin: newLogin,
        },
        screenshots: {
          light: { chrome: lightChrome },
          dark: { htmlClass: darkClass, chrome: darkChrome },
          success: { note: successText, demoRestoredLogin: restoredLogin },
          mobile: { overflow: mobileOverflow, chrome: mobileChrome },
        },
      },
      null,
      2,
    ) + "\n",
  );
  console.log("S24 captures written:");
  console.log(`  ${OUT}/s24-change-password-evidence.json`);
  console.log(`  ${OUT}/s24-change-password-light.png`);
  console.log(`  ${OUT}/s24-change-password-dark.png`);
  console.log(`  ${OUT}/s24-change-password-success.png`);
  console.log(`  ${OUT}/s24-change-password-mobile.png`);
} finally {
  await browser.close();
}

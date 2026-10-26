// S26 evidence captures — the email-change flow, saved to
// docs/screenshots/s26-* (follows the capture-s21..s25 precedents: dev
// server on :3000, the demo account, the production theme path).
// The captured evidence:
//   1. The API round-trip proof (JSON): the guard family on the demo
//      session (wrong password 400 / mismatched confirm 400 / short
//      password 400 / same-email 400 / duplicate-email 409 — the account
//      untouched: the demo login still succeeds), the anon 401 gate, and
//      the FULL identity rotation on a fresh user (register → verify →
//      sign in → change → me 200 reporting the NEW email → the DB-level
//      email check through Prisma [email field updated, emailVerified
//      STILL TRUE, same user id] → the old-email login 401 → the
//      new-email login 200) + the demo restore proof.
//   2. Dev-server screenshots of the remediated codebase: the Settings
//      Profile tab with the Email address card — desktop light, desktop
//      DARK (themed through the production loadFromUser path), the
//      success-note state (a real panel change + the LIVE identity-block
//      update, then RESTORED through the panel — the demo account ends
//      unchanged), and mobile 390px (no overflow).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

// The audit-script pattern (ai-error-audit.mjs / data-volume-audit.mjs):
// the datasources URL is schema-anchored — run from the repo root.
const prisma = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });

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
    page0.request.post(`${BASE}/api/auth/change-email`, { data: body }).then(async (res) => ({
      status: res.status(),
      body: await res.json(),
    }));

  const wrongPassword = await post({
    password: "WrongPass999!",
    newEmail: "newaddress@example.com",
    confirmEmail: "newaddress@example.com",
  });
  const mismatchedConfirm = await post({
    password: "Demo1234!",
    newEmail: "newaddress@example.com",
    confirmEmail: "different@example.com",
  });
  const shortPassword = await post({
    password: "short",
    newEmail: "newaddress@example.com",
    confirmEmail: "newaddress@example.com",
  });
  const sameEmail = await post({
    password: "Demo1234!",
    newEmail: "demo@studyflow.app",
    confirmEmail: "demo@studyflow.app",
  });
  // The duplicate-email guard: a throwaway unverified registration owns the
  // address — the demo user cannot claim it.
  const takenEmail = `s26-taken-${Date.now()}@studyflow.app`;
  await page0.request.post(`${BASE}/api/auth/register`, {
    data: { email: takenEmail, password: "Fresh1234!", name: "S26 Taken" },
  });
  const duplicateEmail = await post({
    password: "Demo1234!",
    newEmail: takenEmail,
    confirmEmail: takenEmail,
  });
  // The guards ran BEFORE any write: the demo user still signs in.
  const demoStillSignsIn = await page0.request
    .post(`${BASE}/api/auth/login`, { data: { email: "demo@studyflow.app", password: "Demo1234!" } })
    .then((r) => r.status());
  await ctx0.close();

  // The anon gate (a session-free context).
  const anonCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const anonPage = await anonCtx.newPage();
  const anon = await anonPage.request
    .post(`${BASE}/api/auth/change-email`, {
      data: {
        password: "Demo1234!",
        newEmail: "newaddress@example.com",
        confirmEmail: "newaddress@example.com",
      },
    })
    .then(async (res) => ({ status: res.status(), body: await res.json() }));
  await anonCtx.close();

  // The FULL identity rotation on a fresh user (the S17/S24/S25
  // registerFreshUser pattern — the journey runs on a throwaway account).
  const freshEmail = `s26-capture-${Date.now()}@studyflow.app`;
  const freshCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const freshPage = await freshCtx.newPage();
  const regRes = await freshPage.request.post(`${BASE}/api/auth/register`, {
    data: { email: freshEmail, password: "Fresh1234!", name: "S26 Capture" },
  });
  const regBody = await regRes.json();
  await freshPage.request.post(`${BASE}/api/auth/verify-email`, {
    data: { email: freshEmail, code: regBody.code },
  });
  const freshLogin = await freshPage.request
    .post(`${BASE}/api/auth/login`, { data: { email: freshEmail, password: "Fresh1234!" } })
    .then(async (r) => {
      const cookie = (r.headers()["set-cookie"] || "").split(";")[0];
      return { status: r.status(), cookie };
    });
  const freshId = (await prisma.user.findUnique({ where: { email: freshEmail }, select: { id: true } }))?.id;

  // The change — with the session cookie riding the request.
  const newEmail = `s26-capture-new-${Date.now()}@studyflow.app`;
  const change = await freshPage.request.post(`${BASE}/api/auth/change-email`, {
    headers: { cookie: freshLogin.cookie },
    data: { password: "Fresh1234!", newEmail, confirmEmail: newEmail },
  });
  const changeBody = await change.json().catch(() => ({}));

  // The DB-level check through Prisma directly: the email field moved, the
  // user id is the SAME account, emailVerified STAYS TRUE, and the old
  // address no longer resolves.
  const dbAfter = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true, emailVerified: true } });
  const dbOldAddress = await prisma.user.findUnique({ where: { email: freshEmail }, select: { id: true } });
  const dbCheck = {
    newAddressResolves: dbAfter !== null,
    sameAccountId: dbAfter?.id === freshId,
    emailVerifiedStillTrue: dbAfter?.emailVerified === true,
    oldAddressGone: dbOldAddress === null,
  };

  // The session SURVIVES the rotation and reports the NEW email.
  const meAfter = await freshPage.request
    .get(`${BASE}/api/auth/me`, { headers: { cookie: freshLogin.cookie } })
    .then(async (r) => ({ status: r.status(), email: (await r.json()).user?.email }));
  // The OLD email no longer signs in; the NEW email does (same password).
  const oldLogin = await freshPage.request
    .post(`${BASE}/api/auth/login`, { data: { email: freshEmail, password: "Fresh1234!" } })
    .then(async (r) => ({ status: r.status(), body: await r.json() }));
  const newLogin = await freshPage.request
    .post(`${BASE}/api/auth/login`, { data: { email: newEmail, password: "Fresh1234!" } })
    .then((r) => r.status());
  // Cleanup: delete the throwaway through the S25 route.
  const cleanup = await freshPage.request
    .post(`${BASE}/api/auth/delete-account`, {
      headers: { cookie: freshLogin.cookie },
      data: { password: "Fresh1234!", confirmation: "DELETE" },
    })
    .then((r) => r.status());
  await freshCtx.close();

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
      emailAddressCard: !!document.querySelector('section[aria-label="Email address"]'),
      changePasswordCard: !!document.querySelector('section[aria-label="Change password"]'),
      dangerZoneCard: !!document.querySelector('section[aria-label="Danger zone"]'),
      copyText: !!([...document.querySelectorAll("p")].find((p) => /update the address you use to sign in/i.test(p.textContent ?? ""))),
      newEmailField: !!document.querySelector("#new-email"),
      confirmField: !!document.querySelector("#confirm-new-email"),
      passwordField: !!document.querySelector("#email-password"),
      updateButton: !!([...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Update email address")),
    }));

  // 2a. Desktop light.
  const light = await openProfile({ width: 1280, height: 800 }, false);
  await light.page.screenshot({ path: `${OUT}/s26-change-email-light.png`, fullPage: true });
  const lightChrome = await readChrome(light.page);
  await light.ctx.close();

  // 2b. Desktop DARK (themed through the production path).
  const dark = await openProfile({ width: 1280, height: 800 }, true);
  await dark.page.screenshot({ path: `${OUT}/s26-change-email-dark.png`, fullPage: true });
  const darkClass = await dark.page.evaluate(() => document.documentElement.className);
  const darkChrome = await readChrome(dark.page);
  await dark.ctx.close();

  // 2c. The success-note state (a real panel change + the LIVE identity-
  //     block update, then RESTORED through the panel — the demo account
  //     ends unchanged; the S24 rotate-and-restore pattern).
  const result = await openProfile({ width: 1280, height: 800 }, false);
  const card = result.page.locator('section[aria-label="Email address"]');
  const captureEmail = `s26-demo-capture-${Date.now()}@studyflow.app`;
  await card.getByLabel("New email", { exact: true }).fill(captureEmail);
  await card.getByLabel("Confirm new email").fill(captureEmail);
  await card.getByLabel("Password").fill("Demo1234!");
  await card.getByRole("button", { name: /update email address/i }).click();
  await result.page.getByRole("status").waitFor({ timeout: 30000 });
  await result.page.waitForTimeout(500);
  await result.page.screenshot({ path: `${OUT}/s26-change-email-success.png`, fullPage: true });
  const successText = await result.page.getByRole("status").textContent();
  const identityShowsNew = await result.page
    .getByRole("tabpanel", { name: "Profile" })
    .locator("p", { hasText: captureEmail })
    .count();
  // The restore (the panel again — the account ends with its own address).
  await card.getByLabel("New email", { exact: true }).fill("demo@studyflow.app");
  await card.getByLabel("Confirm new email").fill("demo@studyflow.app");
  await card.getByLabel("Password").fill("Demo1234!");
  await card.getByRole("button", { name: /update email address/i }).click();
  await result.page.getByRole("status").waitFor({ timeout: 30000 });
  const restoredLogin = await result.page.request
    .post(`${BASE}/api/auth/login`, { data: { email: "demo@studyflow.app", password: "Demo1234!" } })
    .then((r) => r.status());
  await result.ctx.close();

  // 2d. Mobile 390px (no horizontal overflow).
  const mobile = await openProfile({ width: 390, height: 844 }, false);
  await mobile.page.screenshot({ path: `${OUT}/s26-change-email-mobile.png`, fullPage: true });
  const mobileOverflow = await mobile.page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  const mobileChrome = await readChrome(mobile.page);
  await mobile.ctx.close();

  writeFileSync(
    `${OUT}/s26-change-email-evidence.json`,
    JSON.stringify(
      {
        guardFamily: { wrongPassword, mismatchedConfirm, shortPassword, sameEmail, duplicateEmail },
        demoStillSignsIn: demoStillSignsIn === 200,
        anonGate: anon,
        freshUserChange: {
          registered: regRes.status(),
          verifiedLogin: freshLogin.status,
          change: { status: change.status(), body: changeBody },
          dbCheck,
          meAfter,
          oldLogin,
          newLogin,
          cleanupDelete: cleanup,
        },
        screenshots: {
          light: { chrome: lightChrome },
          dark: { htmlClass: darkClass, chrome: darkChrome },
          success: { note: successText, identityShowsNewEmail: identityShowsNew > 0, demoRestoredLogin: restoredLogin },
          mobile: { overflow: mobileOverflow, chrome: mobileChrome },
        },
      },
      null,
      2,
    ) + "\n",
  );
  console.log("S26 captures written:");
  console.log(`  ${OUT}/s26-change-email-evidence.json`);
  console.log(`  ${OUT}/s26-change-email-light.png`);
  console.log(`  ${OUT}/s26-change-email-dark.png`);
  console.log(`  ${OUT}/s26-change-email-success.png`);
  console.log(`  ${OUT}/s26-change-email-mobile.png`);
} finally {
  await browser.close();
  await prisma.$disconnect();
}

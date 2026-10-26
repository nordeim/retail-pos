// S25 evidence captures — the account-deletion flow, saved to
// docs/screenshots/s25-* (follows the capture-s21..s24 precedents: dev
// server on :3000, the demo account, the production theme path).
// The captured evidence:
//   1. The API round-trip proof (JSON): the guard family on the demo
//      session (wrong password 400 / wrong confirmation 400 / short
//      password 400 — the account untouched: the demo login still
//      succeeds), the anon 401 gate, and the FULL deletion on a fresh
//      user (register → verify → sign in → create content → the cascade
//      verified at the DB level through Prisma [content rows exist →
//      delete → user gone + every row gone] → the old-credentials login
//      401 → the cleared session's /api/auth/me 401) + the demo restore
//      proof.
//   2. Dev-server screenshots of the remediated codebase: the Settings
//      Profile tab with the Danger zone card — desktop light, desktop
//      DARK (themed through the production loadFromUser path), the
//      revealed confirmation-form state (a real reveal, then Cancel —
//      the demo account is NEVER deleted), and mobile 390px (no
//      overflow).
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
    page0.request.post(`${BASE}/api/auth/delete-account`, { data: body }).then(async (res) => ({
      status: res.status(),
      body: await res.json(),
    }));

  const wrongPassword = await post({ password: "WrongPass999!", confirmation: "DELETE" });
  const wrongConfirmation = await post({ password: "Demo1234!", confirmation: "delete" });
  const shortPassword = await post({ password: "short", confirmation: "DELETE" });
  // The guards ran BEFORE any write: the demo user still signs in.
  const demoStillSignsIn = await page0.request
    .post(`${BASE}/api/auth/login`, { data: { email: "demo@studyflow.app", password: "Demo1234!" } })
    .then((r) => r.status());
  await ctx0.close();

  // The anon gate (a session-free context).
  const anonCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const anonPage = await anonCtx.newPage();
  const anon = await anonPage.request
    .post(`${BASE}/api/auth/delete-account`, { data: { password: "Demo1234!", confirmation: "DELETE" } })
    .then(async (res) => ({ status: res.status(), body: await res.json() }));
  await anonCtx.close();

  // The FULL deletion on a fresh user (the S17/S24 registerFreshUser
  // pattern — the terminal journey runs on a throwaway account).
  const freshEmail = `s25-capture-${Date.now()}@studyflow.app`;
  const freshCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const freshPage = await freshCtx.newPage();
  const regRes = await freshPage.request.post(`${BASE}/api/auth/register`, {
    data: { email: freshEmail, password: "Fresh1234!", name: "S25 Capture" },
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
  // Content for the cascade proof: a subject + a task + a notebook.
  const subj = await freshPage.request.post(`${BASE}/api/subjects`, {
    headers: { cookie: freshLogin.cookie },
    data: { name: "Cascade Capture", color: "#8b5cf6" },
  });
  const subjBody = await subj.json();
  await freshPage.request.post(`${BASE}/api/tasks`, {
    headers: { cookie: freshLogin.cookie },
    data: { title: "Cascade capture task", subjectId: subjBody.id, priority: "medium" },
  });
  await freshPage.request.post(`${BASE}/api/notebooks`, {
    headers: { cookie: freshLogin.cookie },
    data: { name: "Cascade capture notebook" },
  });
  // The DB-level content check BEFORE the deletion.
  const beforeUser = await prisma.user.findUnique({
    where: { email: freshEmail },
    include: { subjects: true, tasks: true, notebooks: true },
  });
  const contentBefore = {
    subjects: beforeUser?.subjects.length ?? -1,
    tasks: beforeUser?.tasks.length ?? -1,
    notebooks: beforeUser?.notebooks.length ?? -1,
  };
  // The deletion — with the session cookie riding the request.
  const del = await freshPage.request.post(`${BASE}/api/auth/delete-account`, {
    headers: { cookie: freshLogin.cookie },
    data: { password: "Fresh1234!", confirmation: "DELETE" },
  });
  const delBody = await del.json().catch(() => ({}));
  const delCookieCleared = /Max-Age=0/i.test(del.headers()["set-cookie"] || "");
  // The DB-level cascade check AFTER the deletion.
  const afterUser = await prisma.user.findUnique({ where: { email: freshEmail } });
  const cascadeAfter = {
    userGone: afterUser === null,
    subjects: await prisma.subject.count({ where: { name: "Cascade Capture" } }),
    tasks: await prisma.task.count({ where: { title: "Cascade capture task" } }),
    notebooks: await prisma.notebook.count({ where: { name: "Cascade capture notebook" } }),
  };
  // The old credentials no longer sign in; the cleared session is dead.
  const oldLogin = await freshPage.request
    .post(`${BASE}/api/auth/login`, { data: { email: freshEmail, password: "Fresh1234!" } })
    .then(async (r) => ({ status: r.status(), body: await r.json() }));
  const meWithOldCookie = await freshPage.request
    .get(`${BASE}/api/auth/me`, { headers: { cookie: freshLogin.cookie } })
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
      changePasswordCard: !!document.querySelector('section[aria-label="Change password"]'),
      dangerZoneCard: !!document.querySelector('section[aria-label="Danger zone"]'),
      warningCopy: !!([...document.querySelectorAll("p")].find((p) => /permanently delete your account and all your data/i.test(p.textContent ?? ""))),
      revealButton: !!([...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Delete account…")),
      formHiddenByDefault: !document.querySelector("#delete-password"),
    }));

  // 2a. Desktop light.
  const light = await openProfile({ width: 1280, height: 800 }, false);
  await light.page.screenshot({ path: `${OUT}/s25-delete-account-light.png`, fullPage: true });
  const lightChrome = await readChrome(light.page);
  await light.ctx.close();

  // 2b. Desktop DARK (themed through the production path).
  const dark = await openProfile({ width: 1280, height: 800 }, true);
  await dark.page.screenshot({ path: `${OUT}/s25-delete-account-dark.png`, fullPage: true });
  const darkClass = await dark.page.evaluate(() => document.documentElement.className);
  const darkChrome = await readChrome(dark.page);
  await dark.ctx.close();

  // 2c. The revealed confirmation-form state (a REAL reveal — clicking
  //     "Delete account…", then Cancel; the demo account is NEVER deleted).
  const revealed = await openProfile({ width: 1280, height: 800 }, false);
  const card = revealed.page.locator('section[aria-label="Danger zone"]');
  await card.getByRole("button", { name: /delete account…/i }).click();
  await revealed.page.waitForTimeout(600);
  await revealed.page.screenshot({ path: `${OUT}/s25-delete-account-revealed.png`, fullPage: true });
  const revealedChrome = await revealed.page.evaluate(() => ({
    passwordField: !!document.querySelector("#delete-password"),
    confirmationField: !!document.querySelector("#delete-confirmation"),
    destructiveButton: !!([...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Permanently delete my account")),
    cancelButton: !!([...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Cancel")),
  }));
  // Cancel re-hides the form; the demo account ends the capture intact.
  await card.getByRole("button", { name: /cancel/i }).click();
  await revealed.page.waitForTimeout(400);
  const cancelledFormHidden = await revealed.page.evaluate(() => !document.querySelector("#delete-password"));
  const demoIntact = await revealed.page.request
    .post(`${BASE}/api/auth/login`, { data: { email: "demo@studyflow.app", password: "Demo1234!" } })
    .then((r) => r.status());
  await revealed.ctx.close();

  // 2d. Mobile 390px (no horizontal overflow).
  const mobile = await openProfile({ width: 390, height: 844 }, false);
  await mobile.page.screenshot({ path: `${OUT}/s25-delete-account-mobile.png`, fullPage: true });
  const mobileOverflow = await mobile.page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  const mobileChrome = await readChrome(mobile.page);
  await mobile.ctx.close();

  writeFileSync(
    `${OUT}/s25-delete-account-evidence.json`,
    JSON.stringify(
      {
        guardFamily: { wrongPassword, wrongConfirmation, shortPassword },
        demoStillSignsIn: demoStillSignsIn === 200,
        anonGate: anon,
        freshUserDeletion: {
          registered: regRes.status(),
          verifiedLogin: freshLogin.status,
          contentBefore,
          delete: { status: del.status(), body: delBody, cookieCleared: delCookieCleared },
          cascadeAfter,
          oldLogin,
          meWithOldCookie,
        },
        screenshots: {
          light: { chrome: lightChrome },
          dark: { htmlClass: darkClass, chrome: darkChrome },
          revealed: { chrome: revealedChrome, cancelledFormHidden, demoIntactLogin: demoIntact },
          mobile: { overflow: mobileOverflow, chrome: mobileChrome },
        },
      },
      null,
      2,
    ) + "\n",
  );
  console.log("S25 captures written:");
  console.log(`  ${OUT}/s25-delete-account-evidence.json`);
  console.log(`  ${OUT}/s25-delete-account-light.png`);
  console.log(`  ${OUT}/s25-delete-account-dark.png`);
  console.log(`  ${OUT}/s25-delete-account-revealed.png`);
  console.log(`  ${OUT}/s25-delete-account-mobile.png`);
} finally {
  await browser.close();
  await prisma.$disconnect();
}

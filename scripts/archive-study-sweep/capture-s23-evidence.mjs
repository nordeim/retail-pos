// S23 evidence captures — the data import (restore), saved to
// docs/screenshots/s23-* (follows the capture-s21/s22 precedents: dev
// server on :3000, the demo account, the production theme path).
// The captured evidence:
//   1. The API round-trip proof (JSON): a valid envelope POSTed to
//      /api/import/data → the per-collection summary; the IDEMPOTENT
//      re-import (created=0, updated=3, row count unchanged); the
//      validation-error family (future version / dangling required FK /
//      duplicate id → 400 with the actionable message, database
//      unchanged); the probe rows cleaned up through the app's own API.
//   2. Dev-server screenshots of the remediated codebase: the /export
//      portability page with the Restore card — desktop light, desktop
//      DARK (themed through the production loadFromUser path), the
//      completed-import result state, and mobile 390px (no overflow).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const envelope = () => ({
  format: "studyflow-data-export",
  version: 1,
  exportedAt: "2026-10-01T00:00:00.000Z",
  user: { id: "u-old", email: "old@account.dev", name: "Old Account" },
  counts: {},
  data: {
    subjects: [
      {
        id: "s23-capture-subject",
        name: "Capture Probe Subject",
        color: "#8b5cf6",
        createdAt: "2026-09-01T00:00:00.000Z",
      },
    ],
    tasks: [
      {
        id: "s23-capture-task",
        title: "Capture probe task (linked)",
        subjectId: "s23-capture-subject",
        createdAt: "2026-09-02T00:00:00.000Z",
        updatedAt: "2026-09-02T00:00:00.000Z",
      },
      {
        id: "s23-capture-dangling",
        title: "Capture probe task (dangling subject)",
        subjectId: "no-such-subject-anywhere",
        createdAt: "2026-09-03T00:00:00.000Z",
        updatedAt: "2026-09-03T00:00:00.000Z",
      },
    ],
  },
});

const browser = await chromium.launch();
try {
  // ---- 1. The API round-trip proof (the demo session rides the context) --
  const ctx0 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page0 = await ctx0.newPage();
  await page0.goto(`${BASE}/login`);
  await page0.fill("input[type=email]", "demo@studyflow.app");
  await page0.fill("input[type=password]", "Demo1234!");
  await page0.click("button[type=submit]");
  await page0.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 30000 });
  await page0.waitForTimeout(800);

  const tasksBefore = (await (await page0.request.get(`${BASE}/api/tasks`)).json()).length;

  const post = (body) =>
    page0.request.post(`${BASE}/api/import/data`, { data: body }).then(async (res) => ({
      status: res.status(),
      body: await res.json(),
    }));

  const first = await post(envelope());
  const second = await post(envelope()); // the idempotent re-import
  // The rollback guard baseline: AFTER the successful imports (the probe
  // rows legitimately landed) — the validation family must change NOTHING.
  const tasksAfterImports = (await (await page0.request.get(`${BASE}/api/tasks`)).json()).length;
  const futureVersion = await post({ ...envelope(), version: 2 });
  const withBadCard = envelope();
  withBadCard.data.cards = [{ id: "s23-bad-card", front: "f", back: "b", deckId: "no-such-deck" }];
  const danglingRequired = await post(withBadCard);
  const withDup = envelope();
  withDup.data.subjects = [
    { id: "s23-dup", name: "A" },
    { id: "s23-dup", name: "B" },
  ];
  const duplicate = await post(withDup);

  const tasksAfterValidation = (await (await page0.request.get(`${BASE}/api/tasks`)).json()).length;
  // The probe-row cleanup (API-driven hygiene — the dev db stays clean).
  const deleted = [];
  for (const id of ["s23-capture-task", "s23-capture-dangling"]) {
    const res = await page0.request.delete(`${BASE}/api/tasks/${id}`);
    deleted.push({ id, status: res.status() });
  }
  const delSubject = await page0.request.delete(`${BASE}/api/subjects/s23-capture-subject`);
  deleted.push({ id: "s23-capture-subject", status: delSubject.status() });
  await ctx0.close();

  writeFileSync(
    `${OUT}/s23-import-roundtrip-evidence.json`,
    JSON.stringify(
      {
        envelopeShape: "1 subject + 2 tasks (one with a dangling optional subjectId)",
        firstImport: first,
        idempotentReImport: second,
        validationErrors: { futureVersion, danglingRequired, duplicate },
        rollbackGuard: {
          tasksAfterImports,
          tasksAfterValidationFamily: tasksAfterValidation,
          unchanged: tasksAfterImports === tasksAfterValidation,
        },
        probeCleanup: deleted,
      },
      null,
      2,
    ) + "\n",
  );

  // ---- 2. Dev-server screenshots (the remediated codebase) ---------------
  const openPanel = async (viewport, fulfillDark) => {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`);
    await page.fill("input[type=email]", "demo@studyflow.app");
    await page.fill("input[type=password]", "Demo1234!");
    await page.click("button[type=submit]");
    await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 30000 });
    if (fulfillDark) {
      // Theme the panel dark through the PRODUCTION path: fulfill
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
    await page.goto(`${BASE}/export`);
    await page.getByRole("heading", { name: "Export Your Data" }).waitFor({ timeout: 30000 });
    await page.waitForTimeout(1200); // the count grid + theme settle
    return { ctx, page };
  };

  const readChrome = (page) =>
    page.evaluate(() => ({
      restoreCard: !!document.querySelector('[aria-label="Restore from a backup"]'),
      fileInput: !!document.querySelector('input[type="file"]'),
      importButton: !!([...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Import")),
      countCards: document.querySelectorAll('[aria-label="What\'s included"] > div').length,
      downloadLink: !!document.querySelector('a[href="/api/export/data"]'),
    }));

  // 2a. Desktop light.
  const light = await openPanel({ width: 1280, height: 800 }, false);
  await light.page.screenshot({ path: `${OUT}/s23-export-import-card-light.png`, fullPage: true });
  const lightChrome = await readChrome(light.page);
  await light.ctx.close();

  // 2b. Desktop DARK (themed through the production path).
  const dark = await openPanel({ width: 1280, height: 800 }, true);
  await dark.page.screenshot({ path: `${OUT}/s23-export-import-card-dark.png`, fullPage: true });
  const darkClass = await dark.page.evaluate(() => document.documentElement.className);
  const darkChrome = await readChrome(dark.page);
  await dark.ctx.close();

  // 2c. The completed-import result state (a real file through the panel).
  const result = await openPanel({ width: 1280, height: 800 }, false);
  await result.page.locator('input[type="file"]').setInputFiles({
    name: "studyflow-data-2026-10-01.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(envelope())),
  });
  await result.page.getByRole("button", { name: "Import" }).click();
  await result.page.getByRole("status").waitFor({ timeout: 30000 });
  await result.page.waitForTimeout(500);
  await result.page.screenshot({ path: `${OUT}/s23-import-result-state.png`, fullPage: true });
  const resultText = await result.page.getByRole("status").textContent();
  // Cleanup the rows the result-state import wrote.
  for (const id of ["s23-capture-task", "s23-capture-dangling"]) {
    await result.page.request.delete(`${BASE}/api/tasks/${id}`);
  }
  await result.page.request.delete(`${BASE}/api/subjects/s23-capture-subject`);
  await result.ctx.close();

  // 2d. Mobile 390px (no horizontal overflow).
  const mobile = await openPanel({ width: 390, height: 844 }, false);
  await mobile.page.screenshot({ path: `${OUT}/s23-export-import-card-mobile.png`, fullPage: true });
  const mobileOverflow = await mobile.page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  const mobileChrome = await readChrome(mobile.page);
  await mobile.ctx.close();

  console.log(
    JSON.stringify(
      {
        ok: true,
        captured: [
          "s23-import-roundtrip-evidence.json",
          "s23-export-import-card-light.png",
          "s23-export-import-card-dark.png",
          "s23-import-result-state.png",
          "s23-export-import-card-mobile.png",
        ],
        roundtrip: {
          firstImport: { status: first.status, created: first.body.created, updated: first.body.updated },
          reImport: { status: second.status, created: second.body.created, updated: second.body.updated },
          validationFamily: {
            futureVersion: futureVersion.status,
            danglingRequired: danglingRequired.status,
            duplicate: duplicate.status,
          },
          rollbackUnchanged: tasksAfterImports === tasksAfterValidation,
          probeCleanup: deleted.every((d) => d.status === 200),
        },
        chrome: { light: await lightChrome, dark: { ...await darkChrome, htmlClass: darkClass }, mobile: await mobileChrome },
        resultText: (resultText ?? "").slice(0, 90),
        mobileOverflow,
      },
      null,
      2,
    ),
  );
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 300) }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}

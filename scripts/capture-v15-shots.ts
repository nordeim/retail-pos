// ---------------------------------------------------------------------------
// Evidence capture: the V15 hover micro-interaction families
// (docs/remediation-plan-v15.md B5) → docs/screenshots/*.png.
//
// Run against a live server (the probe posture — production build on :3100
// with db/custom.db; capture-v15-shots.sh boots it):
//   bun scripts/capture-v15-shots.ts
// (CAPTURE_BASE_URL overrides the target, same as capture-hover-shots.ts)
//
// Playwright — not agent-browser — because every agent-browser command
// after a mouse move resets the hover state (the v13 lesson: hover evidence
// rides Playwright's page.mouse, which persists across commands).
//
// Captures: the mail button under its BLUE hover (the row shot shows the
// Eye's indigo resting beside it), the Completada badge under the violet
// tint, and the refreshed Ajustes (the category chip's trash icon).
// ---------------------------------------------------------------------------

import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.CAPTURE_BASE_URL ?? "http://127.0.0.1:3100";
const OUT = path.resolve(import.meta.dirname, "..", "docs", "screenshots");
const EMAIL = process.env.SEED_OWNER_EMAIL ?? "owner@veloxpos.local";
const PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "$Abcd1234";

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByTestId("login-submit").click();
  await page.waitForURL(`${BASE}/`);
  await page.locator("html[data-app-hydrated=true]").waitFor();

  // ---- the mail button under its BLUE hover (F2) --------------------------
  await page.goto(`${BASE}/Sales`);
  await page.waitForLoadState("networkidle");
  const mail = page.locator('[data-testid^="mail-sale-"]').first();
  const row = mail.locator("xpath=ancestor::tr");
  await mail.hover();
  // The 150ms transition-colors settle.
  await page.waitForTimeout(300);
  // Verify the hover landed before the shot (the color family is the pin;
  // here we just confirm the observable changed).
  const mailBg = await mail.evaluate((el) => getComputedStyle(el).backgroundColor);
  if (mailBg === "rgba(0, 0, 0, 0)") {
    throw new Error(`mail hover did not land (bg=${mailBg})`);
  }
  await row.screenshot({ path: path.join(OUT, "desktop-ventas-mail-hover.png") });
  console.log("[capture] desktop-ventas-mail-hover.png (mail bg:", mailBg + ")");

  // ---- the Completada badge under the violet tint (F4) ---------------------
  const badge = page.getByText("Completada", { exact: true }).first();
  await badge.hover();
  await page.waitForTimeout(300);
  const badgeBg = await badge.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  if (badgeBg.includes("220, 252, 231")) {
    throw new Error(`badge hover did not land (bg=${badgeBg})`);
  }
  await badge.screenshot({ path: path.join(OUT, "desktop-badge-hover-violet.png") });
  console.log("[capture] desktop-badge-hover-violet.png (badge bg:", badgeBg + ")");

  // ---- the refreshed Ajustes (F3: the chip's trash icon) -------------------
  await page.goto(`${BASE}/StoreSettings`);
  await page.waitForLoadState("networkidle");
  await page.locator('[data-testid="settings-category-chips"]').waitFor();
  await page.screenshot({ path: path.join(OUT, "desktop-ajustes.png") });
  console.log("[capture] desktop-ajustes.png (refresh)");
  // The chips sit below the 800px fold — the card shot is the F3 evidence.
  const catCard = page.locator('[data-testid="settings-categories-card"]');
  await catCard.scrollIntoViewIfNeeded();
  await catCard.screenshot({ path: path.join(OUT, "desktop-ajustes-categorias.png") });
  console.log("[capture] desktop-ajustes-categorias.png (the chip trash)");
} finally {
  await browser.close();
}

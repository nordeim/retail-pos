// Session-65 CLEANUP probe — MANDATORY follow-up to ref-grade-probe-s65.mjs:
// deletes the throwaway grade + subject from the reference account and
// verifies ZERO residue. Also captures the full Recent Grades entry copy
// before deletion (for the drift record).
// Usage: node scripts/ref-grade-cleanup-s65.mjs
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const j = (o) => JSON.stringify(o, null, 1);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);

  // ---- capture the full seeded structure BEFORE deleting ----
  await page.locator("a").filter({ hasText: "Grade Tracker" }).first().click();
  await page.waitForTimeout(1800);
  const full = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    return main.innerText.replace(/\s+/g, " ").slice(0, 1200);
  });
  console.log("FULL SEEDED TEXT:", j({ t: full }));
  // hover the recent-grades entry to reveal affordances
  const entry = page.locator("main *").filter({ hasText: /^8800/ }).last();
  console.log("entry candidates:", await entry.count());

  // ---- delete the grade: find its row + delete control ----
  // Strategy: locate the element containing the grade percentage, hover it,
  // and look for any button/trash/menu that appears.
  const hoverTargets = page.locator("main div, main li, main tr").filter({ hasText: "8800" });
  const nT = await hoverTargets.count();
  console.log("hover targets:", nT);
  let deleted = false;
  for (let i = nT - 1; i >= 0 && !deleted; i--) {
    const t = hoverTargets.nth(i);
    try {
      await t.hover({ timeout: 2000 });
      await page.waitForTimeout(400);
    } catch { continue; }
    // any button that appears on hover
    const btns = page.locator("main button:visible");
    const nB = await btns.count();
    for (let b = 0; b < nB; b++) {
      const btn = btns.nth(b);
      const label = (await btn.getAttribute("aria-label").catch(() => null)) || (await btn.textContent().catch(() => ""));
      if (/delete|trash|remove/i.test(label || "")) {
        console.log("clicking delete control:", label);
        await btn.click({ timeout: 3000 });
        await page.waitForTimeout(800);
        // confirm dialog if any
        const confirmBtn = page.locator("[role=dialog] button", { hasText: /delete|confirm|remove/i }).first();
        if ((await confirmBtn.count()) > 0) {
          console.log("confirming:", await confirmBtn.textContent());
          await confirmBtn.click();
        }
        await page.waitForTimeout(1500);
        deleted = true;
        break;
      }
    }
    if (!deleted) {
      // also try a visible trash icon (svg button) anywhere in the row
      const trashBtn = t.locator("button:has(svg.lucide-trash, svg.lucide-trash2, svg.lucide-x)").first();
      if ((await trashBtn.count()) > 0) {
        console.log("clicking trash icon button");
        await trashBtn.click({ timeout: 3000 });
        await page.waitForTimeout(800);
        const confirmBtn = page.locator("[role=dialog] button", { hasText: /delete|confirm|remove/i }).first();
        if ((await confirmBtn.count()) > 0) await confirmBtn.click();
        await page.waitForTimeout(1500);
        deleted = true;
      }
    }
  }
  console.log("grade deleted:", deleted);
  const afterGrade = await page.evaluate(() => (document.querySelector("main") || document.body).innerText.replace(/\s+/g, " ").slice(0, 400));
  console.log("AFTER GRADE DELETE:", j({ t: afterGrade }));

  // ---- delete the subject ----
  await page.locator("a").filter({ hasText: "Settings" }).first().click();
  await page.waitForTimeout(1200);
  await page.locator("button").filter({ hasText: "Subjects" }).first().click();
  await page.waitForTimeout(1200);
  // hover the subject row to reveal its delete control
  const subjRow = page.locator("main *").filter({ hasText: "Probe Subject" }).last();
  console.log("subject row candidates:", await subjRow.count());
  let subjDeleted = false;
  const rows = page.locator("main div, main li").filter({ hasText: "Probe Subject" });
  const nR = await rows.count();
  for (let i = nR - 1; i >= 0 && !subjDeleted; i--) {
    const r = rows.nth(i);
    try { await r.hover({ timeout: 2000 }); await page.waitForTimeout(400); } catch { continue; }
    const delBtn = r.locator("button").filter({ hasText: /delete|trash|remove/i }).first();
    const trashIcon = r.locator("button:has(svg.lucide-trash, svg.lucide-trash2)").first();
    const target = (await delBtn.count()) > 0 ? delBtn : trashIcon;
    if ((await target.count()) > 0) {
      await target.click({ timeout: 3000 });
      await page.waitForTimeout(600);
      const confirmBtn = page.locator("[role=dialog] button", { hasText: /delete|confirm|remove/i }).first();
      if ((await confirmBtn.count()) > 0) {
        console.log("confirming subject delete");
        await confirmBtn.click();
      }
      await page.waitForTimeout(1500);
      subjDeleted = true;
    }
  }
  console.log("subject deleted:", subjDeleted);

  // ---- verify ZERO residue ----
  await page.locator("a").filter({ hasText: "Grade Tracker" }).first().click();
  await page.waitForTimeout(1800);
  const residue = await page.evaluate(() => {
    const t = (document.querySelector("main") || document.body).innerText;
    return {
      hasProbeSubject: t.includes("Probe Subject"),
      has8800: t.includes("8800"),
      text: t.replace(/\s+/g, " ").slice(0, 400),
    };
  });
  console.log("RESIDUE CHECK:", j(residue));
  console.log(JSON.stringify({ ok: residue && !residue.hasProbeSubject && !residue.has8800 }));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

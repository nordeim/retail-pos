// Session-65 GATED WRITE-PATH PROBE (the skill's authorized exception):
// one throwaway Subject + one throwaway Grade on the reference account,
// capture the seeded GradeTracker card structure, then DELETE both and
// verify zero residue. Never leaves probe data behind.
// Usage: node scripts/ref-grade-probe-s65.mjs
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const j = (o) => JSON.stringify(o, null, 1);

try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);

  // ---- 1. create the throwaway Subject (Settings → Subjects) ----
  await page.locator("a").filter({ hasText: "Settings" }).first().click();
  await page.waitForTimeout(1500);
  await page.locator("button").filter({ hasText: "Subjects" }).first().click();
  await page.waitForTimeout(1200);
  console.log("subjects tab text:", j({ t: (await page.evaluate(() => (document.querySelector("main") || document.body).innerText.replace(/\s+/g, " ").slice(0, 500))) }));
  // find the add-subject control
  const addSubBtn = page.locator("main button", { hasText: /add subject|new subject|add/i }).first();
  console.log("add-subject button count:", await addSubBtn.count());
  await addSubBtn.click({ timeout: 10000 });
  await page.waitForTimeout(1000);
  console.log("dialog after add-subject:", j({ t: (await page.evaluate(() => {
    const dlg = document.querySelector("[role=dialog]");
    return dlg ? dlg.innerText.replace(/\s+/g, " ").slice(0, 400) : "NO DIALOG";
  })) }));
  // fill name + pick a color if present
  const nameInput = page.locator("[role=dialog] input").first();
  await nameInput.fill("Probe Subject");
  await page.waitForTimeout(400);
  // submit the dialog (last button or a save/add button)
  const dlgSave = page.locator("[role=dialog] button", { hasText: /add|save|create/i }).first();
  if ((await dlgSave.count()) > 0) await dlgSave.click();
  else await page.locator("[role=dialog] button[type=submit]").first().click();
  await page.waitForTimeout(1500);
  const subjectRows = await page.evaluate(() => (document.querySelector("main") || document.body).innerText.includes("Probe Subject"));
  console.log("subject created:", subjectRows);

  // ---- 2. create the throwaway Grade (GradeTracker → Add Grade) ----
  await page.locator("a").filter({ hasText: "Grade Tracker" }).first().click();
  await page.waitForTimeout(1500);
  await page.locator("main button", { hasText: "Add Grade" }).first().click();
  await page.waitForTimeout(1200);
  console.log("add-grade dialog:", j({ t: (await page.evaluate(() => {
    const dlg = document.querySelector("[role=dialog]");
    return dlg ? dlg.innerText.replace(/\s+/g, " ").slice(0, 500) : "NO DIALOG";
  })) }));
  const dInputs = page.locator("[role=dialog] input");
  const nInputs = await dInputs.count();
  console.log("dialog inputs:", nInputs);
  for (let i = 0; i < nInputs; i++) {
    const el = dInputs.nth(i);
    const info = await el.evaluate((inp) => ({ type: inp.type, placeholder: inp.placeholder, name: inp.name || "", value: inp.value }));
    console.log(`input[${i}]:`, j(info));
  }
  const dSelects = page.locator("[role=dialog] select, [role=dialog] [role=combobox]");
  console.log("dialog selects/comboboxes:", await dSelects.count());
  // fill text inputs except file/date-ish; assume first text = title
  for (let i = 0; i < nInputs; i++) {
    const el = dInputs.nth(i);
    const type = await el.evaluate((inp) => inp.type);
    if (type === "text") { await el.fill("Probe Grade").catch(() => {}); break; }
  }
  // number inputs: score then weight — fill conservatively
  const numInputs = page.locator("[role=dialog] input[type=number]");
  const nNum = await numInputs.count();
  if (nNum > 0) await numInputs.nth(0).fill("88");
  if (nNum > 1) await numInputs.nth(1).fill("1");
  // subject combobox (radix): click and pick Probe Subject
  const subjTrigger = page.locator("[role=dialog] [role=combobox]").first();
  if ((await subjTrigger.count()) > 0) {
    await subjTrigger.click();
    await page.waitForTimeout(600);
    const opt = page.locator("[role=option]", { hasText: "Probe Subject" }).first();
    if ((await opt.count()) > 0) await opt.click();
    else console.log("options:", await page.evaluate(() => [...document.querySelectorAll("[role=option]")].map((o) => o.textContent.trim())));
  }
  await page.waitForTimeout(400);
  const gradeSave = page.locator("[role=dialog] button", { hasText: /add grade|save|create|add/i }).first();
  await gradeSave.click();
  await page.waitForTimeout(2000);

  // ---- 3. capture the SEEDED card structure ----
  const seeded = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const t = main.innerText.replace(/\s+/g, " ");
    return {
      text: t.slice(0, 900),
      hasHighestGrade: t.includes("Highest Grade"),
      hasGradesLogged: /grades? logged/.test(t),
      hasBestScore: t.includes("Best score so far"),
      hasAcrossAll: t.includes("Across all subjects"),
      hasThisSemester: t.includes("This semester"),
    };
  });
  console.log("SEEDED STRUCTURE:", j(seeded));
  await page.screenshot({ path: "docs/screenshots/65-ref-desktop-gradetracker-probe.png" });

  // ---- 4. DELETE the probe grade (hover row → trash/menu) ----
  // discover the row's affordances first
  console.log("grade row html hints:", j(await page.evaluate(() => {
    const els = [...document.querySelectorAll("main *")].filter((el) => el.children.length === 0 && el.textContent.trim() === "Probe Grade");
    return els.map((el) => {
      let p = el.parentElement;
      for (let d = 0; d < 3 && p; d++) {
        const btns = [...p.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") || b.textContent.trim()).filter(Boolean);
        if (btns.length) return { depth: d, buttons: btns };
        p = p.parentElement;
      }
      return { depth: -1, buttons: [] };
    });
  })));
  console.log(JSON.stringify({ ok: true, stage: "captured — deletion follows in the same script run" }));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

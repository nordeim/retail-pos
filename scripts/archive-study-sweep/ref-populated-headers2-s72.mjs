// Session-72 probe v2: the OTHER SectionCard consumers' ref header anatomy,
// POPULATED (follow-up to ref-populated-headers-s72.mjs whose h2-scoped dump
// came back empty — the ref's analytics card titles are NOT h2 elements, and
// the calculator/solver population drivers missed: the ref calculator is a
// BUTTON keypad, the solver field needs click+type).
//
// v2 fixes (AP-115 discipline — dump EVERY candidate, identify by path):
//   - calculator: click digit/operator buttons, then dump + click the header
//     "History" button to see what renders
//   - solver: getByPlaceholder → click → type → Solve → dump any result card
//   - analytics + gradetracker: dump ALL h1–h6 AND bold text nodes (fw>=600)
//     with tag/path/rect/computed styles
//   - cleanup inline: probe-signature deletes via the Bearer pattern
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const APP = "6969efea366cba53524cde3f";
const OUT = "docs/screenshots";
const j = (o) => JSON.stringify(o);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const api = (method, path) =>
  page.evaluate(async ({ method, path }) => {
    let token = null;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k);
      if (v && v.startsWith("eyJ")) { token = v; break; }
    }
    const r = await fetch(`/api/apps/6969efea366cba53524cde3f${path}`, {
      method, credentials: "include",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    let body = null;
    try { body = await r.json(); } catch {}
    return { status: r.status, body };
  }, { method, path });
const listE = (e) => api("GET", `/entities/${e}`);
const delE = (e, id) => api("DELETE", `/entities/${e}/${id}`);

// AP-115 dump: every heading + bold text node with its path + styles
const textDump = () =>
  page.evaluate(() => {
    const out = [];
    const main = document.querySelector("main") || document.body;
    for (const el of main.querySelectorAll("h1,h2,h3,h4,h5,h6,strong,b,span,div,p")) {
      if (el.children.length > 0) continue; // leaf text nodes only
      const t = (el.textContent || "").trim();
      if (!t || t.length > 60) continue;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      const fw = parseInt(cs.fontWeight, 10);
      const isHeading = /^h[1-6]$/.test(el.tagName);
      if (!isHeading && !(fw >= 600 && parseInt(cs.fontSize, 10) >= 14)) continue;
      // parent chain (3 up) with border-bottom + padding of each
      const chain = [];
      let p = el.parentElement;
      for (let d = 0; d < 3 && p; d++) {
        const pcs = getComputedStyle(p);
        const pr = p.getBoundingClientRect();
        chain.push({
          tag: p.tagName, cls: (p.className || "").toString().slice(0, 60),
          pad: `${pcs.paddingTop}/${pcs.paddingBottom}`,
          borderB: pcs.borderBottomWidth !== "0px" ? `${pcs.borderBottomWidth} ${pcs.borderBottomColor}` : "none",
          h: Math.round(pr.height),
        });
        p = p.parentElement;
      }
      out.push({ tag: el.tagName, text: t.slice(0, 40), fs: cs.fontSize, fw: cs.fontWeight, color: cs.color, x: Math.round(r.x), y: Math.round(r.y), chain });
    }
    return out;
  });

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });

try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);

  // ---- populate: subject + grade + task (proven flows) ----
  await page.locator("a").filter({ hasText: "Settings" }).first().click();
  await page.waitForTimeout(1200);
  await page.locator("button").filter({ hasText: "Subjects" }).first().click();
  await page.waitForTimeout(1000);
  await page.locator("main button", { hasText: /add subject/i }).first().click();
  await page.waitForTimeout(800);
  await page.locator("[role=dialog] input").first().fill("Probe Subject S72");
  await page.locator("[role=dialog] button", { hasText: /add subject/i }).first().click();
  await page.waitForTimeout(1500);

  await page.locator("a").filter({ hasText: "Grade Tracker" }).first().click();
  await page.waitForTimeout(1500);
  await page.locator("main button", { hasText: "Add Grade" }).first().click();
  await page.waitForTimeout(1000);
  const nums = page.locator("[role=dialog] input[type=number]");
  await nums.nth(0).fill("50");
  await nums.nth(1).fill("100");
  const subjTrigger = page.locator("[role=dialog] [role=combobox]").first();
  if ((await subjTrigger.count()) > 0) {
    await subjTrigger.click();
    await page.waitForTimeout(500);
    await page.locator("[role=option]", { hasText: "Probe Subject S72" }).first().click();
    await page.waitForTimeout(400);
  }
  await page.locator("[role=dialog] button", { hasText: /add|save/i }).first().click();
  await page.waitForTimeout(1800);

  await page.locator("a").filter({ hasText: "My Day" }).first().click();
  await page.waitForTimeout(1500);
  const qadd = page.locator('main input[placeholder*="task" i]').first();
  await qadd.fill("Probe task S72");
  await qadd.press("Enter");
  await page.waitForTimeout(1500);

  // ---- calculator: BUTTON keypad (2 + 3 =) ----
  await page.locator("a").filter({ hasText: "Calculator" }).first().click();
  await page.waitForTimeout(1800);
  const press = async (label) => {
    const btn = page.locator("main button").filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) }).first();
    if ((await btn.count()) > 0) { await btn.click(); await page.waitForTimeout(350); return true; }
    return false;
  };
  const pressed = [];
  for (const k of ["2", "\\+", "3", "="]) pressed.push(await press(k));
  await page.waitForTimeout(1800);
  await shot("72-ref-populated-calculator2");
  const calcDump = await textDump();
  console.log("CALC-DUMP-AFTER-EVAL:", j(calcDump));
  // click the header History button if present
  const histBtn = page.locator("main button", { hasText: /history/i }).first();
  if ((await histBtn.count()) > 0) {
    await histBtn.click();
    await page.waitForTimeout(1500);
    await shot("72-ref-populated-calculator-history-open");
    console.log("CALC-DUMP-HISTORY-OPEN:", j(await textDump()));
    console.log("CALC-HISTORY-TEXT:", j(await page.evaluate(() => (document.querySelector("main") || document.body).innerText.replace(/\s+/g, " ").slice(0, 600))));
  } else {
    console.log("CALC-HEADER-HISTORY-BUTTON: none");
  }

  // ---- mathsolver: click + type + Solve ----
  await page.locator("a").filter({ hasText: "Math Solver" }).first().click();
  await page.waitForTimeout(1800);
  const solverField = page.getByPlaceholder(/type your math problem/i).first();
  if ((await solverField.count()) > 0) {
    await solverField.click();
    await page.keyboard.type("2x+3=7", { delay: 40 });
    await page.waitForTimeout(600);
    await shot("72-ref-populated-mathsolver-typed");
    const solveBtn = page.locator("main button", { hasText: /solve/i }).first();
    const disabled = await solveBtn.isDisabled().catch(() => true);
    console.log("SOLVER-BUTTON-DISABLED:", disabled);
    if (!disabled) {
      await solveBtn.click();
      await page.waitForTimeout(15000); // AI response
      await shot("72-ref-populated-mathsolver2");
      console.log("SOLVER-TEXT:", j(await page.evaluate(() => (document.querySelector("main") || document.body).innerText.replace(/\s+/g, " ").slice(0, 800))));
      console.log("SOLVER-DUMP:", j(await textDump()));
    }
  } else {
    console.log("SOLVER-FIELD: not found by placeholder");
  }

  // ---- analytics + gradetracker dumps ----
  await page.locator("a").filter({ hasText: "Analytics" }).first().click();
  await page.waitForTimeout(2200);
  await shot("72-ref-populated-analytics2");
  console.log("ANALYTICS-DUMP:", j(await textDump()));

  await page.locator("a").filter({ hasText: "Grade Tracker" }).first().click();
  await page.waitForTimeout(2200);
  console.log("GT-DUMP:", j(await textDump()));

  // ---- cleanup (probe signature) ----
  const subjects = await listE("Subject");
  const probeSubjects = (subjects.status === 200 && Array.isArray(subjects.body) ? subjects.body : []).filter((s) => /probe.*s72/i.test(s.name || ""));
  const grades = await listE("Grade");
  const probeGrades = (grades.status === 200 && Array.isArray(grades.body) ? grades.body : []).filter((g) => probeSubjects.some((s) => s.id === g.subject_id));
  const tasks = await listE("Task");
  const probeTasks = (tasks.status === 200 && Array.isArray(tasks.body) ? tasks.body : []).filter((t) => /probe.*s72/i.test(t.title || ""));
  const targets = [
    ...probeGrades.map((g) => ({ entity: "Grade", id: g.id })),
    ...probeSubjects.map((s) => ({ entity: "Subject", id: s.id })),
    ...probeTasks.map((t) => ({ entity: "Task", id: t.id })),
  ];
  // delta-scan the calc/solver entities for anything created this session
  for (const e of ["Calculation", "CalculatorHistory", "MathSolution", "SolverHistory"]) {
    const r = await listE(e);
    if (r.status === 200 && Array.isArray(r.body)) {
      for (const row of r.body) {
        const created = row.created_date || row.date || "";
        if (/^2026-10-20/.test(created)) targets.push({ entity: e, id: row.id });
      }
    }
  }
  const results = [];
  for (const t of targets) results.push({ ...t, status: (await delE(t.entity, t.id)).status });
  console.log("CLEANUP-TARGETS:", targets.length, j(results));

  const after = await listE("Subject");
  const residueSubj = (after.status === 200 && Array.isArray(after.body) ? after.body : []).filter((s) => /probe.*s72/i.test(s.name || ""));
  const afterG = await listE("Grade");
  const residueG = (afterG.status === 200 && Array.isArray(afterG.body) ? afterG.body : []).filter((g) => /6ad6d9816ee8472ce86b8897/.test(g.subject_id || ""));
  const afterT = await listE("Task");
  const residueT = (afterT.status === 200 && Array.isArray(afterT.body) ? afterT.body : []).filter((t) => /probe.*s72/i.test(t.title || ""));
  const residue = [...residueSubj, ...residueG, ...residueT];
  console.log("RESIDUE:", residue.length === 0 ? "ZERO" : j(residue));
  console.log("PROBE-V2-COMPLETE ok:", residue.length === 0);
} catch (err) {
  console.log("ERROR:", String(err).slice(0, 400));
} finally {
  await browser.close();
}

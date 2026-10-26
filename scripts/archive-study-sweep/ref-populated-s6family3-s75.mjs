// Session-75 probe v3: the populated S6-family re-measure on the reference.
// v1: 3 driver misses (calculator keypad / solver click+type / API truncation).
// v2: dialog-closure verification exposed the REAL blockers — the ref's date
//     fields are custom popover pickers ("Pick date"), the Subject fields are
//     Radix selects, and the account has ZERO subjects, so Assignment/Exam
//     dialogs could not pass validation at all. Only the My Day task (v1-
//     proven quick-add) ever persisted.
// v3 chain (each step verified before the next):
//   1. probe SUBJECT via Settings → Subjects (the v1-proven flow) — the
//      prerequisite for the subject-bearing dialogs
//   2. task via My Day quick-add (proven)
//   3. event: title + Start/End picker popovers
//   4. assignment: title + subject combobox + due-date popover
//   5. exam: title + subject combobox + date popover
//   6. note: inline editor + Enter (autosave attempt)
//   then measure tasks/assignments/exams/notes/calendar, delta+signature
//   cleanup, residue verification.
// Usage: node scripts/ref-populated-s6family3-s75.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const REF = "https://omni-study1.base44.app";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });
const j = (o) => JSON.stringify(o);
const SIG = /probe.*s75/i;
const SIGTXT = "Probe s75";

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
    let parsed = null;
    try { parsed = await r.json(); } catch {}
    return { status: r.status, body: parsed };
  }, { method, path });

const CANDIDATES = ["Task", "Todo", "Grade", "Subject", "Assignment", "Calculation", "CalculatorHistory", "MathSolution", "SolverHistory", "FocusSession", "Event", "Note", "Flashcard", "FlashcardSet", "Deck", "StudyGroup", "PracticeTest"];
const listE = (e) => api("GET", `/entities/${e}`);
const delE = (e, id) => api("DELETE", `/entities/${e}/${id}`);

const textDump = () =>
  page.evaluate(() => {
    const out = [];
    const main = document.querySelector("main") || document.body;
    for (const el of main.querySelectorAll("h1,h2,h3,h4,h5,h6,strong,b,span,div,p")) {
      if (el.children.length > 0) continue;
      const t = (el.textContent || "").trim();
      if (!t || t.length > 80) continue;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      const fw = parseInt(cs.fontWeight, 10);
      const isHeading = /^h[1-6]$/.test(el.tagName);
      if (!isHeading && !(fw >= 600 && parseInt(cs.fontSize, 10) >= 14)) continue;
      const chain = [];
      let p = el.parentElement;
      for (let i = 0; i < 3 && p; i++) {
        const pcs = getComputedStyle(p);
        const pr = p.getBoundingClientRect();
        chain.push({ tag: p.tagName.toLowerCase(), cls: (p.className || "").toString().slice(0, 80), borderB: `${pcs.borderBottomWidth} ${pcs.borderBottomStyle}`, pad: `${pcs.paddingTop}/${pcs.paddingBottom}`, h: Math.round(pr.height) });
        p = p.parentElement;
      }
      out.push({ text: t, tag: el.tagName.toLowerCase(), fs: cs.fontSize, fw: cs.fontWeight, chain });
    }
    return out;
  });

const visit = async (navText) => {
  await page.locator("a").filter({ hasText: navText }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2200);
};

// Radix Select: click the combobox, pick the option by text.
const pickCombobox = async (dlg, optionText) => {
  const trig = dlg.locator("[role=combobox]").first();
  if ((await trig.count()) === 0) return "NO-COMBO";
  await trig.click();
  await page.waitForTimeout(700);
  const opt = page.locator("[role=option]", { hasText: optionText }).first();
  if ((await opt.count()) === 0) {
    await page.keyboard.press("Escape");
    return `NO-OPTION(${optionText})`;
  }
  await opt.click();
  await page.waitForTimeout(500);
  return "PICKED";
};

// Popover date picker: click the trigger, click a mid-month day inside the
// portaled popover, verify the trigger text changed (the success signal).
const pickPopoverDate = async (trigger, day = "15") => {
  const before = ((await trigger.textContent().catch(() => "")) || "").trim();
  await trigger.click();
  await page.waitForTimeout(800);
  const dayRe = new RegExp(`^${day}$`);
  let clicked = false;
  const pop = page.locator("[data-radix-popper-content-wrapper]").last();
  if ((await pop.count()) > 0) {
    const btn = pop.locator("button", { hasText: dayRe }).first();
    if ((await btn.count()) > 0) { await btn.click(); clicked = true; }
  }
  if (!clicked) {
    // dialog-in-dialog calendars / gridcells
    const cell = page.locator("[role=gridcell] button, [role=option]", { hasText: dayRe }).first();
    if ((await cell.count()) > 0) { await cell.click(); clicked = true; }
  }
  await page.waitForTimeout(700);
  const after = ((await trigger.textContent().catch(() => "")) || "").trim();
  const changed = before !== after && after.length > 0;
  if (!changed) await page.keyboard.press("Escape");
  return { clicked, changed, before, after };
};

// fill every fillable input by type (v2 lesson) inside a dialog
const fillDialogBasics = async (signature) => {
  const dlg = page.locator("[role=dialog]").last();
  const inputs = dlg.locator("input");
  const n = await inputs.count();
  const filled = [];
  for (let i = 0; i < n; i++) {
    const inp = inputs.nth(i);
    const type = (await inp.getAttribute("type")) ?? "text";
    try {
      if (type === "text" || type === "") { await inp.fill(signature, { timeout: 3000 }); filled.push(`${i}:text`); }
      else if (type === "number") { await inp.fill("1", { timeout: 3000 }); filled.push(`${i}:number`); }
      else if (type === "datetime-local") { await inp.fill("2026-11-01T18:00", { timeout: 3000 }); filled.push(`${i}:dtlocal`); }
    } catch { filled.push(`${i}:SKIP`); }
  }
  return filled;
};

// submit + VERIFY closure (the v1 lesson)
const submitDialog = async (actionRe = /add|save|create/i) => {
  const dlg = page.locator("[role=dialog]").last();
  const submit = dlg.locator("button", { hasText: actionRe }).last();
  if ((await submit.count()) > 0) await submit.click({ timeout: 5000 });
  else await page.keyboard.press("Enter");
  const closed = await dlg.waitFor({ state: "detached", timeout: 8000 }).then(() => true).catch(() => false);
  if (!closed) {
    const dlgText = (await dlg.textContent().catch(() => "")) || "";
    console.log("DIALOG-STILL-OPEN:", dlgText.slice(0, 220));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);
    return false;
  }
  await page.waitForTimeout(1500);
  return true;
};

const discoveryDump = async (viewName) => {
  const d = await page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    return {
      buttons: [...document.querySelectorAll("main button")].filter(vis).map((b) => b.textContent.trim()).filter(Boolean).slice(0, 18),
      inputs: [...document.querySelectorAll("main input, main textarea")].filter(vis).map((i) => i.placeholder || i.type || i.getAttribute("aria-label")).slice(0, 10),
    };
  });
  console.log(`DISCOVERY-${viewName}:`, j(d));
  return d;
};

try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);

  const baseline = {};
  for (const e of CANDIDATES) {
    const v = await listE(e);
    baseline[e] = Array.isArray(v?.body) ? v.body.map((x) => x.id) : `__${v?.status}`;
  }
  console.log("BASELINE:", j(baseline));

  // ---- P0. probe SUBJECT (the v1-proven Settings flow) ----
  try {
    await visit("Settings");
    await page.locator("button", { hasText: "Subjects" }).first().click();
    await page.waitForTimeout(1000);
    await page.locator("main button", { hasText: /add subject/i }).first().click();
    await page.waitForTimeout(800);
    await page.locator("[role=dialog] input").first().fill("Probe Subject s75");
    await page.locator("[role=dialog] button", { hasText: /add subject/i }).first().click();
    await page.waitForTimeout(1800);
    const subjList = await listE("Subject");
    const created = Array.isArray(subjList?.body) ? subjList.body.find((s) => SIG.test(s.name || "")) : null;
    console.log("P0-subject:", created ? `OK id=${created.id}` : "NOT-CREATED");
  } catch (e) { console.log("P0-subject: FAILED", String(e).slice(0, 150)); }

  // ---- P1. task via My Day quick-add ----
  try {
    await visit("My Day");
    const qadd = page.locator('main input[placeholder*="task" i]').first();
    if ((await qadd.count()) > 0) {
      await qadd.fill("Probe task s75");
      await qadd.press("Enter");
      await page.waitForTimeout(1800);
      console.log("P1-task: filled");
    } else console.log("P1-task: NO quick-add input");
  } catch (e) { console.log("P1-task: FAILED", String(e).slice(0, 150)); }

  // ---- P2. event: title + Start/End pickers ----
  try {
    await visit("Events");
    const evBtn = page.locator("main button", { hasText: /new event/i }).first();
    if ((await evBtn.count()) > 0) {
      await evBtn.click();
      await page.waitForTimeout(900);
      console.log("P2-event fill:", j(await fillDialogBasics(SIGTXT)));
      // drive the two popover triggers (Start / End rows) if present
      const dlg = page.locator("[role=dialog]").last();
      const pickTriggers = dlg.locator("button", { hasText: /pick|select date|^—$|^-$|start.*date|end.*date/i });
      const pn = Math.min(await pickTriggers.count(), 2);
      for (let i = 0; i < pn; i++) {
        const r = await pickPopoverDate(pickTriggers.nth(i));
        console.log(`P2-event picker[${i}]:`, j(r));
      }
      console.log("P2-event submit:", await submitDialog(/create event|add|save|create/i));
    } else console.log("P2-event: NO New Event button");
  } catch (e) { console.log("P2-event: FAILED", String(e).slice(0, 150)); }

  // ---- P3. assignment: title + subject + due date ----
  try {
    await visit("Assignments");
    const asgBtn = page.locator("main button", { hasText: /add assignment|^add$|new assignment/i }).first();
    if ((await asgBtn.count()) > 0) {
      await asgBtn.click();
      await page.waitForTimeout(900);
      console.log("P3-assignment fill:", j(await fillDialogBasics(SIGTXT)));
      const dlg = page.locator("[role=dialog]").last();
      console.log("P3-assignment subject:", await pickCombobox(dlg, "Probe Subject s75"));
      const dueTrig = dlg.locator("button", { hasText: /pick date|due date/i }).first();
      if ((await dueTrig.count()) > 0) console.log("P3-assignment due:", j(await pickPopoverDate(dueTrig)));
      console.log("P3-assignment submit:", await submitDialog());
    } else console.log("P3-assignment: NO add button");
  } catch (e) { console.log("P3-assignment: FAILED", String(e).slice(0, 150)); }

  // ---- P4. exam: title + subject + date ----
  try {
    await visit("Exams");
    const examBtn = page.locator("main button", { hasText: /add exam|^add$|new exam/i }).first();
    if ((await examBtn.count()) > 0) {
      await examBtn.click();
      await page.waitForTimeout(900);
      console.log("P4-exam fill:", j(await fillDialogBasics(SIGTXT)));
      const dlg = page.locator("[role=dialog]").last();
      console.log("P4-exam subject:", await pickCombobox(dlg, "Probe Subject s75"));
      const dateTrig = dlg.locator("button", { hasText: /pick|date & time/i }).first();
      if ((await dateTrig.count()) > 0) console.log("P4-exam date:", j(await pickPopoverDate(dateTrig)));
      console.log("P4-exam submit:", await submitDialog());
    } else console.log("P4-exam: NO add button");
  } catch (e) { console.log("P4-exam: FAILED", String(e).slice(0, 150)); }

  // ---- P5. note: inline editor + Enter ----
  try {
    await visit("Notes");
    await discoveryDump("notes");
    const noteBtn = page.locator("main button", { hasText: /^new$|new note/i }).first();
    if ((await noteBtn.count()) > 0) {
      await noteBtn.click();
      await page.waitForTimeout(1200);
      const tInp = page.locator("main input").first();
      if ((await tInp.count()) > 0) {
        await tInp.fill("Probe note s75");
        await tInp.press("Enter");
        await page.waitForTimeout(1200);
      }
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(800);
      console.log("P5-note: attempted");
    } else console.log("P5-note: NO new button");
  } catch (e) { console.log("P5-note: FAILED", String(e).slice(0, 150)); }

  // ---- measure the populated views ----
  const measures = {};
  for (const [key, nav] of [["tasks", "Tasks"], ["assignments", "Assignments"], ["exams", "Exams"], ["notes", "Notes"], ["calendar", "Calendar"]]) {
    try {
      await visit(nav);
      await page.screenshot({ path: `${OUT}/75-ref-populated-${key}.png`, fullPage: false });
      measures[key] = await textDump();
      console.log(`MEASURED-${key}: ${measures[key].length} leaf nodes`);
    } catch (e) { console.log(`MEASURE-${key}: FAILED`, String(e).slice(0, 150)); }
  }
  console.log("MEASURES-TEXT:", j(measures));

  // ---- cleanup: delta + signature ----
  const after = {};
  for (const e of CANDIDATES) {
    const v = await listE(e);
    after[e] = Array.isArray(v?.body) ? v.body : `__${v?.status}`;
  }
  const toDelete = [];
  for (const e of CANDIDATES) {
    if (!Array.isArray(baseline[e]) || !Array.isArray(after[e])) continue;
    const baseIds = new Set(baseline[e]);
    for (const row of after[e]) {
      if (!baseIds.has(row.id)) toDelete.push({ entity: e, id: row.id, why: "delta" });
      else if (SIG.test(JSON.stringify(row))) toDelete.push({ entity: e, id: row.id, why: "signature" });
    }
  }
  const deletions = [];
  for (const d of toDelete) {
    const st = await delE(d.entity, d.id);
    deletions.push({ ...d, status: st?.status });
  }
  console.log("DELETIONS:", j(deletions));

  const residue = [];
  for (const e of CANDIDATES) {
    const v = await listE(e);
    if (!Array.isArray(v?.body)) continue;
    for (const row of v.body) if (SIG.test(JSON.stringify(row))) residue.push({ entity: e, id: row.id });
  }
  console.log("RESIDUE:", residue.length === 0 ? "ZERO" : j(residue));
  console.log("PROBE-V3-COMPLETE ok:", residue.length === 0);
} catch (err) {
  console.log("PROBE-ERROR:", String(err).slice(0, 600));
  try {
    const residue = [];
    for (const e of CANDIDATES) {
      const v = await listE(e);
      if (!Array.isArray(v?.body)) continue;
      for (const row of v.body) if (SIG.test(JSON.stringify(row))) residue.push({ entity: e, id: row.id });
    }
    for (const r of residue) await delE(r.entity, r.id);
    console.log("EMERGENCY-CLEANUP:", residue.length, "objects deleted");
  } catch (e2) {
    console.log("EMERGENCY-CLEANUP-FAILED:", String(e2).slice(0, 200));
  }
} finally {
  await browser.close();
}

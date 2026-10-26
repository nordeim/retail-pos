// Session-75 probe: the populated S6-family re-measure on the reference.
// The S6/S7/S8 populated pins were decoded from the reference in the s6–s8
// era; every cycle since re-verifies the clone against those PINS, but the
// REF-side populated surfaces themselves have not been re-measured since.
// The Batch AB lesson (s72): populated surfaces drift independently of the
// zero-state surfaces the standing sweep covers.
//
// Populate (each object probe-signatured for the delta cleanup):
//   - task      → My Day quick-add (the v1-proven driver)
//   - event     → Events "New Event" dialog
//   - assignment→ Assignments add dialog
//   - exam      → Exams add dialog
//   - note      → Notes "New" flow
// Measure: tasks, assignments, exams, notes, calendar — screenshot +
// AP-115 leaf-text dump (headings + bold >=14px leaves with parent chain).
// Cleanup: baseline→after delta over the v1 CANDIDATE entities + a
// probe-signature scan of every listed entity, then residue verification.
// Usage: node scripts/ref-populated-s6family-s75.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const REF = "https://omni-study1.base44.app";
const APP = "6969efea366cba53524cde3f";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });
const j = (o) => JSON.stringify(o);
const SIG = /probe.*s75/i;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Bearer-JWT entity API (the s65-learned, s72-proven pattern)
const api = (method, path, body) =>
  page.evaluate(async ({ method, path, body }) => {
    let token = null;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k);
      if (v && v.startsWith("eyJ")) { token = v; break; }
    }
    const r = await fetch(`/api/apps/6969efea366cba53524cde3f${path}`, {
      method, credentials: "include",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let parsed = null;
    try { parsed = await r.json(); } catch {}
    return { status: r.status, body: parsed };
  }, { method, path, body });

const CANDIDATES = ["Task", "Todo", "Grade", "Subject", "Assignment", "Calculation", "CalculatorHistory", "MathSolution", "SolverHistory", "FocusSession", "Event", "Note", "Flashcard", "FlashcardSet", "Deck", "StudyGroup", "PracticeTest"];
const listE = (e) => api("GET", `/entities/${e}`);
const delE = (e, id) => api("DELETE", `/entities/${e}/${id}`);

// AP-115 dump: every visible leaf text node that is a heading or bold >=14px,
// with its parent chain (3 up) borders — the mixed-content-safe dump.
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
        chain.push({
          tag: p.tagName.toLowerCase(),
          cls: (p.className || "").toString().slice(0, 80),
          borderB: `${pcs.borderBottomWidth} ${pcs.borderBottomStyle}`,
          pad: `${pcs.paddingTop}/${pcs.paddingBottom}`,
          h: Math.round(pr.height),
        });
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

// The discovery pre-dump: visible buttons + inputs so a failed driver is
// diagnosable from the log (the v1 lesson: drivers that miss silently
// populate nothing and the measurement looks "empty" for no visible reason).
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
  // ---- login ----
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);

  // ---- baseline inventory (delta-cleanup anchor) ----
  const baseline = {};
  for (const e of CANDIDATES) {
    const v = await listE(e);
    baseline[e] = Array.isArray(v?.body) ? v.body.map((x) => x.id) : `__${v?.status}`;
  }
  console.log("BASELINE:", j(baseline));

  // ---- P1. task via My Day quick-add (v1-proven) ----
  await visit("My Day");
  await discoveryDump("myday");
  const qadd = page.locator('main input[placeholder*="task" i]').first();
  if ((await qadd.count()) > 0) {
    await qadd.fill("Probe task s75");
    await qadd.press("Enter");
    await page.waitForTimeout(1800);
    console.log("P1-task: filled");
  } else {
    console.log("P1-task: NO quick-add input — skipped");
  }

  // ---- P2. event via Events New Event ----
  await visit("Events");
  await discoveryDump("events");
  const evBtn = page.locator("main button", { hasText: /new event/i }).first();
  if ((await evBtn.count()) > 0) {
    await evBtn.click();
    await page.waitForTimeout(900);
    const dlg = page.locator("[role=dialog]");
    const inputs = dlg.locator("input");
    const n = await inputs.count();
    console.log("P2-event dialog inputs:", n);
    // fill the first text input with the signature; leave the rest default
    for (let i = 0; i < n; i++) {
      const inp = inputs.nth(i);
      const type = await inp.getAttribute("type");
      if (!type || type === "text") { await inp.fill("Probe event s75"); break; }
    }
    const submit = dlg.locator("button", { hasText: /add|save|create/i }).first();
    if ((await submit.count()) > 0) { await submit.click(); await page.waitForTimeout(1800); console.log("P2-event: submitted"); }
  } else {
    console.log("P2-event: NO New Event button — skipped");
  }

  // ---- P3. assignment via Assignments add dialog ----
  await visit("Assignments");
  await discoveryDump("assignments");
  const asgBtn = page.locator("main button", { hasText: /add assignment|^add$|new assignment/i }).first();
  if ((await asgBtn.count()) > 0) {
    await asgBtn.click();
    await page.waitForTimeout(900);
    const dlg = page.locator("[role=dialog]");
    const inputs = dlg.locator("input");
    const n = await inputs.count();
    console.log("P3-assignment dialog inputs:", n);
    for (let i = 0; i < n; i++) {
      const inp = inputs.nth(i);
      const type = await inp.getAttribute("type");
      if (!type || type === "text") { await inp.fill("Probe assignment s75"); break; }
    }
    const submit = dlg.locator("button", { hasText: /add|save|create/i }).first();
    if ((await submit.count()) > 0) { await submit.click(); await page.waitForTimeout(1800); console.log("P3-assignment: submitted"); }
  } else {
    console.log("P3-assignment: NO add button — skipped");
  }

  // ---- P4. exam via Exams add dialog ----
  await visit("Exams");
  await discoveryDump("exams");
  const examBtn = page.locator("main button", { hasText: /add exam|^add$|new exam/i }).first();
  if ((await examBtn.count()) > 0) {
    await examBtn.click();
    await page.waitForTimeout(900);
    const dlg = page.locator("[role=dialog]");
    const inputs = dlg.locator("input");
    const n = await inputs.count();
    console.log("P4-exam dialog inputs:", n);
    for (let i = 0; i < n; i++) {
      const inp = inputs.nth(i);
      const type = await inp.getAttribute("type");
      if (!type || type === "text") { await inp.fill("Probe exam s75"); break; }
    }
    const submit = dlg.locator("button", { hasText: /add|save|create/i }).first();
    if ((await submit.count()) > 0) { await submit.click(); await page.waitForTimeout(1800); console.log("P4-exam: submitted"); }
  } else {
    console.log("P4-exam: NO add button — skipped");
  }

  // ---- P5. note via Notes New ----
  await visit("Notes");
  await discoveryDump("notes");
  const noteBtn = page.locator("main button", { hasText: /^new$|new note/i }).first();
  if ((await noteBtn.count()) > 0) {
    await noteBtn.click();
    await page.waitForTimeout(1200);
    // the editor may be a dialog or an inline pane; fill any visible title-ish input
    const tInp = page.locator("main input[placeholder*='title' i], [role=dialog] input").first();
    if ((await tInp.count()) > 0) { await tInp.fill("Probe note s75"); }
    const save = page.locator("main button, [role=dialog] button", { hasText: /save|create|done/i }).first();
    if ((await save.count()) > 0) { await save.click().catch(() => {}); await page.waitForTimeout(1500); }
    console.log("P5-note: attempted");
  } else {
    console.log("P5-note: NO new button — skipped");
  }

  // ---- measure the populated views ----
  const measures = {};
  for (const [key, nav] of [["tasks", "Tasks"], ["assignments", "Assignments"], ["exams", "Exams"], ["notes", "Notes"], ["calendar", "Calendar"]]) {
    await visit(nav);
    await page.screenshot({ path: `${OUT}/75-ref-populated-${key}.png`, fullPage: false });
    measures[key] = await textDump();
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

  // ---- residue verification ----
  const residue = [];
  for (const e of CANDIDATES) {
    const v = await listE(e);
    if (!Array.isArray(v?.body)) continue;
    for (const row of v.body) if (SIG.test(JSON.stringify(row))) residue.push({ entity: e, id: row.id });
  }
  console.log("RESIDUE:", residue.length === 0 ? "ZERO" : j(residue));
  console.log("PROBE-S75-COMPLETE ok:", residue.length === 0);
} catch (err) {
  console.log("PROBE-ERROR:", String(err).slice(0, 600));
  // attempt emergency signature cleanup on any failure
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

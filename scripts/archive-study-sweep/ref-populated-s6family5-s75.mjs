// Session-75 probe v5: the v4 post-mortem — the date PICKS registered, but
// the calendar POPOVER is itself a modal [role=dialog], so `.last()` scoped
// the submit/detach verification to the POPOVER layer, not the form. The
// popover stayed open (blocking P4/P5) until the measure phase's `page.goto`
// reloaded past it. v5 scopes everything by FORM TITLE:
//   - the form dialog = [role=dialog]:has-text("Add Assignment"/"Add Exam")
//   - after a pick: Escape once → verify [data-radix-popper-content-wrapper]
//     is gone → submit via the FORM's own button → wait for THAT to detach
// v5 also finally drives the New Note editor with a post-click layer dump.
// (v4 achieved: subject/task/event all created + measured + cleaned ZERO.)
// v3 achieved: subject OK, task OK (My Day quick-add), event OK (the Start/
// End fields are datetime-local inputs). Blockers: the Assignment/Exam date
// pickers ("Pick date"/"Pick" popover triggers) did not take — root-cause
// hypothesis: day "15" of October is in the PAST (ref today = Oct 20) and
// the calendar disables past dates, so the matched button no-op'd. Notes:
// the "New Note" flow was never inventoried after the click.
// v4 changes:
//   - picker day = 28 (future), button filtered :not([aria-disabled=true])
//   - picker instrumented: dump the popover layers before clicking, verify
//     by re-reading the trigger text + the dialog text after
//   - notes: discovery-dump AFTER clicking New Note, fill what appears
//   - text dump widened (any visible leaf 2–60 chars, cap 60) so regular-
//     weight ROW content lands in the comparison (v3 rows were filtered out)
//   - measure adds dashboard + myday (the task surfaces there too)
//   - event datetime = tomorrow 18:00 (visible in the October grid)
// Cleanup unchanged: baseline→after delta + signature, residue verification.
// Usage: node scripts/ref-populated-s6family4-s75.mjs
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

// widened leaf dump: headings + bold≥14 (unfiltered) PLUS any visible leaf
// text 2–60 chars (cap 60) — rows are regular weight, v3 missed them
const textDump = () =>
  page.evaluate(() => {
    const out = [];
    const seen = new Set();
    const main = document.querySelector("main") || document.body;
    for (const el of main.querySelectorAll("h1,h2,h3,h4,h5,h6,strong,b,span,div,p")) {
      if (el.children.length > 0) continue;
      const t = (el.textContent || "").trim();
      if (!t || t.length > 60 || t.length < 2) continue;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      const fw = parseInt(cs.fontWeight, 10);
      const isHeading = /^h[1-6]$/.test(el.tagName);
      const fs = parseInt(cs.fontSize, 10);
      if (!isHeading && !(fw >= 600 && fs >= 14) && !(fs >= 12 && t.length >= 3)) continue;
      const key = t + "|" + el.tagName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ t, tag: el.tagName.toLowerCase(), fs: `${fs}px`, fw });
    }
    return out.slice(0, 60);
  });

const visit = async (navText) => {
  await page.locator("a").filter({ hasText: navText }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2200);
};

const pickCombobox = async (dlg, optionText) => {
  const trig = dlg.locator("[role=combobox]").first();
  if ((await trig.count()) === 0) return "NO-COMBO";
  await trig.click();
  await page.waitForTimeout(700);
  const opt = page.locator("[role=option]", { hasText: optionText }).first();
  if ((await opt.count()) === 0) { await page.keyboard.press("Escape"); return `NO-OPTION(${optionText})`; }
  await opt.click();
  await page.waitForTimeout(500);
  return "PICKED";
};

// v4 popover picker: instrument → click the ENABLED future day → verify
const pickPopoverDate = async (trigger, day = "28") => {
  const before = ((await trigger.textContent().catch(() => "")) || "").trim();
  await trigger.click();
  await page.waitForTimeout(900);
  const layers = await page.evaluate(() => {
    const wraps = [...document.querySelectorAll("[data-radix-popper-content-wrapper]")];
    return wraps.slice(-2).map((w) => ({
      btns: [...w.querySelectorAll("button")].slice(0, 45).map((b) => ({
        t: (b.textContent || "").trim().slice(0, 12),
        dis: b.disabled || b.getAttribute("aria-disabled") === "true",
      })),
    }));
  });
  console.log("POPOVER:", j(layers).slice(0, 1500));
  const dayRe = new RegExp(`^${day}$`);
  const btn = page
    .locator("[data-radix-popper-content-wrapper] button:not([disabled]):not([aria-disabled='true'])", { hasText: dayRe })
    .last();
  if ((await btn.count()) === 0) {
    await page.keyboard.press("Escape");
    return { clicked: false, before };
  }
  await btn.click();
  await page.waitForTimeout(800);
  const after = ((await trigger.textContent().catch(() => "")) || "").trim();
  const dlgText = ((await page.locator("[role=dialog]").last().textContent().catch(() => "")) || "");
  const stillPlaceholder = /pick date|^pick$/im.test(dlgText.replace(/Pick Duration/g, ""));
  return { clicked: true, before, after, stillPlaceholder };
};

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
      else if (type === "datetime-local") {
        const tmr = new Date(Date.now() + 86400000);
        const iso = `${tmr.getFullYear()}-${String(tmr.getMonth() + 1).padStart(2, "0")}-${String(tmr.getDate()).padStart(2, "0")}T18:00`;
        await inp.fill(iso, { timeout: 3000 });
        filled.push(`${i}:dtlocal(${iso})`);
      }
    } catch { filled.push(`${i}:SKIP`); }
  }
  return filled;
};

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
      buttons: [...document.querySelectorAll("main button, [role=dialog] button")].filter(vis).map((b) => b.textContent.trim()).filter(Boolean).slice(0, 22),
      inputs: [...document.querySelectorAll("main input, main textarea, [role=dialog] input, [role=dialog] textarea")].filter(vis).map((i) => i.placeholder || i.type || i.getAttribute("aria-label")).slice(0, 12),
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

  // ---- P0. subject (v1-proven) ----
  try {
    await visit("Settings");
    await page.locator("button", { hasText: "Subjects" }).first().click();
    await page.waitForTimeout(1000);
    await page.locator("main button", { hasText: /add subject/i }).first().click();
    await page.waitForTimeout(800);
    await page.locator("[role=dialog] input").first().fill("Probe Subject s75");
    await page.locator("[role=dialog] button", { hasText: /add subject/i }).first().click();
    await page.waitForTimeout(1800);
    console.log("P0-subject: attempted");
  } catch (e) { console.log("P0-subject: FAILED", String(e).slice(0, 150)); }

  // ---- P1. task via My Day quick-add (proven) ----
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

  // ---- P2. event (datetime-local proven) ----
  try {
    await visit("Events");
    const evBtn = page.locator("main button", { hasText: /new event/i }).first();
    if ((await evBtn.count()) > 0) {
      await evBtn.click();
      await page.waitForTimeout(900);
      console.log("P2-event fill:", j(await fillDialogBasics(SIGTXT)));
      console.log("P2-event submit:", await submitDialog(/create event|add|save|create/i));
    } else console.log("P2-event: NO New Event button");
  } catch (e) { console.log("P2-event: FAILED", String(e).slice(0, 150)); }

  // form-scoped submit (the v4 lesson: popovers are dialogs too)
  const closePopoverThenSubmit = async (formTitleRe, actionRe) => {
    // close the popover layer if one is open
    const popCount = await page.locator("[data-radix-popper-content-wrapper]").count();
    if (popCount > 0) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(700);
    }
    const stillPop = await page.locator("[data-radix-popper-content-wrapper]").count();
    if (stillPop > 0) {
      // click outside as fallback (neutral content area — never the sidebar)
      await page.mouse.click(720, 700);
      await page.waitForTimeout(700);
    }
    const form = page.locator("[role=dialog]", { hasText: formTitleRe }).first();
    if ((await form.count()) === 0) return "FORM-GONE";
    const submit = form.locator("button", { hasText: actionRe }).last();
    if ((await submit.count()) === 0) return "NO-SUBMIT-BTN";
    await submit.click({ timeout: 5000 });
    const closed = await form.waitFor({ state: "detached", timeout: 9000 }).then(() => true).catch(() => false);
    if (!closed) {
      console.log("FORM-STILL-OPEN:", ((await form.textContent().catch(() => "")) || "").slice(0, 220));
      await page.keyboard.press("Escape");
      await page.waitForTimeout(800);
      return false;
    }
    await page.waitForTimeout(1500);
    return true;
  };

  // ---- P3. assignment: title + subject + FUTURE day pick ----
  try {
    await visit("Assignments");
    const asgBtn = page.locator("main button", { hasText: /add assignment|^add$|new assignment/i }).first();
    if ((await asgBtn.count()) > 0) {
      await asgBtn.click();
      await page.waitForTimeout(900);
      console.log("P3 fill:", j(await fillDialogBasics(SIGTXT)));
      const dlg = page.locator("[role=dialog]", { hasText: /add assignment/i }).first();
      console.log("P3 subject:", await pickCombobox(dlg, "Probe Subject s75"));
      const dueTrig = dlg.locator("button", { hasText: /pick date/i }).first();
      if ((await dueTrig.count()) > 0) console.log("P3 due:", j(await pickPopoverDate(dueTrig, "28")));
      console.log("P3 submit:", await closePopoverThenSubmit(/add assignment/i, /add assignment/i));
    } else console.log("P3: NO add button");
  } catch (e) { console.log("P3: FAILED", String(e).slice(0, 150)); }

  // ---- P4. exam: title + subject + FUTURE day pick ----
  try {
    await visit("Exams");
    const examBtn = page.locator("main button", { hasText: /add exam|^add$|new exam/i }).first();
    if ((await examBtn.count()) > 0) {
      await examBtn.click();
      await page.waitForTimeout(900);
      console.log("P4 fill:", j(await fillDialogBasics(SIGTXT)));
      const dlg = page.locator("[role=dialog]", { hasText: /add exam/i }).first();
      console.log("P4 subject:", await pickCombobox(dlg, "Probe Subject s75"));
      const dateTrig = dlg.locator("button", { hasText: /^pick$/i }).first();
      if ((await dateTrig.count()) > 0) console.log("P4 date:", j(await pickPopoverDate(dateTrig, "28")));
      console.log("P4 submit:", await closePopoverThenSubmit(/add exam/i, /add exam/i));
    } else console.log("P4: NO add button");
  } catch (e) { console.log("P4: FAILED", String(e).slice(0, 150)); }

  // ---- P5. note: post-click layer dump, scoped fill, save ----
  try {
    await visit("Notes");
    const noteBtn = page.locator("main button", { hasText: /new note/i }).first();
    if ((await noteBtn.count()) > 0) {
      await noteBtn.click();
      await page.waitForTimeout(1400);
      const layers = await page.evaluate(() => {
        const ds = [...document.querySelectorAll("[role=dialog]")];
        return ds.map((d) => ({
          sample: (d.textContent || "").slice(0, 160),
          inputs: [...d.querySelectorAll("input, textarea")].map((i) => i.placeholder || i.type).slice(0, 8),
          buttons: [...d.querySelectorAll("button")].map((b) => b.textContent.trim()).filter(Boolean).slice(0, 10),
        }));
      });
      console.log("P5-LAYERS:", j(layers));
      // fill whatever dialog exists, else the inline editor
      const dlgCount = await page.locator("[role=dialog]").count();
      if (dlgCount > 0) {
        const form = page.locator("[role=dialog]").first();
        const inp = form.locator("input").first();
        if ((await inp.count()) > 0) await inp.fill("Probe note s75", { timeout: 4000 }).catch(() => {});
        const ta = form.locator("textarea").first();
        if ((await ta.count()) > 0) await ta.fill("Probe note body s75", { timeout: 4000 }).catch(() => {});
        console.log("P5-note submit:", await closePopoverThenSubmit(/note/i, /save|create|add|done/i));
      } else {
        const title = page.locator("main input").first();
        if ((await title.count()) > 0) {
          await title.fill("Probe note s75", { timeout: 4000 }).catch(() => {});
          await title.press("Enter").catch(() => {});
          await page.waitForTimeout(1200);
        }
        await page.keyboard.press("Escape").catch(() => {});
        console.log("P5-note: inline attempted");
      }
      await page.waitForTimeout(600);
    } else console.log("P5-note: NO new-note button");
  } catch (e) { console.log("P5-note: FAILED", String(e).slice(0, 150)); }

  // ---- measure the populated views (dashboard + myday added) ----
  const measures = {};
  for (const [key, nav] of [["dashboard", null], ["myday", "My Day"], ["tasks", "Tasks"], ["assignments", "Assignments"], ["exams", "Exams"], ["notes", "Notes"], ["calendar", "Calendar"]]) {
    try {
      if (nav) await visit(nav);
      else await page.goto(`${REF}/`, { timeout: 45000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${OUT}/75-ref-populated-${key}.png`, fullPage: false });
      measures[key] = await textDump();
      console.log(`MEASURED-${key}: ${measures[key].length} leaves`);
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
  console.log("PROBE-V4-COMPLETE ok:", residue.length === 0);
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

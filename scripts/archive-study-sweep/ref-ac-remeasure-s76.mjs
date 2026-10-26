// Session-76 probe v2: the Batch AC re-measure — the two open questions
// from the S75 measurement (AC6 exam-topics positive case, AC8 task
// far-date pill form) plus computed-style anatomy for the AC1/AC2
// assignment row and the AC3/AC4/AC5/AC7 exam card.
//
// v1 learnings applied here:
//  - the Add Exam dialog anatomy (measured): title "e.g., Math Final Exam",
//    duration "60", LOCATION "e.g., Room 101, Hall A", TOPICS
//    "Add a topic...", notes textarea, subject + type comboboxes, "Pick"
//    date popover trigger → fill by placeholder, topics via fill+Enter
//  - the Add Task dialog has an EMPTY title → scope by the "Create Task"
//    button; the date field appears via an "Add due date" button
//  - an open modal blocks sidebar navigation → visit() closes dialogs first
//  - AP-118: Exam MUST be in the cleanup candidate list
//  - AP-119: popovers are modal dialogs too — Escape before submit
// Usage: node scripts/ref-ac-remeasure-s76.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const REF = "https://omni-study1.base44.app";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });
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
    let parsed = null;
    try { parsed = await r.json(); } catch {}
    return { status: r.status, body: parsed };
  }, { method, path });

// AP-118: Exam MUST be in the candidate list (the S75 survivor lesson).
const CANDIDATES = ["Task", "Todo", "Grade", "Subject", "Assignment", "Calculation", "CalculatorHistory", "MathSolution", "SolverHistory", "FocusSession", "Event", "Note", "Flashcard", "FlashcardSet", "Deck", "StudyGroup", "PracticeTest", "Exam"];
const listE = (e) => api("GET", `/entities/${e}`);
const delE = (e, id) => api("DELETE", `/entities/${e}/${id}`);

const visit = async (navText) => {
  // close any modal layer first (AP-119: popovers AND dialogs block the sidebar)
  for (let i = 0; i < 2; i++) {
    const openDlg = await page.locator("[role=dialog]").count();
    const pop = await page.locator("[data-radix-popper-content-wrapper]").count();
    if (openDlg === 0 && pop === 0) break;
    await page.keyboard.press("Escape");
    await page.waitForTimeout(900);
  }
  const stillOpen = await page.locator("[role=dialog]").count();
  if (stillOpen > 0) {
    const closeBtn = page.locator('[role=dialog] button', { hasText: /close|cancel/i }).first();
    if ((await closeBtn.count()) > 0) await closeBtn.click().catch(() => {});
    await page.waitForTimeout(900);
  }
  await page.locator("a").filter({ hasText: navText }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2200);
};

// AP-119: scope submits to the FORM dialog (popovers are dialogs too).
const closePopoverThenSubmit = async (formLocator, actionRe) => {
  const popCount = await page.locator("[data-radix-popper-content-wrapper]").count();
  if (popCount > 0) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(700);
  }
  const stillPop = await page.locator("[data-radix-popper-content-wrapper]").count();
  if (stillPop > 0) {
    await page.mouse.click(720, 700);
    await page.waitForTimeout(700);
  }
  if ((await formLocator.count()) === 0) return "FORM-GONE";
  const submit = formLocator.locator("button", { hasText: actionRe }).last();
  if ((await submit.count()) === 0) return "NO-SUBMIT-BTN";
  await submit.click({ timeout: 5000 });
  const closed = await formLocator.waitFor({ state: "detached", timeout: 9000 }).then(() => true).catch(() => false);
  await page.waitForTimeout(1600);
  return closed ? "SUBMITTED" : "STILL-OPEN";
};

const pickComboboxIn = async (form, optionText) => {
  const trig = form.locator("[role=combobox]").first();
  if ((await trig.count()) === 0) return "NO-COMBO";
  await trig.click();
  await page.waitForTimeout(700);
  const opt = page.locator("[role=option]", { hasText: optionText }).first();
  if ((await opt.count()) === 0) { await page.keyboard.press("Escape"); return `NO-OPTION(${optionText})`; }
  await opt.click();
  await page.waitForTimeout(500);
  return "PICKED";
};

// v4 popover picker: click the ENABLED future day, verify the trigger moved.
const pickPopoverDate = async (trigger, day = "28") => {
  await trigger.click();
  await page.waitForTimeout(900);
  const dayRe = new RegExp(`^${day}$`);
  const btn = page
    .locator("[data-radix-popper-content-wrapper] button:not([disabled]):not([aria-disabled='true'])", { hasText: dayRe })
    .last();
  if ((await btn.count()) === 0) {
    await page.keyboard.press("Escape");
    return false;
  }
  await btn.click();
  await page.waitForTimeout(800);
  return true;
};

// The dialog anatomy dump — every input/textarea/combobox/button with type
// and placeholder, so unknown fields (Topics? Location?) are inventoried.
const dumpDialog = async () => {
  const dlg = page.locator("[role=dialog]").last();
  const d = await dlg.evaluate((el) => {
    const vis = (x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    return {
      title: (el.querySelector("h1,h2,h3,[role=alertdialogtitle]")?.textContent || "").trim().slice(0, 60),
      inputs: [...el.querySelectorAll("input, textarea")].filter(vis).map((i) => ({
        tag: i.tagName.toLowerCase(),
        type: i.getAttribute("type") ?? "(text)",
        ph: i.getAttribute("placeholder") ?? "",
        label: i.labels?.[0]?.textContent?.trim().slice(0, 40) ?? "",
      })),
      combos: [...el.querySelectorAll("[role=combobox]")].filter(vis).map((c) => ({
        text: (c.textContent || "").trim().slice(0, 30),
        ph: c.getAttribute("aria-placeholder") ?? "",
      })),
      buttons: [...el.querySelectorAll("button")].filter(vis).map((b) => (b.textContent || "").trim().slice(0, 30)).filter(Boolean),
    };
  }).catch((e) => ({ err: String(e).slice(0, 120) }));
  console.log("DIALOG-ANATOMY:", j(d));
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

  // ---- P0. subject (the v3-proven Settings chain) ----
  try {
    await visit("Settings");
    await page.locator("button", { hasText: "Subjects" }).first().click();
    await page.waitForTimeout(1000);
    await page.locator("main button", { hasText: /add subject/i }).first().click();
    await page.waitForTimeout(800);
    await page.locator("[role=dialog] input").first().fill("Probe Subject s76");
    await page.locator("[role=dialog] button", { hasText: /add subject/i }).first().click();
    await page.waitForTimeout(1800);
    console.log("P0-subject: attempted");
  } catch (e) { console.log("P0-subject: FAILED", String(e).slice(0, 150)); }

  // ---- P1. EXAM with topics + location (AC5/AC6 positive cases) ----
  try {
    await visit("Exams");
    await page.locator("main button", { hasText: /add exam|new exam/i }).first().click();
    await page.waitForTimeout(1000);
    const form = page.locator('[role=dialog]:has-text("Add Exam")').first();
    // fill by PLACEHOLDER (the v1-measured anatomy)
    const title = form.locator('input[placeholder*="Final Exam" i], input[placeholder*="exam" i]').first();
    if ((await title.count()) > 0) await title.fill("Probe Exam s76");
    const loc = form.locator('input[placeholder*="Room 101" i], input[placeholder*="Hall" i]').first();
    if ((await loc.count()) > 0) await loc.fill("Room 3B");
    const top = form.locator('input[placeholder*="topic" i]').first();
    if ((await top.count()) > 0) {
      await top.fill("Probe topic A");
      await top.press("Enter");
      await page.waitForTimeout(600);
      await top.fill("Probe topic B");
      await top.press("Enter");
      await page.waitForTimeout(600);
    }
    const dateTrig = form.locator("button", { hasText: /pick date|^pick$|select date/i }).first();
    if ((await dateTrig.count()) > 0) console.log("P1-exam date pick:", await pickPopoverDate(dateTrig, "28"));
    console.log("P1-exam subject:", await pickComboboxIn(form, "Probe Subject s76"));
    console.log("P1-exam submit:", await closePopoverThenSubmit(form, /add exam/i));
    await page.waitForTimeout(1800);
  } catch (e) { console.log("P1-exam: FAILED", String(e).slice(0, 200)); }

  // ---- P2. task with a FAR due date (AC8 far-date form) ----
  try {
    await visit("Tasks");
    await page.locator("main button", { hasText: /add task|new task/i }).first().click();
    await page.waitForTimeout(1000);
    await dumpDialog();
    // the ref's task dialog has an EMPTY title — scope by its Create button
    const form = page.locator('[role=dialog]:has(button:has-text("Create Task"))').first();
    const tInput = form.locator('input[placeholder*="Task name" i]').first();
    if ((await tInput.count()) > 0) await tInput.fill("Probe task far s76");
    // "Add due date" reveals the date control
    const addDue = form.locator("button", { hasText: /add due date/i }).first();
    if ((await addDue.count()) > 0) {
      await addDue.click();
      await page.waitForTimeout(800);
      const dateTrig = form.locator("button", { hasText: /pick date|^pick$|select date/i }).first();
      if ((await dateTrig.count()) > 0) {
        console.log("P2-task date pick:", await pickPopoverDate(dateTrig, "4"));
      } else {
        const dayBtn = page.locator("[data-radix-popper-content-wrapper] button:not([disabled]):not([aria-disabled='true'])", { hasText: /^4$/ }).last();
        if ((await dayBtn.count()) > 0) { await dayBtn.click(); await page.waitForTimeout(800); console.log("P2-task date pick: popover-day-4"); }
      }
    }
    console.log("P2-task submit:", await closePopoverThenSubmit(form, /create task/i));
    await page.waitForTimeout(1800);
  } catch (e) { console.log("P2-task: FAILED", String(e).slice(0, 200)); }

  // ---- P3. quick-add task (due=today — AC8 today form re-verify) ----
  try {
    await visit("My Day");
    const qadd = page.locator('main input[placeholder*="task" i], main input[placeholder*="Add" i]').first();
    if ((await qadd.count()) > 0) {
      await qadd.fill("Probe task today s76");
      await qadd.press("Enter");
      await page.waitForTimeout(1800);
      console.log("P3-quickadd: filled");
    } else console.log("P3-quickadd: NO quick-add input");
  } catch (e) { console.log("P3-quickadd: FAILED", String(e).slice(0, 150)); }

  // ---- P4. assignment (AC1/AC2 anatomy with computed styles) ----
  try {
    await visit("Assignments");
    await page.locator("main button", { hasText: /add assignment|new assignment/i }).first().click();
    await page.waitForTimeout(1000);
    await dumpDialog();
    const form = page.locator('[role=dialog]:has-text("Add Assignment"), [role=dialog]:has-text("New Assignment")').first();
    const tInput = form.locator("input[type=text], input:not([type])").first();
    if ((await tInput.count()) > 0) await tInput.fill("Probe Assignment s76");
    const dateTrig = form.locator("button", { hasText: /pick date|^pick$|select date/i }).first();
    if ((await dateTrig.count()) > 0) console.log("P4-assign date pick:", await pickPopoverDate(dateTrig, "28"));
    console.log("P4-assign subject:", await pickComboboxIn(form, "Probe Subject s76"));
    console.log("P4-assign submit:", await closePopoverThenSubmit(form, /add assignment|new assignment/i));
    await page.waitForTimeout(1800);
  } catch (e) { console.log("P4-assign: FAILED", String(e).slice(0, 200)); }

  // ---- MEASURE phase -------------------------------------------------------
  await page.waitForTimeout(1500);

  // Tasks rows: the due pills (today form + far form) with computed styles
  try {
    await visit("Tasks");
    await page.waitForTimeout(1500);
    const rows = await page.evaluate(() => {
      const out = [];
      const cards = [...document.querySelectorAll("main article, main div[class*=rounded-xl], main div[class*=group]")];
      for (const card of cards.slice(0, 20)) {
        const t = (card.textContent || "").trim();
        if (!/probe.*s76/i.test(t)) continue;
        const titleEl = card.querySelector("p[class*=font-semibold], p[class*=font-medium], h1,h2,h3");
        const tr = titleEl?.getBoundingClientRect();
        const cr = card.getBoundingClientRect();
        out.push({
          text: t.slice(0, 170),
          titleY: tr ? Math.round(tr.y - cr.y) : null,
          pills: [...card.querySelectorAll("span, [class*=rounded-full]")].map((el) => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return {
              text: (el.textContent || "").trim().slice(0, 40),
              bg: s.backgroundColor, color: s.color, fs: s.fontSize, fw: s.fontWeight,
              y: Math.round(r.y - cr.y), x: Math.round(r.x - cr.x), w: Math.round(r.width),
            };
          }).filter((p) => p.text && p.text.length < 40),
        });
      }
      return out;
    });
    console.log("MEASURE-TASKS:", j(rows));
    await page.screenshot({ path: `${OUT}/76-ref-tasks-populated.png` });
  } catch (e) { console.log("MEASURE-tasks: FAILED", String(e).slice(0, 200)); }

  // Exams cards: date format, subject chip, location row, topics row, due pill
  try {
    await visit("Exams");
    await page.waitForTimeout(1500);
    const cards = await page.evaluate(() => {
      const out = [];
      const cards = [...document.querySelectorAll("main div[class*=group], main div[class*=rounded]")];
      for (const card of cards.slice(0, 24)) {
        const t = (card.textContent || "").trim();
        if (!/probe.*s76/i.test(t)) continue;
        const rowsOut = [];
        for (const p of [...card.querySelectorAll("p, span, div")]) {
          if (p.children.length > 0 && p.tagName !== "P") continue;
          const txt = (p.textContent || "").trim();
          if (!txt || txt.length > 90) continue;
          const s = getComputedStyle(p);
          rowsOut.push({ tag: p.tagName.toLowerCase(), text: txt.slice(0, 70), fs: s.fontSize, fw: s.fontWeight, color: s.color });
        }
        out.push({
          text: t.slice(0, 220),
          pills: [...card.querySelectorAll("span")].map((el) => {
            const s = getComputedStyle(el);
            return { text: (el.textContent || "").trim().slice(0, 44), bg: s.backgroundColor, color: s.color, fs: s.fontSize, fw: s.fontWeight };
          }).filter((p) => p.text && p.text.length < 44),
          rows: rowsOut.slice(0, 20),
        });
      }
      return out;
    });
    console.log("MEASURE-EXAMS:", j(cards));
    await page.screenshot({ path: `${OUT}/76-ref-exams-populated.png` });
  } catch (e) { console.log("MEASURE-exams: FAILED", String(e).slice(0, 200)); }

  // Assignment row: geometry (due pill INLINE with title?) + styles
  try {
    await visit("Assignments");
    await page.waitForTimeout(1500);
    const row = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("main article, main div[class*=rounded-xl]")];
      for (const card of cards.slice(0, 14)) {
        const t = (card.textContent || "").trim();
        if (!/probe.*s76/i.test(t)) continue;
        const title = card.querySelector("h1,h2,h3,p[class*=font-semibold],p[class*=font-medium]");
        const titleR = title?.getBoundingClientRect();
        const cardR = card.getBoundingClientRect();
        const items = [...card.querySelectorAll("span, [class*=rounded-full]")].map((el) => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return {
            text: (el.textContent || "").trim().slice(0, 40),
            bg: s.backgroundColor, color: s.color, fs: s.fontSize, fw: s.fontWeight,
            y: Math.round(r.y - cardR.y), x: Math.round(r.x - cardR.x), w: Math.round(r.width), h: Math.round(r.height),
          };
        }).filter((p) => p.text && p.text.length < 40);
        return {
          title: title?.textContent?.trim().slice(0, 50),
          titleY: titleR ? Math.round(titleR.y - cardR.y) : null,
          titleH: titleR ? Math.round(titleR.height) : null,
          items,
          text: t.slice(0, 180),
        };
      }
      return null;
    });
    console.log("MEASURE-ASSIGN:", j(row));
    await page.screenshot({ path: `${OUT}/76-ref-assignments-populated.png` });
  } catch (e) { console.log("MEASURE-assign: FAILED", String(e).slice(0, 200)); }

  // ---- CLEANUP: baseline delta + residue verification (AP-118) -----------
  const after = {};
  for (const e of CANDIDATES) {
    const v = await listE(e);
    after[e] = Array.isArray(v?.body) ? v.body.map((x) => x.id) : `__${v?.status}`;
  }
  const created = {};
  for (const e of CANDIDATES) {
    const b = new Set(Array.isArray(baseline[e]) ? baseline[e] : []);
    const a = Array.isArray(after[e]) ? after[e] : [];
    const delta = a.filter((id) => !b.has(id));
    if (delta.length) created[e] = delta;
  }
  console.log("CREATED-DELTA:", j(created));
  const deletions = [];
  for (const [e, ids] of Object.entries(created)) {
    for (const id of ids) {
      const r = await delE(e, id);
      deletions.push(`${e}:${id.slice(-6)}=${r.status}`);
    }
  }
  console.log("DELETIONS:", j(deletions));
  const final = {};
  for (const e of CANDIDATES) {
    const v = await listE(e);
    final[e] = Array.isArray(v?.body) ? v.body.map((x) => x.id) : `__${v?.status}`;
  }
  let residue = 0;
  for (const e of CANDIDATES) {
    for (const id of created[e] ?? []) if ((final[e] ?? []).includes(id)) residue++;
  }
  console.log("FINAL-RESIDUE:", residue);
} catch (e) {
  console.log("FATAL:", String(e).slice(0, 400));
} finally {
  await browser.close();
}

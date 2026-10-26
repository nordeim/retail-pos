// Session-76 probe v4: final micro-measure — (1) the exam topic-chip bg,
// (2) the location row computed style, (3) the subject chip innerHTML (the
// leading dot), (4) the assignment due pill's tomorrow/today forms ("N
// days" is measured for 7; the 0/1-day forms are not).
// Usage: node scripts/ref-ac-remeasure4-s76.mjs
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

const CANDIDATES = ["Task", "Subject", "Assignment", "Event", "Exam"];
const listE = (e) => api("GET", `/entities/${e}`);
const delE = (e, id) => api("DELETE", `/entities/${e}/${id}`);

const visit = async (navText) => {
  for (let i = 0; i < 2; i++) {
    const openDlg = await page.locator("[role=dialog]").count();
    const pop = await page.locator("[data-radix-popper-content-wrapper]").count();
    if (openDlg === 0 && pop === 0) break;
    await page.keyboard.press("Escape");
    await page.waitForTimeout(900);
  }
  await page.locator("a").filter({ hasText: navText }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2200);
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

const pickPopoverDay = async (day) => {
  const dayRe = new RegExp(`^${day}$`);
  const btn = page
    .locator("[data-radix-popper-content-wrapper] button:not([disabled]):not([aria-disabled='true'])", { hasText: dayRe })
    .last();
  if ((await btn.count()) === 0) { await page.keyboard.press("Escape"); return false; }
  await btn.click();
  await page.waitForTimeout(800);
  return true;
};

const submitForm = async (form, actionRe) => {
  const pop = await page.locator("[data-radix-popper-content-wrapper]").count();
  if (pop > 0) { await page.keyboard.press("Escape"); await page.waitForTimeout(600); }
  const submit = form.locator("button", { hasText: actionRe }).last();
  await submit.click({ timeout: 5000 });
  const closed = await form.waitFor({ state: "detached", timeout: 9000 }).then(() => true).catch(() => false);
  await page.waitForTimeout(1600);
  return closed ? "SUBMITTED" : "STILL-OPEN";
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

  // P0 subject
  try {
    await visit("Settings");
    await page.locator("button", { hasText: "Subjects" }).first().click();
    await page.waitForTimeout(1000);
    await page.locator("main button", { hasText: /add subject/i }).first().click();
    await page.waitForTimeout(800);
    await page.locator("[role=dialog] input").first().fill("Probe Subject s76");
    await page.locator("[role=dialog] button", { hasText: /add subject/i }).first().click();
    await page.waitForTimeout(1800);
  } catch (e) { console.log("P0: FAILED", String(e).slice(0, 120)); }

  // P1 exam (topics + location) for the fine anatomy
  try {
    await visit("Exams");
    await page.locator("main button", { hasText: /add exam|new exam/i }).first().click();
    await page.waitForTimeout(1000);
    const form = page.locator('[role=dialog]:has-text("Add Exam")').first();
    await form.locator('input[placeholder*="Final Exam" i], input[placeholder*="exam" i]').first().fill("Probe Exam s76");
    await form.locator('input[placeholder*="Room 101" i], input[placeholder*="Hall" i]').first().fill("Room 3B");
    const top = form.locator('input[placeholder*="topic" i]').first();
    await top.fill("Probe topic A");
    await top.press("Enter");
    await page.waitForTimeout(600);
    await form.locator("button", { hasText: /pick date|^pick$|select date/i }).first().click();
    await pickPopoverDay("28");
    await pickComboboxIn(form, "Probe Subject s76");
    console.log("P1-exam:", await submitForm(form, /add exam/i));
  } catch (e) { console.log("P1-exam: FAILED", String(e).slice(0, 200)); }

  // P2 assignments: tomorrow (day 22) + today (day 21)
  for (const [name, day] of [["Probe Assign tmrw s76", "22"], ["Probe Assign today s76", "21"]]) {
    try {
      await visit("Assignments");
      await page.locator("main button", { hasText: /add assignment|new assignment/i }).first().click();
      await page.waitForTimeout(1000);
      const form = page.locator('[role=dialog]:has-text("Add Assignment")').first();
      await form.locator("input[type=text], input:not([type])").first().fill(name);
      await form.locator("button", { hasText: /pick date/i }).first().click();
      await pickPopoverDay(day);
      await pickComboboxIn(form, "Probe Subject s76");
      console.log(`P2-${day}:`, await submitForm(form, /add assignment/i));
    } catch (e) { console.log(`P2-${day}: FAILED`, String(e).slice(0, 160)); }
  }

  // MEASURE exams: fine anatomy (topic chip bg, location row, subject chip dot)
  await visit("Exams");
  await page.waitForTimeout(1500);
  const examDump = await page.evaluate(() => {
    for (const card of [...document.querySelectorAll("main div[class*=group], main div[class*=rounded]")].slice(0, 24)) {
      const t = (card.textContent || "").trim();
      if (!/probe.*s76/i.test(t) || !/Room 3B/.test(t)) continue;
      const fine = [];
      for (const el of [...card.querySelectorAll("*")]) {
        if (el.children.length > 1) continue;
        const txt = (el.textContent || "").trim();
        if (!txt || txt.length > 60) continue;
        const s = getComputedStyle(el);
        fine.push({
          tag: el.tagName.toLowerCase(),
          text: txt.slice(0, 40),
          cls: (el.getAttribute("class") || "").slice(0, 60),
          bg: s.backgroundColor, color: s.color, fs: s.fontSize, fw: s.fontWeight,
          html: txt.length < 30 ? el.innerHTML.slice(0, 240) : "",
        });
      }
      return { text: t.slice(0, 260), fine: fine.slice(0, 40) };
    }
    return null;
  });
  console.log("MEASURE-EXAM-FINE:", j(examDump));
  await page.screenshot({ path: `${OUT}/76-ref-exam-fine.png` });

  // MEASURE assignments: tomorrow + today pill forms
  await visit("Assignments");
  await page.waitForTimeout(1500);
  const assignDump = await page.evaluate(() => {
    const out = [];
    for (const card of [...document.querySelectorAll("main article, main div[class*=rounded-xl]")].slice(0, 14)) {
      const t = (card.textContent || "").trim();
      if (!/probe.*s76/i.test(t)) continue;
      const pills = [...card.querySelectorAll("span, [class*=rounded-full]")].map((el) => {
        const s = getComputedStyle(el);
        return {
          text: (el.textContent || "").trim().slice(0, 40),
          bg: s.backgroundColor, color: s.color, fs: s.fontSize, fw: s.fontWeight,
          html: (el.textContent || "").trim().length < 30 ? el.innerHTML.slice(0, 160) : "",
        };
      }).filter((p) => p.text && p.text.length < 40);
      out.push({ row: t.slice(0, 90), pills });
    }
    return out;
  });
  console.log("MEASURE-ASSIGN-FORMS:", j(assignDump));
  await page.screenshot({ path: `${OUT}/76-ref-assign-forms.png` });

  // ---- CLEANUP ----
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
  const deletions = [];
  for (const [e, ids] of Object.entries(created)) {
    for (const id of ids) deletions.push(`${e}:${id.slice(-6)}=${(await delE(e, id)).status}`);
  }
  console.log("DELETIONS:", j(deletions));
  const final = {};
  for (const e of CANDIDATES) {
    const v = await listE(e);
    final[e] = Array.isArray(v?.body) ? v.body.map((x) => x.id) : `__${v?.status}`;
  }
  let residue = 0;
  for (const e of CANDIDATES) for (const id of created[e] ?? []) if ((final[e] ?? []).includes(id)) residue++;
  console.log("FINAL-RESIDUE:", residue);
} catch (e) {
  console.log("FATAL:", String(e).slice(0, 400));
} finally {
  await browser.close();
}

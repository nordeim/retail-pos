// Session-76 probe v3: the focused re-measure — the remaining unknowns
// after v2: (1) the FUTURE task due-pill form (v2's "far" task landed on a
// past date — the day-4 click hit October 4), (2) the TOMORROW form,
// (3) the task pill's inner anatomy (calendar icon?), (4) the exam topic
// chip bg, (5) the subject chip's leading dot, (6) the location row style.
// Usage: node scripts/ref-ac-remeasure3-s76.mjs
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

const pickPopoverDay = async (day) => {
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

const makeTask = async (name, day) => {
  await visit("Tasks");
  await page.locator("main button", { hasText: /add task|new task/i }).first().click();
  await page.waitForTimeout(1000);
  const form = page.locator('[role=dialog]:has(button:has-text("Create Task"))').first();
  await form.locator('input[placeholder*="Task name" i]').first().fill(name);
  const addDue = form.locator("button", { hasText: /add due date/i }).first();
  await addDue.click();
  await page.waitForTimeout(800);
  const picked = await pickPopoverDay(day);
  // close any popover, then submit through the form's own button
  const pop = await page.locator("[data-radix-popper-content-wrapper]").count();
  if (pop > 0) { await page.keyboard.press("Escape"); await page.waitForTimeout(600); }
  const submit = form.locator("button", { hasText: /create task/i }).last();
  await submit.click({ timeout: 5000 });
  const closed = await form.waitFor({ state: "detached", timeout: 9000 }).then(() => true).catch(() => false);
  await page.waitForTimeout(1600);
  return { picked, closed };
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

  // P1: future task (day 28) + tomorrow task (day 22) + today quick-add
  console.log("P1-future28:", j(await makeTask("Probe future28 s76", "28")));
  console.log("P2-tomorrow22:", j(await makeTask("Probe tomorrow22 s76", "22")));
  try {
    await visit("My Day");
    const qadd = page.locator('main input[placeholder*="task" i], main input[placeholder*="Add" i]').first();
    if ((await qadd.count()) > 0) {
      await qadd.fill("Probe today s76");
      await qadd.press("Enter");
      await page.waitForTimeout(1800);
    }
  } catch (e) { console.log("P3-quickadd: FAILED", String(e).slice(0, 120)); }

  // MEASURE tasks: every probe row's pill, with innerHTML anatomy
  await visit("Tasks");
  await page.waitForTimeout(1500);
  const rows = await page.evaluate(() => {
    const out = [];
    const cards = [...document.querySelectorAll("main article, main div[class*=rounded-xl], main div[class*=group]")];
    for (const card of cards.slice(0, 25)) {
      const t = (card.textContent || "").trim();
      if (!/probe.*s76/i.test(t)) continue;
      const pillEls = [...card.querySelectorAll("span, [class*=rounded-full]")].filter((el) => {
        const txt = (el.textContent || "").trim();
        return txt && txt.length < 30 && /oct|today|tomorrow|day/i.test(txt);
      });
      out.push({
        row: t.slice(0, 80),
        pills: pillEls.map((el) => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return {
            text: (el.textContent || "").trim(),
            html: el.innerHTML.slice(0, 200),
            bg: s.backgroundColor, color: s.color, fs: s.fontSize, fw: s.fontWeight,
            w: Math.round(r.width), h: Math.round(r.height),
          };
        }),
      });
    }
    return out;
  });
  console.log("MEASURE-TASKS:", j(rows));
  await page.screenshot({ path: `${OUT}/76-ref-tasks-forms.png` });

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

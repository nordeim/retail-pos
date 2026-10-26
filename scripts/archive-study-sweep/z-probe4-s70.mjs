// Session-70 probe #4: the full dashboard geometry truth table on BOTH
// hosts — the stat-card row, the section grid, the assignments card, the
// root container rhythm (gap between the blocks) — for the Batch-AA pin
// values. READ-ONLY (zero-residue).
// Usage: node scripts/z-probe4-s70.mjs
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const CLONE = "http://localhost:3200";

async function measure(page, host, isRef) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${host}/`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  return page.evaluate(() => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    // stat cards: the "tasks completed" hint text's card ancestor
    const statOf = (hint) => {
      const el0 = [...document.querySelectorAll("p, span, div")].find(
        (e) => e.children.length === 0 && e.textContent.trim() === hint && vis(e),
      );
      let el = el0;
      for (let i = 0; i < 6 && el; i++) {
        el = el.parentElement;
        if (!el) break;
        const r = el.getBoundingClientRect();
        if (r.width > 200 && r.height > 90) break;
      }
      const r = el?.getBoundingClientRect();
      return r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null;
    };
    // section cards via the h2 ancestors
    const cardOf = (needle) => {
      const h2 = [...document.querySelectorAll("h2")].find(
        (h) => h.textContent.trim() === needle && vis(h),
      );
      if (!h2) return null;
      let el = h2;
      for (let i = 0; i < 7 && el; i++) {
        el = el.parentElement;
        if (!el) break;
        const r = el.getBoundingClientRect();
        if (r.width > 500 && r.height > 150) {
          return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
        }
      }
      return null;
    };
    // the root rhythm: the y-gaps between the stat row, the section grid,
    // and the assignments card
    const tasks = cardOf("Today's Tasks");
    const exams = cardOf("Upcoming Exams");
    const assignments = cardOf("Upcoming Assignments");
    const stats = [statOf("tasks completed"), statOf("to be done"), statOf("assignments"), statOf("this month")];
    // the grid container that holds tasks+exams (shared parent)
    let gridCls = null;
    if (tasks && exams) {
      const h2 = [...document.querySelectorAll("h2")].find((h) => h.textContent.trim() === "Today's Tasks" && vis(h));
      let el = h2;
      for (let i = 0; i < 8 && el; i++) {
        el = el.parentElement;
        if (!el) break;
        if (el.contains && [...el.querySelectorAll(":scope > div")].length >= 2 && getComputedStyle(el).display === "grid") {
          gridCls = { cls: typeof el.className === "string" ? el.className : "", cols: getComputedStyle(el).gridTemplateColumns };
          break;
        }
      }
    }
    return { stats, tasks, exams, assignments, gridCls };
  });
}

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);
  const ref = await measure(page, REF, true);

  const cctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const cpage = await cctx.newPage();
  const email = `s70-probe4-${Date.now()}@studyflow.app`;
  const reg = await cpage.request.post(`${CLONE}/api/auth/register`, {
    data: { email, password: "Fresh1234!", name: "S70 Probe 4" },
  });
  if (!reg.ok()) throw new Error(`register failed ${reg.status()}`);
  const { code } = await reg.json();
  await cpage.request.post(`${CLONE}/api/auth/verify-email`, { data: { email, code } });
  await cpage.goto(`${CLONE}/`, { timeout: 45000 });
  await cpage.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await cpage.waitForTimeout(2000);
  const clone = await measure(cpage, CLONE, false);

  console.log(JSON.stringify({ ref, clone }, null, 1));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 500) }));
} finally {
  await browser.close();
}

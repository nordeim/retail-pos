// Session-75 residue verification (post-abort): log in, list every candidate
// entity, scan for the probe signature AND the literal probe strings, report.
// Delete nothing — report only (the caller decides).
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const j = (o) => JSON.stringify(o);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const CANDIDATES = ["Task", "Todo", "Grade", "Subject", "Assignment", "Calculation", "CalculatorHistory", "MathSolution", "SolverHistory", "FocusSession", "Event", "Note", "Flashcard", "FlashcardSet", "Deck", "StudyGroup", "PracticeTest"];

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

try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);

  const inventory = {};
  for (const e of CANDIDATES) {
    const v = await api("GET", `/entities/${e}`);
    inventory[e] = Array.isArray(v?.body) ? v.body : `__${v?.status}`;
  }
  // report: counts + any signature/needle hit
  const needles = /probe.*s75|probe task|probe event|probe assignment|probe exam|probe note/i;
  const hits = [];
  const counts = {};
  for (const e of CANDIDATES) {
    const v = inventory[e];
    if (!Array.isArray(v)) { counts[e] = `__${v}`; continue; }
    counts[e] = v.length;
    for (const row of v) {
      if (needles.test(JSON.stringify(row))) hits.push({ entity: e, id: row.id, row });
    }
  }
  console.log("COUNTS:", j(counts));
  console.log("SIGNATURE-HITS:", hits.length === 0 ? "ZERO" : j(hits));
} catch (err) {
  console.log("CHECK-ERROR:", String(err).slice(0, 400));
} finally {
  await browser.close();
}

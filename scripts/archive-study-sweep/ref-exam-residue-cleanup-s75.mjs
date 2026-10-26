import { chromium } from "playwright";
const REF = "https://omni-study1.base44.app";
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
try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);
  const probe = /probe.*s75/i;
  // extended candidate list: v5's list + Exam/Exams/ExamSchedule
  const extra = ["Exam", "Exams", "ExamSchedule"];
  for (const e of extra) {
    const v = await api("GET", `/entities/${e}`);
    if (!Array.isArray(v?.body)) { console.log(`ENTITY ${e}: __${v?.status}`); continue; }
    console.log(`ENTITY ${e}: ${v.body.length} rows`);
    for (const row of v.body) {
      if (probe.test(JSON.stringify(row))) {
        const del = await api("DELETE", `/entities/${e}/${row.id}`);
        console.log(`DELETED ${e}/${row.id}: ${del?.status}`);
      } else {
        console.log(`KEEP ${e}/${row.id}: ${j(row).slice(0, 120)}`);
      }
    }
  }
  // final verify across extra + the v5 list
  let residue = 0;
  for (const e of [...extra, "Task", "Subject", "Assignment", "Event"]) {
    const v = await api("GET", `/entities/${e}`);
    if (!Array.isArray(v?.body)) continue;
    for (const row of v.body) if (probe.test(JSON.stringify(row))) residue++;
  }
  console.log("FINAL-RESIDUE:", residue === 0 ? "ZERO" : residue);
} catch (err) { console.log("ERR:", String(err).slice(0, 300)); }
finally { await browser.close(); }

// Session-72 probe cleanup (MANDATORY follow-up to ref-populated-headers-s72.mjs):
// the first run's apiCreated parse failed (truncated bodies) and the entity
// GETs 403'd without the Bearer token, so the probe subject/grade/task may
// remain. Deletes EXACTLY the probe-signature rows (subject "Probe Subject
// S72" + grades linked to it + task "Probe task S72") via the s65-proven
// Bearer-from-localStorage pattern, then verifies zero residue.
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const APP = "6969efea366cba53524cde3f";
const j = (o) => JSON.stringify(o, null, 1);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);

  const api = (method, path) =>
    page.evaluate(async ({ method, path }) => {
      let token = null;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const v = localStorage.getItem(k);
        if (v && v.startsWith("eyJ")) { token = v; break; }
      }
      const r = await fetch(`/api/apps/6969efea366cba53524cde3f${path}`, {
        method,
        credentials: "include",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      let body = null;
      try { body = await r.json(); } catch {}
      return { status: r.status, body };
    }, { method, path });

  const list = (entity) => api("GET", `/entities/${entity}`);
  const del = (entity, id) => api("DELETE", `/entities/${entity}/${id}`);

  // ---- inventory ----
  const inv = {};
  for (const e of ["Subject", "Grade", "Task", "Calculation", "CalculatorHistory", "MathSolution", "SolverHistory"]) {
    const r = await list(e);
    inv[e] = r.status === 200 && Array.isArray(r.body) ? r.body : { status: r.status };
  }
  console.log("INVENTORY:", j({
    subjects: (inv.Subject || []).map((s) => ({ id: s.id, name: s.name })),
    grades: (inv.Grade || []).map((g) => ({ id: g.id, subject_id: g.subject_id, score: g.score })),
    tasks: (inv.Task || []).map((t) => ({ id: t.id, title: t.title })),
    calc: Array.isArray(inv.Calculation) ? inv.Calculation.length : inv.Calculation,
    calcHist: Array.isArray(inv.CalculatorHistory) ? inv.CalculatorHistory.length : inv.CalculatorHistory,
    mathSol: Array.isArray(inv.MathSolution) ? inv.MathSolution.length : inv.MathSolution,
    solverHist: Array.isArray(inv.SolverHistory) ? inv.SolverHistory.length : inv.SolverHistory,
  }));

  // ---- surgical deletion (probe signature only) ----
  const targets = [];
  const probeSubjects = (inv.Subject || []).filter((s) => /probe.*s72/i.test(s.name || ""));
  for (const s of probeSubjects) targets.push({ entity: "Subject", id: s.id, why: `subject ${s.name}` });
  const probeGrades = (inv.Grade || []).filter((g) => probeSubjects.some((s) => s.id === g.subject_id));
  for (const g of probeGrades) targets.push({ entity: "Grade", id: g.id, why: `grade on probe subject ${g.score}/100` });
  const probeTasks = (inv.Task || []).filter((t) => /probe.*s72/i.test(t.title || ""));
  for (const t of probeTasks) targets.push({ entity: "Task", id: t.id, why: `task ${t.title}` });

  console.log("TARGETS:", j(targets));
  const results = [];
  for (const t of targets) {
    const r = await del(t.entity, t.id);
    results.push({ ...t, status: r.status });
  }
  console.log("DELETE RESULTS:", j(results));

  // ---- verify zero residue ----
  const after = {};
  for (const e of ["Subject", "Grade", "Task"]) {
    const r = await list(e);
    after[e] = r.status === 200 && Array.isArray(r.body) ? r.body : { status: r.status };
  }
  const residue = [
    ...(after.Subject || []).filter((s) => /probe.*s72/i.test(s.name || "")).map((s) => ({ entity: "Subject", id: s.id })),
    ...(after.Grade || []).filter((g) => (after.Subject || []).some?.((s) => s.id === g.subject_id) || /probe/i.test(JSON.stringify(g))).map((g) => ({ entity: "Grade", id: g.id })),
    ...(after.Task || []).filter((t) => /probe.*s72/i.test(t.title || "")).map((t) => ({ entity: "Task", id: t.id })),
  ];
  console.log("RESIDUE:", residue.length === 0 ? "ZERO" : j(residue));
  console.log("CLEANUP-COMPLETE ok:", residue.length === 0);
} catch (err) {
  console.log("ERROR:", String(err).slice(0, 400));
} finally {
  await browser.close();
}

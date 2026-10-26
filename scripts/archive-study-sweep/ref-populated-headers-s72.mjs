// Session-72 probe: the OTHER SectionCard consumers' ref header anatomy,
// measured on a POPULATED reference account (the open follow-up from s70's
// probe #6 — at zero data calculator/mathsolver/analytics/gradetracker
// render no titled cards, so Batch AA shipped borderedHeader as opt-in with
// this measurement explicitly deferred).
//
// Protocol (AP-109 endpoint-learning + AP-111/115 full-path dumps):
//   A. baseline entity inventory (the zero-residue contract)
//   B. populate via the ref's own UI: probe subject + grade (s65-proven
//      flow), a My Day quick-add task, a calculator computation, a solver
//      entry — intercepting every non-GET entity call to learn names/ids
//   C. measure EVERY visible titled card header on the 4 populated views:
//      outer block padding/border/height + inner row height (the probe-#5
//      discriminator: bordered = p-6/border-b, h≈81, row 32; old = p-6
//      pb-4 no border, h≈68)
//   D. cleanup by delta (delete exactly what the probe created) + verify
//      the inventory matches the baseline (zero residue).
// Usage: node scripts/ref-populated-headers-s72.mjs
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const APP = "6969efea366cba53524cde3f";
const OUT = "docs/screenshots";
const j = (o) => JSON.stringify(o);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// every non-GET entity call the UI makes during population (the s65
// api-learn pattern): response gives the created object with its id
const apiLog = [];
page.on("response", async (res) => {
  const req = res.request();
  const url = req.url();
  if (!url.includes(`/api/apps/${APP}/entities/`) || req.method() === "GET") return;
  const m = url.match(/entities\/([^/?]+)(?:\/([^/?]+))?/);
  let body = "";
  try { body = await res.text(); } catch {}
  apiLog.push({ method: req.method(), entity: m?.[1], id: m?.[2], status: res.status(), body: body.slice(0, 200) });
});

const list = (entity) =>
  page.evaluate(async (entity) => {
    const r = await fetch(`/api/apps/6969efea366cba53524cde3f/entities/${entity}`, { credentials: "include" });
    return r.ok ? r.json() : { __status: r.status };
  }, entity);
const del = (entity, id) =>
  page.evaluate(async ({ entity, id }) => {
    const r = await fetch(`/api/apps/6969efea366cba53524cde3f/entities/${entity}/${id}`, {
      method: "DELETE", credentials: "include",
    });
    return r.status;
  }, { entity, id });

// candidate entity names for the delta inventory (Grade/Subject proven s65;
// the rest learned from the interception log if the names differ)
const CANDIDATES = ["Task", "Todo", "Grade", "Subject", "Assignment", "Calculation", "CalculatorHistory", "MathSolution", "SolverHistory", "FocusSession", "Event"];

async function dumpHeaders(viewName) {
  await page.screenshot({ path: `${OUT}/72-ref-populated-${viewName}.png`, fullPage: false });
  return page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const out = [];
    for (const h2 of main.querySelectorAll("h2")) {
      const r = h2.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue; // AP-115 visibility scope
      // the header block = the h2's padded ancestor (the SectionCard header)
      let block = h2.parentElement; // inner row (flex)
      let outer = block?.parentElement; // padded block
      if (!block || !outer) continue;
      const bs = getComputedStyle(block), os = getComputedStyle(outer);
      const orb = outer.getBoundingClientRect(), brb = block.getBoundingClientRect();
      out.push({
        text: h2.textContent.trim().slice(0, 40),
        h2fs: getComputedStyle(h2).fontSize,
        outerPad: `${os.paddingTop}/${os.paddingBottom}`,
        outerBorderB: `${os.borderBottomWidth} ${os.borderBottomStyle} ${os.borderBottomColor}`,
        outerH: Math.round(orb.height),
        rowH: Math.round(brb.height),
        rowJustify: bs.justifyContent,
        cardBorderR: getComputedStyle(outer.closest("section") || outer).borderRadius,
      });
    }
    return out;
  });
}

const created = []; // {entity, id} — everything to delete in cleanup
try {
  // ---- login ----
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);

  // ---- A. baseline inventory ----
  const baseline = {};
  for (const e of CANDIDATES) {
    const v = await list(e);
    baseline[e] = Array.isArray(v) ? v.map((x) => x.id) : `__${v.__status}`;
  }
  console.log("BASELINE:", j(baseline));

  // ---- B1. probe subject (Settings → Subjects, the s65-proven flow) ----
  await page.locator("a").filter({ hasText: "Settings" }).first().click();
  await page.waitForTimeout(1200);
  await page.locator("button").filter({ hasText: "Subjects" }).first().click();
  await page.waitForTimeout(1000);
  await page.locator("main button", { hasText: /add subject/i }).first().click();
  await page.waitForTimeout(800);
  await page.locator("[role=dialog] input").first().fill("Probe Subject S72");
  await page.locator("[role=dialog] button", { hasText: /add subject/i }).first().click();
  await page.waitForTimeout(1500);

  // ---- B2. grade 50/100 on it (GradeTracker → Add Grade) ----
  await page.locator("a").filter({ hasText: "Grade Tracker" }).first().click();
  await page.waitForTimeout(1500);
  await page.locator("main button", { hasText: "Add Grade" }).first().click();
  await page.waitForTimeout(1000);
  const nums = page.locator("[role=dialog] input[type=number]");
  await nums.nth(0).fill("50");
  await nums.nth(1).fill("100");
  const subjTrigger = page.locator("[role=dialog] [role=combobox]").first();
  if ((await subjTrigger.count()) > 0) {
    await subjTrigger.click();
    await page.waitForTimeout(500);
    await page.locator("[role=option]", { hasText: "Probe Subject S72" }).first().click();
    await page.waitForTimeout(400);
  }
  await page.locator("[role=dialog] button", { hasText: /add|save/i }).first().click();
  await page.waitForTimeout(1800);

  // ---- B3. task via My Day quick-add ----
  await page.locator("a").filter({ hasText: "My Day" }).first().click();
  await page.waitForTimeout(1500);
  const qadd = page.locator('main input[placeholder*="task" i]').first();
  await qadd.fill("Probe task S72");
  await qadd.press("Enter");
  await page.waitForTimeout(1800);

  // ---- B4. calculator: evaluate 2+3 ----
  await page.locator("a").filter({ hasText: "Calculator" }).first().click();
  await page.waitForTimeout(1500);
  const calcInput = page.locator("main input").first();
  if ((await calcInput.count()) > 0) {
    await calcInput.fill("2+3");
    await calcInput.press("Enter").catch(() => {});
    await page.waitForTimeout(600);
    const eq = page.locator("main button", { hasText: "=" }).first();
    if ((await eq.count()) > 0) await eq.click().catch(() => {});
    await page.waitForTimeout(1500);
  }

  // ---- B5. math solver: solve 2x+3=7 ----
  await page.locator("a").filter({ hasText: "Math Solver" }).first().click();
  await page.waitForTimeout(1500);
  const solverField = page.locator("main textarea, main input[type=text]").first();
  if ((await solverField.count()) > 0) {
    await solverField.fill("2x+3=7");
    const solveBtn = page.locator("main button", { hasText: /solve/i }).first();
    if ((await solveBtn.count()) > 0) await solveBtn.click();
    await page.waitForTimeout(2500);
  }

  console.log("API LOG:", j(apiLog));

  // ---- C. measure the 4 populated views ----
  const measurements = {};
  for (const v of ["gradetracker", "analytics", "calculator", "mathsolver"]) {
    await page.locator("a").filter({ hasText: /Grade Tracker|Analytics|Calculator|Math Solver/i }).filter({ hasText: new RegExp(v === "gradetracker" ? "Grade Tracker" : v === "analytics" ? "Analytics" : v === "calculator" ? "Calculator" : "Math Solver", "i") }).first().click();
    await page.waitForTimeout(2200);
    measurements[v] = await dumpHeaders(v);
  }
  console.log("MEASUREMENTS:", j(measurements));

  // ---- D. cleanup by delta ----
  // collect ids created during the session from the api log
  const apiCreated = [];
  for (const call of apiLog) {
    if (call.method === "POST" && call.status < 300) {
      try {
        const parsed = JSON.parse(call.body);
        if (parsed?.id) apiCreated.push({ entity: call.entity, id: parsed.id });
      } catch {}
    }
  }
  console.log("API-CREATED:", j(apiCreated));

  // delta scan for anything the log missed
  const after = {};
  for (const e of CANDIDATES) {
    const v = await list(e);
    after[e] = Array.isArray(v) ? v.map((x) => x.id) : `__${v.__status}`;
  }
  const delta = [];
  for (const e of CANDIDATES) {
    if (!Array.isArray(baseline[e])) continue;
    for (const id of after[e] || []) if (!baseline[e].includes(id)) delta.push({ entity: e, id });
  }
  const toDelete = [...apiCreated];
  for (const d of delta) if (!toDelete.some((t) => t.id === d.id)) toDelete.push(d);

  const deletions = [];
  for (const { entity, id } of toDelete) {
    const st = await del(entity, id);
    deletions.push({ entity, id, status: st });
  }
  console.log("DELETIONS:", j(deletions));

  // ---- verify zero residue ----
  const final = {};
  for (const e of CANDIDATES) {
    const v = await list(e);
    final[e] = Array.isArray(v) ? v.map((x) => x.id) : `__${v.__status}`;
  }
  const residue = [];
  for (const e of CANDIDATES) {
    if (!Array.isArray(baseline[e])) continue;
    for (const id of final[e] || []) if (!baseline[e].includes(id)) residue.push({ entity: e, id });
  }
  console.log("RESIDUE:", residue.length === 0 ? "ZERO" : j(residue));
  console.log("PROBE-COMPLETE ok:", residue.length === 0);
} catch (err) {
  console.log("ERROR:", String(err).slice(0, 400));
  // best-effort cleanup on failure: delete whatever the log captured
  try {
    for (const call of apiLog) {
      if (call.method === "POST" && call.status < 300) {
        const parsed = JSON.parse(call.body);
        if (parsed?.id) console.log("EMERGENCY-DELETE", call.entity, parsed.id, await del(call.entity, parsed.id));
      }
    }
  } catch (e2) { console.log("EMERGENCY-CLEANUP-FAILED:", String(e2).slice(0, 200)); }
} finally {
  await browser.close();
}

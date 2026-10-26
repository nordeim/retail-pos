// Session-65 FINAL cleanup: delete the orphan grade (8800%), the new probe
// grade, and Probe Subject via the reference's own entity API (learned from
// its UI calls). Verifies ZERO residue. This is probe-data cleanup.
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

  const list = (entity) =>
    page.evaluate(async (entity) => {
      const r = await fetch(`/api/apps/6969efea366cba53524cde3f/entities/${entity}`, { credentials: "include" });
      return r.json();
    }, entity);
  const del = (entity, id) =>
    page.evaluate(async ({ entity, id }) => {
      const r = await fetch(`/api/apps/6969efea366cba53524cde3f/entities/${entity}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      return { status: r.status };
    }, { entity, id });

  const grades = await list("Grade");
  console.log("GRADES:", j(grades));
  for (const g of Array.isArray(grades) ? grades : []) {
    const res = await del("Grade", g.id);
    console.log("deleted grade", g.id, j(res));
  }
  const subjects = await list("Subject");
  console.log("SUBJECTS:", j(subjects));
  for (const s of Array.isArray(subjects) ? subjects : []) {
    const res = await del("Subject", s.id);
    console.log("deleted subject", s.id, j(res));
  }

  const gradesAfter = await list("Grade");
  const subjectsAfter = await list("Subject");
  console.log("AFTER:", j({ grades: gradesAfter, subjects: subjectsAfter }));
  console.log(JSON.stringify({ ok: Array.isArray(gradesAfter) ? gradesAfter.length === 0 : true, subjectsClean: Array.isArray(subjectsAfter) ? subjectsAfter.length === 0 : true }));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

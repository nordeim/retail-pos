// Session-9 paired probe: drives BOTH the live reference (omni-study1.base44.app)
// and the local clone (dev server :3000) side by side, visits all 20 views,
// and dumps a per-view DOM/style fingerprint for gap analysis.
// Usage: node scripts/paired-probe-s9.mjs [--views Dashboard,Tasks]
import { chromium } from "@playwright/test";
import fs from "node:fs";

const REF = "https://omni-study1.base44.app";
const CLONE = "http://localhost:3000";
const OUT = "/home/z/my-project/omni-study/research/s9-probe";
const VIEWS = [
  "Dashboard", "MyDay", "Tasks", "Calendar", "Events", "Timetable",
  "Assignments", "Exams", "Notes", "Flashcards", "PracticeTests",
  "StudyGroups", "GradeTracker", "Analytics", "Files", "Calculator",
  "MathSolver", "AIAssistant", "FocusTimer", "Settings",
];
const only = process.argv.includes("--views")
  ? process.argv[process.argv.indexOf("--views") + 1].split(",")
  : VIEWS;

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function makeSession(base, email, password) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes("login"), { timeout: 30_000 });
  await page.waitForTimeout(1500);
  return { ctx, page };
}

console.log("logging into reference…");
const ref = await makeSession(REF, "sepnetflix2023@outlook.com", "$Abcd1234");
console.log("logging into clone…");
const clone = await makeSession(CLONE, "demo@studyflow.app", "Demo1234!");

// per-view fingerprint: headings, buttons, cards, inputs, icon names
async function fingerprint(page) {
  return page.evaluate(() => {
    const $ = (sel) => Array.from(document.querySelectorAll(sel));
    const iconNames = (root) =>
      Array.from((root || document).querySelectorAll("svg"))
        .map((s) => s.getAttribute("class") || "")
        .map((c) => (c.match(/lucide-([a-z0-9-]+)/) || [])[1])
        .filter(Boolean);
    const main = document.querySelector("main") || document.body;
    const styleOf = (el, props) => {
      const s = getComputedStyle(el);
      return Object.fromEntries(props.map((p) => [p, s.getPropertyValue(p)]));
    };
    return {
      url: location.pathname,
      h1: $("h1").map((h) => h.textContent.trim().slice(0, 60)),
      h2: $("h2").map((h) => h.textContent.trim().slice(0, 50)),
      buttons: $("button").length,
      inputs: $("input,textarea,select").length,
      links: $("a").length,
      mainIcons: iconNames(main).slice(0, 60),
      firstCard: (() => {
        const c = main.querySelector('[class*="rounded-2xl"], [class*="rounded-xl"]');
        return c
          ? { cls: c.className.slice(0, 100), ...styleOf(c, ["background-color", "border-color", "border-radius", "box-shadow"]) }
          : null;
      })(),
      emptyBlocks: main.querySelectorAll('[class*="rounded-2xl"][class*="bg-gradient"], [style*="gradient"]').length,
    };
  });
}

const report = {};
for (const view of only) {
  const path = "/" + view;
  console.log("probing", view, "…");
  for (const [name, sess] of [["ref", ref], ["clone", clone]]) {
    try {
      await sess.page.goto((name === "ref" ? REF : CLONE) + path, { waitUntil: "networkidle", timeout: 30_000 });
      await sess.page.waitForTimeout(1200);
      report[view] = report[view] || {};
      report[view][name] = await fingerprint(sess.page);
      await sess.page.screenshot({ path: `${OUT}/${view}-${name}.png`, fullPage: false });
    } catch (e) {
      report[view] = report[view] || {};
      report[view][name] = { error: String(e).slice(0, 200) };
    }
  }
}

fs.writeFileSync(`${OUT}/fingerprint.json`, JSON.stringify(report, null, 2));
console.log("saved", `${OUT}/fingerprint.json`);

await ref.ctx.close();
await clone.ctx.close();
await browser.close();

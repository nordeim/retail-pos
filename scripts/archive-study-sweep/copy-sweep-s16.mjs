// S16 copy sweep — the last full copy pass over the twenty views was
// session-9; views have shipped six remediation iterations since. This
// probe sweeps all 20 view paths on BOTH apps (logged in), extracts the
// chrome copy that defines each view's identity (h1, ViewHeader subtitle,
// the primary action labels), and diffs them. JSON to stdout.
import { chromium } from "playwright";

const BASE = process.env.CWV_BASE ?? "http://localhost:3200";
const REF = "https://omni-study1.base44.app";

const PATHS = [
  "/Dashboard", "/MyDay", "/Tasks", "/Calendar", "/Events",
  "/Timetable", "/Assignments", "/Exams", "/Notes", "/Flashcards",
  "/PracticeTests", "/StudyGroups", "/GradeTracker", "/Analytics",
  "/Files", "/Calculator", "/MathSolver", "/AIAssistant", "/FocusTimer",
  "/Settings",
];

async function login(page, which) {
  const url = which === "clone" ? `${BASE}/login` : `${REF}/login`;
  await page.goto(url, { waitUntil: "load" });
  await page.fill("input[type=email]", which === "clone" ? "demo@studyflow.app" : "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", which === "clone" ? "Demo1234!" : "$Abcd1234");
  await page.click("button[type=submit]");
  // Deterministic post-login gate: the reference's LOGIN page itself renders
  // a <main>, so waiting on main resolves pre-auth — wait for the greeting
  // h1 instead (the post-rebrand login flow is also slower).
  await page.waitForFunction(
    () => /good (morning|afternoon|evening)/i.test(document.querySelector("main h1")?.textContent ?? ""),
    null,
    { timeout: 30000 },
  );
}

async function sweep(browser, which) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await login(page, which);
  const out = {};
  for (const path of PATHS) {
    try {
      const url = which === "clone" ? `${BASE}${path}` : `${REF}${path}`;
      await page.goto(url, { waitUntil: "load", timeout: 45000 });
      await page.waitForFunction(
        () => !!document.querySelector("main h1") || !!document.querySelector("main h2"),
        null,
        { timeout: 20000 }
      );
      await page.waitForTimeout(700); // data fetch settle
      out[path] = await page.evaluate(() => {
        const main = document.querySelector("main");
        const h1 = main?.querySelector("h1");
        // The subtitle follows the h1 block in the header (16px slate-500).
        let subtitle = null;
        if (h1) {
          let n = h1.parentElement;
          for (let i = 0; i < 3 && n && n !== main; i++) {
            const p = [...n.children].find(
              (c) => c !== h1 && c.tagName === "P" && c.textContent && c.textContent.trim().length < 90
            );
            if (p) { subtitle = p.textContent.trim(); break; }
            n = n.parentElement;
          }
        }
        const buttons = [...(main?.querySelectorAll("button") ?? [])]
          .map((b) => b.textContent?.trim() ?? "")
          .filter((t) => t && t.length > 1 && t.length < 40 && !/^(Cancel|Save|Close|×)$/i.test(t));
        return {
          h1: h1?.textContent?.trim() ?? null,
          subtitle,
          buttons: [...new Set(buttons)].slice(0, 8),
        };
      });
    } catch (e) {
      out[path] = { error: String(e).slice(0, 120) };
    }
  }
  await context.close();
  return out;
}

async function main() {
  const browser = await chromium.launch();
  const clone = await sweep(browser, "clone");
  let ref = {};
  try {
    ref = await sweep(browser, "ref");
  } catch (e) {
    ref = { error: String(e).slice(0, 160) };
  }
  await browser.close();

  const diffs = {};
  for (const path of PATHS) {
    const c = clone[path];
    const r = ref[path];
    if (!c || !r || c.error || r.error) {
      diffs[path] = { issue: "sweep error", clone: c?.error ?? c?.h1, ref: r?.error ?? r?.h1 };
      continue;
    }
    const d = {};
    if (c.h1 !== r.h1) d.h1 = { clone: c.h1, ref: r.h1 };
    if ((c.subtitle ?? null) !== (r.subtitle ?? null)) d.subtitle = { clone: c.subtitle, ref: r.subtitle };
    const refOnly = r.buttons.filter((b) => !c.buttons.includes(b));
    if (refOnly.length) d.refOnlyButtons = refOnly;
    diffs[path] = Object.keys(d).length ? d : "MATCH";
  }

  console.log(
    JSON.stringify(
      {
        clone,
        ref,
        diffs,
        matchCount: Object.values(diffs).filter((v) => v === "MATCH").length,
      },
      null,
      1
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

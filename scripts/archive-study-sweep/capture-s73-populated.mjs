// Session-73 populated-clone captures (Batch AB evidence).
// Captures the three Batch AB surfaces on the clone's SEEDED demo account:
//   - GradeTracker: the measured per-subject cards (4 seeded subjects)
//   - Math Solver: the measured subtitle + the free-standing "Recent Problems" h2
//   - Calculator: the header History toggle + the slide-in "Calculation
//     History" panel with the spaced-expression entry (2 + 3 / = 5)
// The ref-side populated evidence is the s72 probe set (72-ref-populated-*.png).
// Usage: node scripts/capture-s73-populated.mjs   (clone :3200 standalone + seeded custom.db first)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const CLONE = "http://localhost:3200";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // sign in as the seeded demo user
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);

  // GradeTracker — the seeded 4-subject card grid
  await page.goto(`${CLONE}/GradeTracker`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/73-clone-gradetracker-populated.png`, fullPage: false });

  // Math Solver — the measured subtitle + free-standing Recent Problems h2
  await page.goto(`${CLONE}/MathSolver`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/73-clone-mathsolver.png`, fullPage: false });

  // Calculator — evaluate 2+3, open the Calculation History panel
  await page.goto(`${CLONE}/Calculator`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: "Insert 2" }).click();
  await page.getByRole("button", { name: "Insert +" }).click();
  await page.getByRole("button", { name: "Insert 3" }).click();
  await page.getByRole("button", { name: "Equals" }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/73-clone-calculator.png`, fullPage: false });
  await page.getByRole("button", { name: "History" }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/73-clone-calculator-history-open.png`, fullPage: false });

  console.log(JSON.stringify({ ok: true, captured: 4 }));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

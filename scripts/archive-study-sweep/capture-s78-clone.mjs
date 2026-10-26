// Session-78 evidence captures — the remediated surfaces on the dev server
// (:3000): the mobile two-pane Notes/Flashcards (AE6 — the list panes now
// render at 390), the five overflow-fixed views at 390 (AE9-13), and the
// hardened Batch AD surfaces (the Notes editor + the study mode).
// Usage: node scripts/capture-s78-clone.mjs  (dev server on :3000 first)
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
const DEMO = { email: "demo@studyflow.app", password: "Demo1234!" };

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { timeout: 45000 });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', DEMO.email);
  await page.fill('input[type="password"]', DEMO.password);
  await page.click("button[type=submit]");
  await page.waitForURL(/\/Dashboard/, { timeout: 20000 });
  await page.waitForTimeout(1500);

  // The mobile two-pane surfaces (AE6).
  await page.goto(`${BASE}/Notes`, { timeout: 45000 });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/78-clone-mobile-notes.png`, fullPage: false });
  // Select a note from the now-visible list.
  await page.getByRole("button", { name: /Kinetics summary/ }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/78-clone-mobile-notes-selected.png`, fullPage: false });

  await page.goto(`${BASE}/Flashcards`, { timeout: 45000 });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/78-clone-mobile-flashcards.png`, fullPage: false });

  // The five overflow-fixed views (AE9-13).
  for (const v of ["Timetable", "Exams", "Files", "Calculator", "StudyGroups"]) {
    await page.goto(`${BASE}/${v}`, { timeout: 45000 });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `${OUT}/78-clone-mobile-${v.toLowerCase()}.png`, fullPage: false });
  }
  await ctx.close();

  // The hardened Batch AD surfaces at desktop.
  const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dpage = await dctx.newPage();
  await dpage.goto(`${BASE}/login`, { timeout: 45000 });
  await dpage.waitForTimeout(2000);
  await dpage.fill('input[type="email"]', DEMO.email);
  await dpage.fill('input[type="password"]', DEMO.password);
  await dpage.click("button[type=submit]");
  await dpage.waitForURL(/\/Dashboard/, { timeout: 20000 });
  await dpage.waitForTimeout(1500);

  await dpage.goto(`${BASE}/Notes`, { timeout: 45000 });
  await dpage.waitForTimeout(2000);
  await dpage.getByRole("button", { name: /Integration techniques/ }).first().click();
  await dpage.waitForTimeout(2500);
  await dpage.screenshot({ path: `${OUT}/78-clone-notes-editor.png`, fullPage: false });

  await dpage.goto(`${BASE}/Flashcards`, { timeout: 45000 });
  await dpage.waitForTimeout(2000);
  await dpage.locator('[aria-label="Deck rows"] > *', { hasText: "Integration rules" }).first().click();
  await dpage.locator('[aria-label="Deck detail"]').getByRole("button", { name: "Study" }).click();
  await dpage.waitForTimeout(1200);
  await dpage.locator("[data-flip-card]").click();
  await dpage.waitForTimeout(900);
  await dpage.screenshot({ path: `${OUT}/78-clone-flashcards-study.png`, fullPage: false });
  await dctx.close();
  console.log("done — S78 evidence captures complete");
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

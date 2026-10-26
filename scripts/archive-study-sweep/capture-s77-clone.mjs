// Session-77 evidence capture: the remediated clone surfaces on the DEV
// server (:3000, the seeded demo account) — the Batch AD anatomy before
// the commit. Desktop: Notes (the Quill editor + toolbar + title/Font/tag
// rows + the reworked list rows), Flashcards (the in-page study mode with
// the rating pair). Mobile 390×844: the Notes editor + the study mode.
// Usage: node scripts/capture-s77-clone.mjs  (dev server on :3000 first)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const CLONE = "http://localhost:3000";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const visit = async (navText) => {
  await page.locator("a").filter({ hasText: navText }).first().click({ timeout: 15000 });
  await page.waitForTimeout(1800);
};

try {
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);

  // ---- Notes: the populated editor (Quill + chrome rows) ----
  await visit("Notes");
  await page.getByRole("button", { name: /Dot product intuition/ }).first().click();
  await page.waitForTimeout(2200); // the dynamic Quill import + mount
  await page.screenshot({ path: `${OUT}/77-clone-notes-editor.png` });
  // the tagged note (Integration techniques carries 2 tags)
  await page.getByRole("button", { name: /Integration techniques/ }).first().click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/77-clone-notes-tagged.png` });

  // ---- Flashcards: the in-page study mode + the rating pair ----
  await visit("Flashcards");
  await page.locator('[aria-label="Deck rows"] > *', { hasText: "Integration rules" }).first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/77-clone-flashcards-deck.png` });
  await page.locator('[aria-label="Deck detail"]').getByRole("button", { name: "Study" }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/77-clone-flashcards-study.png` });
  await page.locator("[data-flip-card]").click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/77-clone-flashcards-rating.png` });

  // ---- Mobile 390×844: the editor + the study mode ----
  // (direct gotos — the sidebar links are drawer-hidden at 390px)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${CLONE}/Notes`, { timeout: 30000 });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/77-clone-mobile-notes.png` });
  await page.goto(`${CLONE}/Flashcards`, { timeout: 30000 });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/77-clone-mobile-flashcards.png` });

  console.log("CAPTURED: 77-clone-{notes-editor,notes-tagged,flashcards-deck,flashcards-study,flashcards-rating,mobile-notes,mobile-flashcards}.png");
} catch (e) {
  console.log("FATAL:", String(e).slice(0, 300));
} finally {
  await browser.close();
}

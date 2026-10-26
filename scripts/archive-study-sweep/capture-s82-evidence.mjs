// S82 · the AI surface evidence captures — the sixteenth-delegate family
// (the flashcards study mode where the Correct rating now preserves a hard
// card's difficulty, the deck + card grid), the files view (the metadata
// create-response contract), and the calculator footer (the col-span-2
// Equals whose fill is now pinned against the Backspace sibling).
// Targets the :3200 standalone (avoids disturbing anything on :3000).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3200";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

await page.goto(`${BASE}/login`);
await page.fill("input[type=email]", "demo@studyflow.app");
await page.fill("input[type=password]", "Demo1234!");
await page.click("button[type=submit]");
await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

// ---- AI1: the flashcards study mode (light) ------------------------------------
// A dedicated hard card + deck, then the study flow the AI1c pin walks:
// select the deck, Study, flip, the Wrong/Correct rating pair.
const stamp = `s82-ai-${Date.now()}`;
const deckRes = await page.request.post(`${BASE}/api/flashcards/decks`, {
  data: { name: `S82 evidence deck ${stamp}` },
});
const deck = await deckRes.json();
await page.request.post(`${BASE}/api/flashcards/cards`, {
  data: { deckId: deck.id, front: "What does the sent-keys filter protect?", back: "Partial PATCHes keep only sent keys.", difficulty: "hard" },
});

await page.goto(`${BASE}/Flashcards`);
await page.waitForFunction(() => !!document.querySelector('[aria-label="Deck rows"]'), null, { timeout: 15000 });
await page.locator('[aria-label="Deck rows"] > *', { hasText: "S82 evidence deck" }).first().click();
await page.waitForFunction(() => !!document.querySelector('[aria-label="Card grid"]'), null, { timeout: 15000 });
await page.screenshot({ path: `${OUT}/82-clone-ai1-card-grid.png` });

await page.locator('[aria-label="Deck detail"]').getByRole("button", { name: "Study" }).click();
const study = page.locator('[aria-label="Study mode"]');
await study.waitFor({ timeout: 15000 });
await study.locator("[data-flip-card]").click();
await page.waitForTimeout(600); // the 500ms flip transition
await page.screenshot({ path: `${OUT}/82-clone-ai1-study-rating-pair.png` });

// Cleanup: delete the evidence deck (cascades the card).
await page.request.delete(`${BASE}/api/flashcards/decks/${deck.id}`);

// ---- AI2: the notes surface (the unconditional settlement's home) --------------
await page.goto(`${BASE}/Notes`);
await page.waitForFunction(() => !!document.querySelector('[aria-label="Notes list"]') || !!document.querySelector("main h1"), null, { timeout: 15000 });
await page.screenshot({ path: `${OUT}/82-clone-ai2-notes-surface.png` });

// ---- AI6: the files view (the metadata create-response contract) ---------------
await page.goto(`${BASE}/Files`);
await page.waitForFunction(() => !!document.querySelector("main h1"), null, { timeout: 15000 });
await page.screenshot({ path: `${OUT}/82-clone-ai6-files-surface.png` });

// ---- AI4: the calculator footer (the col-span-2 gradient Equals) ---------------
await page.goto(`${BASE}/Calculator`);
await page.waitForFunction(() => !!document.querySelector('[aria-label="Backspace"]'), null, { timeout: 15000 });
await page.screenshot({ path: `${OUT}/82-clone-ai4-calculator-footer.png` });

await browser.close();
console.log("S82 evidence captures done.");

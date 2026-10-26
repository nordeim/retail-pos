// S89 · Batch AP surface evidence captures — the partial-empty zombie kill
// (AP1, the s88 audit's L1 — AO4's coverage gap).
//
// AP1 frames (the partial-empty surface, post-fix): the same
// external-deletion window as the s88 capture, but a 2-OF-3 deletion —
// the surviving set is NON-EMPTY while the advanced study index runs past
// it (deckCards[studyIndex] === undefined with 0 < length). Frame 1: the
// partial-empty two-pane (the surviving card renders in the grid — the
// zombie precondition WITHOUT the deck going empty; pre-fix `studying`
// stays latched behind this render). Frame 2: the UI Add Card refill —
// the CARD GRID returns with the new card and study mode NOT resurrected
// (pre-fix the latched `studying` + the refilled index auto-resurrected
// study mode the user never re-entered). The behavioral RED/GREEN proof
// lives in the e2e pin (tests/e2e/parity-session7.spec.ts S89/AP1);
// these frames document the remediated surface.
//
// The AM2 convention: every frame is separated by a REAL interaction (the
// 2-of-3 external deletion, the refill save) — never a re-shoot; both
// frames must be md5-DISTINCT (printed at the end).
//
// Usage: DATABASE_URL="file:../db/custom.db" node scripts/capture-s89-evidence.mjs
//        (clone :3200 standalone first — the S86 daemon recipe)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3200";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });
const PREFERENCES = "/api/settings/preferences";

const prisma = new PrismaClient();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

let deckId = null;
let routeArmed = false;
try {
  const demo = await prisma.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (!demo) throw new Error("demo user missing — run bun run db:seed");
  const stamp = `s89-ap-${Date.now()}`;

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
  await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

  // ================= AP1 · the partial-empty zombie's dead surface ========
  // The stamped deck + THREE cards (the partial-deletion precondition; the
  // deck delete in the finally cascades the cards — the AN1/AO2 convention).
  const deckRes = await page.request.post(`${BASE}/api/flashcards/decks`, {
    data: { name: `${stamp}-partial-crew` },
  });
  if (!deckRes.ok()) throw new Error(`deck create failed ${deckRes.status()}`);
  const deck = await deckRes.json();
  deckId = deck.id;
  const cardIds = [];
  for (let i = 0; i < 3; i++) {
    const cardRes = await page.request.post(`${BASE}/api/flashcards/cards`, {
      data: { deckId: deck.id, front: `AP1 capture front ${i}`, back: `AP1 capture back ${i}`, difficulty: "medium" },
    });
    if (!cardRes.ok()) throw new Error(`card ${i} create failed ${cardRes.status()}`);
    cardIds.push((await cardRes.json()).id);
  }

  await page.goto(`${BASE}/Flashcards`);
  await page.waitForTimeout(1500);
  await page.locator('[aria-label="Deck rows"] > *', { hasText: `${stamp}-partial-crew` }).first().click();
  await page.locator('[aria-label="Deck detail"]').getByRole("button", { name: "Study" }).click();
  const study = page.locator('[aria-label="Study mode"]');
  await study.waitFor({ state: "visible", timeout: 10000 });

  // The deterministic PARTIAL-deletion window (the pin's own recipe): the
  // armed GET between rate's PATCH and its refresh deletes TWO of the three
  // cards, so the collection returns the ONE survivor while studyIndex has
  // advanced to 1 — past the surviving set (the partial-empty state, the
  // zombie precondition that AO4's length === 0 condition never covered).
  routeArmed = true;
  await page.route("**/api/flashcards/cards*", async (route) => {
    if (routeArmed && route.request().method() === "GET") {
      routeArmed = false;
      await page.request.delete(`${BASE}/api/flashcards/cards/${cardIds[1]}`);
      await page.request.delete(`${BASE}/api/flashcards/cards/${cardIds[2]}`);
    }
    await route.continue();
  });
  await study.locator("[data-flip-card]").click();
  await study.getByRole("button", { name: "Correct" }).click();
  const grid = page.locator('[aria-label="Card grid"]');
  await grid.waitFor({ state: "visible", timeout: 10000 });
  await grid.getByText("AP1 capture front 0").waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/89-clone-ap-flashcards-partial-emptied.png` });

  // The refill: a UI Add Card while the view stays mounted — post-fix the
  // card grid returns with the new card and study mode stays dead (the
  // partial-empty zombie kill; pre-fix the refilled index resurrected it).
  await page.locator('[aria-label="Deck detail"]').getByRole("button", { name: "Add Card" }).first().click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Front (question)").fill("AP1 capture refill front");
  await dlg.getByLabel("Back (answer)").fill("AP1 capture refill back");
  await dlg.getByRole("button", { name: "Add card" }).click();
  await grid.waitFor({ state: "visible", timeout: 10000 });
  await grid.getByText("AP1 capture refill front").waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/89-clone-ap-flashcards-refilled.png` });
  await page.unroute("**/api/flashcards/cards*").catch(() => {});

  // ---- The distinct-frame verification (the AM2 closure: print the md5s) --
  const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex").slice(0, 8);
  const frames = [
    `${OUT}/89-clone-ap-flashcards-partial-emptied.png`,
    `${OUT}/89-clone-ap-flashcards-refilled.png`,
  ].map(md5);
  const distinct = new Set(frames).size === frames.length;
  console.log(`S89 AP frames: ${frames.join(" ")} — ${distinct ? "all DISTINCT" : "DUPLICATE PRESENT"}`);
} finally {
  // The AL5/S42 + AN1 cleanup convention: the probe deck cascades its
  // cards; the shared demo surface is restored (accent violet, mode light)
  // on EVERY path (the S4 restore lesson).
  if (deckId) {
    await page.request.delete(`${BASE}/api/flashcards/decks/${deckId}`).catch(() => {});
  }
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet", themeMode: "light" } }).catch(() => {});
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  await prisma.$disconnect().catch(() => {});
}
console.log("S89 AP surface captures complete");

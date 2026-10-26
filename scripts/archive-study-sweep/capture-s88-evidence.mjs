// S88 · Batch AO surface evidence captures — the study-zombie kill (AO4)
// and the dedicated clock-date token (AO5).
//
// AO4 frames (the zombie's dead surface, post-fix): the exact
// external-deletion window the s80 auditor described is driven LIVE —
// mid-study, rate's own refresh (PATCH ok -> GET) carries a card deletion
// between its two legs via a route interception; the guard falls through to
// the empty two-pane state (frame 1), then a UI Add Card refills the deck
// and the CARD GRID returns with study mode NOT resurrected (frame 2 —
// pre-fix the latched `studying` auto-resurrected study mode here and the
// grid never came back). The behavioral RED/GREEN proof lives in the e2e
// pin (tests/e2e/parity-session7.spec.ts S88/AO4); these frames document
// the remediated surface.
//
// AO5 frames (the clock chip under two accents): the sidebar clock-date
// chip in DARK mode under violet then teal — the dedicated
// --sf-primary-clock-date-dark token retunes with the accent (the AF5
// family's computed-color pins carry the behavioral proof).
//
// The AM2 convention: every frame is separated by a REAL interaction (the
// external deletion, the refill save, the accent PATCH) — never a re-shoot;
// all four frames must be md5-DISTINCT (printed at the end).
//
// Usage: DATABASE_URL="file:../db/custom.db" node scripts/capture-s88-evidence.mjs
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
  const stamp = `s88-ao-${Date.now()}`;

  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
  await page.waitForFunction(() => !!document.querySelector(".sf-clock-date"), null, { timeout: 15000 });

  // ================= AO4 · the zombie's dead surface =================
  // The stamped deck + its single card (the API seam; the deck delete in
  // the finally cascades the card — the AN1/AO2 convention).
  const deckRes = await page.request.post(`${BASE}/api/flashcards/decks`, {
    data: { name: `${stamp}-zombie-crew` },
  });
  if (!deckRes.ok()) throw new Error(`deck create failed ${deckRes.status()}`);
  const deck = await deckRes.json();
  deckId = deck.id;
  const cardRes = await page.request.post(`${BASE}/api/flashcards/cards`, {
    data: { deckId: deck.id, front: "AO4 capture front", back: "AO4 capture back", difficulty: "medium" },
  });
  if (!cardRes.ok()) throw new Error(`card create failed ${cardRes.status()}`);
  const card = await cardRes.json();

  // Dark mode for the whole capture (the AO5 frames need it; the AO4
  // frames are mode-independent).
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { themeMode: "dark" } });

  await page.goto(`${BASE}/Flashcards`);
  await page.waitForTimeout(1500);
  await page.locator('[aria-label="Deck rows"] > *', { hasText: `${stamp}-zombie-crew` }).first().click();
  await page.locator('[aria-label="Deck detail"]').getByRole("button", { name: "Study" }).click();
  const study = page.locator('[aria-label="Study mode"]');
  await study.waitFor({ state: "visible", timeout: 10000 });

  // The deterministic external-deletion window (the pin's own recipe): the
  // armed GET between rate's PATCH and its refresh deletes the card, so
  // the collection returns [] while the view stays mounted and studying.
  routeArmed = true;
  await page.route("**/api/flashcards/cards*", async (route) => {
    if (routeArmed && route.request().method() === "GET") {
      routeArmed = false;
      await page.request.delete(`${BASE}/api/flashcards/cards/${card.id}`);
    }
    await route.continue();
  });
  await study.locator("[data-flip-card]").click();
  await study.getByRole("button", { name: "Correct" }).click();
  await page.getByText("No cards in this deck").waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/88-clone-ao-flashcards-emptied.png` });

  // The refill: a UI Add Card while the view stays mounted — post-fix the
  // card grid returns and study mode stays dead (the zombie kill).
  await page.locator('[aria-label="Deck detail"]').getByRole("button", { name: "Add Card" }).first().click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Front (question)").fill("AO4 capture refill front");
  await dlg.getByLabel("Back (answer)").fill("AO4 capture refill back");
  await dlg.getByRole("button", { name: "Add card" }).click();
  const grid = page.locator('[aria-label="Card grid"]');
  await grid.waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/88-clone-ao-flashcards-refilled.png` });
  await page.unroute("**/api/flashcards/cards*").catch(() => {});

  // ================= AO5 · the clock chip under two accents =================
  // Violet (the default) first — the sidebar clock-date chip in dark.
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "violet" } });
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForTimeout(2500);
  await page.locator(".sf-clock-date").waitFor({ state: "visible", timeout: 10000 });
  await page.screenshot({ path: `${OUT}/88-clone-ao-clockchip-violet-dark.png` });

  // The REAL interaction separating the frames: the accent PATCH to teal —
  // the dedicated token retunes with it (computed color proof in the AF5
  // pin family; this frame documents the surface).
  await page.request.patch(`${BASE}${PREFERENCES}`, { data: { accentColor: "teal" } });
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForTimeout(2500);
  await page.waitForFunction(
    () => document.documentElement.style.getPropertyValue("--sf-primary-clock-date-dark") !== "",
    null,
    { timeout: 10000 },
  );
  await page.screenshot({ path: `${OUT}/88-clone-ao-clockchip-teal-dark.png` });

  // ---- The distinct-frame verification (the AM2 closure: print the md5s) --
  const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex").slice(0, 8);
  const frames = [
    `${OUT}/88-clone-ao-flashcards-emptied.png`,
    `${OUT}/88-clone-ao-flashcards-refilled.png`,
    `${OUT}/88-clone-ao-clockchip-violet-dark.png`,
    `${OUT}/88-clone-ao-clockchip-teal-dark.png`,
  ].map(md5);
  const distinct = new Set(frames).size === frames.length;
  console.log(`S88 AO frames: ${frames.join(" ")} — ${distinct ? "all DISTINCT" : "DUPLICATE PRESENT"}`);
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
console.log("S88 AO surface captures complete");

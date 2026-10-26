// S79 evidence captures (Batch AF): the mobile study flow at 390 (the
// in-row entry + the full-width study pane + the exit restore), the
// desktop full-replacement study layout, the Tasks aside (no "Lists"
// heading, the 768 h1), and the dark clock chip (the AF5 readability
// fix). Saves under docs/screenshots/79-*.
// Usage: node scripts/capture-s79-clone.mjs   (dev server on :3000)
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";

const browser = await chromium.launch();

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForFunction(
    () => /good (morning|afternoon|evening)/i.test(document.querySelector("main h1")?.textContent ?? ""),
    null,
    { timeout: 30000 },
  );
}

try {
  // --- 1. The mobile study flow at 390×844 --------------------------------
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const m = await mctx.newPage();
  await login(m);

  await m.goto(`${BASE}/Flashcards`);
  await m.waitForFunction(() => document.documentElement.style.getPropertyValue("--sf-primary") !== "");
  await m.waitForTimeout(1500);
  await m.screenshot({ path: `${OUT}/79-clone-mobile-flashcards-decklist.png` });

  // The in-row Study affordance entry → the full-width study pane.
  await m.getByRole("button", { name: "Study Integration rules", exact: true }).tap();
  await m.locator('[aria-label="Study mode"]').waitFor({ state: "visible", timeout: 10000 });
  await m.waitForTimeout(600);
  await m.screenshot({ path: `${OUT}/79-clone-mobile-flashcards-study.png` });

  // The flipped state + the rating pair.
  await m.locator("[data-flip-card]").tap();
  await m.waitForTimeout(700);
  await m.screenshot({ path: `${OUT}/79-clone-mobile-flashcards-study-rating.png` });

  // Exit restores the two-pane layout.
  await m.getByRole("button", { name: "Exit Study" }).tap();
  await m.waitForTimeout(700);
  await m.screenshot({ path: `${OUT}/79-clone-mobile-flashcards-exit.png` });
  await mctx.close();

  // --- 2. The desktop full-replacement study layout (1280×800) ------------
  const dctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const d = await dctx.newPage();
  await login(d);

  await d.goto(`${BASE}/Flashcards`);
  await d.waitForFunction(() => document.documentElement.style.getPropertyValue("--sf-primary") !== "");
  await d.waitForTimeout(1500);
  await d.screenshot({ path: `${OUT}/79-clone-desktop-flashcards-deckdetail.png` });

  await d.locator('[aria-label="Deck rows"] > *', { hasText: "Integration rules" }).first().click();
  await d.locator('[aria-label="Deck detail"]').getByRole("button", { name: "Study" }).click();
  await d.locator('[aria-label="Study mode"]').waitFor({ state: "visible", timeout: 10000 });
  await d.waitForTimeout(600);
  await d.screenshot({ path: `${OUT}/79-clone-desktop-flashcards-study.png` });
  await dctx.close();

  // --- 3. The Tasks aside at 768 (no "Lists" heading; the h1 visible) ------
  const tctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const t = await tctx.newPage();
  await login(t);
  await t.goto(`${BASE}/Tasks`);
  await t.waitForTimeout(1800);
  await t.screenshot({ path: `${OUT}/79-clone-tasks-768-aside.png` });
  await tctx.close();

  // --- 4. The dark clock chip (the AF5 readability fix) --------------------
  const kctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const k = await kctx.newPage();
  await login(k);
  await k.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "dark" } });
  await k.goto(`${BASE}/Dashboard`);
  await k.waitForFunction(() => document.documentElement.classList.contains("dark"), null, { timeout: 30000 });
  await k.waitForTimeout(1200);
  // Frame the sidebar's clock chip.
  const chip = k.locator(".sf-clock-chip");
  await chip.screenshot({ path: `${OUT}/79-clone-dark-clock-chip.png` });
  await k.screenshot({ path: `${OUT}/79-clone-dark-dashboard.png` });
  await k.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });
  await kctx.close();

  console.log("S79 evidence captured: mobile study flow ×4, desktop study ×2, tasks-768 ×1, dark clock ×2");
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

// S79 probe B (v2): create a deck on the reference via Playwright locators,
// then measure the Flashcards mobile shape at 390×844.
// Usage: node scripts/ref-mobile-flashcards-seeded-s79.mjs
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);

  await page.goto(`${REF}/Flashcards`, { timeout: 45000 });
  await page.waitForTimeout(2500);

  // Open the Create Deck dialog and create a deck
  await page.getByRole("button", { name: "Create Deck" }).click();
  await page.waitForTimeout(1200);
  const name = page.getByPlaceholder("e.g., Biology Chapter 5");
  await name.fill("S79 Probe Deck");
  await page.getByPlaceholder("What's this deck about?").fill("probe deck description");
  // The dialog's primary action
  const dlg = page.locator('[role="dialog"]');
  await dlg.getByRole("button", { name: /^Create|^Save|^Add/ }).click();
  await page.waitForTimeout(2500);

  const out = {};
  out.afterCreate = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const aside = main.querySelector("aside");
    const studyBtn = [...main.querySelectorAll("button")].find((b) => b.textContent.trim() === "Study");
    const asideR = aside?.getBoundingClientRect();
    const btnR = studyBtn?.getBoundingClientRect();
    const container = aside?.parentElement;
    const right = container ? [...container.children].filter((c) => c !== aside).find((c) => c.getBoundingClientRect().width > 0) : null;
    const rightR = right?.getBoundingClientRect();
    return {
      scrollW: document.documentElement.scrollWidth,
      asideW: asideR ? Math.round(asideR.width) : null,
      rightW: rightR ? Math.round(rightR.width) : null,
      studyBtn: btnR ? { x: Math.round(btnR.x), w: Math.round(btnR.width), inViewport: btnR.x >= 0 && btnR.right <= 390 } : null,
      text: main.innerText.replace(/\s+/g, " ").slice(0, 200),
    };
  });
  await page.screenshot({ path: "docs/screenshots/79-ref-mobile-flashcards-seeded.png", fullPage: false });

  // If the Study button exists and is in viewport, click it and measure the study pane
  if (out.afterCreate.studyBtn) {
    const clicked = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("main button")].find((b) => b.textContent.trim() === "Study");
      if (!btn) return false;
      btn.scrollIntoView({ block: "center", inline: "center" });
      btn.click();
      return true;
    });
    if (clicked) {
      await page.waitForTimeout(1800);
      out.studyMode = await page.evaluate(() => {
        const main = document.querySelector("main") || document.body;
        const exitBtn = [...main.querySelectorAll("button")].find((b) => b.textContent.trim().includes("Exit"));
        const counter = document.body.innerText.match(/\d+\s*\/\s*\d+/);
        const exitR = exitBtn?.getBoundingClientRect();
        return {
          exitBtn: exitR ? { x: Math.round(exitR.x), w: Math.round(exitR.width), inViewport: exitR.x >= 0 && exitR.right <= 390 } : null,
          counter: counter ? counter[0] : null,
          scrollW: document.documentElement.scrollWidth,
        };
      });
      await page.screenshot({ path: "docs/screenshots/79-ref-mobile-flashcards-study.png", fullPage: false });
    }
  }

  console.log(JSON.stringify(out, null, 2));
  await ctx.close();
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 500) }));
} finally {
  await browser.close();
}

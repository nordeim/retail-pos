// S79 probe C: on the reference — select the probe deck, add a card, then
// measure the Study button geometry + study-mode reachability at 390×844.
// Usage: node scripts/ref-mobile-flashcards-study-s79.mjs
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

  const out = {};

  // Measure the two-pane shape with the s78 flex-children method (the ref
  // uses no <aside> element)
  out.panes = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const vis = (el) => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
    const containers = [...main.querySelectorAll("div")]
      .filter((el) => {
        const cs = getComputedStyle(el);
        return cs.display === "flex" && cs.flexDirection === "row" && el.children.length >= 2 && el.getBoundingClientRect().height > 300;
      })
      .slice(0, 2)
      .map((el) => ({
        kids: [...el.children].filter(vis).map((k) => ({ tag: k.tagName, w: Math.round(k.getBoundingClientRect().width), x: Math.round(k.getBoundingClientRect().x) })),
      }));
    return { scrollW: document.documentElement.scrollWidth, containers };
  });

  // Select the probe deck (click its row in the list)
  await page.evaluate(() => {
    const main = document.querySelector("main");
    const row = [...main.querySelectorAll("div,button")].find((el) => el.textContent.trim().startsWith("S79 Probe Deck") && el.textContent.includes("0 cards"));
    row?.click();
  });
  await page.waitForTimeout(2000);
  out.afterSelectText = await page.evaluate(() => (document.querySelector("main") || document.body).innerText.replace(/\s+/g, " ").slice(0, 250));

  // Add a card: find the Add Card / Add First Card button
  const addBtnText = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("main button")].map((b) => b.textContent.trim());
    return btns.find((t) => /add/i.test(t)) || null;
  });
  out.addBtnText = addBtnText;
  if (addBtnText) {
    await page.evaluate((t) => {
      const btn = [...document.querySelectorAll("main button")].find((b) => b.textContent.trim() === t);
      btn?.click();
    }, addBtnText);
    await page.waitForTimeout(1500);
    // Fill front/back
    const dialogText = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"]');
      return dlg ? [...dlg.querySelectorAll("input, textarea")].map((i) => i.placeholder) : [];
    });
    out.dialogFields = dialogText;
    if (dialogText.length >= 2) {
      await page.getByPlaceholder(dialogText[0]).fill("Probe front");
      await page.getByPlaceholder(dialogText[1]).fill("Probe back");
      const dlg = page.locator('[role="dialog"]');
      await dlg.getByRole("button", { name: /^Add|^Create|^Save/ }).click();
      await page.waitForTimeout(2000);
    }
  }

  // Measure the Study button geometry
  out.studyBtn = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const studyBtn = [...main.querySelectorAll("button")].find((b) => b.textContent.trim() === "Study");
    if (!studyBtn) return null;
    const r = studyBtn.getBoundingClientRect();
    return { x: Math.round(r.x), w: Math.round(r.width), y: Math.round(r.y), inViewport: r.x >= 0 && r.right <= 390, scrollW: document.documentElement.scrollWidth };
  });
  await page.screenshot({ path: "docs/screenshots/79-ref-mobile-flashcards-card.png", fullPage: false });

  // Click Study and measure the study pane
  if (out.studyBtn) {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("main button")].find((b) => b.textContent.trim() === "Study");
      btn?.scrollIntoView({ block: "center", inline: "center" });
      btn?.click();
    });
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
        text: main.innerText.replace(/\s+/g, " ").slice(0, 150),
      };
    });
    await page.screenshot({ path: "docs/screenshots/79-ref-mobile-flashcards-study.png", fullPage: false });
  }

  console.log(JSON.stringify(out, null, 2));
  await ctx.close();
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 500) }));
} finally {
  await browser.close();
}

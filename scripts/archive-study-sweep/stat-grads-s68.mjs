// Session-68: the ref stat-block gradients (background-image stops).
import { chromium } from "playwright";
const REF = "https://omni-study1.base44.app";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${REF}/login`, { timeout: 45000 });
await page.waitForTimeout(2500);
await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
await page.fill("input[type=password]", "$Abcd1234");
await page.click("button[type=submit]");
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
await page.waitForTimeout(3500);
const grads = await page.evaluate(() => {
  const main = document.querySelector("main") || document.body;
  const out = [];
  for (const label of ["Today's Progress", "Pending Tasks", "Due Soon", "Focus Time"]) {
    const labelEl = [...main.querySelectorAll("*")].find((e) => e.children.length === 0 && e.textContent.trim() === label);
    if (!labelEl) continue;
    let card = labelEl.parentElement;
    for (let i = 0; i < 6 && card; i++) {
      const cs = getComputedStyle(card);
      if (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && String(card.className).includes("rounded")) break;
      card = card.parentElement;
    }
    const block = [...(card?.querySelectorAll("div, span") ?? [])].find((d) => {
      const r = d.getBoundingClientRect();
      return r.width > 30 && r.height > 30 && r.width < 70 && getComputedStyle(d).borderRadius !== "0px" && d.querySelector("svg");
    });
    if (!block) continue;
    const cs = getComputedStyle(block);
    out.push({ label, backgroundImage: cs.backgroundImage, borderRadius: cs.borderRadius, size: `${Math.round(block.getBoundingClientRect().width)}x${Math.round(block.getBoundingClientRect().height)}` });
  }
  return out;
});
console.log(JSON.stringify(grads, null, 1));
await browser.close();

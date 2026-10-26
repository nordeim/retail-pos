// Quick geometry probe: reference signup/verify sub-screen composition —
// Back alignment, h2 text-align, input x-position, content column width.
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("https://omni-study1.base44.app/login");
await page.waitForSelector("input[type=email]");
await page.getByRole("button", { name: /sign up/i }).click();
await page.waitForTimeout(1200);
const geo = await page.evaluate(() => {
  const card = document.querySelector("div.shadow-2xl");
  const cardBox = card.getBoundingClientRect();
  const back = [...card.querySelectorAll("button")].find((b) => /^back/i.test(b.textContent.trim()));
  const h2 = card.querySelector("h2");
  const backBox = back.getBoundingClientRect();
  const h2Box = h2.getBoundingClientRect();
  const input = card.querySelector("input");
  const inputBox = input.getBoundingClientRect();
  const form = card.querySelector("form");
  return {
    cardLeft: Math.round(cardBox.left),
    cardWidth: Math.round(cardBox.width),
    backLeft: Math.round(backBox.left),
    backWidth: Math.round(backBox.width),
    backMarginBottomToH2: Math.round(h2Box.top - backBox.bottom),
    h2TextAlign: getComputedStyle(h2).textAlign,
    h2Left: Math.round(h2Box.left),
    h2Width: Math.round(h2Box.width),
    h2FontSize: getComputedStyle(h2).fontSize,
    subCopyAlign: h2.nextElementSibling ? getComputedStyle(h2.nextElementSibling).textAlign : null,
    inputLeft: Math.round(inputBox.left),
    inputHeight: Math.round(inputBox.height),
    formLeft: Math.round(form.getBoundingClientRect().left),
    innerContentLeft: Math.round(backBox.left - cardBox.left),
  };
});
console.log(JSON.stringify(geo, null, 1));
await page.screenshot({ path: "/tmp/s15-ref-signup-geo.png" });
await browser.close();

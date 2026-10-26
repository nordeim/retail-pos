// Session-67 precise: the DESKTOP sidebar brand header on both hosts —
// title/subtitle font sizes at 1440×900. Completes the brand-header
// truth table (mobile drawer measured separately in
// drawer-brand-compare-s67.mjs).
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const CLONE = "http://localhost:3200";

async function loginRef(page) {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(4000);
}
async function loginClone(page) {
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);
}

async function measure(page, tag) {
  const m = await page.evaluate(() => {
    const title = [...document.querySelectorAll("*")]
      .filter((el) => el.children.length === 0 && el.textContent.trim() === "StudyFlow")
      .filter((el) => el.offsetWidth > 0)
      .pop();
    const sub = [...document.querySelectorAll("*")]
      .filter((el) => el.children.length === 0 && el.textContent.trim() === "Your study companion")
      .filter((el) => el.offsetWidth > 0)
      .pop();
    if (!title || !sub) return { found: false };
    const tcs = getComputedStyle(title);
    const scs = getComputedStyle(sub);
    return {
      found: true,
      title: { fs: tcs.fontSize, fw: tcs.fontWeight, lh: tcs.lineHeight },
      subtitle: { fs: scs.fontSize, lh: scs.lineHeight },
    };
  });
  return { tag, ...m };
}

const browser = await chromium.launch();
try {
  const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const rpage = await rctx.newPage();
  await loginRef(rpage);
  console.log(JSON.stringify(await measure(rpage, "ref"), null, 1));
  await rctx.close();
  const cctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const cpage = await cctx.newPage();
  await loginClone(cpage);
  console.log(JSON.stringify(await measure(cpage, "clone"), null, 1));
  await cctx.close();
} catch (e) {
  console.log(JSON.stringify({ error: String(e).slice(0, 300) }));
} finally {
  await browser.close();
}

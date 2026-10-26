// Session-67 resolution: the ref desktop "StudyFlow" brand measured 16px
// in one probe and 18px in another — dump EVERY visible text node matching
// "StudyFlow" on the ref desktop dashboard with computed styles + DOM path,
// so the pin encodes the right element.
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
  await page.waitForTimeout(4500);
}
async function loginClone(page) {
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);
}

const browser = await chromium.launch();
for (const [host, login, tag] of [[REF, loginRef, "ref"], [CLONE, loginClone, "clone"]]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await login(page);
    const nodes = await page.evaluate(() => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const t = walker.currentNode;
        if (t.textContent.trim() !== "StudyFlow") continue;
        const el = t.parentElement;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        // DOM path
        let path = [], n = el;
        for (let i = 0; i < 5 && n && n !== document.body; i++) {
          path.unshift(`${n.tagName.toLowerCase()}${n.className && typeof n.className === "string" ? "." + n.className.split(" ").slice(0, 3).join(".") : ""}`);
          n = n.parentElement;
        }
        out.push({
          fs: cs.fontSize, lh: cs.lineHeight, fw: cs.fontWeight,
          visible: r.width > 0 && r.height > 0,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) },
          path: path.join(" > "),
        });
      }
      return out;
    });
    console.log(tag, JSON.stringify(nodes, null, 1));
  } catch (e) {
    console.log(tag, "ERROR", String(e).slice(0, 200));
  } finally {
    await ctx.close();
  }
}
await browser.close();

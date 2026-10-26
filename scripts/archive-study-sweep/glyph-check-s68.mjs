// Session-68: Practice Tests glyph equality — the ref renders the class
// lucide-file-question, the clone lucide-file-question-mark (the installed
// lucide renamed the icon). Same artwork? Compare the SVG path data.
import { chromium } from "playwright";
const REF = "https://omni-study1.base44.app";
const CLONE = "http://localhost:3200";
async function loginRef(page) {
  await page.goto(`${REF}/login`, { timeout: 45000 }); await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(3000);
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
    const d = await page.evaluate(() => {
      const svg = [...document.querySelectorAll("aside nav a svg")].find((s) => /file-question/.test(s.getAttribute("class") ?? ""));
      if (!svg) return null;
      return { paths: [...svg.querySelectorAll("path, line, circle")].map((p) => p.outerHTML.slice(0, 120)), viewBox: svg.getAttribute("viewBox") };
    });
    console.log(tag, JSON.stringify(d, null, 1));
  } catch (e) { console.log(tag, "ERR", String(e).slice(0, 120)); }
  finally { await ctx.close(); }
}
await browser.close();

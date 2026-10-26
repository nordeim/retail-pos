// Session-69 ref-side structure dump: headings, grids, section rows, links.
// Usage: node scripts/z-probe2-s69.mjs
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${REF}/login`, { timeout: 45000 });
  await p.waitForTimeout(2000);
  await p.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await p.fill("input[type=password]", "$Abcd1234");
  await p.click("button[type=submit]");
  await p.waitForFunction(() => document.querySelectorAll("h1").length > 0, null, { timeout: 45000 });
  await p.waitForTimeout(2500);
  const dump = await p.evaluate(() => {
    const headings = [...document.querySelectorAll("h1,h2,h3,h4")].slice(0, 24).map((h) => ({
      tag: h.tagName, text: h.textContent.trim().slice(0, 40),
      icon: (() => { const s = h.parentElement?.querySelector("svg") || h.querySelector("svg"); return s ? (s.getAttribute("class").match(/lucide-[a-z0-9-]+/g) || []).join(",") : null; })(),
      cls: h.className.slice(0, 80),
    }));
    const grids = [...document.querySelectorAll("div")].filter((d) => {
      const t = getComputedStyle(d).gridTemplateColumns;
      return t && t.split(" ").length >= 2 && d.getBoundingClientRect().width > 400;
    }).slice(0, 8).map((d) => ({
      cols: getComputedStyle(d).gridTemplateColumns,
      gap: getComputedStyle(d).gap,
      cls: d.className.slice(0, 90),
      kids: [...d.children].slice(0, 5).map((c) => ({ span: getComputedStyle(c).gridColumn, w: Math.round(c.getBoundingClientRect().width), h2: c.querySelector("h1,h2,h3")?.textContent.trim().slice(0, 30) || null })),
    }));
    const links = [...document.querySelectorAll("a, button")].map((a) => a.textContent.trim()).filter((t) => t && t.length < 24 && /view all|^all$|new|create|start/i.test(t)).slice(0, 14);
    return { headings, grids, links };
  });
  console.log(JSON.stringify(dump, null, 1));
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 500) }));
} finally {
  await browser.close();
}

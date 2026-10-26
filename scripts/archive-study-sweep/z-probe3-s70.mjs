// Session-70 probe #3: the AP-111 full node dump — EVERY visible text node
// matching "View All" / "All" on the reference dashboard, with its DOM path,
// tag chain, geometry and computed styles. Settles the probe-vs-probe
// disagreement (probe #1: a/16px/gray vs probe #2: button/12px/violet).
// READ-ONLY (zero-residue).
// Usage: node scripts/z-probe3-s70.mjs
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);

  const dump = await page.evaluate(() => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const pathOf = (el) => {
      const parts = [];
      let e = el;
      for (let i = 0; e && e !== document.body && i < 10; i++) {
        const sib = [...(e.parentElement?.children ?? [])].filter((c) => c.tagName === e.tagName);
        const idx = sib.indexOf(e);
        parts.unshift(`${e.tagName.toLowerCase()}${idx > 0 ? `[${idx}]` : ""}${e.className && typeof e.className === "string" ? "." + e.className.split(" ").slice(0, 3).join(".") : ""}`);
        e = e.parentElement;
      }
      return parts.join(" > ");
    };
    const dumpNode = (t) => {
      const el = t.parentElement;
      if (!el || !vis(el)) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const parent = el.parentElement;
      const pcs = parent ? getComputedStyle(parent) : null;
      return {
        text: t.textContent.trim(),
        tag: el.tagName.toLowerCase(),
        parentTag: parent?.tagName.toLowerCase() ?? null,
        path: pathOf(el),
        fs: cs.fontSize, fw: cs.fontWeight, color: cs.color,
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        selfCls: typeof el.className === "string" ? el.className.slice(0, 120) : "",
        parentCls: typeof parent?.className === "string" ? parent.className.slice(0, 160) : "",
        parentFs: pcs?.fontSize, parentColor: pcs?.color,
        href: el.closest("a")?.getAttribute("href") ?? null,
        svgSibling: el.parentElement?.querySelector("svg") ? "svg-in-parent" : (el.querySelector("svg") ? "svg-in-self" : "none"),
      };
    };
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const t = walker.currentNode;
      const s = t.textContent.trim();
      if (s === "View All" || s === "All") {
        const d = dumpNode(t);
        if (d) out.push(d);
      }
    }
    return out;
  });

  console.log(JSON.stringify(dump, null, 1));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 500) }));
} finally {
  await browser.close();
}

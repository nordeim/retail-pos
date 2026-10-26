// Session-70 probe #2: the AP-111 scoped node dump — settle the two
// open reads from z-probe-s70.mjs with VISIBLE-node-scoped measurements:
//   1. The avatar tiles: ONLY buttons rendered inside the VISIBLE
//      Appearance panel (offsetParent !== null), each with its geometry.
//   2. The dashboard section-header actions: BOTH "View All" anchors
//      (Today's Tasks + Upcoming Assignments) with computed styles, plus
//      the Exams "All" anchor — the full action truth table in one dump.
// READ-ONLY (zero-residue).
// Usage: node scripts/z-probe2-s70.mjs
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

  const dash = await page.evaluate(() => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const grabActions = (needle) => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const t = walker.currentNode;
        if (t.textContent.trim() !== needle) continue;
        const el = t.parentElement;
        if (!vis(el)) continue;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const head = el.closest("h2");
        out.push({
          tag: el.tagName.toLowerCase(),
          fs: cs.fontSize, color: cs.color, fw: cs.fontWeight,
          x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
          cls: el.className?.slice(0, 260) ?? "",
          parentCls: el.parentElement?.className?.slice(0, 160) ?? "",
          inHead: !!head,
          svg: !!el.querySelector("svg"),
        });
      }
      return out;
    };
    // the section card geometry: walk from the h2 up to the wide card
    const cardOf = (needle) => {
      const h2 = [...document.querySelectorAll("h2")].find(
        (h) => h.textContent.trim() === needle && vis(h),
      );
      if (!h2) return null;
      let el = h2;
      for (let i = 0; i < 7 && el; i++) {
        el = el.parentElement;
        if (!el) break;
        const r = el.getBoundingClientRect();
        if (r.width > 500 && el !== document.body) {
          return { x: Math.round(r.x), w: Math.round(r.w ?? r.width), width: Math.round(r.width), h: Math.round(r.height) };
        }
      }
      return null;
    };
    return {
      tasks: grabActions("View All"),
      all: grabActions("All"),
      cards: {
        tasks: cardOf("Today's Tasks"),
        exams: cardOf("Upcoming Exams"),
        assignments: cardOf("Upcoming Assignments"),
      },
    };
  });

  await page.locator("a").filter({ hasText: "Settings" }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2200);
  const avatar = await page.evaluate(() => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && el.offsetParent !== null;
    };
    // scope: the element containing the visible "Avatar" label, then its
    // sibling container's buttons
    const avLabel = [...document.querySelectorAll("p, span, div, h3, h4")].find(
      (el) => el.textContent.trim() === "Avatar" && vis(el) && el.children.length === 0,
    );
    let scope = avLabel?.parentElement?.parentElement ?? document;
    let tiles = [...scope.querySelectorAll("button")].filter((b) => {
      const t = b.textContent.trim();
      return vis(b) && t.length > 0 && t.length <= 6 && /\p{Extended_Pictographic}/u.test(t);
    });
    return {
      scopedTo: scope === document ? "document" : "panel",
      count: tiles.length,
      tiles: tiles.map((b) => {
        const r = b.getBoundingClientRect();
        return { e: b.textContent.trim(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      }),
    };
  });

  console.log(JSON.stringify({ dash, avatar }, null, 1));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 500) }));
} finally {
  await browser.close();
}

// Session-70 probe: settle the two s70 screenshot hypotheses (AP-111:
// probes are the authority, screenshots are hypotheses).
//   1. The dashboard Upcoming Assignments card: reference geometry
//      (full 3-track span?) + the header action ("View All" — tag, classes).
//   2. The Settings avatar emoji vocabulary (the Z12-pinned 22-list vs
//      the row-2 tile count the screenshot suggests).
// READ-ONLY on the reference (zero-residue protocol): login → navigate →
// measure → no writes.
// Usage: node scripts/z-probe-s70.mjs
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

  // ---- 1. the dashboard section grid ----
  const grid = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    // find the section headers, then climb to the card and the grid
    const heads = [...main.querySelectorAll("h2")].filter((h) =>
      ["Today's Tasks", "Upcoming Exams", "Upcoming Assignments"].includes(h.textContent.trim()),
    );
    const cards = heads.map((h) => {
      let el = h;
      for (let i = 0; i < 6 && el; i++) {
        el = el.parentElement;
        if (!el) break;
        const r = el.getBoundingClientRect();
        if (r.width > 300 && r.height > 120) break;
      }
      const r = el?.getBoundingClientRect();
      return {
        title: h.textContent.trim(),
        x: r ? Math.round(r.x) : null,
        w: r ? Math.round(r.width) : null,
        h: r ? Math.round(r.height) : null,
        cls: el?.className?.slice(0, 220) ?? null,
      };
    });
    // the grid container: climb from the first card until the element has
    // the 3-track computed columns
    let gridEl = null;
    if (cards[0]) {
      const firstCard = document.evaluate(
        "//*[contains(normalize-space(text()),'Today')][1]",
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null,
      ).singleNodeValue?.parentElement?.parentElement;
      let el = firstCard;
      for (let i = 0; i < 6 && el; i++) {
        const cols = getComputedStyle(el).gridTemplateColumns;
        if (cols && cols.split(" ").length >= 2) { gridEl = el; break; }
        el = el.parentElement;
      }
    }
    const gridCols = gridEl ? getComputedStyle(gridEl).gridTemplateColumns : null;
    // the assignments card header action
    const aHead = heads.find((h) => h.textContent.trim() === "Upcoming Assignments");
    let action = null;
    if (aHead) {
      const headerRow = aHead.parentElement;
      const link = headerRow?.querySelector("a, button");
      if (link) {
        const cs = getComputedStyle(link);
        const r = link.getBoundingClientRect();
        action = {
          tag: link.tagName.toLowerCase(),
          text: link.textContent.trim(),
          fs: cs.fontSize, color: cs.color, fw: cs.fontWeight,
          w: Math.round(r.width), h: Math.round(r.height),
          cls: link.className.slice(0, 220),
          svg: !!link.querySelector("svg"),
        };
      }
    }
    return { cards, gridCols, action };
  });

  // ---- 2. the Settings avatar vocabulary ----
  await page.locator("a").filter({ hasText: "Settings" }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2200);
  const avatar = await page.evaluate(() => {
    // the emoji tiles: buttons with aria-label starting "Choose avatar"
    // (the ref's own labeling may differ — fall back to scanning short
    // emoji-only button/element texts inside the Appearance panel)
    let tiles = [...document.querySelectorAll('button[aria-label^="Choose avatar"]')];
    let source = "aria-label";
    if (tiles.length === 0) {
      tiles = [...document.querySelectorAll("button")].filter((b) => {
        const t = b.textContent.trim();
        return t.length <= 4 && /\p{Extended_Pictographic}/u.test(t);
      });
      source = "emoji-scan";
    }
    const list = tiles.map((b) =>
      source === "aria-label" ? b.getAttribute("aria-label") : b.textContent.trim(),
    );
    return { source, count: tiles.length, list };
  });

  console.log(JSON.stringify({ grid, avatar }, null, 1));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 500) }));
} finally {
  await browser.close();
}

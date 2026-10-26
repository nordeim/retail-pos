// Session-70 probe #6: does the ref's border-b section-header anatomy
// generalize across the other SectionCard-bearing views (Calculator,
// MathSolver, Analytics)? Every visible h2 inside a card: its header
// block's padding + border-bottom. Decides shared-default vs scoped fix.
// READ-ONLY (zero-residue).
// Usage: node scripts/z-probe6-s70.mjs
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

  const out = {};
  for (const [name, nav, path] of [
    ["calculator", "Calculator", null],
    ["mathsolver", null, "/MathSolver"],
    ["analytics", "Analytics", null],
  ]) {
    if (nav) {
      await page.locator("a").filter({ hasText: nav }).first().click({ timeout: 15000 });
    } else {
      await page.goto(`${REF}${path}`, { timeout: 45000 });
      await page.waitForTimeout(2000);
    }
    await page.waitForTimeout(2000);
    out[name] = await page.evaluate(() => {
      const vis = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };
      const res = [];
      for (const h2 of document.querySelectorAll("h2")) {
        if (!vis(h2)) continue;
        // climb to the card: the nearest ancestor with rounded corners + border
        let el = h2;
        let card = null;
        for (let i = 0; i < 6 && el; i++) {
          el = el.parentElement;
          if (!el) break;
          const cs = getComputedStyle(el);
          if (cs.borderRadius !== "0px" && cs.borderTopWidth !== "0px" && el.getBoundingClientRect().width > 300) {
            card = el;
            break;
          }
        }
        if (!card) continue;
        // the header block: the h2's ancestor that is a DIRECT child of the card
        let head = h2;
        while (head.parentElement && head.parentElement !== card) head = head.parentElement;
        const cs = getComputedStyle(head);
        const r = head.getBoundingClientRect();
        res.push({
          h2: h2.textContent.trim().slice(0, 40),
          headCls: typeof head.className === "string" ? head.className.slice(0, 120) : "",
          pt: cs.paddingTop, pb: cs.paddingBottom,
          bb: cs.borderBottomWidth !== "0px" ? `${cs.borderBottomWidth} ${cs.borderBottomColor}` : "none",
          h: Math.round(r.height),
        });
      }
      return res;
    });
  }
  console.log(JSON.stringify(out, null, 1));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 500) }));
} finally {
  await browser.close();
}

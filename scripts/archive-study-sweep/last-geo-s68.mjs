// Session-68 last two measurements: (1) the REF collapsed header box (click
// the aside's unlabeled chevron via DOM), (2) the drawer brand BLOCK box on
// both hosts (proper walk-up to the padded block) + the divider under it.
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

// (1) collapsed header on the REF (and re-confirm clone)
for (const [host, login, tag] of [[REF, loginRef, "ref"], [CLONE, loginClone, "clone"]]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await login(page);
    await page.evaluate(() => {
      const aside = document.querySelector("aside");
      const btn = aside.querySelector("button"); // the header chevron (first button)
      btn?.click();
    });
    await page.waitForTimeout(1200);
    const cgeo = await page.evaluate(() => {
      const aside = document.querySelector("aside");
      const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
      const header = aside.querySelector(":scope > div");
      const chev = header.querySelector("button");
      const firstRow = [...aside.querySelectorAll("a")].find((a) => a.getBoundingClientRect().width > 0);
      const cs = getComputedStyle(header);
      return {
        asideW: Math.round(aside.getBoundingClientRect().width),
        header: { cls: String(header.className).slice(0, 80), pad: `${cs.paddingTop} ${cs.paddingBottom}`, ...rect(header) },
        chevron: chev ? rect(chev) : null,
        firstRow: firstRow ? rect(firstRow) : null,
        row2: (() => { const rows = [...aside.querySelectorAll("a")].filter((a) => a.getBoundingClientRect().width > 0); return rows[1] ? rect(rows[1]) : null; })(),
      };
    });
    console.log(`[${tag}-collapsed]`, JSON.stringify(cgeo));
  } catch (e) {
    console.log(`[${tag}-collapsed] ERROR`, String(e).slice(0, 200));
  } finally {
    await ctx.close();
  }
}

// (2) drawer brand block walk-up
for (const [host, login, tag, isRef] of [[REF, loginRef, "ref", true], [CLONE, loginClone, "clone", false]]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  try {
    await login(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1200);
    if (isRef) {
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll("button")].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.y < 80 && r.x < 120; });
        btns[0]?.click();
      });
    } else {
      await page.getByRole("button", { name: "Open navigation menu" }).click({ timeout: 5000 });
    }
    await page.waitForTimeout(1500);
    const geo = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let sub = null;
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.trim() !== "Your study companion") continue;
        const el = walker.currentNode.parentElement;
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.y > 30 && r.y < 70 && r.x < 300) { sub = el; break; }
      }
      if (!sub) return { error: "no subtitle" };
      const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
      // walk up while the parent is NOT the panel (stop at the block whose
      // height covers the subtitle and sits at the panel top)
      let block = sub.parentElement; // the text container div
      let row = block.parentElement; // the brand row (icon + text)
      let outer = row.parentElement; // the padded block
      const ocs = outer ? getComputedStyle(outer) : null;
      const nav = [...document.querySelectorAll("nav")].find((n) => { const r = n.getBoundingClientRect(); return r.width > 200 && r.y < 120 && r.x < 50; });
      return {
        outerBlock: outer ? { cls: String(outer.className).slice(0, 90), pad: ocs ? `${ocs.paddingTop} ${ocs.paddingRight} ${ocs.paddingBottom} ${ocs.paddingLeft}` : null, box: rect(outer), borderBottom: ocs.borderBottomWidth + " " + ocs.borderBottomColor } : null,
        navBox: nav ? { y: Math.round(nav.getBoundingClientRect().y), pad: (() => { const c = getComputedStyle(nav); return `${c.paddingTop} ${c.paddingBottom}`; })() } : null,
      };
    });
    console.log(`[${tag}-drawer-block]`, JSON.stringify(geo));
  } catch (e) {
    console.log(`[${tag}-drawer-block] ERROR`, String(e).slice(0, 200));
  } finally {
    await ctx.close();
  }
}
await browser.close();

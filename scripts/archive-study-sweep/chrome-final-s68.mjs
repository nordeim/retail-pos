// Session-68 final geometry probe: (a) desktop nav row pitch both hosts,
// (b) the reference's COLLAPSED sidebar header box (S52 interplay), (c) the
// drawer brand block box + bottom border, (d) the sidebar footer internals
// (ref 185px vs clone 112px), (e) the ref brand icon block transform check.
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

for (const [host, login, tag] of [[REF, loginRef, "ref"], [CLONE, loginClone, "clone"]]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await login(page);
    const expanded = await page.evaluate(() => {
      const aside = document.querySelector("aside");
      const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
      const rows = [...aside.querySelectorAll("a")].filter((a) => a.getBoundingClientRect().width > 0).slice(0, 3).map((a) => rect(a));
      const footer = aside.querySelector(".mt-auto, .shrink-0:last-child") || [...aside.children].slice(-1)[0];
      const footerKids = [...footer.querySelectorAll(":scope > *")].map((k) => ({ cls: String(k.className).slice(0, 50), ...rect(k), txt: k.textContent.trim().replace(/\s+/g, " ").slice(0, 40) }));
      const iconBlock = aside.querySelector("header div, div.flex.items-center.gap-3 > div, div.flex.items-center.gap-3 > span");
      const ib = iconBlock ? getComputedStyle(iconBlock) : null;
      return {
        rowPitch: rows,
        footerBox: rect(footer),
        footerKids,
        asideBorderR: getComputedStyle(aside).borderRightWidth + " " + getComputedStyle(aside).borderRightColor,
        iconTransform: ib ? ib.transform : null,
      };
    });
    console.log(`[${tag}-expanded]`, JSON.stringify(expanded));

    // collapse the sidebar (the chevron) and measure the header
    const collapsed = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("aside button")].find((b) => (b.getAttribute("aria-label") || "").includes("ollapse"));
      if (!btn) return { error: "no chevron button" };
      btn.click();
      return true;
    });
    if (collapsed === true) {
      await page.waitForTimeout(1200);
      const cgeo = await page.evaluate(() => {
        const aside = document.querySelector("aside");
        const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
        const header = aside.querySelector(":scope > div");
        const chev = header.querySelector("button");
        const firstRow = [...aside.querySelectorAll("a")].find((a) => a.getBoundingClientRect().width > 0);
        return {
          aside: { cls: String(aside.className).slice(0, 70), ...rect(aside) },
          header: { cls: String(header.className).slice(0, 80), ...rect(header) },
          chevron: chev ? { ...rect(chev) } : null,
          firstRow: firstRow ? { ...rect(firstRow) } : null,
        };
      });
      console.log(`[${tag}-collapsed]`, JSON.stringify(cgeo));
      // restore
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll("aside button")].find((b) => (b.getAttribute("aria-label") || "").includes("xpand"));
        btn?.click();
      });
      await page.waitForTimeout(800);
    }
  } catch (e) {
    console.log(`[${tag}] ERROR`, String(e).slice(0, 200));
  } finally {
    await ctx.close();
  }
}

// drawer brand block + border
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
      // the drawer brand block: the element containing the subtitle at y<70
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
      // walk up to the block with p-6-ish padding
      let block = sub;
      for (let i = 0; i < 4; i++) {
        const p = block.parentElement;
        if (!p) break;
        const cs = getComputedStyle(p);
        if (parseFloat(cs.paddingTop) >= 16) { block = p; } else break;
      }
      const bcs = getComputedStyle(block);
      return {
        block: { cls: String(block.className).slice(0, 90), ...rect(block) },
        pad: `${bcs.paddingTop} ${bcs.paddingRight} ${bcs.paddingBottom} ${bcs.paddingLeft}`,
        borderBottom: bcs.borderBottomWidth + " " + bcs.borderBottomColor,
        subtitleColor: getComputedStyle(sub).color,
      };
    });
    console.log(`[${tag}-drawer-brand]`, JSON.stringify(geo));
  } catch (e) {
    console.log(`[${tag}-drawer-brand] ERROR`, String(e).slice(0, 200));
  } finally {
    await ctx.close();
  }
}
await browser.close();

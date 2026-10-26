// Session-68 debug: (1) why did the drawer-open probe fail on BOTH sites,
// (2) is the reference's desktop sidebar subtitle REALLY two lines (h=32)
// while the clone is one line (h=16) — the s68 sweep's one disagreement.
// AP-111 discipline: dump every node with DOM path + rect + container chain.
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

// ---- Part 1: desktop subtitle node dump (both hosts) ----
for (const [host, login, tag] of [[REF, loginRef, "ref"], [CLONE, loginClone, "clone"]]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await login(page);
    const dump = await page.evaluate(() => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const t = walker.currentNode;
        if (t.textContent.trim() !== "Your study companion") continue;
        const el = t.parentElement;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (!(r.width > 0 && r.height > 0)) continue;
        // container chain with widths
        const chain = [];
        let n = el;
        for (let i = 0; i < 5 && n && n !== document.documentElement; i++) {
          const ncs = getComputedStyle(n);
          const nr = n.getBoundingClientRect();
          chain.push(`${n.tagName.toLowerCase()}.${String(n.className).split(" ").slice(0, 4).join(".")}|w=${Math.round(nr.width)}|minW=${ncs.minWidth}|overflow=${ncs.overflowX}`);
          n = n.parentElement;
        }
        out.push({ fs: cs.fontSize, lh: cs.lineHeight, ws: cs.whiteSpace, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), chain: chain.join(" >> ") });
      }
      return out;
    });
    console.log(`[desktop-subtitle ${tag}]`, JSON.stringify(dump, null, 1));
    await page.screenshot({ path: `docs/screenshots/68-debug-desktop-brand-${tag}.png`, clip: { x: 0, y: 0, width: 300, height: 120 } });
  } catch (e) {
    console.log(`[desktop-subtitle ${tag}] ERROR`, String(e).slice(0, 200));
  } finally {
    await ctx.close();
  }
}

// ---- Part 2: drawer-open debugging (both hosts, 390x844 fresh) ----
for (const [host, login, tag] of [[REF, loginRef, "ref"], [CLONE, loginClone, "clone"]]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  try {
    await login(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1500);
    // count candidate buttons
    const cands = await page.evaluate(() => {
      const hdr = document.querySelector("header");
      const fixed = [...document.querySelectorAll(".fixed")].map((el) => el.tagName + "." + String(el.className).split(" ").slice(0, 3).join("."));
      const btns = [...document.querySelectorAll("button")].slice(0, 8).map((b, i) => ({ i, label: b.getAttribute("aria-label"), txt: b.textContent.trim().slice(0, 24), x: Math.round(b.getBoundingClientRect().x), y: Math.round(b.getBoundingClientRect().y), visible: b.getBoundingClientRect().width > 0 }));
      return { hasHeader: !!hdr, headerBtnCount: hdr ? hdr.querySelectorAll("button").length : 0, fixedEls: fixed.slice(0, 6), btns };
    });
    console.log(`[drawer-candidates ${tag}]`, JSON.stringify(cands));
    // attempt the click with the right selector
    if (tag === "clone") {
      await page.getByRole("button", { name: "Open navigation menu" }).click({ timeout: 5000 });
    } else {
      // the reference's unlabeled hamburger: first VISIBLE button in the fixed app bar
      const clicked = await page.evaluate(() => {
        const btns = [...document.querySelectorAll("button")].filter((b) => {
          const r = b.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.y < 80 && r.x < 120;
        });
        if (!btns.length) return false;
        btns[0].click();
        return true;
      });
      console.log(`[drawer ${tag}] dom-click:`, clicked);
    }
    await page.waitForTimeout(1500);
    const state = await page.evaluate(() => {
      const links = [...document.querySelectorAll("a")];
      const gt = links.find((a) => a.textContent.trim() === "Grade Tracker");
      const gtVisible = gt ? gt.getBoundingClientRect().width > 0 : false;
      return { linkCount: links.length, gtVisible, bodyChildren: document.body.children.length };
    });
    console.log(`[drawer ${tag}] after-click:`, JSON.stringify(state));
    await page.screenshot({ path: `docs/screenshots/68-debug-drawer-${tag}.png` });
  } catch (e) {
    console.log(`[drawer ${tag}] ERROR`, String(e).slice(0, 300));
  } finally {
    await ctx.close();
  }
}
await browser.close();

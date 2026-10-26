// Session-67 diagnostic: find the reference's mobile hamburger — dump ALL
// buttons (including unlabeled icon buttons), fixed/absolute elements in
// the top strip, and svg-bearing buttons.
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(`${REF}/login`, { timeout: 45000 });
await page.waitForTimeout(2500);
await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
await page.fill("input[type=password]", "$Abcd1234");
await page.click("button[type=submit]");
await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
await page.waitForTimeout(5000);

const diag = await page.evaluate(() => {
  const all = [...document.querySelectorAll("button")].map((b, i) => ({
    i,
    aria: b.getAttribute("aria-label"),
    text: b.textContent.trim().slice(0, 24),
    hasSvg: !!b.querySelector("svg"),
    visible: b.offsetWidth > 0 && b.offsetHeight > 0,
    rect: (({ x, y, w, h }) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }))(
      b.getBoundingClientRect()
    ),
  }));
  // anything fixed near the top (app bar candidates)
  const fixed = [...document.querySelectorAll("*")]
    .filter((el) => {
      const cs = getComputedStyle(el);
      return (cs.position === "fixed" || cs.position === "sticky") && el.getBoundingClientRect().top < 80;
    })
    .slice(0, 8)
    .map((el) => ({
      tag: el.tagName,
      cls: (el.className || "").toString().slice(0, 90),
      aria: el.getAttribute?.("aria-label") || undefined,
      role: el.getAttribute?.("role") || undefined,
      rect: (({ x, y, w, h }) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }))(
        el.getBoundingClientRect()
      ),
    }));
  return { buttonCount: all.length, buttons: all.slice(0, 20), fixed };
});
console.log(JSON.stringify(diag, null, 1));
await page.screenshot({ path: "docs/screenshots/67-ref-mobile-diagnostic.png" });

// Open the drawer via a REAL Playwright click (trusted event) on the
// unlabeled top-left icon button, then dump the overlay/dialog state.
const burger = page.locator("header button").first();
await burger.click({ timeout: 8000 });
await page.waitForTimeout(1800);
const state = await page.evaluate(() => {
  const overlays = [...document.querySelectorAll('[role="dialog"], [data-state="open"]')].map((el) => ({
    tag: el.tagName,
    role: el.getAttribute("role"),
    state: el.getAttribute("data-state"),
    cls: (el.className || "").toString().slice(0, 80),
    textSample: el.textContent.trim().slice(0, 80),
  }));
  const bodyChildren = [...document.body.children].map((el) => ({
    tag: el.tagName,
    id: el.id || undefined,
    cls: (el.className || "").toString().slice(0, 60),
  }));
  return { overlays, bodyChildren };
});
console.log("STATE:", JSON.stringify(state, null, 1));
const panel = await page.evaluate(() => {
  // the drawer panel = the white sheet containing the nav links (opened state)
  const links = [...document.querySelectorAll("a")].filter((a) =>
    /Dashboard|My Day|Grade Tracker|Analytics/.test(a.textContent)
  );
  const sheet = links[0]?.closest("div");
  let node = sheet;
  for (let i = 0; i < 6 && node; i++) {
    const cs = getComputedStyle(node);
    if (parseFloat(cs.width) > 200 && node.getBoundingClientRect().left < 10) break;
    node = node.parentElement;
  }
  const cs = node ? getComputedStyle(node) : null;
  const r = node?.getBoundingClientRect();
  return {
    width: r ? Math.round(r.width) : 0,
    left: r ? Math.round(r.left) : 0,
    bg: cs?.backgroundColor,
    bgIsColorMix: (cs?.backgroundColor || "").includes("color-mix") || (cs?.backgroundColor || "").includes("oklab"),
    linkCount: [...document.querySelectorAll("a")].filter((a) => a.textContent.trim() && a.getBoundingClientRect().left < 290 && a.getBoundingClientRect().top > 60).length,
    hasSubtitle: /Your study companion/.test(document.body.innerText),
    closeX: [...document.querySelectorAll("button")].some((b) => !b.getAttribute("aria-label") && b.closest("div") === node),
  };
});
console.log("PANEL:", JSON.stringify(panel, null, 1));
await page.screenshot({ path: "docs/screenshots/67-ref-mobile-drawer-open.png" });
await browser.close();

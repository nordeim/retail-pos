// Session-68 comprehensive chrome measurement: the s68 sweep found 6 drawer
// icon drifts + a 48-vs-52px row-spacing delta + a desktop subtitle color/wrap
// difference. This probe measures the FULL nav chrome on both hosts so the
// fix batch pins measured values: brand block (fs/lh/color/box), nav rows
// (height, gap, py), icons, and the app-bar brand — desktop sidebar AND drawer.
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

async function desktopSidebar(page) {
  return page.evaluate(() => {
    const aside = document.querySelector("aside");
    if (!aside) return { error: "no aside" };
    const grab = (needle) => {
      const walker = document.createTreeWalker(aside, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.trim() !== needle) continue;
        const el = walker.currentNode.parentElement;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { fs: cs.fontSize, lh: cs.lineHeight, color: cs.color, fw: cs.fontWeight, w: Math.round(r.width), h: Math.round(r.height) };
      }
      return null;
    };
    // nav rows: the VISIBLE links with icons inside the aside
    const rows = [];
    for (const a of aside.querySelectorAll("a")) {
      const r = a.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      const svg = a.querySelector("svg");
      const cls = svg ? [...svg.classList].find((c) => c.startsWith("lucide-") && c !== "lucide") : null;
      const svgCs = svg ? getComputedStyle(svg) : null;
      rows.push({
        label: a.textContent.trim().replace(/\s+/g, " "),
        h: Math.round(r.height),
        y: Math.round(r.y),
        icon: cls,
        iconSize: svgCs ? `${svgCs.width}x${svgCs.height}` : null,
        padY: (() => { const cs = getComputedStyle(a); return `${cs.paddingTop}/${cs.paddingBottom}`; })(),
        mb: getComputedStyle(a).marginBottom,
      });
    }
    // the aside header structure
    const header = aside.querySelector("div");
    const hcs = header ? getComputedStyle(header) : null;
    return {
      brand: { title: grab("StudyFlow"), subtitle: grab("Your study companion") },
      headerClass: header ? String(header.className) : null,
      headerPad: hcs ? `${hcs.paddingTop} ${hcs.paddingBottom} ${hcs.paddingLeft} ${hcs.paddingRight}` : null,
      headerH: header ? Math.round(header.getBoundingClientRect().height) : null,
      rows: rows.slice(0, 22),
    };
  });
}

async function drawerMeasure(page, isRef) {
  if (isRef) {
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")].filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.y < 80 && r.x < 120;
      });
      btns[0]?.click();
    });
  } else {
    await page.getByRole("button", { name: "Open navigation menu" }).click({ timeout: 5000 });
  }
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    // the drawer panel: the visible overlay nav links' common ancestor
    const links = [...document.querySelectorAll("a")].filter((a) => {
      const r = a.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && a.querySelector("svg") && a.textContent.trim().length > 0;
    });
    // drawer links = links whose y is BELOW the app bar and x < 300 (390 viewport)
    const dLinks = links.filter((a) => a.getBoundingClientRect().y > 60 && a.getBoundingClientRect().x < 300);
    const rows = dLinks.slice(0, 22).map((a) => {
      const r = a.getBoundingClientRect();
      const svg = a.querySelector("svg");
      const cs = getComputedStyle(a);
      const svgCs = svg ? getComputedStyle(svg) : null;
      return {
        label: a.textContent.trim().replace(/\s+/g, " "),
        h: Math.round(r.height),
        y: Math.round(r.y),
        icon: svg ? [...svg.classList].find((c) => c.startsWith("lucide-") && c !== "lucide") : null,
        iconSize: svgCs ? `${svgCs.width}x${svgCs.height}` : null,
        padY: `${cs.paddingTop}/${cs.paddingBottom}`,
        color: cs.color,
        fs: cs.fontSize,
      };
    });
    // brand block inside the drawer: find the panel via the title node
    const grab = (needle) => {
      for (const a of dLinks) { /* nav links only; brand is outside them */ }
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.trim() !== needle) continue;
        const el = walker.currentNode.parentElement;
        const r = el.getBoundingClientRect();
        if (!(r.width > 0 && r.height > 0)) continue;
        if (r.y > 200) continue; // brand sits at the drawer top
        const cs = getComputedStyle(el);
        return { fs: cs.fontSize, lh: cs.lineHeight, color: cs.color, w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y) };
      }
      return null;
    };
    return { brand: { title: grab("StudyFlow"), subtitle: grab("Your study companion") }, rows };
  });
}

async function appBarBrand(page) {
  return page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (walker.currentNode.textContent.trim() !== "StudyFlow") continue;
      const el = walker.currentNode.parentElement;
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0) || r.y > 60) continue;
      const cs = getComputedStyle(el);
      return { fs: cs.fontSize, lh: cs.lineHeight, color: cs.color, fw: cs.fontWeight };
    }
    return null;
  });
}

const browser = await chromium.launch();
const out = {};
for (const [host, login, tag, isRef] of [[REF, loginRef, "ref", true], [CLONE, loginClone, "clone", false]]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await login(page);
    out[tag + "-desktop"] = await desktopSidebar(page);
    out[tag + "-appbar-desktop"] = null;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1500);
    out[tag + "-appbar"] = await appBarBrand(page);
    out[tag + "-drawer"] = await drawerMeasure(page, isRef);
  } catch (e) {
    out[tag] = { error: String(e).slice(0, 300) };
  } finally {
    await ctx.close();
  }
}
await browser.close();
console.log(JSON.stringify(out, null, 1));

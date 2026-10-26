// Session-78 VLM-hypothesis verification probe (the AP-115 doctrine: VLM
// findings are hypotheses; DOM computed styles are the authority).
// The s78 VLM pairwise pass raised two claims:
//   H1: the ref's dashboard stat cards carry "large colored circles behind
//       the icons" that the clone lacks/fades.
//   H2: the ref sidebar lacks "Grade Tracker" (a nav-count/label drift).
// This probe measures BOTH hosts' stat-card DOM (every child of every stat
// card, with geometry + computed backgrounds) and the full sidebar nav
// label list, then prints both for byte-level comparison.
// Usage: node scripts/vlm-verify-s78.mjs   (clone :3200 standalone first)
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
  await page.waitForTimeout(2500);
}

async function loginClone(page) {
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  await page.waitForTimeout(1500);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);
}

// Dump every stat-card-shaped node: cards whose heading text matches the
// dashboard's stat vocabulary, then EVERY descendant with a non-transparent
// background or an SVG icon, with geometry + computed styles.
async function statCardDump(page) {
  return page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    // Stat cards: the grid cells that contain a big fraction value heading.
    const cards = [...main.querySelectorAll("div, article, section")].filter((el) => {
      if (el.querySelector("h1, h2, h3") === null) return false;
      const cs = getComputedStyle(el);
      if (cs.display.includes("flex") && el.children.length > 3) return false;
      const r = el.getBoundingClientRect();
      return r.width > 120 && r.width < 400 && r.height > 60 && r.height < 220 &&
        getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)" === false; // cards w/ white bg
    });
    // Simpler: find elements whose direct text matches the stat vocabulary
    // and walk up to the card container.
    const vocab = ["Tasks Completed", "Assignments", "Focus Time", "Upcoming Exams", "Study Streak", "Completion"];
    const out = [];
    for (const el of [...main.querySelectorAll("h2, h3, p, span")]) {
      const t = el.textContent.trim();
      if (!vocab.some((v) => t.toLowerCase().includes(v.toLowerCase()))) continue;
      const card = el.closest("div");
      if (!card) continue;
      const cr = card.getBoundingClientRect();
      const dump = [...card.querySelectorAll("*")].map((c) => {
        const cs = getComputedStyle(c);
        const r = c.getBoundingClientRect();
        return {
          tag: c.tagName, cls: (c.className || "").toString().slice(0, 60),
          x: Math.round(r.x - cr.x), y: Math.round(r.y - cr.y), w: Math.round(r.width), h: Math.round(r.height),
          bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0, 80),
          radius: cs.borderRadius, color: cs.color, fs: cs.fontSize, fw: cs.fontWeight,
          pos: cs.position, z: cs.zIndex, opacity: cs.opacity,
        };
      });
      out.push({ label: t.slice(0, 40), w: Math.round(cr.width), h: Math.round(cr.height), children: dump });
      if (out.length >= 4) break;
    }
    return out;
  });
}

async function navDump(page) {
  return page.evaluate(() => {
    const nav = document.querySelector("nav") || document.querySelector("aside");
    if (!nav) return { error: "no nav" };
    return {
      links: [...nav.querySelectorAll("a")].map((a) => ({
        text: a.textContent.trim().slice(0, 30),
        visible: a.getBoundingClientRect().width > 0,
      })),
      count: nav.querySelectorAll("a").length,
    };
  });
}

const browser = await chromium.launch();
try {
  const refCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const refPage = await refCtx.newPage();
  await loginRef(refPage);
  const refStats = await statCardDump(refPage);
  const refNav = await navDump(refPage);
  await refCtx.close();

  const clCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const clPage = await clCtx.newPage();
  await loginClone(clPage);
  const clStats = await statCardDump(clPage);
  const clNav = await navDump(clPage);
  await clCtx.close();

  const out = { refNav, cloneNav: clNav, refStats, cloneStats: clStats };
  const { writeFileSync } = await import("node:fs");
  writeFileSync("/tmp/vlm-verify-s78.json", JSON.stringify(out, null, 1));
  console.log(JSON.stringify({
    refNavCount: refNav.count, cloneNavCount: clNav.count,
    refLabels: (refNav.links || []).map((l) => l.text),
    cloneLabels: (clNav.links || []).map((l) => l.text),
    refStatLabels: refStats.map((c) => c.label),
    cloneStatLabels: clStats.map((c) => c.label),
  }, null, 1));
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

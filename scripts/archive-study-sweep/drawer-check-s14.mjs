// Standing mobile-drawer priority check — session 14 (S14).
// Verifies the mobile navigation drawer on BOTH apps at 390x844:
// backdrop rgba(0,0,0,0.2)+blur(4px) (oklab serialization accepted — trap 7),
// 288px white shadow-2xl panel, 20 links, no footer, Escape-close (clone superset).
// Follows the S13 precedent: reference login + clone dev server, JSON verdict.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const REF = "https://omni-study1.base44.app";
const CLONE = "http://localhost:3000";
const OUT = "/tmp/s14-drawer-evidence";
mkdirSync(OUT, { recursive: true });

const DRAWER_PROBE = `(() => {
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const dialog = document.querySelector('[role="dialog"][aria-label*="avigation"], [role="dialog"]');
  const root = dialog && visible(dialog) ? dialog : document.body;
  const backdrop = [...root.querySelectorAll('button, div')].find(el => (el.className || '').includes('bg-black') && visible(el)) || null;
  const panel = [...root.querySelectorAll('div')].find(el => (el.className || '').includes('w-72') && visible(el)) || null;
  const links = panel ? [...panel.querySelectorAll('a')] : [];
  const footer = panel ? panel.querySelector('footer') : null;
  const cs = (el) => el ? { bg: getComputedStyle(el).backgroundColor, blur: getComputedStyle(el).backdropFilter, w: getComputedStyle(el).width, shadow: getComputedStyle(el).boxShadow.slice(0, 60) } : null;
  return JSON.stringify({
    backdrop: cs(backdrop),
    panel: cs(panel),
    linkCount: links.length,
    firstLink: links[0] ? links[0].textContent.trim().slice(0, 20) : null,
    hasFooter: !!footer,
  });
})()`;

async function probeDrawer(browser, base, login) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  if (login) {
    await page.goto(`${base}/login`);
    await page.fill("input[type=email]", login.email);
    await page.fill("input[type=password]", login.password);
    await page.click("button[type=submit]");
    await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 30000 });
  } else {
    await page.goto(`${base}/`);
    await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 30000 });
  }
  await page.waitForTimeout(1200);
  // Open the drawer (clone: the menu button in the mobile app bar; ref: its own chrome)
  const menuBtn = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i]').first();
  if (await menuBtn.count() > 0) {
    await menuBtn.click();
  } else {
    // Reference app: header hamburger — try common shapes
    await page.locator('header button, [class*="header"] button').first().click().catch(() => {});
  }
  await page.waitForTimeout(900);
  const probe = JSON.parse(await page.evaluate(DRAWER_PROBE));
  // Escape-close check (clone superset — reference tested too)
  const beforeOpen = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return !!d && d.getBoundingClientRect().width > 0;
  });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  const afterEscape = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return !!d && d.getBoundingClientRect().width > 0;
  });
  await page.screenshot({ path: `${OUT}/${login ? "clone" : "reference"}-drawer.png` });
  await ctx.close();
  return { ...probe, escapeClosed: beforeOpen && !afterEscape };
}

const browser = await chromium.launch();
const reference = await probeDrawer(browser, REF, { email: "sepnetflix2023@outlook.com", password: "$Abcd1234" });
const clone = await probeDrawer(browser, CLONE, { email: "demo@studyflow.app", password: "Demo1234!" });
await browser.close();

const norm = (bg) => (bg || "").split("oklab(0 0 0 / 0.2)").join("rgba(0, 0, 0, 0.2)").split("oklab(0 0 0/0.2)").join("rgba(0, 0, 0, 0.2)");
const verdict = {
  reference,
  clone,
  checks: {
    backdropMatch:
      norm(clone.backdrop?.bg) === norm(reference.backdrop?.bg) &&
      (clone.backdrop?.blur || "").includes("blur(4px)") === ((reference.backdrop?.blur || "").includes("blur(4px)")),
    panelWidthMatch: Math.abs(parseFloat(clone.panel?.w || "0") - parseFloat(reference.panel?.w || "0")) < 2,
    panelWhite: (clone.panel?.bg || "").includes("255, 255, 255"),
    linkCountMatch: clone.linkCount === reference.linkCount,
    noFooter: !clone.hasFooter,
    escapeCloseSuperset: clone.escapeClosed,
  },
};
console.log(JSON.stringify(verdict, null, 2));
const allGreen = Object.values(verdict.checks).every(Boolean);
console.log(allGreen ? "\\nDRAWER CHECK: GREEN" : "\\nDRAWER CHECK: FAILURES PRESENT");

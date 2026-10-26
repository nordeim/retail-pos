// Session-67 probe: precise mobile-navigation comparison, BOTH hosts.
// The generic drawer heuristic (header button / menu text) fails on both
// sites identically — this probe targets the REAL control measured in
// Batch A (aria-label "Open navigation menu") and compares the drawer
// anatomy + the Tailwind v4 opacity-serialization trap (color-mix vs raw
// rgb) on computed styles of the drawer surface.
// Usage: node scripts/mobile-nav-compare-s67.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const REF = "https://omni-study1.base44.app";
const CLONE = "http://localhost:3200";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

async function loginRef(page) {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);
}

async function registerClone(page) {
  const email = `s67-mnav-${Date.now()}@studyflow.app`;
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  const reg = await page.request.post(`${CLONE}/api/auth/register`, {
    data: { email, password: "Fresh1234!", name: "S67 Probe" },
  });
  if (!reg.ok()) throw new Error(`register failed ${reg.status()}`);
  const { code } = await reg.json();
  await page.request.post(`${CLONE}/api/auth/verify-email`, { data: { email, code } });
  await page.goto(`${CLONE}/`, { timeout: 45000 });
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);
}

async function probe(page, host, tag) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${host}/`, { timeout: 45000 });
  await page.waitForTimeout(4000);

  const bar = await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Open navigation menu" i], button[aria-label*="navigation" i]');
    if (!btn) {
      const labels = [...document.querySelectorAll("button")]
        .map((b) => b.getAttribute("aria-label") || b.textContent.trim().slice(0, 30))
        .filter(Boolean)
        .slice(0, 12);
      return { appBarFound: false, visibleButtonLabels: labels };
    }
    const barEl = btn.closest("header, div");
    const cs = barEl ? getComputedStyle(barEl) : null;
    return {
      appBarFound: true,
      btnAriaLabel: btn.getAttribute("aria-label"),
      barPosition: cs?.position,
      barBackdrop: cs?.backdropFilter?.slice(0, 60) || "none",
      barBg: cs?.backgroundColor,
    };
  });

  let drawer = { opened: false };
  try {
    await page.getByRole("button", { name: /open navigation menu/i }).click({ timeout: 5000 });
    await page.waitForTimeout(1200);
    drawer = await page.evaluate(() => {
      const closeBtn = document.querySelector('[aria-label="Close menu" i], [aria-label="Close navigation menu" i]');
      const dialog = closeBtn?.closest('[role="dialog"], [data-state], div');
      const panel = closeBtn?.parentElement?.parentElement || dialog;
      if (!closeBtn) return { opened: false };
      const cs = panel ? getComputedStyle(panel) : null;
      const links = [...document.querySelectorAll('[role="dialog"] a, [data-state="open"] a')];
      const navLinks = links.filter((a) => a.textContent.trim().length > 0);
      // Tailwind v4 trap: an unpinned bg-* opacity variant serializes as
      // color-mix(in oklab, ...) — the pinned raw-rgb branch reads back rgb().
      const bg = cs?.backgroundColor || "";
      return {
        opened: true,
        closeAria: closeBtn.getAttribute("aria-label"),
        panelWidth: cs ? parseFloat(cs.width) : 0,
        panelBg: bg,
        bgIsColorMix: bg.includes("color-mix") || bg.includes("oklab"),
        linkCount: navLinks.length,
        hasBrand: !!panel?.textContent?.match(/StudyFlow|Study/i),
        hasFooter: !!panel?.querySelector("footer"),
      };
    });
    await page.screenshot({ path: `${OUT}/67-${tag}-mobile-drawer-precise.png` });
    await page.getByRole("button", { name: /close/i }).click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(600);
    const closed = await page.evaluate(
      () => !document.querySelector('[aria-label="Close menu" i], [aria-label="Close navigation menu" i]')
    );
    drawer.closesOk = closed;
  } catch (e) {
    drawer.error = String(e).slice(0, 150);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  return { tag, appBar: bar, drawer };
}
const browser = await chromium.launch();
const out = {};
try {
  const rctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const rpage = await rctx.newPage();
  await loginRef(rpage);
  out.ref = await probe(rpage, REF, "ref");
  await rctx.close();

  const cctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const cpage = await cctx.newPage();
  await registerClone(cpage);
  out.clone = await probe(cpage, CLONE, "clone");
  await cctx.close();

  console.log(JSON.stringify(out, null, 1));
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

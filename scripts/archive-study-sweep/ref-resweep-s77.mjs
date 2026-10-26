// Session-77 sweep (the s76 class re-tagged): reference UNCHANGED-since-s67 regression sweep.
// Derived from ref-resweep-s75.mjs (the 9 measured invariants, both hosts)
// with the s69 addition: the Batch-X brand-header typography is now part of
// the standing invariant set — desktop sidebar (18/28 + 12/16, S3-H), the
// mobile app-bar brand (16/24) and the drawer brand (16/24 + 12/16 + one
// line, S3-I) are measured via TreeWalker node dumps on BOTH hosts and must
// match the s67 committed truth table byte-for-byte.
// Usage: node scripts/ref-resweep-s77.mjs   (clone :3200 standalone first)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const REF = "https://omni-study1.base44.app";
const CLONE = "http://localhost:3200";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const VIEWS = [
  { name: "dashboard", nav: null },
  { name: "myday", nav: "My Day" },
  { name: "gradetracker", nav: "Grade Tracker" },
  { name: "practicetests", nav: "Practice Tests" },
  { name: "studygroups", nav: "Study Groups" },
  { name: "events", nav: "Events" },
  { name: "settings", nav: "Settings" },
];

async function fingerprint(page) {
  return page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const t = main.innerText.replace(/\s+/g, " ");
    return {
      h1: [...main.querySelectorAll("h1")].map((h) => h.textContent.trim()),
      h2: [...main.querySelectorAll("h2")].map((h) => h.textContent.trim()).slice(0, 12),
      buttons: [...main.querySelectorAll("button")].map((b) => b.textContent.trim()).filter(Boolean).slice(0, 14),
      inputs: [...main.querySelectorAll("input")].map((i) => i.placeholder || i.type).slice(0, 8),
      text: t.slice(0, 1200),
    };
  });
}

// Brand-header node dump (the AP-111 discipline: dump EVERY visible node
// matching the brand strings with computed styles; the caller picks by
// geometry — sidebar nodes sit at x < 300 on desktop, the app-bar/drawer
// nodes at y < 120 / x < 300 on mobile).
async function brandDump(page) {
  return page.evaluate(() => {
    const grab = (needle) => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const t = walker.currentNode;
        if (t.textContent.trim() !== needle) continue;
        const el = t.parentElement;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (!(r.width > 0 && r.height > 0)) continue;
        out.push({ fs: cs.fontSize, lh: cs.lineHeight, fw: cs.fontWeight, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
      }
      return out;
    };
    return { title: grab("StudyFlow"), subtitle: grab("Your study companion") };
  });
}

// Invariants measured on the reference s63–s65 (committed in Batches T/U/V).
// `where`: ref = reference only, both = both sites (clone via fresh user).
const INVARIANTS = [
  { id: "dash-greeting-live", where: "both", view: "dashboard",
    pass: (f) => /Good (morning|afternoon|evening)/.test(f.h1.join(" ") + " " + f.text.slice(0, 200)) },
  { id: "myday-chrome-at-zero", where: "both", view: "myday",
    pass: (f) => f.h1.length >= 1 && f.inputs.some((i) => /task|add/i.test(i)) &&
      f.text.includes("What would you like to accomplish today?") &&
      f.text.indexOf("Add Your First Task") > f.text.indexOf("What would you like") },
  { id: "gt-subtitle-measured", where: "both", view: "gradetracker",
    pass: (f) => f.text.includes("Monitor your academic performance") },
  { id: "gt-3cards-no-highest", where: "both", view: "gradetracker",
    pass: (f) => f.text.includes("Total Grades") && f.text.includes("Subjects Tracked") && !f.text.includes("Highest Grade") },
  { id: "pt-subtitle-measured", where: "both", view: "practicetests",
    pass: (f) => f.text.includes("Test yourself with practice exams") },
  { id: "sg-list-empty-cta", where: "both", view: "studygroups",
    pass: (f) => f.text.includes("No study groups") && f.buttons.some((b) => /Create Group/.test(b)) },
  { id: "sg-right-bold-hint", where: "both", view: "studygroups",
    pass: (f) => f.text.includes("Select a group") && f.text.includes("Choose a study group from the sidebar or create a new one") },
  { id: "events-carousel-chrome", where: "both", view: "events",
    pass: (f) => f.text.includes("New Event") && /CW ?\d+/.test(f.text) },
  { id: "settings-tabs", where: "both", view: "settings",
    pass: (f) => f.text.includes("Appearance") && f.text.includes("Subjects") && f.text.includes("Holidays") },
];

// Batch-X brand invariants (s69): the desktop sidebar truth table from the
// s67 node dump — title 18px/28px/700, subtitle 12px/16px. Both hosts must
// match exactly (this is the S3-H pin's live cross-check).
function desktopBrandOk(dump) {
  const title = dump.title.find((n) => n.x < 300);
  const sub = dump.subtitle.find((n) => n.x < 300);
  return !!title && !!sub &&
    title.fs === "18px" && title.lh === "28px" && title.fw === "700" &&
    sub.fs === "12px" && sub.lh === "16px";
}

// The app-bar brand alone (measured pre-open, no drawer subtitle yet):
// the visible 16px/24px title node under y<120.
function appBarBrandOk(dump) {
  const bar = dump.title.find((n) => n.x < 300 && n.y < 120);
  return !!bar && bar.fs === "16px" && bar.lh === "24px";
}

// The drawer truth table (S3-L): title 16px/24px/700; subtitle 12px/16px
// with a ONE-line box (< 20px). The drawer overlays the app bar at the SAME
// y-range, so the drawer title is anchored to the SUBTITLE (the only "Your
// study companion" node visible at 390 — the desktop sidebar is
// display:none); the bar brand is the other visible title node.
function drawerBrandOk(dump) {
  const sub = dump.subtitle.find((n) => n.x < 300);
  if (!sub) return false;
  const dTitle = dump.title.find((n) => n.x < 300 && Math.abs(n.y - sub.y) < 40);
  const bar = dump.title.find((n) => n.x < 300 && n !== dTitle && n.y < 120);
  return !!bar && !!dTitle &&
    bar.fs === "16px" && bar.lh === "24px" &&
    dTitle.fs === "16px" && dTitle.lh === "24px" && dTitle.fw === "700" &&
    sub.fs === "12px" && sub.lh === "16px" && sub.h < 20;
}

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
  const email = `s77-resweep-${Date.now()}@studyflow.app`;
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  const reg = await page.request.post(`${CLONE}/api/auth/register`, {
    data: { email, password: "Fresh1234!", name: "S72 Probe" },
  });
  if (!reg.ok()) throw new Error(`register failed ${reg.status()}`);
  const { code } = await reg.json();
  const verify = await page.request.post(`${CLONE}/api/auth/verify-email`, { data: { email, code } });
  if (!verify.ok()) throw new Error(`verify failed ${verify.status()}`);
  await page.goto(`${CLONE}/`, { timeout: 45000 });
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);
}

async function sweep(page, host, tag) {
  const results = [];
  for (const v of VIEWS) {
    if (v.nav) {
      await page.locator("a").filter({ hasText: v.nav }).first().click({ timeout: 15000 });
    }
    await page.waitForTimeout(2200);
    const fp = await fingerprint(page);
    await page.screenshot({ path: `${OUT}/77-${tag}-${v.name}.png`, fullPage: false });
    for (const inv of INVARIANTS) {
      if (inv.view !== v.name) continue;
      let ok = false;
      try { ok = inv.pass(fp); } catch { ok = false; }
      results.push({ host, inv: inv.id, view: v.name, ok, hint: ok ? "" : fp.text.slice(0, 220) });
    }
  }
  return results;
}

// The mobile-nav probe (user-flagged standing surface). Opens the drawer on
// BOTH sites (the reference hamburger is an UNLABELED icon button — the
// first button in the fixed header; the clone is aria-labeled), then dumps
// the brand nodes + measures the drawer panel.
async function mobileProbe(page, host, tag, isRef) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${host}/`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  const dash = await fingerprint(page);
  await page.screenshot({ path: `${OUT}/77-${tag}-mobile-dashboard.png`, fullPage: false });
  const barDump = await brandDump(page);
  // open the drawer: the labeled clone path first, the reference's unlabeled
  // first-VISIBLE-header-button fallback second (the s67 probe-resolution
  // lesson; the s69 .fixed-button lesson — the hidden aside is also .fixed,
  // so the fallback filters by visibility + position, not DOM order).
  let drawerOpened = false;
  try {
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
    // s69 lesson (the .find() trap): the hidden sidebar's links match the
    // label too — ANY VISIBLE match (width > 0) means the drawer opened.
    drawerOpened = await page
      .locator("a")
      .filter({ hasText: "Grade Tracker" })
      .evaluateAll((as) => as.some((a) => a.getBoundingClientRect().width > 0))
      .catch(() => false);
    await page.screenshot({ path: `${OUT}/77-${tag}-mobile-drawer.png`, fullPage: false });
  } catch { drawerOpened = false; }
  const drawerDump = drawerOpened ? await brandDump(page) : null;
  await page.setViewportSize({ width: 1440, height: 900 });
  return {
    host, tag,
    greetingOk: /Good (morning|afternoon|evening)/.test(dash.text.slice(0, 200)),
    drawerOpened,
    brand: { bar: barDump, drawer: drawerDump },
    barOk: appBarBrandOk(barDump),
    brandOk: drawerOpened ? drawerBrandOk(drawerDump) : false,
  };
}

const browser = await chromium.launch();
const out = { ref: [], clone: [], brandDesktop: {}, mobile: {} };
try {
  // reference sweep
  const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const rpage = await rctx.newPage();
  await loginRef(rpage);
  out.ref = await sweep(rpage, REF, "ref");
  out.brandDesktop.ref = { dump: await brandDump(rpage), ok: desktopBrandOk(await brandDump(rpage)) };
  out.mobile.ref = await mobileProbe(rpage, REF, "ref", true);
  await rctx.close();

  // clone sweep (fresh empty user — matches the reference's empty account)
  const cctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const cpage = await cctx.newPage();
  await registerClone(cpage);
  out.clone = await sweep(cpage, CLONE, "clone");
  out.brandDesktop.clone = { dump: await brandDump(cpage), ok: desktopBrandOk(await brandDump(cpage)) };
  out.mobile.clone = await mobileProbe(cpage, CLONE, "clone", false);
  await cctx.close();

  const bad = [...out.ref, ...out.clone].filter((r) => !r.ok);
  const brandBad = !out.brandDesktop.ref.ok || !out.brandDesktop.clone.ok ||
    !out.mobile.ref.barOk || !out.mobile.clone.barOk ||
    !out.mobile.ref.brandOk || !out.mobile.clone.brandOk;
  console.log(JSON.stringify({
    ok: bad.length === 0 && !brandBad,
    failed: bad,
    refChecks: out.ref.length,
    cloneChecks: out.clone.length,
    brandDesktop: { ref: out.brandDesktop.ref.ok, clone: out.brandDesktop.clone.ok, refDump: out.brandDesktop.ref.dump, cloneDump: out.brandDesktop.clone.dump },
    mobile: { ref: { drawerOpened: out.mobile.ref.drawerOpened, barOk: out.mobile.ref.barOk, brandOk: out.mobile.ref.brandOk }, clone: { drawerOpened: out.mobile.clone.drawerOpened, barOk: out.mobile.clone.barOk, brandOk: out.mobile.clone.brandOk } },
  }, null, 1));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 500) }));
} finally {
  await browser.close();
}

// Session-67 probe: reference UNCHANGED-since-s65 regression sweep.
// Re-fingerprints the live reference + the clone (fresh empty user) on the
// s63–s65 measured surfaces and evaluates the recorded invariants in-script.
// All expectations come from the committed records (Batch T/U/V pins).
// Usage: node scripts/ref-resweep-s67.mjs
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
  const email = `s67-resweep-${Date.now()}@studyflow.app`;
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  const reg = await page.request.post(`${CLONE}/api/auth/register`, {
    data: { email, password: "Fresh1234!", name: "S66 Probe" },
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
    await page.screenshot({ path: `${OUT}/67-${tag}-${v.name}.png`, fullPage: false });
    for (const inv of INVARIANTS) {
      if (inv.view !== v.name) continue;
      let ok = false;
      try { ok = inv.pass(fp); } catch { ok = false; }
      results.push({ host, inv: inv.id, view: v.name, ok, hint: ok ? "" : fp.text.slice(0, 220) });
    }
  }
  return results;
}

async function mobileProbe(page, host, tag) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${host}/`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  const dash = await fingerprint(page);
  await page.screenshot({ path: `${OUT}/67-${tag}-mobile-dashboard.png`, fullPage: false });
  // drawer/menu affordance on mobile
  const menuBtn = page.locator("button").filter({ hasText: /menu|open/i }).or(
    page.locator('[aria-label*="menu" i], [aria-label*="navigation" i], header button, [class*="lg:hidden"] button').first()
  ).first();
  let drawerOpened = false;
  try {
    await menuBtn.click({ timeout: 4000 });
    await page.waitForTimeout(1200);
    drawerOpened = await page.locator("a").filter({ hasText: "Grade Tracker" }).first().isVisible();
    await page.screenshot({ path: `${OUT}/67-${tag}-mobile-drawer.png`, fullPage: false });
  } catch { drawerOpened = false; }
  await page.setViewportSize({ width: 1440, height: 900 });
  return { host, tag, greetingOk: /Good (morning|afternoon|evening)/.test(dash.text.slice(0, 200)), drawerOpened };
}

const browser = await chromium.launch();
const out = { ref: [], clone: [], mobile: {} };
try {
  // reference sweep
  const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const rpage = await rctx.newPage();
  await loginRef(rpage);
  out.ref = await sweep(rpage, REF, "ref");
  out.mobile.ref = await mobileProbe(rpage, REF, "ref");
  await rctx.close();

  // clone sweep (fresh empty user — matches the reference's empty account)
  const cctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const cpage = await cctx.newPage();
  await registerClone(cpage);
  out.clone = await sweep(cpage, CLONE, "clone");
  out.mobile.clone = await mobileProbe(cpage, CLONE, "clone");
  await cctx.close();

  const bad = [...out.ref, ...out.clone].filter((r) => !r.ok);
  console.log(JSON.stringify({ ok: bad.length === 0, failed: bad, refChecks: out.ref.length, cloneChecks: out.clone.length, mobile: out.mobile }, null, 1));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 500) }));
} finally {
  await browser.close();
}

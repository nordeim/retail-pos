// Accent × dark-mode consistency sweep (session-11 audit; S38 extended to
// the mobile 20-view matrix).
// For EVERY accent (7), sets dark + accent via the settings API (the real
// application path: loadFromUser → applyToDocument), then walks all 20 views
// at desktop 1280×800 AND all 20 views at mobile 390×844 (the S38 extension
// — the pre-S38 mobile pass swept only 6 views: MOBILE_VIEWS; the other 14
// had never been rendered in dark × accent at the stacked mobile layout by
// any standing audit), plus the drawer per accent, flagging:
//  - "flashbulb" surfaces: opaque light backgrounds (luminance > 0.80) ≥40×20
//  - unreadable text: contrast < 2.2 (the S10 FAIL bar)
//  - low-contrast text: 2.2 ≤ contrast < 3.2 (WARN — the accent-600-on-dark
//    family lands here; the codebase's own dark convention is strongDark)
//  - mobile overflow: scrollWidth > 390 (the S16 mobile-only-gap class)
//
// The S38 envelope shape (unit-pinned by tests/suite-verdict.test.ts):
//   { mode: "dark", mobileViewport: {390×844}, applied: {accent→reading},
//     desktop: {accent→{view→record}}, mobile: {accent→{view→record,
//     "(drawer)": {linkCount, flashbulbs, unreadable, lowcontrast,
//     error?}}} } — EVERY view is recorded explicitly (clean views carry
// empty detector arrays; the pre-S38 omission-means-clean recording is
// RETIRED), so the seam's ALL-ACCENTS + ALL-VIEWS + drawer-present guards
// make every silently-skipped dimension a LOUD shape-error, never
// green-by-omission (the S37 anti-phantom doctrine applied here).
//
// Restores light + violet at the end (the dev user resting state), with the
// failure-path restore in the catch (a crashed sweep never leaves dark).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const VIEWS = [
  "Dashboard", "MyDay", "Tasks", "Calendar", "Events", "Timetable",
  "Assignments", "Exams", "Notes", "Flashcards", "PracticeTests",
  "StudyGroups", "GradeTracker", "Analytics", "Files", "Calculator",
  "MathSolver", "AIAssistant", "FocusTimer", "Settings",
];
const ACCENTS = ["violet", "blue", "green", "orange", "pink", "red", "teal"];
const MOBILE_W = 390;
const MOBILE_H = 844;

function fail(msg) {
  console.error(`ACCENT-DARK-SWEEP PRECONDITION FAILED: ${msg}`);
  process.exit(1);
}

async function restoreRestingState(page) {
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } }).catch(() => {});
}

const CHECKER = `(() => {
  const lum = (r, g, b) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const parse = (c) => {
    if (!c) return null;
    let m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(',').map(s => parseFloat(s));
    if (parts.length < 3 || parts.some(p => isNaN(p))) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const effectiveBg = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      const bg = parse(cs.backgroundColor);
      if (bg && bg.a > 0.85) return bg;
      node = node.parentElement;
    }
    const bodyBg = parse(getComputedStyle(document.body).backgroundColor);
    // S81/AH10 (audit-tools repair): the body fallback must fire on a
    // TRANSPARENT body too — parse() returns a truthy {0,0,0,a:0} for
    // rgba(0,0,0,0), so the bodyBg-or-fallback form NEVER fell back and every
    // glass-backed (alpha 0.8 < 0.85) text measured against phantom
    // BLACK — false unreadable detections across the LIGHT sweep family
    // (the dark family's own fallback is near-black, masking the bug).
    return bodyBg && bodyBg.a > 0.85 ? bodyBg : { r: 9, g: 9, b: 11, a: 1 };
  };
  const flashbulbs = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('main *, aside *, header *, [role=dialog] *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const bg = parse(cs.backgroundColor);
    if (!bg || bg.a <= 0.9) continue;
    const L = lum(bg.r, bg.g, bg.b);
    if (L <= 0.80) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 40 || rect.height < 20) continue;
    const cls = (el.className && el.className.toString) ? el.className.toString() : '';
    if (/sf-gradient|UserAvatar|avatar/.test(cls)) continue;
    const key = cls.slice(0, 60) + '|' + Math.round(rect.width) + 'x' + Math.round(rect.height);
    if (seen.has(key)) continue;
    seen.add(key);
    flashbulbs.push({ cls: cls.slice(0, 70), bg: cs.backgroundColor, tag: el.tagName, w: Math.round(rect.width), h: Math.round(rect.height), text: (el.textContent || '').trim().slice(0, 30) });
    if (flashbulbs.length >= 12) break;
  }
  const unreadable = [];
  const lowcontrast = [];
  for (const el of document.querySelectorAll('main *, aside *, header *, [role=dialog] *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') continue;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) continue;
    const bg = effectiveBg(el);
    const c = contrast(lum(fg.r, fg.g, fg.b), lum(bg.r, bg.g, bg.b));
    const cls = (el.className && el.className.toString) ? el.className.toString() : '';
    const entry = { text: (el.textContent || '').trim().slice(0, 26), color: cs.color, bgEff: 'rgb(' + bg.r + ',' + bg.g + ',' + bg.b + ')', contrast: +c.toFixed(2), cls: cls.slice(0, 66) };
    if (c < 2.2) { unreadable.push(entry); if (unreadable.length >= 10) continue; }
    else if (c < 3.2) { lowcontrast.push(entry); if (lowcontrast.length >= 14) continue; }
  }
  return JSON.stringify({ flashbulbs, unreadable, lowcontrast, scrollWidth: document.documentElement.scrollWidth });
})()`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

try {
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });

  const out = {
    mode: "dark",
    mobileViewport: { width: MOBILE_W, height: MOBILE_H },
    applied: {},
    desktop: {},
    mobile: {},
  };

  for (const accent of ACCENTS) {
    // --- the accent through the REAL lifecycle (S27) + the applied self-verification (S38) ---
    const patch = await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "dark", accentColor: accent } });
    if (!patch.ok()) {
      await restoreRestingState(page);
      fail(`the settings PATCH answered ${patch.status()} for accent ${accent} — the sweep refuses to measure an unverified accent.`);
    }
    await page.goto(`${BASE}/Dashboard`);
    try {
      await page.waitForFunction(
        (a) => document.documentElement.dataset.accent === a && document.documentElement.classList.contains("dark"),
        accent,
        { timeout: 30000 },
      );
    } catch {
      await restoreRestingState(page);
      fail(`the accent ${accent} never applied through the real lifecycle (data-accent=${await page.evaluate(() => document.documentElement.dataset.accent)}, dark=${await page.evaluate(() => document.documentElement.classList.contains("dark"))}) — the sweep refuses to measure the wrong accent.`);
    }
    const applied = await page.evaluate(() => document.documentElement.dataset.accent);
    if (applied !== accent) {
      await restoreRestingState(page);
      fail(`the applied accent is ${applied}, expected ${accent} — the sweep refuses to measure the wrong accent.`);
    }
    out.applied[accent] = applied;

    // Desktop pass (1280×800 — every view recorded explicitly; the S38 shape)
    out.desktop[accent] = {};
    for (const v of VIEWS) {
      await page.goto(`${BASE}/${v}`);
      await page.waitForTimeout(1400);
      const parsed = JSON.parse(await page.evaluate(CHECKER));
      out.desktop[accent][v] = parsed;
    }

    // Mobile pass (same browser CONTEXT so the sf_session cookie rides along)
    // — the S38 extension: ALL 20 views (the pre-S38 MOBILE_VIEWS pass
    // covered only 6; the other 14 had never been rendered in dark ×
    // accent at the stacked mobile layout by any standing audit).
    out.mobile[accent] = {};
    const mobile = await context.newPage();
    await mobile.setViewportSize({ width: MOBILE_W, height: MOBILE_H });
    await mobile.goto(`${BASE}/Dashboard`);
    await mobile.waitForTimeout(1200);
    const mInner = await mobile.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
    if (mInner.w !== MOBILE_W || mInner.h !== MOBILE_H) {
      await restoreRestingState(page);
      await mobile.close();
      fail(`the mobile viewport applied as ${mInner.w}×${mInner.h}, expected ${MOBILE_W}×${MOBILE_H} — the sweep refuses to measure at another size.`);
    }
    for (const v of VIEWS) {
      await mobile.goto(`${BASE}/${v}`);
      await mobile.waitForTimeout(1400);
      if (v === "Settings") {
        // open the Avatar tab (the emoji grid — selected swatch is accent-tinted)
        try { await mobile.getByRole("tab", { name: /avatar/i }).click(); await mobile.waitForTimeout(600); } catch {}
      }
      const parsed = JSON.parse(await mobile.evaluate(CHECKER));
      out.mobile[accent][v] = parsed;
    }
    // Drawer open state — recorded UNCONDITIONALLY per accent (the S38
    // shape): linkCount + the detector family; the guarded catch records
    // the error as a FINDING-class record (the seam counts it), never a
    // swallow.
    try {
      await mobile.goto(`${BASE}/Dashboard`);
      await mobile.waitForTimeout(900);
      await mobile.getByRole("button", { name: "Open navigation menu" }).click();
      const dialog = mobile.getByRole("dialog");
      await dialog.waitFor({ state: "visible", timeout: 10000 });
      await mobile.waitForTimeout(700);
      const dr = JSON.parse(await mobile.evaluate(CHECKER));
      const linkCount = await mobile.evaluate(() => document.querySelectorAll('[role=dialog] a').length);
      if (linkCount !== VIEWS.length) {
        await restoreRestingState(page);
        await mobile.close();
        fail(`the drawer carried ${linkCount} links under accent ${accent} (expected ${VIEWS.length}) — the navigation census broke.`);
      }
      out.mobile[accent]["(drawer)"] = { linkCount, flashbulbs: dr.flashbulbs, unreadable: dr.unreadable, lowcontrast: dr.lowcontrast };
    } catch (e) {
      out.mobile[accent]["(drawer)"] = { linkCount: 0, flashbulbs: [], unreadable: [], lowcontrast: [], error: String(e).slice(0, 140) };
    }
    await mobile.close();
    console.error(`accent ${accent} (${applied}) done — ${Object.keys(out.desktop[accent]).length} desktop + ${Object.keys(out.mobile[accent]).length} mobile records`);
    // incremental flush — a later crash must not lose earlier accents
    const { writeFileSync } = await import("node:fs");
    writeFileSync("/tmp/accent-sweep-partial.json", JSON.stringify(out, null, 1));
  }

  // Restore the dev user resting state (light + violet) — explicit, awaited,
  // and verified (never RELY on it being already correct).
  await restoreRestingState(page);
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(
    () => document.documentElement.dataset.accent === "violet" && !document.documentElement.classList.contains("dark"),
    undefined,
    { timeout: 30000 },
  );
  await browser.close();
  console.log(JSON.stringify(out, null, 1));
} catch (e) {
  // The failure-path restore: a crashed sweep never leaves the dev user in
  // dark × a random accent (the S37 pattern).
  await restoreRestingState(page).catch(() => {});
  console.error(`ACCENT-DARK-SWEEP CRASHED: ${e}`);
  process.exit(1);
}

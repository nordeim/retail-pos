// Dark-mode consistency sweep for the clone (session-10 audit; S27 repair).
// Logs in, enables dark mode THROUGH THE REAL APPLICATION PATH (the settings
// API + the S11 pre-paint/auth-corrected lifecycle — never a forced class:
// the session-10 forcing silently rotted after S11), visits all 20 views,
// and flags:
//  - "flashbulb" surfaces: opaque light backgrounds (luminance > 0.80) at least 40x40px on the dark canvas
//  - unreadable text: contrast(text, effective bg) < 2.2
// Effective background = walk up ancestors until an opaque bg is found.
// S27 self-verifying precondition: the sweep FAILS LOUDLY (non-zero exit)
// if the dark class is not applied at sweep time — it never silently
// measures the wrong mode; the applied mode rides the JSON envelope.
// Restores light at the end (the dev user resting state).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const VIEWS = [
  "Dashboard", "MyDay", "Tasks", "Calendar", "Events", "Timetable",
  "Assignments", "Exams", "Notes", "Flashcards", "PracticeTests",
  "StudyGroups", "GradeTracker", "Analytics", "Files", "Calculator",
  "MathSolver", "AIAssistant", "FocusTimer", "Settings",
];

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
      const img = cs.backgroundImage;
      if (img && img !== 'none' && img.includes('rgb(') && !img.includes('var(')) {
        const first = parse(img);
        if (first && first.a > 0.85) return first;
      }
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
  for (const el of document.querySelectorAll('main *, aside *, header *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const bg = parse(cs.backgroundColor);
    if (!bg || bg.a <= 0.9) continue;
    const L = lum(bg.r, bg.g, bg.b);
    if (L <= 0.80) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 40 || rect.height < 20) continue;
    // skip the brand avatar + gradient CTAs (intentional vivid accents)
    const cls = (el.className && el.className.toString) ? el.className.toString() : '';
    if (/sf-gradient|UserAvatar|avatar/.test(cls)) continue;
    const key = cls.slice(0, 60) + '|' + Math.round(rect.width) + 'x' + Math.round(rect.height);
    if (seen.has(key)) continue;
    seen.add(key);
    flashbulbs.push({ cls: cls.slice(0, 70), bg: cs.backgroundColor, tag: el.tagName, w: Math.round(rect.width), h: Math.round(rect.height), text: (el.textContent || '').trim().slice(0, 30) });
    if (flashbulbs.length >= 12) break;
  }
  const unreadable = [];
  for (const el of document.querySelectorAll('main *, aside *')) {
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
    if (c < 2.2) {
      const cls = (el.className && el.className.toString) ? el.className.toString() : '';
      unreadable.push({ text: (el.textContent || '').trim().slice(0, 26), color: cs.color, bgEff: 'rgb(' + bg.r + ',' + bg.g + ',' + bg.b + ')', contrast: +c.toFixed(2), cls: cls.slice(0, 60) });
      if (unreadable.length >= 12) break;
    }
  }
  return JSON.stringify({ flashbulbs, unreadable });
})()`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${BASE}/login`);
await page.fill("input[type=email]", "demo@studyflow.app");
await page.fill("input[type=password]", "Demo1234!");
await page.click("button[type=submit]");
await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
// S27 — set dark mode through the REAL application path (the settings API
// → server persistence → the S11 pre-paint boot cache → auth-confirmed
// loadFromUser) and SELF-VERIFY the precondition before sweeping. The
// session-10 approach (forced class + localStorage["sf-theme-mode"]) silently
// rotted when the S11 lifecycle added the pre-paint cache + auth correction:
// that key is read by NOTHING (the real cache key is "sf-theme"), and the
// user's stored light preference corrected the forced class on the very next
// full load — the sweep measured LIGHT mode and reported 97 phantom
// flashbulbs. A probe that cannot verify its own mode must fail loudly, never
// emit findings that look like findings (the AP-69/AP-70 lesson applied to
// tooling; AGENTS.md dark-sweep entry).
const patch = await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "dark" } });
if (!patch.ok()) {
  console.error(`DARK-SWEEP PRECONDITION FAILED: the settings PATCH answered ${patch.status()} — the sweep refuses to measure the wrong mode (see AGENTS.md dark-sweep entry).`);
  process.exit(1);
}
await page.goto(`${BASE}/Dashboard`);
try {
  // Gate on the OBSERVABLE end state (the S16 lesson — never a fixed sleep):
  // the class must arrive through the real lifecycle, never a probe side-channel.
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"), null, { timeout: 30000 });
} catch {
  console.error("DARK-SWEEP PRECONDITION FAILED: the dark class never applied through the real lifecycle — the sweep refuses to measure the wrong mode (see AGENTS.md dark-sweep entry).");
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });
  process.exit(1);
}
const mode = await page.evaluate(() => (document.documentElement.classList.contains("dark") ? "dark" : ""));
if (mode !== "dark") {
  console.error("DARK-SWEEP PRECONDITION FAILED: the applied mode is not dark — the sweep refuses to measure the wrong mode (see AGENTS.md dark-sweep entry).");
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });
  process.exit(1);
}
console.log("MODE:", mode);

const out = {};
for (const v of VIEWS) {
  await page.goto(`${BASE}/${v}`);
  await page.waitForTimeout(1800);
  const r = await page.evaluate(CHECKER);
  out[v] = JSON.parse(r);
}
// S27 — restore the dev user resting state (light) BEFORE closing: the
// PATCH is awaited so it can never be aborted in-flight (the theme-spec
// lesson — an aborted restore persists dark and poisons later light pins).
await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light" } });
await browser.close();
console.log(JSON.stringify({ mode, views: out }, null, 1));

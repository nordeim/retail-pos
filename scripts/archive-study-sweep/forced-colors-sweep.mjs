// Forced-colors (Windows High Contrast) sweep — session-12 audit.
// Chromium forcedColors emulation over all 20 views (desktop) + the mobile
// drawer, detecting:
//  - invisible text: computed fg vs effective-bg contrast < 2.2 (the forced
//    palette makes most text CanvasText/Canvas — anything below the bar is a
//    real forced-colors defect, e.g. author colors surviving on images)
//  - unbounded interactives: buttons/links/inputs with no border, no
//    background, no icon, no text (completely invisible islands)
//  - state-indication loss probes (view-specific): calendar selected/today
//    cells, task checkbox, assignment slider track/range/thumb, analytics SVG
//    chart fills, settings active tab, sidebar active link
//  - focus visibility: Tab-focus reads the focused element's outline (the
//    shadcn `focus-visible:outline-none` + ring family is wiped in
//    forced-colors — box-shadow rings do not survive)
// Also captures evidence screenshots to /tmp/fc-evidence/ and probes the
// REFERENCE app under the same emulation for the platform baseline.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const REF = "https://omni-study1.base44.app";
const OUT = "/tmp/fc-evidence";
mkdirSync(OUT, { recursive: true });

const VIEWS = [
  "Dashboard", "MyDay", "Tasks", "Calendar", "Events", "Timetable",
  "Assignments", "Exams", "Notes", "Flashcards", "PracticeTests",
  "StudyGroups", "GradeTracker", "Analytics", "Files", "Calculator",
  "MathSolver", "AIAssistant", "FocusTimer", "Settings",
];
// Views with dedicated stateful probes.
const PROBED = {
  Calendar: "calendar",
  Tasks: "checkbox",
  Assignments: "slider",
  Analytics: "charts",
  Settings: "tabs",
};

const CHECKER = `(() => {
  const lum = (r, g, b) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const parse = (c) => {
    if (!c) return null;
    const m = c.match(/rgba?\\(([^)]+)\\)/);
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
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const invisible = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('main *, aside *, header *, [role=dialog] *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
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
      const key = cls.slice(0, 50) + '|' + cs.color;
      if (seen.has(key)) continue;
      seen.add(key);
      invisible.push({ text: (el.textContent || '').trim().slice(0, 26), color: cs.color, bg: 'rgb(' + bg.r + ',' + bg.g + ',' + bg.b + ')', contrast: +c.toFixed(2), cls: cls.slice(0, 60) });
      if (invisible.length >= 10) break;
    }
  }
  const unbounded = [];
  for (const el of document.querySelectorAll('main button, main a, main input, main select, aside button, aside a, [role=dialog] button')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || el.offsetParent === null) continue;
    const hasBorder = ['borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth'].some(p => parseFloat(cs[p]) > 0 && cs.borderTopStyle !== 'none');
    const bg = parse(cs.backgroundColor);
    const hasBg = bg && bg.a > 0.1;
    const hasIcon = !!el.querySelector('svg, img');
    const hasText = (el.textContent || '').trim().length > 0;
    if (!hasBorder && !hasBg && !hasIcon && !hasText) {
      unbounded.push({ tag: el.tagName, label: (el.getAttribute('aria-label') || '').slice(0, 30), cls: (el.className || '').toString().slice(0, 60) });
      if (unbounded.length >= 8) break;
    }
  }
  return JSON.stringify({ invisible, unbounded });
})()`;

const STATE_PROBES = {
  calendar: `(() => {
    const cells = [...document.querySelectorAll('[aria-label*=Calendar] button, .grid button')].filter(b => b.getAttribute('aria-pressed') !== null || b.hasAttribute('data-today'));
    const selected = cells.find(b => b.getAttribute('aria-pressed') === 'true');
    const today = cells.find(b => b.hasAttribute('data-today') && b.getAttribute('aria-pressed') !== 'true');
    const normal = cells.find(b => !b.hasAttribute('data-today') && b.getAttribute('aria-pressed') !== 'true');
    const m = (el) => el ? (() => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, color: cs.color, border: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor }; })() : null;
    return JSON.stringify({ selected: m(selected), today: m(today), normal: m(normal) });
  })()`,
  checkbox: `(() => {
    const cb = document.querySelector('main button[role=checkbox]') || document.querySelector('main input[type=checkbox]');
    if (!cb) return JSON.stringify({ found: false });
    const cs = getComputedStyle(cb);
    const inner = cb.querySelector('svg');
    return JSON.stringify({ found: true, border: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor, bg: cs.backgroundColor, color: cs.color, iconStroke: inner ? getComputedStyle(inner).color : null, ariaChecked: cb.getAttribute('aria-checked') });
  })()`,
  slider: `(() => {
    const thumb = document.querySelector('[role=slider]');
    const track = thumb ? thumb.closest('[role=slider]').parentElement.querySelector('div') : null;
    const fill = document.querySelector('[data-slot=slider-fill]');
    const m = (el) => el ? (() => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, bgImg: cs.backgroundImage === 'none' ? 'none' : cs.backgroundImage.slice(0, 60), border: cs.borderTopWidth + ' ' + cs.borderTopColor }; })() : null;
    return JSON.stringify({ thumb: m(thumb), fill: m(fill) });
  })()`,
  charts: `(() => {
    const paths = [...document.querySelectorAll('main svg path, main svg circle, main svg line')].slice(0, 6);
    return JSON.stringify(paths.map(p => { const cs = getComputedStyle(p); return { fill: cs.fill, stroke: cs.stroke, d: (p.getAttribute('d') || '').slice(0, 24) }; }));
  })()`,
  tabs: `(() => {
    const active = document.querySelector('[role=tab][data-state=active], [role=tab][aria-selected=true]');
    const inactive = document.querySelector('[role=tab][data-state=inactive], [role=tab]:not([aria-selected=true])');
    const m = (el) => el ? (() => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, color: cs.color, border: cs.borderBottomWidth + ' ' + cs.borderBottomColor }; })() : null;
    return JSON.stringify({ active: m(active), inactive: m(inactive) });
  })()`,
};

async function focusProbe(page) {
  // Move focus into the page: sidebar link first, then into main content.
  const results = [];
  await page.keyboard.press("Tab"); // brand/first focusable
  await page.keyboard.press("Tab");
  for (let i = 0; i < 6; i++) {
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { body: true };
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName,
        label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24),
        outline: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`,
        outlineVisible: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0,
        boxShadow: cs.boxShadow === "none" ? "none" : "has-ring",
      };
    });
    results.push(info);
    await page.keyboard.press("Tab");
  }
  return results;
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  forcedColors: "active",
  colorScheme: "light",
});
const page = await context.newPage();
await page.goto(`${BASE}/login`);
await page.fill("input[type=email]", "demo@studyflow.app");
await page.fill("input[type=password]", "Demo1234!");
await page.click("button[type=submit]");
await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
await page.waitForTimeout(1500);

const out = { clone: { views: {}, states: {}, focus: {} }, evidence: {} };

for (const v of VIEWS) {
  await page.goto(`${BASE}/${v}`);
  await page.waitForTimeout(1400);
  const parsed = JSON.parse(await page.evaluate(CHECKER));
  const focus = v === "Dashboard" || v === "Tasks" ? await focusProbe(page) : null;
  if (parsed.invisible.length || parsed.unbounded.length || focus) {
    out.clone.views[v] = parsed;
    if (focus) out.clone.focus[v] = focus;
  }
  if (PROBED[v]) {
    out.clone.states[v] = JSON.parse(await page.evaluate(STATE_PROBES[PROBED[v]]));
  }
  if (["Dashboard", "Calendar", "Tasks", "Analytics", "Assignments", "Timetable"].includes(v)) {
    await page.screenshot({ path: `${OUT}/clone-${v}-fc.png` });
  }
  console.error(`view ${v} done`);
}

// Mobile drawer under forced colors
const mobile = await context.newPage();
await mobile.setViewportSize({ width: 390, height: 844 });
await mobile.goto(`${BASE}/Dashboard`);
await mobile.waitForTimeout(1200);
try {
  await mobile.getByRole("button", { name: "Open navigation menu" }).click();
  await mobile.waitForTimeout(700);
  const drawerProbe = await mobile.evaluate(CHECKER);
  out.clone.views["(mobile drawer)"] = JSON.parse(drawerProbe);
  await mobile.screenshot({ path: `${OUT}/clone-mobile-drawer-fc.png` });
} catch (e) {
  out.clone.views["(mobile drawer)"] = { error: String(e).slice(0, 120) };
}
await mobile.close();

// Reference baseline under the same emulation
const refCtx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  forcedColors: "active",
  colorScheme: "light",
});
const ref = await refCtx.newPage();
await ref.goto(`${REF}/login`);
await ref.fill("input[type=email]", "sepnetflix2023@outlook.com");
await ref.fill("input[type=password]", "$Abcd1234");
await ref.click("button[type=submit]");
await ref.waitForTimeout(5000);
try {
  const refProbe = JSON.parse(await ref.evaluate(CHECKER));
  const refActive = await ref.evaluate(`(() => {
    const links = [...document.querySelectorAll('aside a, nav a')];
    const active = links.find(a => a.getAttribute('aria-current') || /bg-violet|text-violet/.test(a.className || ''));
    const normal = links.find(a => a !== active);
    const m = (el) => el ? (() => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, color: cs.color }; })() : null;
    return JSON.stringify({ activeCount: links.length, active: m(active), normal: m(normal) });
  })()`);
  out.reference = { dashboard: refProbe, nav: JSON.parse(refActive) };
  await ref.screenshot({ path: `${OUT}/reference-Dashboard-fc.png` });
} catch (e) {
  out.reference = { error: String(e).slice(0, 200) };
}
await refCtx.close();

writeFileSync("/tmp/fc-sweep.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await browser.close();

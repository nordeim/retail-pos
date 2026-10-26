// Print audit — session-12. Real page.pdf() output + print-media DOM probes,
// in LIGHT and DARK mode:
//  1. print-media text colors per view (dark mode: the boot script's
//     beforeprint handler must un-theme — emulateMedia alone does NOT fire
//     the event, so the probe dispatches it, mirroring the real pipeline)
//  2. real PDFs of the printable views (Dashboard/Timetable/Assignments/
//     Calendar), light + dark, A4 with default margins
//  3. content-overflow check: elements wider than the printable area
//     (the timetable min-w-[900px] inside overflow-x-auto)
// Light-text detection respects print-color-adjust: exact — text on an
// essential background that PRINTS is not invisible.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "/tmp/print-audit";
mkdirSync(OUT, { recursive: true });

const VIEWS = [
  "Dashboard", "MyDay", "Tasks", "Calendar", "Events", "Timetable",
  "Assignments", "Exams", "Notes", "Flashcards", "PracticeTests",
  "StudyGroups", "GradeTracker", "Analytics", "Files", "Calculator",
  "MathSolver", "AIAssistant", "FocusTimer", "Settings",
];
const PRINTABLE = ["Dashboard", "Timetable", "Assignments", "Calendar"];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
await page.goto(`${BASE}/login`);
await page.fill("input[type=email]", "demo@studyflow.app");
await page.fill("input[type=password]", "Demo1234!");
await page.click("button[type=submit]");
await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });
await page.waitForTimeout(1200);

async function setMode(mode) {
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: mode } });
}

// ---------- 1. print-media text color audit, both modes ----------
const out = { lightPrint: {}, darkPrint: {}, overflow: {}, pdfs: [] };

for (const mode of ["light", "dark"]) {
  await setMode(mode);
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(
    (m) => (m === "dark") === document.documentElement.classList.contains("dark"),
    mode,
    { timeout: 8000 },
  );
  const target = mode === "light" ? out.lightPrint : out.darkPrint;
  for (const v of VIEWS) {
    await page.goto(`${BASE}/${v}`);
    await page.waitForTimeout(1300);
    await page.emulateMedia({ media: "print" });
    // Mirror the real print pipeline: Chromium fires beforeprint when a
    // print dialog/page.pdf() starts — emulateMedia alone does not. The
    // boot script's handler un-themes dark for the print duration.
    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    await page.waitForTimeout(300);
    const r = await page.evaluate(`(() => {
      const lum = (r, g, b) => {
        const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const parse = (c) => {
        const m = c && c.match(/rgba?\\(([^)]+)\\)/);
        if (!m) return null;
        const p = m[1].split(',').map(s => parseFloat(s));
        return { r: p[0], g: p[1], b: p[2] };
      };
      const bad = [];
      const seen = new Set();
      const essentialBg = (el) => {
        // Walk the ancestor chain: print-color-adjust: exact surfaces PRINT
        // their backgrounds (incl. opaque inline colors) — light text on
        // them is readable by design (the S12-C2 fix).
        let node = el;
        while (node && node !== document.documentElement) {
          const cs = getComputedStyle(node);
          if ((cs.printColorAdjust || '') === 'exact') {
            const bg = cs.backgroundColor;
            const m = bg && bg.match(/rgba?\(([^)]+)\)/);
            if (m) {
              const p = m[1].split(',').map(s => parseFloat(s));
              const opaque = p.length < 4 || p[3] > 0.9;
              const tinted = p[0] < 240 || p[1] < 240 || p[2] < 240;
              if (opaque && tinted) return true;
            }
            const img = cs.backgroundImage;
            if (img && img !== 'none') return true;
          }
          node = node.parentElement;
        }
        return false;
      };
      for (const el of document.querySelectorAll('main h1, main h2, main h3, main p, main span, main button, main a, main label, main td, main th, main li')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none') continue;
        const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
        if (!hasText) continue;
        const fg = parse(cs.color);
        if (!fg) continue;
        const L = lum(fg.r, fg.g, fg.b);
        // print body is forced white — light text (L > 0.85 white-ish) is
        // invisible UNLESS it sits on an essential background that prints
        if (L > 0.85 && !essentialBg(el)) {
          const key = cs.color + '|' + (el.className || '').toString().slice(0, 40);
          if (seen.has(key)) continue;
          seen.add(key);
          bad.push({ text: (el.textContent || '').trim().slice(0, 22), color: cs.color, cls: (el.className || '').toString().slice(0, 50) });
          if (bad.length >= 8) break;
        }
      }
      return JSON.stringify({ lightTextCount: bad.length, samples: bad });
    })()`);
    target[v] = JSON.parse(r);
    await page.emulateMedia({ media: "screen" });
  }
  console.error(`print-media pass (${mode}) done`);
}

// ---------- 2. real PDFs ----------
// Playwright's page.pdf() applies the print stylesheet most faithfully when
// the page is already emulating print media (the real Ctrl+P pipeline —
// without it the layout pass can keep the screen-width geometry and clip
// the wide timetable at min-w-[900px]; measured empirically).
await setMode("light");
await page.goto(`${BASE}/Dashboard`);
await page.waitForTimeout(1000);
for (const v of PRINTABLE) {
  await page.goto(`${BASE}/${v}`);
  await page.waitForTimeout(1600);
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: `${OUT}/${v}-light.pdf`, format: "A4", printBackground: true });
  await page.emulateMedia({ media: "screen" });
  out.pdfs.push(`${v}-light.pdf`);
}
await setMode("dark");
await page.goto(`${BASE}/Dashboard`);
await page.waitForFunction(() => document.documentElement.classList.contains("dark"), undefined, { timeout: 8000 });
for (const v of ["Dashboard", "Timetable"]) {
  await page.goto(`${BASE}/${v}`);
  await page.waitForTimeout(1600);
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: `${OUT}/${v}-dark.pdf`, format: "A4", printBackground: true });
  await page.emulateMedia({ media: "screen" });
  out.pdfs.push(`${v}-dark.pdf`);
}
await setMode("light");

// ---------- 3. overflow check under print emulation ----------
await page.goto(`${BASE}/Dashboard`);
await page.waitForTimeout(800);
await page.emulateMedia({ media: "print" });
for (const v of PRINTABLE) {
  await page.goto(`${BASE}/${v}`);
  await page.waitForTimeout(1300);
  const r = await page.evaluate(`(() => {
    // A4 portrait printable width at 96dpi with default 0.4in margins ≈ 718px
    const LIMIT = 718;
    const wide = [];
    for (const el of document.querySelectorAll('main *')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none') continue;
      const w = el.getBoundingClientRect().width + el.getBoundingClientRect().left;
      if (w > LIMIT + 2 && el.scrollWidth >= el.clientWidth) {
        wide.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 60), right: Math.round(w) });
        if (wide.length >= 5) break;
      }
    }
    return JSON.stringify({ overflowRight: wide, bodyScrollW: document.body.scrollWidth });
  })()`);
  out.overflow[v] = JSON.parse(r);
}
await page.emulateMedia({ media: "screen" });

writeFileSync("/tmp/print-audit.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify({ lightPrint: summarize(out.lightPrint), darkPrint: summarize(out.darkPrint), overflow: out.overflow, pdfs: out.pdfs }, null, 1));

function summarize(t) {
  const s = {};
  for (const [v, r] of Object.entries(t)) s[v] = r.lightTextCount;
  return s;
}
await browser.close();

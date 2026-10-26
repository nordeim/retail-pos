// Session-78 targeted probe: the dashboard section-action inner button's
// border-radius + hover background on BOTH hosts. The s78 stat-card dump
// surfaced a 6px-vs-0px radius delta on the transparent inner button;
// this probe measures whether it is VISIBLE (hover background paint) or
// cosmetic-only, and re-reads the ref's exact anatomy for the record.
// Usage: node scripts/sectionaction-probe-s78.mjs
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

async function measure(page) {
  return page.evaluate(async () => {
    const main = document.querySelector("main");
    const h2s = [...main.querySelectorAll("h2")].filter((h) => /Upcoming Exams/.test(h.textContent ?? ""));
    if (h2s.length === 0) return { error: "no exams heading" };
    // Walk up from the heading until we find a container holding an "All"-link.
    let scope = h2s[0];
    let a = null;
    for (let i = 0; i < 8 && scope && !a; i++) {
      scope = scope.parentElement;
      if (!scope) break;
      a = [...scope.querySelectorAll("a")].find((x) => /^All\b/.test(x.textContent.trim()) || /^View All\b/.test(x.textContent.trim()));
    }
    if (!a) return { error: "no All link in heading chain" };
    const btn = a.querySelector("button") ?? a;
    const read = (el) => {
      const s = getComputedStyle(el);
      return {
        radius: s.borderRadius, bg: s.backgroundColor, border: s.border,
        hoverBg: s.getPropertyValue("--hover-bg") || null,
        cls: (el.getAttribute("class") || "").slice(0, 120),
      };
    };
    const base = read(btn);
    // Probe the stylesheet hover rule for the button's class list.
    let hoverBg = "none";
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      if (!rules) continue;
      for (const rule of rules) {
        if (!(rule instanceof CSSStyleRule) || !rule.selectorText.includes(":hover")) continue;
        try {
          if (btn.matches(rule.selectorText.split(":hover")[0] + ":hover")) {
            if (rule.style.backgroundColor) hoverBg = rule.style.backgroundColor;
          }
        } catch { /* selector may not be a valid hover prefix */ }
      }
    }
    return { anchor: read(a), button: base, hoverBgFromSheets: hoverBg, btnTag: btn.tagName };
  });
}

const browser = await chromium.launch();
try {
  const refCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const refPage = await refCtx.newPage();
  await loginRef(refPage);
  const refM = await measure(refPage);
  await refCtx.close();

  const clCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const clPage = await clCtx.newPage();
  await loginClone(clPage);
  const clM = await measure(clPage);
  await clCtx.close();

  console.log(JSON.stringify({ ref: refM, clone: clM }, null, 1));
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

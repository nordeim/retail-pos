// Session-69 probe: precise DOM measurements for the Batch-Z drift candidates
// found by the 69-ref/69-clone screenshot sweep. Both hosts, light mode,
// 1440x900. AP-111 discipline: dump computed styles + geometry, pin from the
// identified node, never from the screenshot alone.
// Usage: node scripts/z-probe-s69.mjs   (clone :3200 standalone first)
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const CLONE = "http://localhost:3200";

// Section-header + empty-state icon and grid probe (dashboard)
async function dashboardProbe(page) {
  return page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    // the stats row + section grid templates
    const grids = [...main.querySelectorAll("div")].filter((d) => {
      const t = getComputedStyle(d).gridTemplateColumns;
      return t && t.split(" ").length >= 2 && d.querySelector("h2");
    }).map((d) => ({
      cols: getComputedStyle(d).gridTemplateColumns,
      gap: getComputedStyle(d).gap,
      childSpans: [...d.children].map((c) => ({
        colSpan: getComputedStyle(c).gridColumn,
        w: Math.round(c.getBoundingClientRect().width),
        h2: c.querySelector("h2")?.textContent.trim() || null,
      })),
    }));
    // every h2 section header: text + the svg icon INSIDE the same flex row
    const headers = [...main.querySelectorAll("h2")].map((h) => {
      const row = h.closest("div");
      const svg = row?.querySelector("svg");
      const cls = svg?.getAttribute("class") || "";
      const box = svg ? svg.getBoundingClientRect() : null;
      return {
        text: h.textContent.trim(),
        icon: (cls.match(/lucide-[a-z0-9-]+/g) || []).join(","),
        size: box ? `${Math.round(box.width)}x${Math.round(box.height)}` : null,
      };
    });
    // empty-state rows inside section cards: icon svg + text
    const empties = [...main.querySelectorAll("h3")].map((h) => {
      const block = h.parentElement;
      const svg = block?.querySelector("svg");
      return {
        text: h.textContent.trim(),
        icon: svg ? (svg.getAttribute("class").match(/lucide-[a-z0-9-]+/g) || []).join(",") : null,
        siblings: [...(block?.children || [])].map((c) => c.textContent.trim()).slice(0, 4),
      };
    });
    // links that read View All / All in section headers
    const links = [...main.querySelectorAll("a")].map((a) => a.textContent.trim()).filter((t) => /view all|^all$/i.test(t));
    return { grids, headers, empties, links };
  });
}

// My Day container + quick-add row probe
async function mydayProbe(page) {
  return page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const input = main.querySelector('input[placeholder*="task"], input[placeholder*="Add"]');
    const row = input ? input.closest("div.flex") || input.parentElement : null;
    const moreBtn = [...main.querySelectorAll("button")].find((b) => /more options/i.test(b.textContent));
    const mb = moreBtn?.getBoundingClientRect();
    const mcs = moreBtn ? getComputedStyle(moreBtn) : null;
    const inputBox = input?.getBoundingClientRect();
    const trailingPlus = row ? row.querySelectorAll("svg").length : 0;
    // the h1 header x (container origin)
    const h1 = main.querySelector("h1");
    const h1x = h1 ? Math.round(h1.getBoundingClientRect().x) : null;
    return {
      h1x,
      input: inputBox ? { x: Math.round(inputBox.x), w: Math.round(inputBox.width), h: Math.round(inputBox.height) } : null,
      rowSvgCount: trailingPlus,
      more: mcs ? {
        x: Math.round(mb.x), w: Math.round(mb.width), h: Math.round(mb.height),
        bg: mcs.backgroundColor, color: mcs.color, radius: mcs.borderRadius, border: mcs.borderColor,
      } : null,
    };
  });
}

// ViewHeader icon probe (gradetracker / practicetests)
async function headerIconProbe(page) {
  return page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const h1 = main.querySelector("h1");
    const row = h1?.parentElement;
    const svg = row?.querySelector("svg");
    return {
      h1: h1?.textContent.trim(),
      icon: svg ? (svg.getAttribute("class").match(/lucide-[a-z0-9-]+/g) || []).join(",") : null,
    };
  });
}

// Practice Tests empty-state wrapper probe
async function ptEmptyProbe(page) {
  return page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const h3 = [...main.querySelectorAll("h3")].find((h) => /no practice tests/i.test(h.textContent));
    if (!h3) return { found: false };
    // walk up to the nearest bordered/boxed ancestor
    let el = h3;
    let boxed = null;
    for (let i = 0; i < 6 && el; i++) {
      el = el.parentElement;
      if (!el) break;
      const cs = getComputedStyle(el);
      if (cs.borderTopWidth !== "0px" || cs.backgroundColor !== "rgba(0, 0, 0, 0)") {
        boxed = { tag: el.tagName, cls: el.className.slice(0, 120), bg: cs.backgroundColor, border: cs.borderTopWidth, radius: cs.borderRadius, w: Math.round(el.getBoundingClientRect().width) };
        break;
      }
    }
    const icon = h3.parentElement?.querySelector("svg");
    return { found: true, boxed, icon: icon ? (icon.getAttribute("class").match(/lucide-[a-z0-9-]+/g) || []).join(",") : null };
  });
}

// Study Groups right-pane empty state probe
async function sgRightProbe(page) {
  return page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const h3 = [...main.querySelectorAll("h3, h2")].find((h) => /select a group/i.test(h.textContent));
    if (!h3) return { found: false };
    const pane = h3.closest("[class*='flex-1']") || h3.parentElement?.parentElement;
    const pcs = pane ? getComputedStyle(pane) : null;
    const icon = h3.parentElement?.querySelector("svg");
    const iconBox = icon ? icon.getBoundingClientRect() : null;
    const h3y = Math.round(h3.getBoundingClientRect().y);
    return {
      found: true,
      paneJustify: pcs?.justifyContent,
      paneAlign: pcs?.alignItems,
      paneH: pane ? Math.round(pane.getBoundingClientRect().height) : null,
      h3y,
      icon: icon ? (icon.getAttribute("class").match(/lucide-[a-z0-9-]+/g) || []).join(",") : null,
      iconBox: iconBox ? `${Math.round(iconBox.width)}x${Math.round(iconBox.height)} @y${Math.round(iconBox.y)}` : null,
    };
  });
}

// Events terminal-panel probe: day headers, bands, New Event row
async function eventsProbe(page) {
  return page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const panel = [...main.querySelectorAll("div")].find((d) => /Events/i.test(d.textContent) && getComputedStyle(d).backgroundColor.includes("15, 23, 42"))
      || main.querySelector("h1")?.parentElement?.parentElement;
    // day headers: strong/b elements reading Today/Tomorrow/Weekday, Month N
    const dayHeads = [...main.querySelectorAll("strong, b, h3, h4, p, div")].filter((el) => {
      const t = el.textContent.trim();
      return /^(Today|Tomorrow|(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), \w+ \d+)$/.test(t) && el.children.length === 0;
    }).slice(0, 4).map((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const band = el.parentElement;
      const bcs = getComputedStyle(band);
      return { text: t2(el), color: cs.color, fw: cs.fontWeight, fs: cs.fontSize, x: Math.round(r.x), y: Math.round(r.y), bandBg: bcs.backgroundColor, bandW: Math.round(band.getBoundingClientRect().width) };
    });
    function t2(el) { return el.textContent.trim(); }
    // "No events" rows
    const noEv = [...main.querySelectorAll("*")].filter((el) => el.children.length === 0 && /^No events\.?$/.test(el.textContent.trim())).slice(0, 2)
      .map((el) => ({ text: el.textContent.trim(), color: getComputedStyle(el).color, fs: getComputedStyle(el).fontSize }));
    // the New Event row
    const newEv = [...main.querySelectorAll("button, a")].find((b) => /new event/i.test(b.textContent));
    const nb = newEv?.getBoundingClientRect();
    const nsvg = newEv?.querySelector("svg");
    return {
      dayHeads, noEv,
      newEvent: newEv ? {
        tag: newEv.tagName, x: Math.round(nb.x), y: Math.round(nb.y), w: Math.round(nb.width),
        color: getComputedStyle(newEv).color,
        icon: nsvg ? (nsvg.getAttribute("class").match(/lucide-[a-z0-9-]+/g) || []).join(",") : null,
        parentJustify: getComputedStyle(newEv.parentElement).justifyContent,
      } : null,
    };
  });
}

// Settings probe: subtitle + appearance structure
async function settingsProbe(page) {
  return page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const sub = [...main.querySelectorAll("p, div")].filter((el) => el.children.length === 0 && /your study|StudyFlow experience/i.test(el.textContent)).slice(0, 2)
      .map((el) => el.textContent.trim());
    // the tablist labels
    const tabs = [...main.querySelectorAll("[role=tab], button")].map((b) => b.textContent.trim()).filter((t) => /^(Appearance|Profile|Subjects|Holidays|Notifications)$/.test(t));
    // appearance content: find Theme/Accent/Avatar labels + card wrappers
    const labels = [...main.querySelectorAll("*")].filter((el) => el.children.length === 0 && /^(Theme|Accent Color|Accent color|Avatar)$/.test(el.textContent.trim())).map((el) => el.textContent.trim());
    // card boxes directly containing a "Theme"/"Accent"/"Avatar" heading
    const cards = [...main.querySelectorAll("div")].filter((d) => {
      const t = d.textContent;
      return /Choose how StudyFlow looks|Customize how StudyFlow looks/.test(t) && d.querySelector("h2, h3");
    }).slice(0, 3).map((d) => {
      const cs = getComputedStyle(d);
      return { bg: cs.backgroundColor, border: cs.borderTopWidth, radius: cs.borderRadius, w: Math.round(d.getBoundingClientRect().width), h: Math.round(d.getBoundingClientRect().height), head: d.querySelector("h2,h3")?.textContent.trim() };
    });
    const saveBtn = [...main.querySelectorAll("button")].find((b) => /save preferences/i.test(b.textContent));
    return { sub, tabs, labels, cards, hasSave: !!saveBtn };
  });
}

const browser = await chromium.launch();
const out = {};
try {
  // reference
  const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const rp = await rctx.newPage();
  await rp.goto(`${REF}/login`, { timeout: 45000 });
  await rp.waitForTimeout(2000);
  await rp.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await rp.fill("input[type=password]", "$Abcd1234");
  await rp.click("button[type=submit]");
  await rp.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await rp.waitForTimeout(2000);
  out.refDash = await dashboardProbe(rp);
  out.refSettings = await settingsProbe(rp);

  await rp.locator("a").filter({ hasText: "My Day" }).first().click();
  await rp.waitForTimeout(1800);
  out.refMyDay = await mydayProbe(rp);

  await rp.locator("a").filter({ hasText: "Grade Tracker" }).first().click();
  await rp.waitForTimeout(1500);
  out.refGtIcon = await headerIconProbe(rp);

  await rp.locator("a").filter({ hasText: "Practice Tests" }).first().click();
  await rp.waitForTimeout(1500);
  out.refPtIcon = await headerIconProbe(rp);
  out.refPtEmpty = await ptEmptyProbe(rp);

  await rp.locator("a").filter({ hasText: "Study Groups" }).first().click();
  await rp.waitForTimeout(1500);
  out.refSgRight = await sgRightProbe(rp);

  await rp.locator("a").filter({ hasText: "Events" }).first().click();
  await rp.waitForTimeout(1800);
  out.refEvents = await eventsProbe(rp);
  await rctx.close();

  // clone (fresh user, light mode)
  const cctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const cp = await cctx.newPage();
  const email = `s69-zprobe-${Date.now()}@studyflow.app`;
  await cp.goto(`${CLONE}/login`, { timeout: 45000 });
  const reg = await cp.request.post(`${CLONE}/api/auth/register`, { data: { email, password: "Fresh1234!", name: "Z Probe" } });
  if (!reg.ok()) throw new Error(`register failed ${reg.status()}`);
  const { code } = await reg.json();
  await cp.request.post(`${CLONE}/api/auth/verify-email`, { data: { email, code } });
  await cp.goto(`${CLONE}/`, { timeout: 45000 });
  await cp.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await cp.waitForTimeout(2000);
  out.cloneDash = await dashboardProbe(cp);
  out.cloneSettings = await settingsProbe(cp);

  await cp.locator("a").filter({ hasText: "My Day" }).first().click();
  await cp.waitForTimeout(1500);
  out.cloneMyDay = await mydayProbe(cp);

  await cp.locator("a").filter({ hasText: "Grade Tracker" }).first().click();
  await cp.waitForTimeout(1200);
  out.cloneGtIcon = await headerIconProbe(cp);

  await cp.locator("a").filter({ hasText: "Practice Tests" }).first().click();
  await cp.waitForTimeout(1200);
  out.clonePtIcon = await headerIconProbe(cp);
  out.clonePtEmpty = await ptEmptyProbe(cp);

  await cp.locator("a").filter({ hasText: "Study Groups" }).first().click();
  await cp.waitForTimeout(1200);
  out.cloneSgRight = await sgRightProbe(cp);

  await cp.locator("a").filter({ hasText: "Events" }).first().click();
  await cp.waitForTimeout(1500);
  out.cloneEvents = await eventsProbe(cp);
  await cctx.close();

  console.log(JSON.stringify(out, null, 1));
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 600) }));
} finally {
  await browser.close();
}

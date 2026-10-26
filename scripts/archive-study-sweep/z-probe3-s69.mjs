// Session-69 probe #3: the remaining Batch-Z unknowns.
// Usage: node scripts/z-probe3-s69.mjs
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${REF}/login`, { timeout: 45000 });
  await p.waitForTimeout(2000);
  await p.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await p.fill("input[type=password]", "$Abcd1234");
  await p.click("button[type=submit]");
  await p.waitForFunction(() => document.querySelectorAll("h1").length > 0, null, { timeout: 45000 });
  await p.waitForTimeout(2500);

  const out = {};

  // 1+2: dashboard All links + section empty rows
  out.dash = await p.evaluate(() => {
    const alls = [...document.querySelectorAll("a, button")].filter((a) => a.textContent.trim() === "All").map((a) => {
      const card = a.closest("div.rounded-2xl, div.bg-white, div[class*=card]") || a.parentElement?.parentElement;
      const cs = getComputedStyle(a);
      const svg = a.querySelector("svg");
      return {
        tag: a.tagName, href: a.getAttribute("href"),
        cardHead: card?.querySelector("h2,h3")?.textContent.trim() || null,
        color: cs.color, fs: cs.fontSize, fw: cs.fontWeight,
        icon: svg ? (svg.getAttribute("class").match(/lucide-[a-z0-9-]+/g) || []).join(",") : null,
        x: Math.round(a.getBoundingClientRect().x), y: Math.round(a.getBoundingClientRect().y),
      };
    });
    const emptyRows = [...document.querySelectorAll("div")].filter((d) => {
      const t = d.textContent.trim();
      return d.children.length <= 2 && d.querySelector("svg") && (/No tasks for today/.test(t) || /No upcoming/.test(t)) && d.getBoundingClientRect().height < 220 && d.getBoundingClientRect().height > 60;
    }).slice(0, 4).map((d) => {
      const svg = d.querySelector("svg");
      const text = [...d.querySelectorAll("*")].filter((e) => e.children.length === 0 && e.textContent.trim().length > 5).map((e) => ({ t: e.textContent.trim(), color: getComputedStyle(e).color, fs: getComputedStyle(e).fontSize }));
      const b = svg.getBoundingClientRect();
      const scs = getComputedStyle(svg.parentElement);
      return {
        icon: (svg.getAttribute("class").match(/lucide-[a-z0-9-]+/g) || []).join(","),
        iconBox: `${Math.round(b.width)}x${Math.round(b.height)}`,
        blockBg: scs.backgroundColor, blockRadius: scs.borderRadius, blockSize: `${Math.round(svg.parentElement.getBoundingClientRect().width)}x${Math.round(svg.parentElement.getBoundingClientRect().height)}`,
        text,
      };
    });
    return { alls, emptyRows };
  });

  // 3: My Day quick-add row svgs
  await p.locator("a").filter({ hasText: "My Day" }).first().click();
  await p.waitForTimeout(1800);
  out.myday = await p.evaluate(() => {
    const input = document.querySelector('input[placeholder*="task"], input[placeholder*="Add"]');
    const row = input ? input.closest("div.flex") || input.parentElement : null;
    const svgs = row ? [...row.querySelectorAll("svg")].map((s) => {
      const b = s.getBoundingClientRect();
      return { icon: (s.getAttribute("class").match(/lucide-[a-z0-9-]+/g) || []).join(","), box: `${Math.round(b.width)}x${Math.round(b.height)} @x${Math.round(b.x)}`, parent: s.parentElement.tagName };
    }) : [];
    const more = [...document.querySelectorAll("button")].find((b) => /more options/i.test(b.textContent));
    return {
      svgs,
      moreInner: more ? { cls: more.className.slice(0, 140), text: more.textContent.trim() } : null,
      rowCls: row?.className.slice(0, 140),
      inputCls: input?.className.slice(0, 140),
    };
  });

  // 4: Events header-row geometry
  await p.locator("a").filter({ hasText: "Events" }).first().click();
  await p.waitForTimeout(1800);
  out.events = await p.evaluate(() => {
    const head = [...document.querySelectorAll("*")].find((el) => el.children.length === 0 && el.textContent.trim() === "Today");
    const bandRow = head?.parentElement;
    const group = bandRow?.nextElementSibling;
    const bcs = bandRow ? getComputedStyle(bandRow) : null;
    const gcs = group ? getComputedStyle(group) : null;
    const panel = bandRow ? bandRow.closest("div[class*='bg-slate-9'], div[class*='rounded']") : null;
    const nb = [...document.querySelectorAll("button")].find((b) => /new event/i.test(b.textContent));
    return {
      bandRow: bcs ? { cls: bandRow.className.slice(0, 120), h: Math.round(bandRow.getBoundingClientRect().height), pad: bcs.padding, bg: bcs.backgroundColor, radius: bcs.borderRadius } : null,
      emptyRow: gcs ? { cls: group.className.slice(0, 120), h: Math.round(group.getBoundingClientRect().height), pad: gcs.padding, bg: gcs.backgroundColor } : null,
      panel: panel ? { cls: panel.className.slice(0, 120), pad: getComputedStyle(panel).padding } : null,
      newEventBtn: nb ? { cls: nb.className.slice(0, 160), justify: getComputedStyle(nb).justifyContent, ta: getComputedStyle(nb).textAlign, pad: getComputedStyle(nb).padding } : null,
      headTextCls: head ? `${head.tagName} ${head.className}` : null,
    };
  });

  // 5: Settings Appearance panel dump
  await p.locator("a").filter({ hasText: "Settings" }).first().click();
  await p.waitForTimeout(1800);
  out.settings = await p.evaluate(() => {
    const sub = [...document.querySelectorAll("p, span, div")].filter((el) => el.children.length === 0 && /customize your studyflow/i.test(el.textContent)).slice(0, 2).map((el) => ({ t: el.textContent.trim(), cls: el.className.slice(0, 80), fs: getComputedStyle(el).fontSize }));
    const h3app = [...document.querySelectorAll("h2,h3,h4")].find((h) => h.textContent.trim() === "Appearance");
    const panel = h3app ? (h3app.closest("div[class*='rounded']")?.parentElement?.closest("div[class*='rounded']") || h3app.closest("div[class*='rounded']")) : null;
    const pcs = panel ? getComputedStyle(panel) : null;
    const labels = [...document.querySelectorAll("*")].filter((el) => el.children.length === 0 && /^(Theme|Accent Color|Avatar)$/.test(el.textContent.trim())).map((el) => ({ t: el.textContent.trim(), cls: el.className.slice(0, 80), fs: getComputedStyle(el).fontSize, fw: getComputedStyle(el).fontWeight, color: getComputedStyle(el).color }));
    const themeBtns = [...document.querySelectorAll("button")].filter((b) => /^(Light|Dark|System)$/.test(b.textContent.trim())).map((b) => {
      const cs = getComputedStyle(b);
      const r = b.getBoundingClientRect();
      return { t: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, color: cs.color, border: cs.borderColor, radius: cs.borderRadius, cls: b.className.slice(0, 100) };
    });
    const swatches = [...document.querySelectorAll("button")].filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width >= 40 && r.width <= 70 && r.height >= 40 && r.height <= 70 && b.textContent.trim() === "";
    }).slice(0, 10).map((b) => {
      const cs = getComputedStyle(b);
      const r = b.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, radius: cs.borderRadius };
    });
    const save = [...document.querySelectorAll("button")].find((b) => /save preferences/i.test(b.textContent));
    const tiles = [...document.querySelectorAll("button")].filter((b) => b.textContent.trim().length === 2 && /\p{Extended_Pictographic}/u.test(b.textContent)).slice(0, 4).map((b) => {
      const cs = getComputedStyle(b);
      const r = b.getBoundingClientRect();
      return { e: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, radius: cs.borderRadius };
    });
    const tabs = [...document.querySelectorAll("button, a")].filter((b) => /^(Appearance|Profile|Subjects|Holidays|Notifications)$/.test(b.textContent.trim())).map((b) => {
      const cs = getComputedStyle(b);
      return { t: b.textContent.trim(), bg: cs.backgroundColor, color: cs.color, fs: cs.fontSize, active: b.getAttribute("aria-selected") || b.className.includes("bg-") };
    });
    return {
      sub, panel: pcs ? { bg: pcs.backgroundColor, radius: pcs.borderRadius, pad: pcs.padding, w: Math.round(panel.getBoundingClientRect().width), h: Math.round(panel.getBoundingClientRect().height), cls: panel.className.slice(0, 120) } : null,
      appHead: h3app ? { cls: h3app.className.slice(0, 100), fs: getComputedStyle(h3app).fontSize, color: getComputedStyle(h3app).color } : null,
      labels, themeBtns, swatches, tiles, tabs,
      save: save ? { cls: save.className.slice(0, 120), bg: getComputedStyle(save).backgroundColor, color: getComputedStyle(save).color, h: Math.round(save.getBoundingClientRect().height) } : null,
    };
  });

  console.log(JSON.stringify(out, null, 1));
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 500) }));
} finally {
  await browser.close();
}

// Session-69 probe #5: final internals for the Batch-Z truth table.
// Usage: node scripts/z-probe5-s69.mjs
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
  await p.waitForTimeout(2000);
  const out = {};

  // Dashboard: View All link styles
  out.viewAll = await p.evaluate(() => [...document.querySelectorAll("a, button")].filter((a) => /view all/i.test(a.textContent.trim()) && a.textContent.trim().length < 12).slice(0, 3).map((a) => {
    const cs = getComputedStyle(a);
    const svg = a.querySelector("svg");
    return { text: a.textContent.trim(), tag: a.tagName, color: cs.color, fs: cs.fontSize, fw: cs.fontWeight, icon: svg ? (svg.getAttribute("class").match(/lucide-[a-z0-9-]+/g) || []).join(",") : null, iconBox: svg ? `${Math.round(svg.getBoundingClientRect().width)}` : null, cls: a.className.slice(0, 110) };
  }));

  // My Day: leading + wrapper + input padding
  await p.locator("a").filter({ hasText: "My Day" }).first().click();
  await p.waitForTimeout(1800);
  out.myday = await p.evaluate(() => {
    const input = document.querySelector('input[placeholder*="task"], input[placeholder*="Add"]');
    const plus = document.querySelector('.lucide-plus, svg[class*="lucide-plus"]');
    const w = plus ? plus.closest("div") : null;
    const ics = input ? getComputedStyle(input) : null;
    return {
      plusWrap: w ? { cls: w.className.slice(0, 140), box: (() => { const r = w.getBoundingClientRect(); return `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`; })(), color: w ? getComputedStyle(plus).color : null } : null,
      inputPadLeft: ics?.paddingLeft,
      inputX: input ? Math.round(input.getBoundingClientRect().x) : null,
    };
  });

  // Settings: appearance internals
  await p.locator("a").filter({ hasText: "Settings" }).first().click();
  await p.waitForTimeout(2000);
  out.appearance = await p.evaluate(() => {
    const hint = [...document.querySelectorAll("*")].filter((el) => el.children.length === 0 && /customize how studyflow looks/i.test(el.textContent)).pop();
    if (!hint) return { found: false };
    let card = hint.closest("div[class*='rounded']");
    for (let i = 0; i < 4 && card; i++) {
      const up = card.parentElement?.closest("div[class*='rounded']");
      if (!up || up.getBoundingClientRect().width > 1300) break;
      card = up;
    }
    const ccs = card ? getComputedStyle(card) : null;
    const cr = card?.getBoundingClientRect();
    const head = card ? [...card.querySelectorAll("*")].filter((el) => el.textContent.trim() === "Appearance" && el.children.length === 0).pop() : null;
    const emojis = card ? [...card.querySelectorAll("button")].map((b) => b.textContent.trim()).filter((t) => t.length === 2 && /\p{Extended_Pictographic}/u.test(t)) : [];
    // section y positions
    const labelY = card ? [...card.querySelectorAll("*")].filter((el) => el.children.length === 0 && /^(Theme|Accent Color|Avatar)$/.test(el.textContent.trim())).map((el) => ({ t: el.textContent.trim(), y: Math.round(el.getBoundingClientRect().y), mb: getComputedStyle(el).marginBottom, cls: el.className.slice(0, 90) })) : [];
    const intro = hint ? { cls: hint.className.slice(0, 90), fs: getComputedStyle(hint).fontSize, color: getComputedStyle(hint).color } : null;
    const themeIcons = card ? [...card.querySelectorAll("button")].filter((b) => /^(Light|Dark|System)$/.test(b.textContent.trim())).slice(0, 1).map((b) => {
      const svg = b.querySelector("svg");
      const r = svg?.getBoundingClientRect();
      return svg ? { icon: (svg.getAttribute("class").match(/lucide-[a-z0-9-]+/g) || []).join(","), box: `${Math.round(r.width)}x${Math.round(r.height)}` } : null;
    }) : [];
    const activeSwatch = card ? [...card.querySelectorAll("button")].find((b) => b.textContent.trim() === "" && getComputedStyle(b).borderColor.includes("139")) : null;
    const swCls = activeSwatch ? activeSwatch.className.slice(0, 140) : null;
    const save = [...document.querySelectorAll("button")].find((b) => /save preferences/i.test(b.textContent));
    const saveIcon = save?.querySelector("svg");
    return {
      found: true,
      card: ccs ? { x: Math.round(cr.x), y: Math.round(cr.y), w: Math.round(cr.width), pad: ccs.padding, radius: ccs.borderRadius, cls: card.className.slice(0, 110) } : null,
      head: head ? { tag: head.tagName, cls: head.className.slice(0, 110), fs: getComputedStyle(head).fontSize, fw: getComputedStyle(head).fontWeight, color: getComputedStyle(head).color } : null,
      intro, labelY, themeIcons, swCls,
      emojiCount: emojis.length, emojis: emojis.join(" "),
      saveIcon: saveIcon ? (saveIcon.getAttribute("class").match(/lucide-[a-z0-9-]+/g) || []).join(",") : null,
    };
  });

  console.log(JSON.stringify(out, null, 1));
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 500) }));
} finally {
  await browser.close();
}

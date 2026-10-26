// Session-69 discriminator probe: is the reference's Appearance panel
// always-dark (like Events) or a dark-mode artifact? Measures the panel in
// the account's CURRENT mode, switches to Light through the ref's own
// picker, re-measures, then RESTORES the original selection.
// Usage: node scripts/z-probe4-s69.mjs
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const browser = await chromium.launch();
const grab = async (page) => page.evaluate(() => {
  const hint = [...document.querySelectorAll("*")].filter((el) => el.children.length === 0 && /customize how studyflow looks/i.test(el.textContent)).pop();
  if (!hint) return { found: false };
  // the panel = the nearest rounded ancestor of the hint
  let panel = hint.closest("div[class*='rounded']");
  for (let i = 0; i < 4 && panel; i++) {
    const up = panel.parentElement?.closest("div[class*='rounded']");
    if (!up || up.getBoundingClientRect().width > 1300) break;
    panel = up;
  }
  const head = panel ? [...panel.querySelectorAll("*")].filter((el) => el.textContent.trim() === "Appearance" && el.children.length === 0).pop() : null;
  const cs = panel ? getComputedStyle(panel) : null;
  const labels = [...document.querySelectorAll("*")].filter((el) => el.children.length === 0 && /^(Theme|Accent Color|Avatar)$/.test(el.textContent.trim())).map((el) => ({ t: el.textContent.trim(), color: getComputedStyle(el).color }));
  const theme = [...document.querySelectorAll("button")].filter((b) => /^(Light|Dark|System)$/.test(b.textContent.trim())).map((b) => ({ t: b.textContent.trim(), sel: getComputedStyle(b).borderColor, color: getComputedStyle(b).color }));
  const save = [...document.querySelectorAll("button")].find((b) => /save preferences/i.test(b.textContent));
  const saveFull = save ? { cls: save.className, inline: save.getAttribute("style"), bg: getComputedStyle(save).backgroundColor, color: getComputedStyle(save).color, childColor: save.firstElementChild ? getComputedStyle(save.firstElementChild).color : null } : null;
  const htmlDark = document.documentElement.classList.contains("dark");
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  return {
    found: true, htmlDark, bodyBg,
    panel: cs ? { bg: cs.backgroundColor, cls: panel.className.slice(0, 140), w: Math.round(panel.getBoundingClientRect().width), color: cs.color } : null,
    labels, theme, saveFull,
  };
});

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
  await p.locator("a").filter({ hasText: "Settings" }).first().click();
  await p.waitForTimeout(2000);
  const asReceived = await grab(p);
  console.log("AS_RECEIVED:", JSON.stringify(asReceived, null, 1));

  // switch to Light through the ref's own picker
  await p.locator("button", { hasText: /^Light$/ }).first().click();
  await p.waitForTimeout(1500);
  await p.reload({ timeout: 45000 });
  await p.waitForTimeout(2500);
  const asLight = await grab(p);
  console.log("AS_LIGHT:", JSON.stringify(asLight, null, 1));

  // restore Dark
  const darkBtn = [...await p.locator("button").all()].find(async (b) => false);
  const dark = p.locator("button", { hasText: /^Dark$/ }).first();
  await dark.click();
  await p.waitForTimeout(1500);
  await p.reload({ timeout: 45000 });
  await p.waitForTimeout(2500);
  const restored = await grab(p);
  console.log("RESTORED:", JSON.stringify({ htmlDark: restored.htmlDark, theme: restored.theme, panelBg: restored.panel?.bg }, null, 1));
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 500) }));
} finally {
  await browser.close();
}

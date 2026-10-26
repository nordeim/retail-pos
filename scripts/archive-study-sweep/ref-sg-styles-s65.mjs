// Session-65 style measurement: StudyGroups empty-state computed styles on
// the reference (right-pane hint typography, list-panel EmptyState + CTA).
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
try {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2000);
  await page.locator("a").filter({ hasText: "Study Groups" }).first().click();
  await page.waitForTimeout(2000);

  const m = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const pick = (el) => {
      const s = getComputedStyle(el);
      return {
        fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color,
        text: el.textContent.trim().slice(0, 60),
        bg: s.backgroundImage !== "none" ? s.backgroundImage : s.backgroundColor,
        radius: s.borderRadius,
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
        cls: el.className.slice(0, 80),
      };
    };
    const out = {};
    // right-pane hint spans
    const spans = [...main.querySelectorAll("p span, div span")].filter((s) => /Select a group|Choose a study group from/.test(s.textContent));
    out.hintSpans = spans.map(pick);
    // the EmptyState title + hint + CTA button in the list panel
    const title = [...main.querySelectorAll("*")].filter((el) => el.children.length === 0 && el.textContent.trim() === "No study groups");
    out.emptyTitle = title.map(pick);
    const hint = [...main.querySelectorAll("*")].filter((el) => el.children.length === 0 && el.textContent.trim() === "Create a group to collaborate");
    out.emptyHint = hint.map(pick);
    const cta = [...main.querySelectorAll("button")].filter((b) => b.textContent.includes("Create Group"));
    out.ctaButtons = cta.map(pick);
    // icon block (the rounded card holding the users icon in the list panel)
    const iconBlocks = [...main.querySelectorAll("div")].filter((d) => {
      const s = getComputedStyle(d);
      return s.backgroundColor === "rgb(237, 233, 254)" || s.backgroundColor.startsWith("rgb(237, 233");
    });
    out.violetBlocks = iconBlocks.slice(0, 3).map(pick);
    // header + button (top-right violet square)
    const plusBtns = [...main.querySelectorAll("button")].filter((b) => b.textContent.trim() === "+" || b.querySelector("svg.lucide-plus"));
    out.plusButtons = plusBtns.map(pick);
    return out;
  });
  console.log(JSON.stringify(m, null, 1));
} finally {
  await browser.close();
}

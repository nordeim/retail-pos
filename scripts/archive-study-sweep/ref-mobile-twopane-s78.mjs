// Session-78 probe B: the reference's MOBILE layout for the FOUR two-pane
// views (Notes, Flashcards, Tasks, StudyGroups) — which list panes render
// below md? The clone hides the Notes/Flashcards/Tasks asides below md;
// this probe measures the ref's shape per view to scope the gap.
// Usage: node scripts/ref-mobile-twopane-s78.mjs
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";

async function loginRef(page) {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);
}

const VIEWS = ["Notes", "Flashcards", "Tasks", "StudyGroups"];

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await loginRef(page);
  const out = {};
  for (const v of VIEWS) {
    await page.goto(`${REF}/${v}`, { timeout: 45000 });
    await page.waitForTimeout(2800);
    await page.screenshot({ path: `docs/screenshots/78-ref-mobile-${v.toLowerCase()}.png`, fullPage: false });
    out[v] = await page.evaluate(() => {
      const main = document.querySelector("main") || document.body;
      const vis = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };
      // The two-pane container: flex row taller than 60vh with 2+ children.
      const panes = [...main.querySelectorAll("div")]
        .filter((el) => {
          const cs = getComputedStyle(el);
          return cs.display === "flex" && el.children.length >= 2 &&
            el.getBoundingClientRect().height > 300 && !el.closest("aside");
        })
        .slice(0, 2)
        .map((el) => ({
          dir: getComputedStyle(el).flexDirection,
          kids: [...el.children].filter(vis).map((k) => ({
            tag: k.tagName, w: Math.round(k.getBoundingClientRect().width),
            cls: (k.className || "").toString().slice(0, 50),
          })),
        }));
      const aside = main.querySelector("aside");
      return {
        scrollW: document.documentElement.scrollWidth,
        asideVisible: aside ? vis(aside) : false,
        asideW: aside ? Math.round(aside.getBoundingClientRect().width) : 0,
        headings: [...main.querySelectorAll("h1,h2")].filter(vis).map((h) => h.tagName + ":" + h.textContent.trim().slice(0, 24)),
        text: main.innerText.replace(/\s+/g, " ").slice(0, 220),
        panes,
      };
    });
  }
  console.log(JSON.stringify(out, null, 1));
  await ctx.close();
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

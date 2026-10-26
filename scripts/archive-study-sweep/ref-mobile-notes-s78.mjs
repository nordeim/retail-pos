// Session-78 probe: the reference's MOBILE Notes layout — does the notes
// LIST render below md, or is it hidden with an editor-only pane (the
// clone's current shape)? The clone hides the w-80 list pane below md and
// renders an h2 + FAB; this probe measures the ref's mobile /Notes DOM to
// decide whether that is parity or a gap.
// Usage: node scripts/ref-mobile-notes-s78.mjs
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

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await loginRef(page);
  // Direct goto (the accent-sweep vehicle): the SPA rewrites resolve /Notes.
  await page.goto(`${REF}/Notes`, { timeout: 45000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "docs/screenshots/78-ref-mobile-notes.png", fullPage: false });

  const dump = await page.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    return {
      headings: [...main.querySelectorAll("h1,h2,h3")].filter(vis).map((h) => ({
        tag: h.tagName, text: h.textContent.trim().slice(0, 40), fs: getComputedStyle(h).fontSize,
      })),
      buttons: [...main.querySelectorAll("button")].filter(vis).map((b) => b.textContent.trim().slice(0, 30)).slice(0, 14),
      inputs: [...main.querySelectorAll("input,textarea,[contenteditable]")].filter(vis).map((i) => ({
        tag: i.tagName, ph: i.getAttribute("placeholder")?.slice(0, 30) ?? "", aria: i.getAttribute("aria-label")?.slice(0, 30) ?? "",
      })).slice(0, 10),
      // Any element that looks like a note LIST row (repeated siblings).
      listCandidates: [...main.querySelectorAll("div,ul,section,aside")]
        .filter((el) => {
          if (!vis(el)) return false;
          const kids = [...el.children].filter(vis);
          return kids.length >= 2 && kids.every((k) => k.tagName === kids[0].tagName && vis(k));
        })
        .slice(0, 5)
        .map((el) => ({
          cls: (el.className || "").toString().slice(0, 60),
          kids: [...el.children].filter(vis).length,
          firstKidText: el.children[0]?.textContent?.trim().slice(0, 40),
        })),
      text: main.innerText.replace(/\s+/g, " ").slice(0, 600),
      scrollW: document.documentElement.scrollWidth,
    };
  });
  console.log(JSON.stringify({ dump }, null, 1));
  await ctx.close();
} catch (err) {
  console.log(JSON.stringify({ error: String(err).slice(0, 400) }));
} finally {
  await browser.close();
}

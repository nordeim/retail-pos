import { chromium } from "playwright";
const REF = "https://omni-study1.base44.app";
const CLONE = "http://localhost:3200";
async function loginRef(page) {
  await page.goto(`${REF}/login`, { timeout: 45000 }); await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(3000);
}
async function loginClone(page) {
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);
}
const browser = await chromium.launch();
for (const [host, login, tag] of [[REF, loginRef, "ref"], [CLONE, loginClone, "clone"]]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await login(page);
    const chip = await page.evaluate(() => {
      const aside = document.querySelector("aside");
      const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
      const walker = document.createTreeWalker(aside, NodeFilter.SHOW_TEXT);
      let timeEl = null;
      while (walker.nextNode()) {
        if (!/^\d{2}:\d{2} (AM|PM)$/.test(walker.currentNode.textContent.trim())) continue;
        timeEl = walker.currentNode.parentElement; break;
      }
      if (!timeEl) return { error: "no clock" };
      // walk up from the time to the first element with a real bg
      let chip = timeEl;
      while (chip && chip !== aside) {
        const cs = getComputedStyle(chip);
        if (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && chip !== aside) break;
        chip = chip.parentElement;
      }
      const ccs = getComputedStyle(chip);
      const tcs = getComputedStyle(timeEl);
      // date = the next sibling text line inside the chip
      const dateEl = [...chip.querySelectorAll("*")].filter((e) => e !== timeEl && /,( )?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.test(e.textContent) && e.children.length === 0)[0];
      const dcs = dateEl ? getComputedStyle(dateEl) : null;
      return {
        chip: { cls: String(chip.className).slice(0, 90), ...rect(chip), pad: `${ccs.paddingTop} ${ccs.paddingBottom}`, radius: ccs.borderRadius },
        time: { fs: tcs.fontSize, lh: tcs.lineHeight, fw: tcs.fontWeight, color: tcs.color },
        date: dcs ? { fs: dcs.fontSize, color: dcs.color } : null,
      };
    });
    console.log(`[${tag}-chip]`, JSON.stringify(chip));
  } catch (e) { console.log(`[${tag}-chip] ERROR`, String(e).slice(0, 150)); }
  finally { await ctx.close(); }
}
// mobile app-bar clock on both
for (const [host, login, tag] of [[REF, loginRef, "ref"], [CLONE, loginClone, "clone"]]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  try {
    await login(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1500);
    const clock = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (!/^\d{2}:\d{2} (AM|PM)$/.test(walker.currentNode.textContent.trim())) continue;
        const el = walker.currentNode.parentElement;
        const r = el.getBoundingClientRect();
        if (!(r.width > 0) || r.y > 64) continue;
        const cs = getComputedStyle(el);
        return { fs: cs.fontSize, fw: cs.fontWeight, color: cs.color, box: { x: Math.round(r.x), y: Math.round(r.y) } };
      }
      return null;
    });
    console.log(`[${tag}-appbar-clock]`, JSON.stringify(clock));
  } catch (e) { console.log(`[${tag}-appbar-clock] ERROR`, String(e).slice(0, 150)); }
  finally { await ctx.close(); }
}
await browser.close();

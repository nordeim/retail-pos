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
      // find the time text node (XX:XX AM)
      const walker = document.createTreeWalker(aside, NodeFilter.SHOW_TEXT);
      let timeEl = null;
      while (walker.nextNode()) {
        if (!/^\d{2}:\d{2} (AM|PM)$/.test(walker.currentNode.textContent.trim())) continue;
        timeEl = walker.currentNode.parentElement; break;
      }
      if (!timeEl) return { error: "no clock" };
      let chip = timeEl.parentElement;
      for (let i = 0; i < 3; i++) {
        const p = chip.parentElement; if (!p) break;
        const cs = getComputedStyle(p);
        if (cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.borderRadius !== "0px") { chip = p; break; }
        chip = p;
      }
      const ccs = getComputedStyle(chip);
      const tcs = getComputedStyle(timeEl);
      const dateEl = [...chip.querySelectorAll("p, div, span")].find((e) => /Mon|Tue|Wed|Oct/.test(e.textContent) && e !== timeEl);
      const dcs = dateEl ? getComputedStyle(dateEl) : null;
      return {
        chip: { cls: String(chip.className).slice(0, 80), ...rect(chip), pad: `${ccs.paddingTop} ${ccs.paddingBottom}`, bg: ccs.backgroundColor, radius: ccs.borderRadius },
        time: { fs: tcs.fontSize, fw: tcs.fontWeight, color: tcs.color },
        date: dcs ? { fs: dcs.fontSize, color: dcs.color } : null,
      };
    });
    console.log(`[${tag}-chip]`, JSON.stringify(chip));
  } catch (e) { console.log(`[${tag}-chip] ERROR`, String(e).slice(0, 150)); }
  finally { await ctx.close(); }
}
await browser.close();

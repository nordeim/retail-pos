// Session-29 probe: reference dashboard/nav/branding re-sweep vs the S18 measurements.
// Checks: zero-data stat cards (0/0, 0 pending, 0 due soon, 0h focus), 20 nav views,
// branding split (title "AcademiaFlow (Copy)" vs in-app "StudyFlow"), greeting.
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const OUT = "/tmp/s29-ref-probe";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

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
  await page.waitForTimeout(3000);

  const dash = await page.evaluate(`(() => {
    const t = document.body.innerText;
    const links = [...document.querySelectorAll('aside a, nav a')].map(a => a.textContent.trim()).filter(Boolean);
    return JSON.stringify({
      title: document.title,
      greeting: (t.match(/Good (morning|afternoon|evening)[^\\n]*/) || [null])[0],
      statText: (t.match(/0\\s*\\/\\s*0[^\\n]*/) || [null])[0],
      hasZeroPending: /0\\s*(pending|due soon)/i.test(t) || t.includes('0 pending') || t.includes('0 due'),
      focusHours: (t.match(/[0-9]+h?\\s*(focused|focus)/i) || [null])[0],
      navLinks: links.length,
      firstLinks: links.slice(0, 22),
    });
  })()`);
  await page.screenshot({ path: `${OUT}/ref-dashboard.png`, fullPage: false });
  console.log(JSON.stringify({ ok: true, dash: JSON.parse(dash) }, null, 2));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 300) }, null, 2));
} finally {
  await browser.close();
}

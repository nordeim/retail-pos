// Session-27 probe 3: Settings tab bodies via REAL Playwright clicks.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const REF = "https://omni-study1.base44.app";
const OUT = "/tmp/s27-ref-probe";
mkdirSync(OUT, { recursive: true });

const TAB_BODY_PROBE = `(() => {
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const inputs = [...document.querySelectorAll('input')].filter(visible).map(el => ({ ph: el.placeholder || null, value: (el.value || '').slice(0, 40), type: el.type }));
  const sliders = [...document.querySelectorAll('input[type=range]')].filter(visible).map(el => ({ min: el.min, max: el.max, value: el.value }));
  const switches = [...document.querySelectorAll('[role=switch]')].filter(visible).map(el => ({ checked: el.getAttribute('aria-checked'), label: (el.closest('div,label')?.textContent || '').trim().slice(0, 60) }));
  const selects = [...document.querySelectorAll('select')].filter(visible).map(el => ({ value: el.value, options: [...el.options].map(o => o.text) }));
  const saveButtons = [...document.querySelectorAll('button')].filter(visible).map(el => el.textContent.trim()).filter(t => /save|sign out/i.test(t)).slice(0, 6);
  const bodyText = document.body.innerText;
  return JSON.stringify({
    inputs, sliders, switches, selects, saveButtons,
    hasSchool: bodyText.includes('School Name'),
    hasGrade: bodyText.includes('Grade Level'),
    hasGoal: bodyText.includes('Daily Study Goal'),
    goalLabel: (bodyText.match(/Daily Study Goal[^\\n]*/) || [null])[0],
    hasCreated: bodyText.includes('Account created'),
    createdLine: (bodyText.match(/Account created[^\\n]*/) || [null])[0],
    emptyStates: (bodyText.match(/No (subjects|holidays)[^\\n]!*/g) || []),
    accountHeaders: (bodyText.match(/(Your account and study information|Manage your subjects and classes|Holidays & Breaks|Set your school holidays and breaks|Manage your notification preferences|Customize how StudyFlow looks)/g) || []),
  });
})()`;

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

  await page.locator('a[href*="Settings" i]').first().click();
  await page.waitForTimeout(3000);

  const results = {};
  for (const tab of ["Profile", "Notifications", "Subjects", "Holidays", "Appearance"]) {
    await page.locator(`[role=tab]:has-text("${tab}")`).first().click();
    await page.waitForTimeout(2000);
    results[tab] = JSON.parse(await page.evaluate(TAB_BODY_PROBE));
    await page.screenshot({ path: `${OUT}/ref-tab-${tab.toLowerCase()}.png` });
  }
  console.log(JSON.stringify({ ok: true, results }, null, 2));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 300) }, null, 2));
} finally {
  await browser.close();
}

// Session-27: clone-side Settings tab sweep — parity verification vs the reference measurements.
import { chromium } from "playwright";

const CLONE = "http://localhost:3000";

const TAB_BODY_PROBE = `(() => {
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const inputs = [...document.querySelectorAll('input')].filter(visible).map(el => ({ ph: el.placeholder || null, value: (el.value || '').slice(0, 40), type: el.type }));
  const sliders = [...document.querySelectorAll('input[type=range]')].filter(visible).map(el => ({ min: el.min, max: el.max, value: el.value }));
  const switches = [...document.querySelectorAll('[role=switch]')].filter(visible).map(el => ({ checked: el.getAttribute('aria-checked'), label: (el.closest('div,label')?.textContent || '').trim().slice(0, 60) }));
  const saveButtons = [...document.querySelectorAll('button')].filter(visible).map(el => el.textContent.trim()).filter(t => /save|sign out/i.test(t)).slice(0, 6);
  const bodyText = document.body.innerText;
  return JSON.stringify({
    inputs, sliders, switches, saveButtons,
    hasSchool: bodyText.includes('School Name'),
    hasGrade: bodyText.includes('Grade Level'),
    hasGoal: bodyText.includes('Daily Study Goal'),
    goalLabel: (bodyText.match(/Daily Study Goal[^\\n]*/) || [null])[0],
    hasCreated: bodyText.includes('Account created'),
    createdLine: (bodyText.match(/Account created[^\\n]*/) || [null])[0],
    accountHeaders: (bodyText.match(/(Your account and study information|Manage your subjects and classes|Holidays & Breaks|Set your school holidays and breaks|Manage your notification preferences|Customize how StudyFlow looks)/g) || []),
  });
})()`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

try {
  await page.goto(`${CLONE}/login`, { timeout: 30000 });
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 30000 });
  await page.waitForTimeout(2000);

  // Navigate to Settings via sidebar
  await page.locator('a:has-text("Settings")').last().click();
  await page.waitForTimeout(2500);

  const results = {};
  for (const tab of ["Profile", "Notifications", "Subjects", "Holidays", "Appearance"]) {
    await page.locator(`[role=tab]:has-text("${tab}")`).first().click();
    await page.waitForTimeout(1500);
    results[tab] = JSON.parse(await page.evaluate(TAB_BODY_PROBE));
  }
  console.log(JSON.stringify({ ok: true, results }, null, 2));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 300) }, null, 2));
} finally {
  await browser.close();
}

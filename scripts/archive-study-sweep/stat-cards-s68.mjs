// Session-68: the dashboard stat-card truth — values + hint strings + the
// hero CTA on the reference (its account renders the zero state) vs the
// clone's fresh zero state. Exact DOM readings, no screenshots eyeballing.
import { chromium } from "playwright";
const REF = "https://omni-study1.base44.app";
const CLONE = "http://localhost:3200";
async function loginRef(page) {
  await page.goto(`${REF}/login`, { timeout: 45000 }); await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(3500);
}
async function loginCloneFresh(page) {
  // fresh zero-data user (the same state class as the ref's empty account)
  const email = `s68-stat-${Date.now()}@studyflow.app`;
  const reg = await page.request.post(`${CLONE}/api/auth/register`, { data: { email, password: "Fresh1234!", name: "S68 Stat" } });
  if (!reg.ok()) throw new Error(`register failed ${reg.status()}`);
  const { code } = await reg.json();
  await page.request.post(`${CLONE}/api/auth/verify-email`, { data: { email, code } });
  await page.goto(`${CLONE}/`, { timeout: 45000 });
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);
}
const browser = await chromium.launch();
for (const [host, login, tag] of [[REF, loginRef, "ref"], [CLONE, loginCloneFresh, "clone"]]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await login(page);
    const cards = await page.evaluate(() => {
      const main = document.querySelector("main") || document.body;
      // stat cards: h3 values + their hint <p> (the StatCard pattern)
      const out = [];
      const h3s = [...main.querySelectorAll("h3")];
      for (const h3 of h3s) {
        const card = h3.closest("div[class*='rounded']")?.parentElement;
        if (!card) continue;
        const label = card.querySelector("h2, p")?.textContent?.trim() ?? "";
        out.push({ value: h3.textContent.trim(), hint: h3.nextElementSibling?.textContent?.trim() ?? "", label: label.slice(0, 30) });
        if (out.length >= 4) break;
      }
      // the hero CTA (Start My Day): tag + icon
      const cta = [...main.querySelectorAll("a, button")].find((el) => /Start My Day/i.test(el.textContent));
      const ctaIcon = cta ? cta.querySelector("svg") : null;
      return {
        cards: out,
        cta: cta ? {
          tag: cta.tagName, text: cta.textContent.trim().slice(0, 40),
          icon: ctaIcon ? [...ctaIcon.classList].find((c) => c.startsWith("lucide-") && c !== "lucide") : null,
        } : null,
      };
    });
    console.log(`[${tag}-stats]`, JSON.stringify(cards, null, 1));
  } catch (e) { console.log(`[${tag}-stats] ERROR`, String(e).slice(0, 200)); }
  finally { await ctx.close(); }
}
await browser.close();

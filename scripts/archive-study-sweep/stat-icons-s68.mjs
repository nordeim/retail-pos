// Session-68: the dashboard stat-card ICONS + block colors on both hosts.
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
  const email = `s68-icon-${Date.now()}@studyflow.app`;
  const reg = await page.request.post(`${CLONE}/api/auth/register`, { data: { email, password: "Fresh1234!", name: "S68 Icon" } });
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
      const out = [];
      // stat labels: h2-ish "Today's Progress" etc; their card = walk up to
      // the rounded card; inside: icon block + value + hint
      for (const label of ["Today's Progress", "Pending Tasks", "Due Soon", "Focus Time"]) {
        const labelEl = [...main.querySelectorAll("*")].find((e) => e.children.length === 0 && e.textContent.trim() === label);
        if (!labelEl) { out.push({ label, error: "no label" }); continue; }
        let card = labelEl.parentElement;
        for (let i = 0; i < 6 && card; i++) {
          const cs = getComputedStyle(card);
          if (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && card.className.includes("rounded")) break;
          card = card.parentElement;
        }
        if (!card) { out.push({ label, error: "no card" }); continue; }
        const block = [...card.querySelectorAll("div, span")].find((d) => {
          const r = d.getBoundingClientRect();
          return r.width > 30 && r.height > 30 && r.width < 70 && getComputedStyle(d).borderRadius !== "0px" && d.querySelector("svg");
        });
        const icon = block?.querySelector("svg");
        out.push({
          label,
          blockBg: block ? getComputedStyle(block).backgroundColor : null,
          icon: icon ? [...icon.classList].find((c) => c.startsWith("lucide-") && c !== "lucide") : null,
        });
      }
      return out;
    });
    console.log(`[${tag}-stat-icons]`, JSON.stringify(cards, null, 1));
  } catch (e) { console.log(`[${tag}-stat-icons] ERROR`, String(e).slice(0, 200)); }
  finally { await ctx.close(); }
}
await browser.close();

// Session-67 precise: the mobile drawer BRAND HEADER on both hosts —
// title font-size/weight, subtitle font-size + line count, icon box,
// close button size. Decides whether the clone's wrapped subtitle is a
// real drift or a rendering artifact.
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const CLONE = "http://localhost:3200";

async function loginRef(page) {
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(4000);
}
async function registerClone(page) {
  const email = `s67-brand-${Date.now()}@studyflow.app`;
  await page.goto(`${CLONE}/login`, { timeout: 45000 });
  const reg = await page.request.post(`${CLONE}/api/auth/register`, {
    data: { email, password: "Fresh1234!", name: "S67 Probe" },
  });
  if (!reg.ok()) throw new Error(`register failed ${reg.status()}`);
  const { code } = await reg.json();
  await page.request.post(`${CLONE}/api/auth/verify-email`, { data: { email, code } });
  await page.goto(`${CLONE}/`, { timeout: 45000 });
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);
}

async function measure(page, host, tag) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${host}/`, { timeout: 45000 });
  await page.waitForTimeout(4000);
  // open the drawer: clone via aria-label, ref via unlabeled header button
  if (tag === "clone") {
    await page.getByRole("button", { name: /open navigation menu/i }).click({ timeout: 6000 });
  } else {
    await page.locator("header button").first().click({ timeout: 6000 });
  }
  await page.waitForTimeout(1400);
  const m = await page.evaluate(() => {
    const sub = [...document.querySelectorAll("*")]
      .filter((el) => el.children.length === 0 && /Your study companion/.test(el.textContent))
      .pop();
    const title = [...document.querySelectorAll("*")]
      .filter((el) => el.children.length === 0 && el.textContent.trim() === "StudyFlow")
      .pop();
    if (!sub || !title) return { found: false };
    const scs = getComputedStyle(sub);
    const tcs = getComputedStyle(title);
    const sr = sub.getBoundingClientRect();
    const tr = title.getBoundingClientRect();
    // the icon box near the title
    const icon = [...document.querySelectorAll("div, span")].find((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 24 && r.width < 48 && r.height === r.width && r.top < 130 && cs.backgroundColor !== "rgba(0, 0, 0, 0)";
    });
    const ics = icon ? getComputedStyle(icon) : null;
    const ir = icon?.getBoundingClientRect();
    return {
      found: true,
      title: { fs: tcs.fontSize, fw: tcs.fontWeight, lh: tcs.lineHeight, w: Math.round(tr.width) },
      subtitle: { fs: scs.fontSize, lh: scs.lineHeight, w: Math.round(sr.width), h: Math.round(sr.height), lines: Math.round(sr.height / parseFloat(scs.lineHeight || "16")) },
      icon: ics ? { w: Math.round(ir.width), radius: ics.borderRadius, bg: ics.backgroundColor } : null,
      subtitleParentWidth: Math.round(sub.parentElement.getBoundingClientRect().width),
      drawerWidth: Math.round(sub.closest("div")?.parentElement?.getBoundingClientRect().width || 0),
    };
  });
  await page.screenshot({ path: `docs/screenshots/67-${tag}-drawer-brand.png` });
  await page.setViewportSize({ width: 1440, height: 900 });
  return { tag, ...m };
}

const browser = await chromium.launch();
try {
  const rctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const rpage = await rctx.newPage();
  await loginRef(rpage);
  console.log(JSON.stringify(await measure(rpage, REF, "ref"), null, 1));
  await rctx.close();
  const cctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const cpage = await cctx.newPage();
  await registerClone(cpage);
  console.log(JSON.stringify(await measure(cpage, CLONE, "clone"), null, 1));
  await cctx.close();
} catch (e) {
  console.log(JSON.stringify({ error: String(e).slice(0, 300) }));
} finally {
  await browser.close();
}

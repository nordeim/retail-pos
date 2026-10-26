// Session-70 probe #5: the SectionCard internals — clone vs ref:
//   1. The clone's section header div: computed padding + border-bottom
//      (what draws the visible divider?), and the body's first child box.
//   2. The ref's section header block (p-6 border-b per the probe #3 path)
//      + the empty-state container padding — for the AA7 header values.
// READ-ONLY (zero-residue).
// Usage: node scripts/z-probe5-s70.mjs
import { chromium } from "playwright";

const REF = "https://omni-study1.base44.app";
const CLONE = "http://localhost:3200";

async function sectionHeader(page) {
  return page.evaluate(() => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const h2 = [...document.querySelectorAll("h2")].find(
      (h) => h.textContent.trim() === "Today's Tasks" && vis(h),
    );
    if (!h2) return null;
    const row = h2.parentElement; // the flex row
    const rcs = getComputedStyle(row);
    const rr = row.getBoundingClientRect();
    const outer = row.parentElement; // the padded header block (ref) / the row itself (clone)
    const ocs = outer ? getComputedStyle(outer) : null;
    const orr = outer?.getBoundingClientRect();
    // the empty-state container: the row's card body first child
    const card = outer?.parentElement?.parentElement;
    const body = card?.querySelector(":scope > div:nth-child(2)");
    const empty = body?.firstElementChild;
    const ecs = empty ? getComputedStyle(empty) : null;
    const err = empty?.getBoundingClientRect();
    return {
      row: { pt: rcs.paddingTop, pb: rcs.paddingBottom, h: Math.round(rr.height), cls: typeof row.className === "string" ? row.className.slice(0, 100) : "" },
      outer: outer ? { pt: ocs.paddingTop, pb: ocs.paddingBottom, bb: ocs.borderBottomWidth + " " + ocs.borderBottomColor, h: Math.round(orr.height), tag: outer.tagName.toLowerCase() } : null,
      empty: ecs ? { pt: ecs.paddingTop, pb: ecs.paddingBottom, h: Math.round(err.height), cls: typeof empty.className === "string" ? empty.className.slice(0, 80) : "" } : null,
    };
  });
}

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${REF}/login`, { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.fill("input[type=email]", "sepnetflix2023@outlook.com");
  await page.fill("input[type=password]", "$Abcd1234");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await page.waitForTimeout(2500);
  const ref = await sectionHeader(page);

  const cctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const cpage = await cctx.newPage();
  const email = `s70-probe5-${Date.now()}@studyflow.app`;
  const reg = await cpage.request.post(`${CLONE}/api/auth/register`, {
    data: { email, password: "Fresh1234!", name: "S70 Probe 5" },
  });
  if (!reg.ok()) throw new Error(`register failed ${reg.status()}`);
  const { code } = await reg.json();
  await cpage.request.post(`${CLONE}/api/auth/verify-email`, { data: { email, code } });
  await cpage.goto(`${CLONE}/`, { timeout: 45000 });
  await cpage.waitForFunction(() => document.querySelector("main") !== null, null, { timeout: 45000 });
  await cpage.waitForTimeout(2000);
  const clone = await sectionHeader(cpage);

  console.log(JSON.stringify({ ref, clone }, null, 1));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err).slice(0, 500) }));
} finally {
  await browser.close();
}

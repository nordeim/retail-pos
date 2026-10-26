// Session-68 icon dump: the s68 drawer side-by-side suggested icon drifts
// (Grade Tracker / Assignments / Practice Tests). AP-111 discipline: dump
// the lucide class string of EVERY drawer link icon on BOTH sites and diff.
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

async function drawerIcons(page, isRef) {
  if (isRef) {
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")].filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.y < 80 && r.x < 120;
      });
      btns[0]?.click();
    });
  } else {
    await page.getByRole("button", { name: "Open navigation menu" }).click({ timeout: 5000 });
  }
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    // drawer links: the VISIBLE nav links inside the overlay (the hidden
    // sidebar's links are display:none — filter by rect width > 0)
    const out = [];
    const seen = new Set();
    for (const a of document.querySelectorAll("a")) {
      const r = a.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      const svg = a.querySelector("svg");
      if (!svg) continue;
      const cls = [...svg.classList].find((c) => c.startsWith("lucide-") && !c.startsWith("lucide lucide"));
      const label = a.textContent.trim().replace(/\s+/g, " ");
      const key = label + "|" + r.y;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ label, y: Math.round(r.y), icon: cls || [...svg.classList].join(" ") });
    }
    return out;
  });
}

const browser = await chromium.launch();
const res = {};
for (const [host, login, tag, isRef] of [[REF, loginRef, "ref", true], [CLONE, loginClone, "clone", false]]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  try {
    await login(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1200);
    res[tag] = await drawerIcons(page, isRef);
  } catch (e) {
    res[tag] = [{ error: String(e).slice(0, 200) }];
  } finally {
    await ctx.close();
  }
}
await browser.close();

// side-by-side diff
const ref = res.ref ?? [], clone = res.clone ?? [];
const max = Math.max(ref.length, clone.length);
console.log("DRAWER LINKS (visible, in DOM order):");
for (let i = 0; i < max; i++) {
  const r = ref[i], c = clone[i];
  const match = r && c && r.icon === c.icon ? "" : "   << DIFF";
  console.log(`${String(i + 1).padStart(2)}. REF ${JSON.stringify(r)}\n    CLN ${JSON.stringify(c)}${match}`);
}
const diffs = [];
for (let i = 0; i < max; i++) {
  if (ref[i] && clone[i] && ref[i].icon !== clone[i].icon) diffs.push({ i: i + 1, label: ref[i].label, ref: ref[i].icon, clone: clone[i].icon });
}
console.log("\nICON DIFFS:", JSON.stringify(diffs, null, 1));

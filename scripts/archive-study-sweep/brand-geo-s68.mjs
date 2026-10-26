// Session-68 geometry completion: the remaining reference measurements for
// the chrome batch — desktop brand row internals (icon block, chevron),
// desktop sidebar nav container padding, footer, and the drawer's nav
// container padding + row x-inset + active-row pill geometry.
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

const browser = await chromium.launch();

// ---- desktop brand row internals ----
for (const [host, login, tag] of [[REF, loginRef, "ref"], [CLONE, loginClone, "clone"]]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await login(page);
    const geo = await page.evaluate(() => {
      const aside = document.querySelector("aside");
      const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
      const out = {};
      // the header block (first div in aside)
      const header = aside.querySelector(":scope > div");
      out.header = { cls: String(header.className).slice(0, 90), ...rect(header) };
      // icon block: the first div/svg inside the header's brand row
      const brandRow = header.querySelector("div.flex.items-center.gap-3") || header.querySelector("div");
      out.brandRow = { cls: String(brandRow.className).slice(0, 60), ...rect(brandRow) };
      const iconWrap = brandRow.querySelector("div, span") || brandRow.querySelector("svg");
      out.iconBlock = iconWrap ? { tag: iconWrap.tagName, cls: String(iconWrap.className?.baseVal ?? iconWrap.className).slice(0, 60), ...rect(iconWrap) } : null;
      const iconSvg = brandRow.querySelector("svg");
      if (iconSvg) out.iconSvg = { cls: [...iconSvg.classList].slice(0, 4).join(" "), ...rect(iconSvg) };
      // chevron button in the header
      const chev = header.querySelector("button");
      out.chevron = chev ? { cls: String(chev.className).slice(0, 80), label: chev.getAttribute("aria-label"), ...rect(chev) } : null;
      // nav container: the parent of the first nav row
      const firstRow = [...aside.querySelectorAll("a")].find((a) => a.getBoundingClientRect().width > 0 && a.textContent.includes("Dashboard"));
      out.firstRow = firstRow ? { cls: String(firstRow.className).slice(0, 90), ...rect(firstRow) } : null;
      if (firstRow) {
        const nav = firstRow.parentElement;
        out.navContainer = { tag: nav.tagName, cls: String(nav.className).slice(0, 90), ...rect(nav) };
        const rowInner = firstRow.querySelector("span, div");
        out.rowInner = rowInner ? { tag: rowInner.tagName, cls: String(rowInner.className).slice(0, 80), ...rect(rowInner) } : null;
      }
      // footer: last child of aside
      const kids = [...aside.children];
      const footer = kids[kids.length - 1];
      out.footer = { tag: footer.tagName, cls: String(footer.className).slice(0, 80), ...rect(footer), text: footer.textContent.trim().replace(/\s+/g, " ").slice(0, 80) };
      // border on header
      out.headerBorder = getComputedStyle(header).borderBottomWidth + " " + getComputedStyle(header).borderBottomColor;
      return out;
    });
    console.log(`[${tag}-desktop-geo]`, JSON.stringify(geo, null, 1));
  } catch (e) {
    console.log(`[${tag}-desktop-geo] ERROR`, String(e).slice(0, 200));
  } finally {
    await ctx.close();
  }
}

// ---- drawer nav container + rows ----
for (const [host, login, tag, isRef] of [[REF, loginRef, "ref", true], [CLONE, loginClone, "clone", false]]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  try {
    await login(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1200);
    if (isRef) {
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll("button")].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.y < 80 && r.x < 120; });
        btns[0]?.click();
      });
    } else {
      await page.getByRole("button", { name: "Open navigation menu" }).click({ timeout: 5000 });
    }
    await page.waitForTimeout(1500);
    const geo = await page.evaluate(() => {
      const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
      const firstRow = [...document.querySelectorAll("a")].filter((a) => a.getBoundingClientRect().width > 0 && a.textContent.includes("Dashboard") && a.getBoundingClientRect().y > 60 && a.getBoundingClientRect().x < 300)[0];
      if (!firstRow) return { error: "no drawer row" };
      const out = { firstRow: { cls: String(firstRow.className).slice(0, 100), ...rect(firstRow) } };
      const nav = firstRow.parentElement;
      out.navContainer = { tag: nav.tagName, cls: String(nav.className).slice(0, 100), ...rect(nav) };
      const rowInner = firstRow.querySelector("span, div");
      out.rowInner = rowInner ? { tag: rowInner.tagName, cls: String(rowInner.className).slice(0, 90), ...rect(rowInner) } : null;
      // second row for pitch
      const rows = [...nav.querySelectorAll("a")];
      out.row2 = rows[1] ? rect(rows[1]) : null;
      // active row bg
      out.activeBg = getComputedStyle(firstRow).backgroundColor;
      return out;
    });
    console.log(`[${tag}-drawer-geo]`, JSON.stringify(geo, null, 1));
  } catch (e) {
    console.log(`[${tag}-drawer-geo] ERROR`, String(e).slice(0, 200));
  } finally {
    await ctx.close();
  }
}
await browser.close();

// S50 evidence capture — the dark × landscape × SEED story in one frame: a
// volume-invariant view (Exams — the 3-col card grid with subject color
// strips and urgency badges) in DARK mode under a non-violet accent (teal)
// at 844×390, with the DRAWER OPEN on the navigated Exams view showing the
// teal ACTIVE-LINK gradient and the dark re-themed exam cards rendering
// clean (the S48/S49 capture patterns, applied to the seed half on the
// 13-view set — the S46 plan's carried note + the S49 plan's own non-gap
// entry).
// PATCHes dark + teal through the settings API (the real lifecycle,
// self-verified on <html data-accent> + html.dark + the shell-presence
// observable — the header; the S42/S48 dark note: no first-paint race in
// dark, the greeting heading carries the post-mount proof), navigates to
// Exams THROUGH THE DRAWER (the landscape vehicle — the interaction under
// test), verifies the LANDSCAPE chrome contract (the sidebar hidden + the
// hamburger visible at 844), verifies the drawer's active link is EXAMS
// with the teal NAV_ACTIVE_GRADIENT_STOPS tint (the dark × landscape ×
// seed interaction cell on the volume-invariant set), verifies the
// drawer-own nav-scroll geometry at 390 height (the landscape contract:
// scrollHeight ~1068 vs clientHeight ~301 — links ~8–20 below the fold),
// verifies the DARK mode (the mode contract) with the DARK checker (zero
// flashbulbs — a light surface on the dark canvas; zero NON-EXEMPT
// unreadable — the CTA-face exemption ONLY; the light-mode calendar-day +
// yellow-pill exemptions do NOT apply in dark, those surfaces re-theme),
// captures the frame, and restores the resting state (light + violet,
// verified via Prisma by the caller). SEED volume — no marker rows, no
// Prisma client needed.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots/s50-accent-dark-landscape-seed-teal-exams-844.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
try {
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", "demo@studyflow.app");
  await page.fill("input[type=password]", "Demo1234!");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/Dashboard`, { timeout: 20000 });

  // dark + teal through the real lifecycle, self-verified (the S42/S48 dark
  // note: the dark class is applied by the theme lifecycle AFTER /api/auth/me
  // resolves — no first-paint race in dark; the greeting heading is the
  // shell-presence post-mount proof, the header the AP-90 guard)
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "dark", accentColor: "teal" } });
  await page.goto(`${BASE}/Dashboard`, { waitUntil: "load" });
  await page.waitForFunction(
    () => document.documentElement.dataset.accent === "teal" &&
      document.documentElement.classList.contains("dark") &&
      !!document.querySelector("header") &&
      /good (morning|afternoon|evening)/i.test(document.querySelector("main h1")?.textContent ?? ""),
    undefined,
    { timeout: 30000 },
  );

  // the LANDSCAPE chrome contract at 844 — the drawer is the below-lg vehicle
  // (getClientRects for the fixed-position sidebar — offsetParent reads
  // null for fixed elements even when rendered, the Chromium quirk)
  const chrome = await page.evaluate(() => ({
    sidebarVisible: (() => { const a = document.querySelector("aside"); return !!a && a.getClientRects().length > 0; })(),
    hamburgerVisible: (() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Open navigation menu"); return !!b && b.offsetParent !== null; })(),
  }));
  if (chrome.sidebarVisible || !chrome.hamburgerVisible) {
    throw new Error(`the LANDSCAPE chrome contract broke at 844 — ${JSON.stringify(chrome)}`);
  }

  // navigate to Exams THROUGH THE DRAWER (the landscape vehicle — the
  // interaction under test; Exams is one of the 13 volume-invariant views)
  const dialog = page.getByRole("dialog");
  const t0 = Date.now();
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  await dialog.getByRole("link", { name: "Exams", exact: true }).click();
  await page.locator("main h1:visible, main h2:visible").first().waitFor({ state: "visible", timeout: 15000 });
  const clickLatencyMs = Date.now() - t0;
  await page.waitForTimeout(1500); // the data-fetch settle band

  // reopen the drawer for the interaction read + the frame (the story:
  // the drawer OPEN on the navigated Exams view with the teal gradient)
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(500);

  const rec = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]');
    const active = dlg?.querySelector('a[aria-current="page"]');
    const inner = active ? active.querySelector("span") : null;
    const main = document.querySelector("main");
    const nav = dlg ? dlg.querySelector("nav") : null;
    // The DARK probes, main-scoped (the frame's own surfaces): any
    // flashbulb (a light surface on the dark canvas) or NON-EXEMPT
    // unreadable text fails the capture. The DARK doctrine: the CTA-face
    // white-on-accent exemption ONLY (the S11 family-2 non-gap) — the
    // light-mode calendar-day and yellow-pill exemptions do NOT apply in
    // dark, those surfaces re-theme (the S42/S44/S46/S48 lesson).
    const lum = (r, g, b) => {
      const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const parse = (c) => {
      const m = c && c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const parts = m[1].split(",").map((s) => parseFloat(s));
      if (parts.length < 3 || parts.some((p) => Number.isNaN(p))) return null;
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    };
    let flashbulbs = 0;
    const flashbulbSeen = new Set();
    for (const el of main.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const bg = parse(cs.backgroundColor);
      if (!bg || bg.a <= 0.9) continue;
      if (lum(bg.r, bg.g, bg.b) <= 0.80) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 20) continue;
      const cls = (el.className && el.className.toString) ? el.className.toString() : "";
      if (/sf-gradient|UserAvatar|avatar/.test(cls)) continue;
      const key = cls.slice(0, 60) + "|" + Math.round(rect.width) + "x" + Math.round(rect.height);
      if (flashbulbSeen.has(key)) continue;
      flashbulbSeen.add(key);
      flashbulbs += 1;
    }
    let unreadableNonExempt = 0;
    let ctaFace = 0;
    for (const el of main.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none") continue;
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!hasText) continue;
      const fg = parse(cs.color);
      if (!fg) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) continue;
      let bgEff = { r: 9, g: 9, b: 11 };
      let node = el;
      while (node && node !== document.documentElement) {
        const cs2 = getComputedStyle(node);
        const bg = parse(cs2.backgroundColor);
        if (bg && bg.a > 0.85) { bgEff = bg; break; }
        node = node.parentElement;
      }
      const c = (Math.max(lum(fg.r, fg.g, fg.b), lum(bgEff.r, bgEff.g, bgEff.b)) + 0.05) / (Math.min(lum(fg.r, fg.g, fg.b), lum(bgEff.r, bgEff.g, bgEff.b)) + 0.05);
      if (c >= 2.2) continue;
      if (cs.color === "rgb(255, 255, 255)") { ctaFace += 1; continue; }
      unreadableNonExempt += 1;
    }
    return {
      drawerOpen: !!dlg,
      linkCount: dlg ? dlg.querySelectorAll("a").length : 0,
      activeLabel: active ? (active.textContent || "").trim() : null,
      activeTint: inner ? getComputedStyle(inner).backgroundImage.slice(0, 90) : null,
      navScrollHeight: nav ? nav.scrollHeight : 0,
      navClientHeight: nav ? nav.clientHeight : 0,
      navScrollable: nav ? nav.scrollHeight > nav.clientHeight : false,
      darkClass: document.documentElement.classList.contains("dark"),
      accent: document.documentElement.dataset.accent,
      scrollWidth: document.documentElement.scrollWidth,
      mainNodes: main ? main.querySelectorAll("*").length : 0,
      flashbulbs,
      unreadableNonExempt,
      ctaFace,
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
  });
  console.error(JSON.stringify({ ...rec, clickLatencyMs }));
  if (rec.activeLabel !== "Exams") {
    throw new Error(`the drawer's active link was "${rec.activeLabel}", expected "Exams" — the interaction did not follow the navigation`);
  }
  if (!rec.activeTint || rec.activeTint === "none") {
    throw new Error(`the active-link gradient computed to "${rec.activeTint}" — the S8 no-var rot class`);
  }
  if (!rec.navScrollable) {
    throw new Error(`the drawer nav is NOT scrollable at 390 height (scrollHeight ${rec.navScrollHeight} vs clientHeight ${rec.navClientHeight}) — the landscape scroll contract`);
  }
  if (!rec.darkClass) {
    throw new Error("the mode contract broke — the html.dark class is missing in the DARK capture");
  }
  if (rec.flashbulbs > 0) {
    throw new Error(`${rec.flashbulbs} flashbulb surface(s) on the dark canvas — the S42/S44/S46/S48 dark doctrine`);
  }
  if (rec.unreadableNonExempt > 0) {
    throw new Error(`${rec.unreadableNonExempt} non-exempt unreadable surface(s) on the dark canvas — the S42/S44/S46/S48 dark doctrine (the CTA-face exemption applied: ${rec.ctaFace})`);
  }
  await page.screenshot({ path: OUT });
  console.error(`saved ${OUT}`);

  // restore the resting state
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 10000 });
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } });
  await page.goto(`${BASE}/Dashboard`);
  await page.waitForFunction(
    () => document.documentElement.dataset.accent === "violet" && !document.documentElement.classList.contains("dark"),
    undefined,
    { timeout: 30000 },
  );
  writeFileSync("/tmp/s50-evidence-record.json", JSON.stringify({ ...rec, clickLatencyMs }, null, 1));
} catch (e) {
  await page.request.patch(`${BASE}/api/settings/preferences`, { data: { themeMode: "light", accentColor: "violet" } }).catch(() => {});
  console.error(`S50 EVIDENCE CAPTURE FAILED: ${e}`);
  process.exit(1);
} finally {
  await browser.close();
}

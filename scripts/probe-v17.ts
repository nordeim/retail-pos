import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:3101";
const EMAIL = "owner@veloxpos.local";
const PASSWORD = "$Abcd1234";

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  // Login through the real form (the e2e identity seeds from .env).
  await page.goto(`${BASE}/login`);
  const set = (sel: string, val: string) =>
    page.locator(sel).fill(val);
  await set('input[type="email"]', EMAIL);
  await set('input[type="password"]', PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  console.log("login ok →", page.url());

  // ---- 1. The app bar + the page overflow posture at 390 -----------------
  const posture = await page.evaluate(() => ({
    docW: document.documentElement.scrollWidth,
    viewportW: window.innerWidth,
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
    appBar: !!document.querySelector('[data-testid="mobile-app-bar"]'),
    sidebarVisible: (() => {
      const el = document.querySelector("aside");
      if (!el) return false;
      const cs = getComputedStyle(el);
      return cs.display !== "none" && el.getBoundingClientRect().width > 0;
    })(),
  }));
  console.log("1. 390px posture:", JSON.stringify(posture));

  // ---- 2. The drawer: open → geometry + timing ---------------------------
  await page.locator('[data-testid="mobile-menu-button"]').click();
  const panel = page.locator('[data-testid="mobile-drawer-panel"]');
  await panel.waitFor({ state: "visible" });

  // Animation timing: read the computed animation on the panel immediately.
  const anim = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="mobile-drawer-panel"]')!;
    const cs = getComputedStyle(el);
    return {
      animationName: cs.animationName,
      animationDuration: cs.animationDuration,
      transform: cs.transform,
    };
  });
  console.log("2. drawer anim (mid-flight):", JSON.stringify(anim));

  // Settle (200ms + margin), then geometry.
  await page.waitForTimeout(500);
  const geom = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="mobile-drawer-panel"]')!;
    const r = el.getBoundingClientRect();
    const links = Array.from(el.querySelectorAll("a")).map((a) => {
      const lr = a.getBoundingClientRect();
      return { t: (a.textContent || "").trim().slice(0, 12), y: Math.round(lr.y), h: Math.round(lr.height) };
    });
    return {
      x: r.x, y: r.y, w: r.width, h: r.height,
      overflowX: document.documentElement.scrollWidth > 390,
      bodyLocked: document.body.style.overflow === "hidden",
      linkCount: links.length,
      pitch: links.slice(1).map((l, i) => l.y - links[i].y),
      linkHeights: [...new Set(links.map((l) => l.h))],
      ariaExpanded: document.querySelector('[data-testid="mobile-menu-button"]')!.getAttribute("aria-expanded"),
      overlay: !!document.querySelector('[data-testid="mobile-drawer-overlay"]'),
    };
  });
  console.log("3. drawer geometry:", JSON.stringify(geom));

  // ---- 3. Focus contract ---------------------------------------------------
  const focusState = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="mobile-drawer-panel"]')!;
    return {
      activeInside: panel.contains(document.activeElement),
      activeIsPanel: document.activeElement === panel,
    };
  });
  console.log("4. focus after open:", JSON.stringify(focusState));

  // Esc closes; focus returns to the hamburger.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const afterEsc = await page.evaluate(() => ({
    panelGone: !document.querySelector('[data-testid="mobile-drawer-panel"]'),
    focusOnHamburger:
      document.activeElement?.getAttribute("data-testid") === "mobile-menu-button",
    bodyUnlocked: document.body.style.overflow !== "hidden",
  }));
  console.log("5. after Esc:", JSON.stringify(afterEsc));

  // ---- 4. Route-change close + backdrop close ------------------------------
  await page.locator('[data-testid="mobile-menu-button"]').click();
  await panel.waitFor({ state: "visible" });
  await page.locator('[data-testid="mobile-drawer-panel"] a', { hasText: "Dashboard" }).click();
  await page.waitForTimeout(500);
  const afterNav = await page.evaluate(() => ({
    path: location.pathname,
    panelGone: !document.querySelector('[data-testid="mobile-drawer-panel"]'),
  }));
  console.log("6. after route-change:", JSON.stringify(afterNav));

  await page.locator('[data-testid="mobile-menu-button"]').click();
  await panel.waitFor({ state: "visible" });
  await page.locator('[data-testid="mobile-drawer-overlay"] > button').click({ position: { x: 350, y: 400 } });
  await page.waitForTimeout(400);
  const afterBackdrop = await page.evaluate(() => !document.querySelector('[data-testid="mobile-drawer-panel"]'));
  console.log("7. backdrop close:", afterBackdrop);

  // ---- 5. Short viewport: the panel's inside scroll ------------------------
  const short = await ctx.newPage();
  await short.setViewportSize({ width: 390, height: 480 });
  await short.goto(`${BASE}/`);
  await short.locator('[data-testid="mobile-menu-button"]').click();
  await short.waitForTimeout(500);
  const scrollProbe = await short.evaluate(() => {
    const el = document.querySelector('[data-testid="mobile-drawer-panel"]')!;
    return {
      panelH: Math.round(el.getBoundingClientRect().height),
      scrollH: el.scrollHeight,
      clientH: el.clientHeight,
      canScrollInside: el.scrollHeight > el.clientHeight,
      overflowY: getComputedStyle(el).overflowY,
      lastLinkBottom: (() => {
        const links = el.querySelectorAll("a");
        const last = links[links.length - 1] as HTMLElement;
        return Math.round(last.getBoundingClientRect().bottom);
      })(),
      viewportH: window.innerHeight,
    };
  });
  console.log("8. short-viewport (480px) inside-scroll:", JSON.stringify(scrollProbe));
  // Actually scroll inside and confirm the last link can reach the viewport.
  const reached = await short.evaluate(() => {
    const el = document.querySelector('[data-testid="mobile-drawer-panel"]') as HTMLElement;
    el.scrollTop = el.scrollHeight;
    const links = el.querySelectorAll("a");
    const last = links[links.length - 1] as HTMLElement;
    return Math.round(last.getBoundingClientRect().bottom) <= window.innerHeight + 1;
  });
  console.log("9. last link reachable after inside scroll:", reached);
  await short.close();

  // ---- 6. All routes at 390: no horizontal overflow ------------------------
  const routes = ["/", "/Dashboard", "/Inventory", "/Sales", "/Registers", "/Cashiers", "/Reports", "/StoreSettings"];
  const routePosture: string[] = [];
  for (const r of routes) {
    await page.goto(`${BASE}${r}`);
    await page.waitForTimeout(350);
    const p = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      ox: document.documentElement.scrollWidth > window.innerWidth,
    }));
    routePosture.push(`${r}:${p.w}${p.ox ? " OVERFLOW!" : ""}`);
  }
  console.log("10. routes at 390:", routePosture.join(" | "));

  await browser.close();
}

main().catch((e) => {
  console.error("PROBE FAILED:", e);
  process.exit(1);
});

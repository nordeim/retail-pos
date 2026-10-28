import { expect, test } from "@playwright/test";

import { ROUTES } from "./helpers";

// ---------------------------------------------------------------------------
// THE MOBILE NAVIGATION CONTRACT (the reference ships NO working mobile menu
// — its 220px sidebar stays expanded and clips the content at 390px; the
// clone's drawer is the superset, pinned here).
//
// Trap 4 (Tailwind v4) is guarded in test form: the drawer's nav list is a
// flex gap-* container, and the gaps render as designed (the v4 :where()
// rewrite must not change the list's geometry).
// ---------------------------------------------------------------------------

const MOBILE = { width: 390, height: 844 };

test.use({ viewport: MOBILE });

test.describe("mobile navigation (390×844)", () => {
  test("the app bar carries the hamburger and the store name", async ({ page }) => {
    await page.goto("/");
    const bar = page.getByTestId("mobile-app-bar");
    await expect(bar).toBeVisible();
    await expect(bar.getByTestId("mobile-menu-button")).toBeVisible();
    await expect(page.getByRole("banner")).toContainText("Mi Tienda");
  });

  test("the drawer opens with all 8 links and closes via the X", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();

    const panel = page.getByTestId("mobile-drawer-panel");
    await expect(panel).toBeVisible();
    for (const label of ["Terminal", "Dashboard", "Inventario", "Ventas", "Cajas", "Cajeros", "Reportes", "Ajustes"]) {
      await expect(panel.getByRole("link", { name: label })).toBeVisible();
    }

    await page.getByTestId("mobile-drawer-close").click();
    await expect(panel).toHaveCount(0);
  });

  test("the drawer panel is a 288px full-height overlay and body scroll locks", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();

    const panel = page.getByTestId("mobile-drawer-panel");
    await expect(panel).toBeVisible();
    // The 200ms slide-in must SETTLE before the geometry pins — a
    // mid-animation measurement catches the transform mid-flight (the
    // sub-pixel flake). The assertion stays strict: exactly 288px wide,
    // exactly the 844px viewport tall.
    await expect
      .poll(async () => {
        const box = await panel.boundingBox();
        return { width: box?.width ?? 0, height: box?.height ?? 0 };
      })
      .toEqual({ width: 288, height: MOBILE.height });

    const locked = await page.evaluate(() => document.body.style.overflow);
    expect(locked).toBe("hidden");
  });

  test("Escape closes the drawer and unlocks the body", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();
    await expect(page.getByTestId("mobile-drawer-panel")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("mobile-drawer-panel")).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe("");
  });

  test("the backdrop closes the drawer", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();
    await expect(page.getByTestId("mobile-drawer-panel")).toBeVisible();

    await page
      .getByTestId("mobile-drawer-overlay")
      .locator("button")
      .first()
      .click({ position: { x: 360, y: 400 } });
    await expect(page.getByTestId("mobile-drawer-panel")).toHaveCount(0);
  });

  test("navigating from the drawer flips the view and closes it", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();
    await page.getByTestId("mobile-drawer-panel").getByTestId("nav-dashboard").click();

    await expect(page).toHaveURL(/\/Dashboard$/);
    await expect(page.locator("main h1")).toHaveText("Dashboard");
    await expect(page.getByTestId("mobile-drawer-panel")).toHaveCount(0);
  });

  test("the hamburger carries aria-expanded through the open/close cycle", async ({ page }) => {
    await page.goto("/");
    const button = page.getByTestId("mobile-menu-button");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });

  test("TRAP-4 GUARD: the drawer nav list gaps are uniform (flex gap, no margin drift)", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();

    // The 8 links sit in a flex container; every consecutive pair must share
    // ONE gap value — a v4 space-y/margin interaction would show up here as
    // a differing offset on the CTA-like first row (the reference bug).
    const tops = await page.getByTestId("mobile-drawer-panel").getByRole("link").evaluateAll(
      (links) => links.map((link) => link.getBoundingClientRect().top),
    );
    expect(tops).toHaveLength(8);
    const gaps: number[] = [];
    for (let i = 1; i < tops.length; i += 1) gaps.push(tops[i] - tops[i - 1]);
    const first = gaps[0];
    for (const gap of gaps) expect(Math.abs(gap - first)).toBeLessThan(0.5);
    // And the gap is the designed 4px flex gap (not a resurrected 12px margin).
    expect(Math.abs(first - 44)).toBeLessThan(3); // link height 40 + gap 4
  });

  test("no horizontal overflow on any mobile view", async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route.path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });

  // V25/SD-104 (the neo-crm session-196 doctrine — the drawer-open spine
  // freeze): the behavior pins above (the panel box, the pitch uniformity,
  // the close paths, the focus contract) leave the drawer's RENDERED
  // geometry ledger unpinned — a computed-margin regression (an mb-*/mt-*
  // utility re-entering the flex column — the trap-4 family) would shift
  // the header and cascade to every box below it while every standing gate
  // stays green. This pin freezes the live-measured spine (agent-browser
  // walk, 2026-10-28) at TRUE 390×844: panel [0,0,288,844] · header
  // [0,0,287,69] (h-9 36 + p-4×2 32 + border-b 1) · nav [0,69,287,727] ·
  // footer [0,796,287,48] · close [235,16,36,36] · 8 links at x=12, each
  // 263×40, first at y=81 with the uniform 44px pitch (81 = nav.y 69 +
  // p-3 12; 796 + 48 = 844). Born-green BY DESIGN — a battery gap, not a
  // behavior bug — and mutation-proven: a planted mb-2 on the header div
  // goes RED at the nav/link/footer boxes (the proof lives in
  // docs/remediation-plan-v25.md §6). The values are integral and
  // deterministic (padding-driven heights, no font dependence).
  test("V25 SPINE FREEZE: the drawer-open geometry ledger at 390×844", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();

    const panel = page.getByTestId("mobile-drawer-panel");
    await expect(panel).toBeVisible();
    // The expect.poll starved-read idiom: the 200ms slide-in must SETTLE
    // before the ledger reads (a mid-flight transform shifts every box).
    await expect
      .poll(async () => {
        const read = (sel: string) =>
          page
            .locator(sel)
            .first()
            .evaluate((el) => {
              const r = el.getBoundingClientRect();
              return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
            });
        const header = await read('[data-testid="mobile-drawer-panel"] > div:first-child');
        const nav = await read('[data-testid="mobile-drawer-panel"] nav');
        const footer = await read('[data-testid="mobile-drawer-panel"] > div:last-child');
        const close = await read('[data-testid="mobile-drawer-close"]');
        const links = await page
          .getByTestId("mobile-drawer-panel")
          .getByRole("link")
          .evaluateAll((els) =>
            els.map((el) => {
              const r = el.getBoundingClientRect();
              return [
                Math.round(r.x),
                Math.round(r.y),
                Math.round(r.width),
                Math.round(r.height),
              ];
            }),
          );
        const panelBox = await panel.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
        });
        return { panelBox, header, nav, footer, close, links };
      })
      .toEqual({
        panelBox: [0, 0, 288, 844],
        header: [0, 0, 287, 69],
        nav: [0, 69, 287, 727],
        footer: [0, 796, 287, 48],
        close: [235, 16, 36, 36],
        links: [81, 125, 169, 213, 257, 301, 345, 389].map((y) => [12, y, 263, 40]),
      });

    // The footer wordmark is part of the shipped surface.
    await expect(
      page.getByTestId("mobile-drawer-panel").locator("div:last-child"),
    ).toHaveText("VeloxPOS");
  });

  // V25/SD-105: the lg-breakpoint close (mobile-chrome's matchMedia
  // listener — "close if the viewport crosses into lg (the app bar
  // disappears there)") carried no pin. Live-verified both directions
  // before the pin: crossing closes the drawer AND resets aria-expanded;
  // resizing back below lg does NOT reopen it (no mobileMenuOpen state
  // leak under the visually-vanished lg:hidden overlay). Born-green.
  test("V25 BREAKPOINT CLOSE: crossing into lg closes the drawer with no state leak", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();
    await expect(page.getByTestId("mobile-drawer-panel")).toBeVisible();

    // Cross into lg: the drawer unmounts and the hamburger (lg:hidden)
    // leaves the rendered surface (display:none keeps it in the DOM —
    // toBeHidden is the correct assertion, never toHaveCount(0)).
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByTestId("mobile-drawer-panel")).toHaveCount(0);
    await expect(page.getByTestId("mobile-app-bar")).toBeHidden();
    await expect(page.getByTestId("mobile-menu-button")).toBeHidden();

    // Back below lg: the drawer STAYS closed — the F2 regression's exact
    // observable (a dead listener leaves mobileMenuOpen true and the
    // drawer reappears here).
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("mobile-menu-button")).toBeVisible();
    await expect(page.getByTestId("mobile-drawer-panel")).toHaveCount(0);
    await expect(page.getByTestId("mobile-menu-button")).toHaveAttribute("aria-expanded", "false");
  });
});

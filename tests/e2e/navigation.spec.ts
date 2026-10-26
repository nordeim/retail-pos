import { expect, test } from "@playwright/test";

import { ROUTES } from "./helpers";

// The authenticated navigation sweep: every reference route renders its
// heading through the SPA rewrite, and the chrome is hydrated.

test.describe("navigation", () => {
  for (const route of ROUTES) {
    test(`renders ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      const hydrated = page.locator("html[data-app-hydrated=true]");
      await expect(hydrated).toBeAttached();

      // The sidebar + the view heading.
      await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
      await expect(page.locator("main h1, main h2").filter({ hasText: route.heading }).first()).toBeVisible();
    });
  }

  test("sidebar navigates between views (SPA, no reload)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();

    await page.getByTestId("nav-dashboard").click();
    await expect(page.locator("main h1")).toHaveText("Dashboard");
    await expect(page).toHaveURL(/\/Dashboard$/);

    await page.getByTestId("nav-inventario").click();
    await expect(page.locator("main h1")).toHaveText("Inventario");
    await expect(page).toHaveURL(/\/Inventory$/);

    await page.getByTestId("nav-terminal").click();
    await expect(page).toHaveURL(/\/$|\/terminal$/i);
  });

  test("case-insensitive alias resolves the same view (superset)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main h1")).toHaveText("Dashboard");
  });

  test("unknown routes render the Spanish 404 with the Terminal CTA", async ({ page }) => {
    await page.goto("/NonExistent");
    await expect(page.getByTestId("not-found-card")).toBeVisible();
    await expect(page.getByText("Página no encontrada")).toBeVisible();
    await page.getByTestId("not-found-cta").click();
    await expect(page).toHaveURL(/\/$|\/terminal$/i);
  });

  test("the sidebar collapse toggle swaps the rail width (220 ↔ 68)", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.getByTestId("desktop-sidebar");
    await expect(sidebar).toBeVisible();

    const wide = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(wide).toBe(220);

    await page.getByTestId("sidebar-toggle").click();
    await expect
      .poll(async () => sidebar.evaluate((el) => el.getBoundingClientRect().width))
      .toBe(68);

    await page.getByTestId("sidebar-toggle").click();
    await expect
      .poll(async () => sidebar.evaluate((el) => el.getBoundingClientRect().width))
      .toBe(220);
  });
});

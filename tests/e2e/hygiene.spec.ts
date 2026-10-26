import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// R4 hygiene pins (remediation-plan-v3 §R4) — the load-failure toast (L6)
// and the mobile drawer focus contract (L11: the neo-crm pattern — focus
// moves INTO the panel with rAF retries verified against activeElement,
// Tab wraps inside, focus RETURNS to the hamburger on close).
//
// This file runs BEFORE mobile-navigation.spec.ts alphabetically; each test
// owns its viewport, and none leaves drawer/limiter state behind.
// ---------------------------------------------------------------------------

test.describe("load-failure toast (L6)", () => {
  test("a failed collection burst surfaces the error toast", async ({ page }) => {
    await page.route("**/api/products", (route) => route.abort());
    await page.goto("/");
    await expect(
      page.getByRole("region", { name: "Notifications" }),
    ).toContainText("No se pudieron cargar los datos");
  });

  test("a healthy boot shows no error toast", async ({ page }) => {
    await page.goto("/");
    // No shift is open on a fresh seed — the Terminal shows its empty card,
    // and the notifications region stays EMPTY (no failed-burst toast).
    await expect(page.getByText("No hay turno activo")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Notifications" }),
    ).toHaveText("");
  });
});

test.describe("drawer focus contract (L11)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("open moves focus INTO the panel; Escape returns it to the hamburger", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();

    // Focus lands on the panel (verified against activeElement — the
    // neo-crm rAF-retry contract).
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.activeElement?.getAttribute("data-testid") ?? "",
        ),
      )
      .toBe("mobile-drawer-panel");

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("mobile-drawer-panel")).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.activeElement?.getAttribute("data-testid") ?? "",
        ),
      )
      .toBe("mobile-menu-button");
  });

  test("Tab wraps inside the drawer — never escapes the modal", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();

    // Focus starts on the panel; the first focusable is the close (X)
    // button, the last is the final nav link (Ajustes).
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.activeElement?.getAttribute("data-testid") ?? "",
        ),
      )
      .toBe("mobile-drawer-panel");

    await page.keyboard.press("Tab");
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.activeElement?.getAttribute("data-testid") ?? "",
        ),
      )
      .toBe("mobile-drawer-close");

    // Shift+Tab from the FIRST focusable wraps to the LAST nav link.
    await page.keyboard.press("Shift+Tab");
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.activeElement?.getAttribute("data-testid") ?? "",
        ),
      )
      .toBe("nav-ajustes");

    // Plain Tab from the LAST focusable wraps back to the FIRST (the X).
    await page.keyboard.press("Tab");
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.activeElement?.getAttribute("data-testid") ?? "",
        ),
      )
      .toBe("mobile-drawer-close");
    await expect(page.getByTestId("mobile-drawer-panel")).toBeVisible();
  });
});

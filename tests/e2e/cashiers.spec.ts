import { expect, test } from "@playwright/test";

// The Cajeros sweep — including the superset gap-fill: the reference page
// ships NO way to create a cashier; the clone's Nuevo Cajero dialog must
// work, and the seeded shifts table renders.

test.describe("cajeros", () => {
  test("lists the seeded cashier and the closed shift history", async ({ page }) => {
    await page.goto("/Cashiers");
    await expect(page.locator("main h1")).toHaveText("Cajeros");
    await expect(page.getByTestId("cashiers-table")).toContainText("Cesar Martínez");
    await expect(page.getByTestId("recent-shifts-table")).toBeVisible();
    await expect(page.getByTestId("recent-shifts-table")).toContainText("Caja 1");
    await expect(page.getByTestId("recent-shifts-table")).toContainText("Cerrado");
  });

  test("create → edit → delete a cashier", async ({ page }) => {
    await page.goto("/Cashiers");
    await page.getByTestId("new-cashier-button").click();
    await page.getByTestId("cashier-name-input").fill("Ana Reyes");
    await page.getByTestId("cashier-submit").click();
    await expect(page.getByText("2 usuarios registrados")).toBeVisible();

    const row = page.locator('[data-testid^="cashier-row-"]', { hasText: "Ana Reyes" });
    await row.getByRole("button", { name: /Editar Ana/ }).click();
    await page.getByTestId("cashier-name-input").fill("Ana Reyes-López");
    await page.getByTestId("cashier-submit").click();
    await expect(page.getByTestId("cashiers-table")).toContainText("Ana Reyes-López");

    const edited = page.locator('[data-testid^="cashier-row-"]', { hasText: "Ana Reyes-López" });
    await edited.getByRole("button", { name: /Eliminar Ana/ }).click();
    await page.getByTestId("confirm-delete-cashier").click();
    await expect(page.getByTestId("cashiers-table")).not.toContainText("Ana Reyes-López");
  });
});

import { expect, test } from "@playwright/test";

// The Ajustes sweep: the settings form round-trip, the live color
// application (Personalización drives the accent vars), and category chips.

test.describe("ajustes", () => {
  test("the reference form fields are present with defaults", async ({ page }) => {
    await page.goto("/StoreSettings");
    await expect(page.locator("main h1")).toHaveText("Ajustes de la Tienda");
    await expect(page.getByTestId("settings-name-input")).toHaveValue("Mi Tienda");
    await expect(page.getByText("RFC / ID Fiscal")).toBeVisible();
    await expect(page.getByTestId("settings-currency")).toContainText("MXN - Peso Mexicano");
    await expect(page.getByTestId("settings-card-provider")).toContainText("Ninguno");
    await expect(page.getByTestId("settings-primary-color")).toHaveValue("#6366f1");
    await expect(page.getByTestId("settings-secondary-color")).toHaveValue("#8b5cf6");
    await expect(page.getByTestId("settings-categories-card")).toContainText("Lácteos");
    await expect(page.getByTestId("settings-categories-card")).toContainText("Bebidas");
  });

  test("saving renames the store and the chrome follows", async ({ page }) => {
    await page.goto("/StoreSettings");
    await page.getByTestId("settings-name-input").fill("Mi Tienda Spec");
    await page.getByTestId("settings-save").click();
    await expect(page.getByTestId("settings-saved")).toBeVisible();

    // The sidebar brand is the store name.
    await expect(page.getByTestId("desktop-sidebar")).toContainText("Mi Tienda Spec");

    // Restore.
    await page.getByTestId("settings-name-input").fill("Mi Tienda");
    await page.getByTestId("settings-save").click();
    await expect(page.getByTestId("settings-saved")).toBeVisible();
  });

  test("category chips can be added and removed", async ({ page }) => {
    await page.goto("/StoreSettings");
    await page.getByTestId("settings-new-category").fill("Panadería");
    await page.getByTestId("settings-add-category").click();
    await expect(page.getByTestId("settings-category-chips")).toContainText("Panadería");

    await page
      .getByTestId("settings-category-chips")
      .getByRole("button", { name: "Eliminar categoría Panadería" })
      .click();
    await expect(page.getByTestId("settings-category-chips")).not.toContainText("Panadería");
  });
});

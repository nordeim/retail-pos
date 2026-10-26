import { expect, test } from "@playwright/test";

import { SEEDED_PRODUCTS } from "./helpers";

// The Inventario sweep: the seeded table, search, category chips, and the
// full product CRUD cycle.

test.describe("inventario", () => {
  test("lists the 12 seeded products with the reference columns", async ({ page }) => {
    await page.goto("/Inventory");
    await expect(page.locator("main h1")).toHaveText("Inventario");
    await expect(page.getByText("12 productos registrados")).toBeVisible();

    for (const header of ["PRODUCTO", "CÓDIGO", "PRECIO", "STOCK", "CATEGORÍA", "ESTADO", "ACCIONES"]) {
      await expect(page.locator("th", { hasText: header })).toHaveCount(1);
    }
    for (const name of SEEDED_PRODUCTS) {
      await expect(page.getByTestId("inventory-table")).toContainText(name);
    }
    await expect(page.getByTestId("inventory-table")).toContainText("$38.50");
    await expect(page.getByTestId("inventory-table")).toContainText("7501005102148");
  });

  test("search filters by name and code", async ({ page }) => {
    await page.goto("/Inventory");
    await page.getByTestId("inventory-search").fill("Coca");
    await expect(page.getByTestId("inventory-table")).toContainText("Coca-Cola 600ml");
    await expect(page.getByTestId("inventory-table")).not.toContainText("Yogurt Danone");

    await page.getByTestId("inventory-search").fill("7501013100018");
    await expect(page.getByTestId("inventory-table")).toContainText("Agua Bonafont 1L");
  });

  test("category chips filter the table", async ({ page }) => {
    await page.goto("/Inventory");
    await page.getByTestId("inventory-chips").getByRole("button", { name: "Bebidas" }).click();
    await expect(page.getByTestId("inventory-table")).toContainText("Coca-Cola 600ml");
    await expect(page.getByTestId("inventory-table")).not.toContainText("Yogurt Danone");

    await page.getByTestId("inventory-chips").getByRole("button", { name: "Todos" }).click();
    await expect(page.getByTestId("inventory-table")).toContainText("Yogurt Danone");
  });

  test("create → verify → edit → delete a product (full CRUD)", async ({ page }) => {
    await page.goto("/Inventory");

    // CREATE
    await page.getByTestId("new-product-button").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toContainText("Código de barras");
    await expect(page.getByRole("dialog")).toContainText("IVA (%)");
    await expect(page.getByTestId("product-submit")).toBeDisabled(); // required fields gate it
    await page.getByTestId("product-name-input").fill("Galletas Emecé 170g");
    await page.getByTestId("product-barcode-input").fill("7501000123456");
    await page.getByTestId("product-price-input").fill("21.50");
    await page.getByTestId("product-submit").click();
    await expect(page.getByText("16 productos registrados").or(page.getByText("13 productos registrados"))).toBeVisible();
    await expect(page.getByTestId("inventory-table")).toContainText("Galletas Emecé 170g");

    // EDIT
    const row = page.locator("tr", { hasText: "Galletas Emecé 170g" });
    await row.getByRole("button", { name: /Editar Galletas/ }).click();
    await page.getByTestId("product-price-input").fill("23.00");
    await page.getByTestId("product-submit").click();
    await expect(page.getByTestId("inventory-table")).toContainText("$23.00");

    // DELETE
    await row.getByRole("button", { name: /Eliminar Galletas/ }).click();
    await page.getByTestId("confirm-delete-product").click();
    await expect(page.getByTestId("inventory-table")).not.toContainText("Galletas Emecé 170g");
  });

  test("the Nuevo Producto dialog carries the reference defaults", async ({ page }) => {
    await page.goto("/Inventory");
    await page.getByTestId("new-product-button").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Stock actual");
    await expect(dialog).toContainText("Stock mínimo");
    await expect(dialog).toContainText("Unidad");
    await expect(dialog).toContainText("Producto activo");
    await expect(dialog).toContainText("Imagen del producto");
  });
});

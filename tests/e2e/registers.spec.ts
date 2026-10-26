import { expect, test } from "@playwright/test";

// The Cajas sweep: register CRUD + the shift lifecycle guards.

test.describe("cajas", () => {
  test("lists the two seeded registers with reference anatomy", async ({ page }) => {
    await page.goto("/Registers");
    await expect(page.locator("main h1")).toHaveText("Cajas Registradoras");
    await expect(page.getByText("2 cajas configuradas")).toBeVisible();

    const cards = page.getByTestId("register-cards");
    await expect(cards).toContainText("Caja 1");
    await expect(cards).toContainText("Entrada principal");
    await expect(cards).toContainText("Caja 2");
    await expect(cards).toContainText("Área de abarrotes");
    await expect(cards).toContainText("Cerrada");
    await expect(page.getByRole("button", { name: "Nueva Caja" })).toBeVisible();
  });

  test("create → open turno on → close turno a register", async ({ page }) => {
    // CREATE
    await page.goto("/Registers");
    await page.getByTestId("new-register-button").click();
    await page.getByTestId("register-name-input").fill("Caja E2E");
    await page.getByTestId("register-location-input").fill("Spec Lane");
    await page.getByTestId("register-submit").click();
    await expect(page.getByText("3 cajas configuradas")).toBeVisible();

    // OPEN TURNO requires a cashier (the seeded one exists).
    const card = page.locator('[data-testid^="register-card-"]', { hasText: "Caja E2E" });
    await card.locator('[data-testid^="open-shift-"]').click();
    await expect(page.getByRole("dialog")).toContainText("Abrir Turno — Caja E2E");
    await expect(page.getByTestId("shift-submit")).toBeDisabled(); // cajero required
    await page.getByTestId("shift-cashier-select").click();
    await page.getByRole("option").first().click();
    await page.getByTestId("shift-submit").click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(card).toContainText("Abierta");
    await expect(card).toContainText("Cerrar Turno");

    // CLOSE TURNO with the counted cash.
    await card.locator('[data-testid^="close-shift-"]').click();
    await expect(page.getByRole("dialog")).toContainText("Cerrar Turno — Caja E2E");
    await page.getByTestId("shift-closing-input").fill("500");
    await page.getByTestId("shift-close-submit").click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(card).toContainText("Cerrada");

    // DELETE (empty register → allowed)
    await card.locator('[data-testid^="delete-register-"]').click();
    await page.getByTestId("confirm-delete-register").click();
    await expect(page.getByText("2 cajas configuradas")).toBeVisible();
  });

  test("a register with an open shift cannot be deleted (the guard)", async ({ page }) => {
    await page.goto("/Registers");
    const card = page.locator('[data-testid^="register-card-"]').first();
    await card.locator('[data-testid^="open-shift-"]').click();
    await page.getByTestId("shift-cashier-select").click();
    await page.getByRole("option").first().click();
    await page.getByTestId("shift-submit").click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await card.locator('[data-testid^="delete-register-"]').click();
    await page.getByTestId("confirm-delete-register").click();
    // Still there — the API 400s and the dialog stays.
    await expect(page.getByTestId("confirm-delete-register")).toBeVisible();
    await page.keyboard.press("Escape");

    // Clean up the turno.
    await card.locator('[data-testid^="close-shift-"]').click();
    await page.getByTestId("shift-close-submit").click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

import { expect, test } from "@playwright/test";

// The full sale journey — the superset flow the reference cannot run (its
// cashier dropdown is permanently empty): cajero exists → shift opens →
// ticket builds → COBRAR → receipt → stock decrements.

test.describe("terminal sales", () => {
  test("the Terminal shows the no-shift gate before a turno is open", async ({ page }) => {
    await page.goto("/");
    // The seed leaves every register closed.
    await expect(page.getByRole("heading", { name: "No hay turno activo" })).toBeVisible();
    await expect(page.getByText("Ve a", { exact: false })).toBeVisible();
    // V5/T5: the header reads "Ticket" in the DOM; CSS uppercases it
    // (the reference renders it the same way — text-transform, not caps text).
    await expect(page.getByTestId("ticket-panel")).toContainText("Ticket");
    await expect(page.getByTestId("ticket-panel")).toContainText("Escanea o selecciona productos");
    await expect(page.getByTestId("cobrar-button")).toBeDisabled();
    await expect(page.getByTestId("cobrar-button")).toContainText("COBRAR $0.00");
  });

  test("open shift → sell → stock decrements → close shift", async ({ page }) => {
    // 1. Open a shift on Caja 1 with the seeded cashier.
    await page.goto("/Registers");
    await page.locator('[data-testid^="open-shift-"]').first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByTestId("shift-cashier-select").click();
    await page.getByRole("option").first().click();
    await page.getByTestId("shift-float-input").fill("500");
    await page.getByTestId("shift-submit").click();
    await expect(page.getByRole("dialog")).toBeHidden();

    // 2. The Terminal is live: grid visible, ticket empty.
    await page.goto("/");
    await expect(page.getByTestId("terminal-grid")).toBeVisible();
    await expect(page.getByTestId("ticket-panel")).toContainText("Escanea o selecciona productos");

    // 3. Add Coca-Cola 600ml ×2 — 18.50 + 16% = 21.46/line, total 42.92.
    const card = page.locator('[data-testid^="terminal-product-"]', { hasText: "Coca-Cola 600ml" });
    await card.click();
    await card.click();
    await expect(page.getByTestId("ticket-qty")).toHaveText("2");
    await expect(page.getByTestId("ticket-total")).toHaveText("$42.92");

    // 4. Ticket qty controls.
    await page.getByRole("button", { name: "Agregar uno" }).click();
    await expect(page.getByTestId("ticket-qty")).toHaveText("3");
    await expect(page.getByTestId("ticket-total")).toHaveText("$64.38");

    // 5. COBRAR — cash, change computed, sale persists.
    await page.getByTestId("cobrar-button").click();
    await expect(page.getByTestId("pay-total")).toHaveText("$64.38");
    await page.getByTestId("method-efectivo").click();
    await page.getByTestId("pay-cash").fill("100");
    await expect(page.getByTestId("pay-change")).toContainText("$35.62");
    await page.getByTestId("confirm-payment").click();
    await expect(page.getByRole("dialog")).toBeHidden();

    // 6. The ticket cleared; the stock dropped (47 − 3 = 44).
    await expect(page.getByTestId("ticket-panel")).toContainText("Escanea o selecciona productos");
    await page.goto("/Inventory");
    await expect(page.getByTestId("inventory-table").locator("tr", { hasText: "Coca-Cola 600ml" })).toContainText("44");

    // 7. The sale is in the history with the verified ticket math.
    await page.goto("/Sales");
    const row = page.locator('[data-testid^="sale-row-"]').first();
    await expect(row).toContainText("Efectivo");
    await expect(row).toContainText("$64.38");
    await row.getByRole("button", { name: /Ver ticket/ }).click();
    await expect(page.getByTestId("sale-detail-title")).toContainText("Ticket V-");
    await expect(page.getByTestId("sale-detail-total")).toHaveText("$64.38");
    await expect(page.getByTestId("sale-detail-items")).toContainText("3x Coca-Cola 600ml");

    // 8. The live sale lands in the reports (V10/SD-36: the seeded history
    // is now the reference's own April/March dates — outside every window —
    // so the aggregation is covered through the LIVE selling path). The
    // method section only lists a method once a windowed sale EXISTS — it
    // doubles as the data-loaded wait. Earlier specs (sale-integrity's
    // control) may have added sales of their own — assert the terminal
    // sale's contribution numerically, order-robustly.
    await page.goto("/Reports");
    await expect(page.getByTestId("report-by-method")).toContainText("Efectivo");
    const reported = await page.evaluate(() => {
      const tx = document.querySelector('[data-testid="report-transactions"]')?.textContent ?? "";
      const rev = document.querySelector('[data-testid="report-revenue"]')?.textContent ?? "";
      return {
        transactions: parseInt((tx.match(/\d+/) ?? ["0"])[0], 10),
        revenue: parseFloat((rev.match(/\$([\d.]+)/) ?? ["0", "0"])[1]),
      };
    });
    expect(reported.transactions).toBeGreaterThanOrEqual(1);
    expect(reported.revenue).toBeGreaterThanOrEqual(64.38);

    // 9. Close the shift so later specs start from the closed baseline.
    await page.goto("/Registers");
    await page.locator('[data-testid^="close-shift-"]').first().click();
    await page.getByTestId("shift-closing-input").fill("564.38");
    await page.getByTestId("shift-close-submit").click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("cash short of the total blocks the payment", async ({ page }) => {
    await page.goto("/Registers");
    await page.locator('[data-testid^="open-shift-"]').first().click();
    await page.getByTestId("shift-cashier-select").click();
    await page.getByRole("option").first().click();
    await page.getByTestId("shift-submit").click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.goto("/");
    await page.locator('[data-testid^="terminal-product-"]', { hasText: "Coca-Cola 600ml" }).click();
    await page.getByTestId("cobrar-button").click();
    await page.getByTestId("pay-cash").fill("5");
    await expect(page.getByText("El efectivo no cubre el total.")).toBeVisible();
    await expect(page.getByTestId("confirm-payment")).toBeDisabled();

    // Clean up: close the turno.
    await page.goto("/Registers");
    await page.locator('[data-testid^="close-shift-"]').first().click();
    await page.getByTestId("shift-close-submit").click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

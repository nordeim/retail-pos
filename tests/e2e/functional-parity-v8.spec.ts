import { expect, test } from "@playwright/test";

import { DEMO_EMAIL, DEMO_PASSWORD } from "./helpers";

// ---------------------------------------------------------------------------
// E2e pins for remediation-plan-v8 — the from_url deep-link round-trip (the
// reference bounces a logged-out deep route to /login?from_url=<url> and
// RETURNS there after sign-in; the clone used to land on / unconditionally),
// the ticket-detail modal's measured layout (2×2 meta grid, "{qty}x" lines,
// light slate dividers, the 18px bold Total, no footer Close), the mail
// action's recipient prompt, the Ajustes hex inputs, and the dialog family's
// measured #0f121a chrome. The round-trip pins opt out of storageState (the
// logged-out surface is the natural host); the rest run authenticated.
// ---------------------------------------------------------------------------

test.describe("functional parity (v8) — the from_url round-trip", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("F1: a logged-out deep route bounces to /login carrying from_url", async ({ page }) => {
    await page.goto("/Reports");
    await page.waitForURL(/\/login\?from_url=/);
    await expect(page.getByTestId("auth-page")).toBeVisible();
    const url = new URL(page.url());
    expect(url.searchParams.get("from_url")).toContain("/Reports");
  });

  test("F1: after login the user returns to the deep-linked route", async ({ page }) => {
    await page.goto("/Reports");
    await page.waitForURL(/\/login\?from_url=/);
    await page.getByLabel("Email").fill(DEMO_EMAIL);
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByTestId("login-submit").click();
    // Back on /Reports — not the Terminal — with its route title.
    await page.waitForURL(/\/Reports/);
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
    await expect(page).toHaveTitle("Reports | VeloxPOS");
  });

  test("F1: a foreign from_url fails closed to the Terminal (open-redirect guard)", async ({ page }) => {
    await page.goto("/login?from_url=https%3A%2F%2Fevil.example%2Fsteal");
    await page.getByLabel("Email").fill(DEMO_EMAIL);
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByTestId("login-submit").click();
    await page.waitForURL(/\/$|\/Terminal/);
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
  });
});

test.describe("functional parity (v8) — authenticated surfaces", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/Sales");
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
  });

  test("F2: the ticket modal is the reference's measured layout", async ({ page }) => {
    await page.locator("[data-testid^=view-sale]").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId("sale-detail-title")).toContainText("Ticket ");

    // The meta block is a 2×2 grid: Fecha/Cajero share a row (same y,
    // different x), Método/Caja the next.
    const metaBox = await dialog
      .getByText("Fecha:", { exact: true })
      .locator("xpath=ancestor::div[preceding-sibling::*[1] or self::div][1]")
      .boundingBox();
    const fecha = await dialog.getByText("Fecha:", { exact: true }).boundingBox();
    const cajero = await dialog.getByText("Cajero:", { exact: true }).boundingBox();
    const metodo = await dialog.getByText("Método:", { exact: true }).boundingBox();
    const caja = await dialog.getByText("Caja:", { exact: true }).boundingBox();
    expect(metaBox).not.toBeNull();
    expect(fecha && cajero && metodo && caja).toBeTruthy();
    if (fecha && cajero && metodo && caja) {
      expect(Math.abs(fecha.y - cajero.y)).toBeLessThan(4); // same row
      expect(cajero.x).toBeGreaterThan(fecha.x); // side by side
      expect(Math.abs(metodo.y - caja.y)).toBeLessThan(4); // next row
      expect(caja.x).toBeGreaterThan(metodo.x);
      expect(metodo.y).toBeGreaterThan(fecha.y); // stacked rows
    }

    // The item lines read "{qty}x {name}" — the reference's format.
    const firstLine = dialog.locator("[data-testid=sale-detail-items] li span").first();
    await expect(firstLine).toHaveText(/^\d+x .+/);

    // The Total row is the reference's 18px bold closer.
    const totalValue = dialog.locator("[data-testid=sale-detail-total]");
    await expect(totalValue).toBeVisible();
    const totalSize = await totalValue.evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    );
    const totalWeight = await totalValue.evaluate((el) => getComputedStyle(el).fontWeight);
    expect(totalSize).toBe(18);
    expect(totalWeight).toBe("700");

    // No footer Close button — the X alone closes. The X's accessible name
    // is "Close" (shadcn's sr-only span), so the pin is: exactly ONE
    // Close-named button, and it is the 16px icon, not a text footer.
    const closeButtons = dialog.getByRole("button", { name: "Close", exact: true });
    await expect(closeButtons).toHaveCount(1);
    const closeBox = await closeButtons.first().boundingBox();
    expect(closeBox?.width).toBeLessThanOrEqual(20);
    await closeButtons.first().click(); // the X
    await expect(dialog).toBeHidden();
  });

  test("F5: the dialogs ride the measured #0f121a chrome", async ({ page }) => {
    await page.goto("/Inventory");
    await page.getByRole("button", { name: /Nuevo Producto/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const bg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe("rgb(15, 18, 26)");
    const color = await dialog.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(231, 233, 239)");
  });

  test("F3: the mail action prompts for the recipient first", async ({ page }) => {
    // A synchronous window.prompt BLOCKS the click action — the handler
    // must run concurrently (page.once) and dismiss to unblock it.
    let promptMessage = "";
    const dialogHandled = new Promise<void>((resolve) => {
      page.once("dialog", async (dialogInfo) => {
        promptMessage = dialogInfo.message();
        await dialogInfo.dismiss();
        resolve();
      });
    });
    await page.locator("[data-testid^=mail-sale]").first().click();
    await dialogHandled;
    expect(promptMessage).toBe("Enviar ticket a:");
    // Cancel is a no-op — the sales view is still on screen.
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("F4: the hex inputs drive the color swatches two-way", async ({ page }) => {
    await page.goto("/StoreSettings");
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
    const swatch = page.locator("#settings-primary");
    const hex = page.getByTestId("settings-primary-hex");
    await expect(hex).toBeVisible();

    await hex.fill("#8b5cf6");
    await expect(swatch).toHaveValue("#8b5cf6", { timeout: 3000 });

    // The swatch writes back into the hex field.
    await swatch.fill("#059669");
    await expect(hex).toHaveValue("#059669", { timeout: 3000 });
  });
});

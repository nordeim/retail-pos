import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2e pins for remediation-plan-v7 — the per-route document title system,
// the image "Quitar" clear round-trip (the stored data URL used to survive a
// remove+save because undefined keys never ride the PATCH), the settings
// logo preview + remove, and numeric-input parity. Written against the
// authenticated project (storageState injected); the two route-title pins
// opt out where the logged-out surface is the natural host.
// ---------------------------------------------------------------------------

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("functional parity (v7)", () => {
  test("M1: the tab title follows SPA view switches", async ({ page }) => {
    await page.goto("/Dashboard");
    await expect(page.locator("aside")).toBeVisible();
    await expect(page).toHaveTitle("Dashboard | VeloxPOS");

    await page.getByRole("link", { name: "Ventas" }).click();
    await expect(page).toHaveURL(/\/Sales/);
    await expect(page).toHaveTitle("Sales | VeloxPOS");

    await page.getByRole("link", { name: "Ajustes" }).click();
    await expect(page).toHaveURL(/\/StoreSettings/);
    await expect(page).toHaveTitle("Store Settings | VeloxPOS");

    await page.getByRole("link", { name: "Terminal" }).click();
    await expect(page).toHaveURL(/\/$|\/Terminal/);
    await expect(page).toHaveTitle("VeloxPOS");
  });

  test("M1: a full load of each route lands on its title", async ({ page }) => {
    for (const [path, title] of [
      ["/Dashboard", "Dashboard | VeloxPOS"],
      ["/Inventory", "Inventory | VeloxPOS"],
      ["/Sales", "Sales | VeloxPOS"],
      ["/Registers", "Registers | VeloxPOS"],
      ["/Cashiers", "Cashiers | VeloxPOS"],
      ["/Reports", "Reports | VeloxPOS"],
      ["/StoreSettings", "Store Settings | VeloxPOS"],
      ["/", "VeloxPOS"],
    ] as const) {
      await page.goto(path);
      await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
      await expect(page).toHaveTitle(title);
    }
  });

  test("M1: unknown routes carry the reference's slug-cased 404 title", async ({ page }) => {
    await page.goto("/no-such-view-xyz");
    await expect(page.getByTestId("not-found-card")).toBeVisible();
    await expect(page.getByText("Página no encontrada")).toBeVisible();
    await expect(page).toHaveTitle("No Such View Xyz | VeloxPOS");
  });

  test("M1: /signup carries the reference's signup title", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
    await expect(page).toHaveTitle("Signup | VeloxPOS");
  });

  test("F1: Quitar clears the stored image (server round-trip)", async ({ page }) => {
    await page.goto("/Inventory");
    await page.getByTestId("new-product-button").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByTestId("product-name-input").fill("Producto Clear V7");
    await page.getByTestId("product-barcode-input").fill("7501999888777");
    await page.getByTestId("product-price-input").fill("5.00");
    await page.setInputFiles("#product-image", {
      name: "clear-test.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    await expect(page.getByTestId("product-image-preview")).toBeVisible();
    await page.getByTestId("product-submit").click();
    await expect(page.getByTestId("inventory-table")).toContainText("Producto Clear V7");

    // The stored row carries the image.
    let row = page.locator("tr", { hasText: "Producto Clear V7" });
    const withImage = await page.evaluate(async () => {
      const rows = await fetch("/api/products").then((r) => r.json());
      const hit = rows.find((r: { name: string }) => r.name === "Producto Clear V7");
      return hit ? Boolean(hit.imageUrl) : null;
    });
    expect(withImage).toBe(true);

    // Quitar + save — the clear must reach the server this time.
    await row.getByRole("button", { name: /Editar/i }).click();
    await expect(page.getByTestId("product-image-preview")).toBeVisible();
    await page.getByRole("button", { name: "Quitar" }).click();
    await expect(page.getByTestId("product-image-preview")).toHaveCount(0);
    await page.getByTestId("product-submit").click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    const cleared = await page.evaluate(async () => {
      const rows = await fetch("/api/products").then((r) => r.json());
      const hit = rows.find((r: { name: string }) => r.name === "Producto Clear V7");
      return hit ? hit.imageUrl : "missing";
    });
    expect(cleared).toBeNull();

    // And a fresh dialog agrees (no preview of a ghost image).
    row = page.locator("tr", { hasText: "Producto Clear V7" });
    await row.getByRole("button", { name: /Editar/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByTestId("product-image-preview")).toHaveCount(0);
    await page.getByRole("button", { name: "Cancelar" }).click();

    // Cleanup.
    await row.getByRole("button", { name: /Eliminar/i }).click();
    await page.getByTestId("confirm-delete-product").click();
    await expect(page.locator("tr", { hasText: "Producto Clear V7" })).toHaveCount(0);
  });

  test("V2: the numeric dialog fields are the reference's number inputs", async ({ page }) => {
    await page.goto("/Inventory");
    await page.getByTestId("new-product-button").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    for (const id of ["product-price", "product-cost", "product-stock", "product-min-stock", "product-iva"]) {
      await expect(page.locator(`#${id}`)).toHaveAttribute("type", "number");
    }

    // The reference's spinners render on its number controls — assert the
    // pseudo-element (the observable difference vs text+inputMode).
    const spin = await page
      .locator("#product-price")
      .evaluate((el) => getComputedStyle(el, "::-webkit-inner-spin-button").display);
    expect(spin).toBe("flex");

    // Native filtering: letters never enter a number field (fill() refuses
    // invalid input by design, so type key-by-key like a user).
    await page.getByTestId("product-price-input").click();
    await page.getByTestId("product-price-input").pressSequentially("abc");
    expect(await page.getByTestId("product-price-input").inputValue()).toBe("");

    // Valid input still flows (the submit stays enabled with name+barcode+price).
    await page.getByTestId("product-name-input").fill("X");
    await page.getByTestId("product-barcode-input").fill("X");
    await page.getByTestId("product-price-input").fill("12.50");
    await expect(page.getByTestId("product-submit")).toBeEnabled();
  });

  test("F2: the settings logo preview appears on pick and clears on Quitar", async ({ page }) => {
    await page.goto("/StoreSettings");
    await expect(page.getByTestId("settings-business-card")).toBeVisible();

    await page.setInputFiles("#settings-logo", {
      name: "logo-test.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    const preview = page.getByTestId("settings-logo-preview");
    await expect(preview).toBeVisible();
    const src = await preview.locator("img").getAttribute("src");
    expect(src).toContain("data:image/");

    await preview.getByRole("button", { name: "Quitar" }).click();
    await expect(page.getByTestId("settings-logo-preview")).toHaveCount(0);

    // The cleared logo round-trips through the PATCH (server null).
    await page.getByTestId("settings-save").click();
    await expect(page.getByTestId("settings-saved")).toBeVisible();
    const stored = await page.evaluate(async () => {
      const s = await fetch("/api/settings").then((r) => r.json());
      return s.logoUrl;
    });
    expect(stored).toBeNull();
  });
});

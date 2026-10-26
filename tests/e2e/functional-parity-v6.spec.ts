import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2e pins for remediation-plan-v6 — the functional-superset completion.
// Each pin mirrors a live-verified finding (docs/remediation-plan-v6.md §0):
// the Unidad select, the product-image data-URL upload, the delete-failure
// toast, the ticket mailto:, the 42px dialog buttons, and the document-head
// suite. Written against the authenticated project (storageState injected).
// ---------------------------------------------------------------------------

test.describe("functional parity (v6)", () => {
  test("B1: the Unidad select saves a non-default unit", async ({ page }) => {
    await page.goto("/Inventory");
    await page.getByTestId("new-product-button").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByTestId("product-name-input").fill("Tornillo Acero 1in");
    await page.getByTestId("product-barcode-input").fill("7501000999999");
    await page.getByTestId("product-price-input").fill("2.00");
    await page.getByTestId("product-unit-select").click();
    await page.getByRole("option", { name: "Metro" }).click();
    await page.getByTestId("product-submit").click();

    await expect(page.getByTestId("inventory-table")).toContainText("Tornillo Acero 1in");

    // The stored unit round-trips through the edit dialog.
    const row = page.locator("tr", { hasText: "Tornillo Acero 1in" });
    await row.getByRole("button", { name: /Editar/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByTestId("product-unit-select")).toContainText("Metro");
    await page.getByRole("button", { name: "Cancelar" }).click();

    // Cleanup.
    await row.getByRole("button", { name: /Eliminar/i }).click();
    await page.getByTestId("confirm-delete-product").click();
    await expect(page.locator("tr", { hasText: "Tornillo Acero 1in" })).toHaveCount(0);
  });

  test("B2: a picked product image is stored and previewed as a data URL", async ({ page }) => {
    await page.goto("/Inventory");
    await page.getByTestId("new-product-button").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByTestId("product-name-input").fill("Café La Selva 340g");
    await page.getByTestId("product-barcode-input").fill("7501000888888");
    await page.getByTestId("product-price-input").fill("95.00");

    // A real 1x1 PNG (the canvas resize path handles any image).
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );
    await page.setInputFiles("#product-image", {
      name: "test-product.png",
      mimeType: "image/png",
      buffer: png,
    });

    // The preview thumb appears (the canvas resize produced a data URL).
    await expect(page.getByTestId("product-image-preview")).toBeVisible();
    const src = await page.getByTestId("product-image-preview").locator("img").getAttribute("src");
    expect(src).toContain("data:image/");

    await page.getByTestId("product-submit").click();
    await expect(page.getByTestId("inventory-table")).toContainText("Café La Selva 340g");

    // The stored image survives a re-open (edit dialog shows the preview).
    const row = page.locator("tr", { hasText: "Café La Selva 340g" });
    await row.getByRole("button", { name: /Editar/i }).click();
    await expect(page.getByTestId("product-image-preview")).toBeVisible();
    await page.getByRole("button", { name: "Cancelar" }).click();

    await row.getByRole("button", { name: /Eliminar/i }).click();
    await page.getByTestId("confirm-delete-product").click();
    await expect(page.locator("tr", { hasText: "Café La Selva 340g" })).toHaveCount(0);
  });

  test("B4: a failed delete surfaces the error toast (no silent failure)", async ({ page }) => {
    await page.goto("/Inventory");
    const row = page.locator("tbody tr").first();
    await row.getByRole("button", { name: /Eliminar/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Force the DELETE to fail.
    await page.route(/\/api\/products\//, (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"boom"}' }),
    );
    await page.getByTestId("confirm-delete-product").click();

    // The toast region carries the failure; the dialog stays open.
    await expect(page.getByRole("region", { name: "Notifications" })).toContainText(/eliminar|boom|error/i);
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("B5: the mail button fetches the fresh sale and navigates to mailto:", async ({ page }) => {
    await page.goto("/Sales");
    const firstMail = page.locator('[data-testid^="mail-sale-"]').first();
    await expect(firstMail).toBeVisible();

    // window.location is unforgeable in Chromium, so the mailto: itself
    // can't be captured here — the builder string is unit-pinned. The e2e
    // proof of wiring: the handler's fresh-fetch fires (and the external
    // protocol navigation is a harmless no-op in headless).
    const saleRequest = page.waitForRequest(/\/api\/sales\/[^/]+$/, { timeout: 5000 });
    await firstMail.click();
    const request = await saleRequest;
    expect(request.method()).toBe("GET");
    await page.waitForTimeout(400);
    // The page itself never navigated away.
    expect(page.url()).toContain("/Sales");
  });

  test("B6: the dialog submit/cancel buttons are the reference's 42px", async ({ page }) => {
    await page.goto("/Inventory");
    await page.getByTestId("new-product-button").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const submit = page.getByTestId("product-submit");
    const cancel = page.getByRole("dialog").getByRole("button", { name: "Cancelar" });
    await expect(submit).toBeVisible();
    const submitH = (await submit.boundingBox())?.height ?? 0;
    const cancelH = (await cancel.boundingBox())?.height ?? 0;
    // The reference's dialog buttons are 42px (dev-renderer exact); the
    // standalone renderer rounds a subpixel to 41 — the CONTRACT is the
    // 42px rhythm (py-2.5 + h-auto), decisively not the old cva h-9=36px.
    expect(submitH).toBeGreaterThan(39);
    expect(submitH).toBeLessThan(44);
    expect(cancelH).toBeGreaterThan(39);
    expect(cancelH).toBeLessThan(44);
  });

  test("B9: the document head ships the reference's meta suite", async ({ page }) => {
    await page.goto("/Dashboard");
    await expect(page).toHaveTitle("VeloxPOS");
    await expect(page.locator('link[rel="icon"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "VeloxPOS");
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.json");
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
      "content",
      "VeloxPOS",
    );

    const manifest = await page.request.get("/manifest.json");
    expect(manifest.ok()).toBe(true);
    const body = (await manifest.json()) as { name?: string };
    expect(body.name).toBe("VeloxPOS");
  });

  test("B7: the sidebar branding tile carries the violet glow", async ({ page }) => {
    await page.goto("/Dashboard");
    const tile = page.locator("aside span[class*=from-violet-500]").first();
    await expect(tile).toBeVisible();
    const shadow = await tile.evaluate((el) => getComputedStyle(el).boxShadow);
    // violet-500/30 serializes as oklab(...) / 0.3 in v4 — the reference's
    // own rgba(139,92,246,.3) is the same color in v3 form. Pin the
    // geometry + alpha, not the serialization.
    expect(shadow).toMatch(/\/ 0\.3\) 0px 10px 15px -3px/);
    expect(shadow).toMatch(/0px 4px 6px -4px/);
  });

  test("F5: the checked switch renders the reference's violet fill", async ({ page }) => {
    await page.goto("/Inventory");
    await page.getByTestId("new-product-button").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const sw = page.locator('[data-slot="switch"]').first();
    await expect(sw).toHaveAttribute("data-state", "checked");
    await expect(sw).toHaveCSS("background-color", "rgb(127, 98, 244)");
  });
});

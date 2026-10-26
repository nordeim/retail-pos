import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2e pins for remediation-plan-v9 — the Spanish route aliases now resolve
// to their views (the rewrites accepted them but viewFromPath silently
// rendered the Terminal), the document title is PATH-driven like the
// reference (exact-case canonical match, slug-case everything else: "/SALES"
// is "SALES | VeloxPOS"), the Ventas Total inherits the ref's 16px (tables
// are bare — cells carry their own sizes), the body default text is the
// ref's measured #e7e9ef, and the two chart skins (Dashboard vs Reports)
// ride their measured gridlines/labels/gradient/line values.
// ---------------------------------------------------------------------------

test.describe("functional parity (v9) — the Spanish aliases render their views", () => {
  test("/Ventas renders the Ventas view (not the Terminal) with the ref's own title", async ({ page }) => {
    await page.goto("/Ventas");
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Historial de Ventas" })).toBeVisible();
    await expect(page).toHaveTitle("Ventas | VeloxPOS");
  });

  test("/Inventario renders the inventory view", async ({ page }) => {
    await page.goto("/Inventario");
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Inventario" })).toBeVisible();
    await expect(page).toHaveTitle("Inventario | VeloxPOS");
  });

  test("/Ajustes renders the settings view", async ({ page }) => {
    await page.goto("/Ajustes");
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ajustes de la Tienda" })).toBeVisible();
    await expect(page).toHaveTitle("Ajustes | VeloxPOS");
  });
});

test.describe("functional parity (v9) — the path-driven title", () => {
  test("/SALES renders the view but slug-cases the title like the ref", async ({ page }) => {
    await page.goto("/SALES");
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Historial de Ventas" })).toBeVisible();
    // Live-measured on the ref: the VIEW renders (case-insensitive) but the
    // title is "SALES | VeloxPOS" — exact-case canonical match or slug-case.
    await expect(page).toHaveTitle("SALES | VeloxPOS");
  });

  test("/storesettings slug-cases (the ref shows 'Storesettings', not 'Store Settings')", async ({ page }) => {
    await page.goto("/storesettings");
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
    await expect(page).toHaveTitle("Storesettings | VeloxPOS");
  });

  test("canonical /Sales keeps its canonical title (no regression)", async ({ page }) => {
    await page.goto("/Sales");
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
    await expect(page).toHaveTitle("Sales | VeloxPOS");
  });
});

test.describe("functional parity (v9) — the bare tables + the foreground token", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/Sales");
    await expect(page.getByTestId("sales-table")).toBeVisible();
  });

  test("F3: the Ventas Total renders at the ref's 16px (inherited, not text-sm)", async ({ page }) => {
    const totalCell = page.locator("[data-testid=sales-table] tbody tr").first().locator("td").nth(4);
    await expect(totalCell).toContainText("$");
    const fontSize = await totalCell.evaluate((el) => getComputedStyle(el).fontSize);
    expect(fontSize).toBe("16px");
    // The cell's own classes stay exactly the ref's (no size utility).
    const cls = await totalCell.evaluate((el) => el.className);
    expect(cls).toContain("font-bold");
    expect(cls).not.toContain("text-sm");
  });

  test("F4: the body default text color is the ref's #e7e9ef", async ({ page }) => {
    const color = await page.evaluate(() => getComputedStyle(document.body).color);
    expect(color).toBe("rgb(231, 233, 239)");
  });
});

test.describe("functional parity (v9) — the two chart skins", () => {
  test("F5-F8: the Dashboard chart rides the light gridlines + 12px labels + gradient", async ({ page }) => {
    await page.goto("/Dashboard");
    const chart = page.locator("[data-testid=weekly-chart-card] svg").first();
    await expect(chart).toBeVisible();

    const gridline = chart.locator("line").first();
    await expect(gridline).toHaveAttribute("stroke", "#e2e8f0");
    await expect(gridline).toHaveAttribute("stroke-dasharray", "3 3");

    const label = chart.locator("text").first();
    expect(await label.getAttribute("font-size")).toBe("12");
    expect(await label.getAttribute("fill")).toBe("#94a3b8");

    // The area fills the salesGrad gradient; the line is the ref's indigo.
    const area = chart.locator("path").first();
    expect(await area.getAttribute("fill")).toContain("salesGrad");
    const line = chart.locator("path[stroke]").last();
    expect(await line.getAttribute("stroke")).toBe("#6366f1");
  });

  test("F5-F8: the Reports chart rides the white/4% gridlines + 11px white/30% labels", async ({ page }) => {
    await page.goto("/Reports");
    const chart = page.locator("[data-testid=report-daily-card] svg").first();
    await expect(chart).toBeVisible();

    const gridline = chart.locator("line").first();
    await expect(gridline).toHaveAttribute("stroke", "rgba(255,255,255,0.04)");
    await expect(gridline).toHaveAttribute("stroke-dasharray", "3 3");

    const label = chart.locator("text").first();
    expect(await label.getAttribute("font-size")).toBe("11");
    expect(await label.getAttribute("fill")).toBe("rgba(255,255,255,0.3)");

    const line = chart.locator("path[stroke]").last();
    expect(await line.getAttribute("stroke")).toBe("#6366f1");
  });
});

import { expect, test } from "@playwright/test";

// The Reportes sweep: the period control, the KPI cards, and the chart
// cards — rendered against the seeded sales.

test.describe("reportes", () => {
  test("renders the KPIs and period control", async ({ page }) => {
    await page.goto("/Reports");
    await expect(page.locator("main h1")).toHaveText("Reportes");
    await expect(page.getByTestId("report-periods")).toContainText("7 días");
    await expect(page.getByTestId("report-periods")).toContainText("14 días");
    await expect(page.getByTestId("report-periods")).toContainText("30 días");
    await expect(page.getByTestId("report-periods")).toContainText("90 días");

    await expect(page.getByTestId("report-revenue")).toBeVisible();
    await expect(page.getByTestId("report-transactions")).toBeVisible();
    await expect(page.getByTestId("report-average")).toBeVisible();
    await expect(page.getByTestId("report-daily-card")).toBeVisible();
  });

  test("the seeded (April/March) sales fall outside every window — the reference's own empty state (V10/SD-34)", async ({ page }) => {
    // The two historical sales ride the reference's exact datetimes
    // (19/04/2026 and 14/03/2026 — measured live on its Ventas table);
    // like the reference, every window (even 90 days) renders empty.
    await page.goto("/Reports");
    await page.getByTestId("report-periods").getByRole("tab", { name: "90 días" }).click();
    await expect(page.getByTestId("report-transactions")).toContainText("0");
    await expect(page.getByTestId("report-revenue")).toContainText("$0.00");
    await expect(page.getByTestId("report-average")).toContainText("$0.00");
  });

  test("the per-method sections render the reference's empty state", async ({ page }) => {
    // V10/SD-34: the reference's own reports show "Sin datos en este
    // período" in both method sections (its sales are 6 months old) — the
    // seeded clone mirrors it. The aggregation path keeps LIVE coverage in
    // terminal-sales.spec.ts (a post-sale reports assertion).
    await page.goto("/Reports");
    await expect(page.getByTestId("report-by-method")).toContainText("Sin datos en este período");
    await expect(page.getByTestId("report-method-detail")).toContainText("Sin datos en este período");
  });
});

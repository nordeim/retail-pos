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

  test("the 90-day window contains both seeded sales ($21.46 + $61.48)", async ({ page }) => {
    await page.goto("/Reports");
    await page.getByTestId("report-periods").getByRole("tab", { name: "90 días" }).click();
    await expect(page.getByTestId("report-transactions")).toContainText("2");
    await expect(page.getByTestId("report-revenue")).toContainText("$82.94");
    await expect(page.getByTestId("report-average")).toContainText("$41.47");
  });

  test("the per-method breakdown lists Efectivo only", async ({ page }) => {
    await page.goto("/Reports");
    await expect(page.getByTestId("report-by-method")).toContainText("Efectivo");
    await expect(page.getByTestId("report-method-detail")).toContainText("Efectivo");
  });
});

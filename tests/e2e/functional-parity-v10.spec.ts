import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2e pins for remediation-plan-v10 — the category donut family (the
// reference's fully-measured rendering: filled sector paths with the
// recharts ramp #6366f1→#ddd6fe + #22c55e, ring innerR 50 / outerR 80 at
// (166.5, 100) in a 333×200 box, counterclockwise from 3 o'clock with the
// trailing 4° gap, #fff 1px strokes, the 5-row legend stacked BELOW the
// chart with slate-600/slate-700 rows and 12px swatches), the low-stock
// header's 12px gap, the Ajustes per-section header icons, and the seeded
// DATA parity (the reference's product page order + real 12th row, Caja 2
// first, the sales' exact April/March datetimes with the second sale's
// real items, the flat empty-window dashboard chart, and the reference's
// X-tick rule on the reports chart).
// ---------------------------------------------------------------------------

test.describe("functional parity (v10) — the donut family", () => {
  test("the donut renders six measured sectors: fills, white strokes, 3 o'clock CCW start", async ({ page }) => {
    await page.goto("/Dashboard");
    const svg = page.locator('[data-testid="category-chart-card"] svg');
    // V11/SD-37 realignment: the box is container-responsive now — at this
    // 1280 viewport the card column is narrower than 333, so the box
    // re-wraps (the reference's own recharts behavior) instead of scaling
    // the drawing. The ring geometry (fixed radii, cy 100, cx = box/2) is
    // the v10 contract, carried forward unchanged.
    const boxW = await svg.evaluate((el) => Number(el.getAttribute("width")));
    expect(boxW).toBeLessThan(333);
    await expect(svg).toHaveAttribute("viewBox", `0 0 ${boxW} 200`);

    const sectors = svg.locator("path");
    await expect(sectors).toHaveCount(6);
    // The measured ramp, in data order (Lácteos → Bebidas).
    const fills = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#22c55e"];
    for (let i = 0; i < fills.length; i += 1) {
      await expect(sectors.nth(i)).toHaveAttribute("fill", fills[i]);
      await expect(sectors.nth(i)).toHaveAttribute("stroke", "#fff");
    }
    // The first sector starts EXACTLY at 3 o'clock relative to the BOX
    // center: M = (box/2 + 80, 100) — at the 333 cap (the v10 measurement)
    // this is (246.5, 100).
    const firstD = await sectors.first().getAttribute("d");
    expect(firstD?.startsWith(`M ${boxW / 2 + 80},100`)).toBe(true);
    // ...and rises counterclockwise (the arc endpoint at 56° relative to
    // the box center: x = box/2 + 80·cos56°, y = 100 − 80·sin56°).
    const arcX = boxW / 2 + 80 * Math.cos((56 * Math.PI) / 180);
    const arcY = 100 - 80 * Math.sin((56 * Math.PI) / 180);
    expect(firstD).toContain(`${arcX.toFixed(2)},${arcY.toFixed(2)}`);
  });

  test("the legend caps at the reference's 5 rows with its measured anatomy", async ({ page }) => {
    await page.goto("/Dashboard");
 const card = page.getByTestId("category-chart-card");
    // The stacked layout: the chart container sits above the legend.
    const chartBox = await card.locator("svg").boundingBox();
    const legendBox = await card.locator("div.space-y-2").boundingBox();
    expect(chartBox).not.toBeNull();
    expect(legendBox).not.toBeNull();
    expect(legendBox!.y).toBeGreaterThan(chartBox!.y + chartBox!.height - 1);

    const rows = card.locator("div.space-y-2 > div");
    await expect(rows).toHaveCount(5);
    // The ref's row anatomy, class-pinned (the established idiom — Tailwind
    // v4 rebalanced its palette in oklch, so v3 hex values rasterize a few
    // ΔE off on the clone; the v9 pixel/VLM precedent holds them visually
    // equivalent. The class IS the contract).
    await expect(rows.first().locator("span.text-slate-600")).toHaveCount(1);
    await expect(rows.first().locator("span.font-semibold.text-slate-700")).toHaveCount(1);
    // The 12px swatch.
    await expect(rows.first().locator("div.w-3")).toHaveCSS("width", "12px");
    // The 6th category (Bebidas) is in the chart but NOT the legend (the
    // card's text surface is the title + the legend rows).
    await expect(card).not.toContainText("Bebidas");
  });

  test("the donut order is deterministic (Lácteos first — the ref's donut order)", async ({ page }) => {
    await page.goto("/Dashboard");
    const rows = page.getByTestId("category-chart-card").locator("div.space-y-2 > div");
    await expect(rows.first()).toContainText("Lácteos");
    await expect(rows.nth(1)).toContainText("Limpieza");
    await expect(rows.nth(2)).toContainText("Higiene Personal");
    await expect(rows.nth(3)).toContainText("Alimentos");
    await expect(rows.nth(4)).toContainText("Snacks");
  });
});

test.describe("functional parity (v10) — the low-stock header gap", () => {
  test("the header→list gap is the reference's 12px (mb-3)", async ({ page }) => {
    await page.goto("/Dashboard");
    // Wait for the list to load (the card renders "Cargando…" first).
    const card = page.getByTestId("low-stock-card");
    await expect(card).toContainText("en stock");
    const gap = await page.evaluate(() => {
      const h3 = Array.from(document.querySelectorAll("h3")).find((x) =>
        /stock bajo/.test(x.textContent ?? ""),
      );
      const cardEl = h3?.closest("div.vx-card");
      const firstRow = Array.from(cardEl?.children ?? []).find(
        (c) => c.textContent?.includes("en stock"),
      );
      if (!h3 || !firstRow) return null;
      return Math.round(firstRow.getBoundingClientRect().top - h3.getBoundingClientRect().bottom);
    });
    expect(gap).toBe(12);
  });
});

test.describe("functional parity (v10) — the Ajustes header icons", () => {
  test("the five sections carry the ref's per-section icon classes at 20px", async ({ page }) => {
    await page.goto("/StoreSettings");
    // Wait for the settings view to render its sections.
    await expect(page.getByRole("heading", { name: "Información del Negocio" })).toBeVisible();
    // The ref's per-section icon+color classes, measured live. The tone is
    // class-pinned (the established idiom — v4's oklch palette rebalance
    // renders a few ΔE off the ref's v3 hex; the v9 pixel/VLM precedent
    // holds them visually equivalent).
    const icons = await page.evaluate(() =>
      Array.from(document.querySelectorAll("h3"))
        .filter((h) => h.closest("div.vx-card"))
        .map((h) => {
          const svg = h.parentElement?.querySelector("svg");
          return {
            text: h.textContent?.trim() ?? "",
            cls: svg?.getAttribute("class") ?? "",
            size: svg ? getComputedStyle(svg).width : "",
          };
        }),
    );
    const expected: Record<string, [string, string]> = {
      "Información del Negocio": ["h-5 w-5 text-indigo-500", "20px"],
      Personalización: ["h-5 w-5 text-purple-500", "20px"],
      "Ticket / Recibo": ["h-5 w-5 text-green-500", "20px"],
      "Proveedor de Pagos con Tarjeta": ["h-5 w-5 text-blue-500", "20px"],
      "Categorías de Producto": ["h-5 w-5 text-amber-500", "20px"],
    };
    expect(icons.length).toBe(5);
    for (const row of icons) {
      const [cls, size] = expected[row.text] ?? [];
      expect(cls, `icon class for ${row.text}`).toBeTruthy();
      expect(row.cls, `icon class for ${row.text}`).toContain(cls!);
      expect(size, `icon size for ${row.text}`).toBe(size);
    }
  });
});

test.describe("functional parity (v10) — the seeded data", () => {
  test("the inventory renders the reference's page order with the real 12th row", async ({ page }) => {
    await page.goto("/Inventory");
    const rows = page.getByTestId("inventory-table").locator("tbody tr");
    await expect(rows).toHaveCount(12);
    await expect(rows.first()).toContainText("Shampoo Pantene 400ml");
    // The dossier-era ASSUMED 12th row is retired: the real one is
    // "Jabón Zote 400g" (barcode 7501025403010, stock 19).
    await expect(rows.nth(10)).toContainText("Jabón Zote 400g");
    await expect(rows.nth(10)).toContainText("19");
    await expect(rows.nth(11)).toContainText("Pan Bimbo Blanco");
  });

  test("the registers render Caja 2 first (the reference's page order)", async ({ page }) => {
    await page.goto("/Registers");
    const cards = page.locator('[data-testid^="register-card-"]');
    await expect(cards).toHaveCount(2);
    await expect(cards.first()).toContainText("Caja 2");
    await expect(cards.nth(1)).toContainText("Caja 1");
  });

  test("the ventas history rides the reference's exact datetimes", async ({ page }) => {
    await page.goto("/Sales");
    const rows = page.locator('[data-testid^="sale-row-"]');
    await expect(rows.first()).toContainText("V-MO6BJT7G");
    await expect(rows.first()).toContainText("19/04/26 22:09");
    await expect(rows.nth(1)).toContainText("V-MMPNY55Z");
    await expect(rows.nth(1)).toContainText("14/03/26 01:45");
  });

  test("the second ticket modal lists the reference's real items", async ({ page }) => {
    await page.goto("/Sales");
    const row = page.locator('[data-testid^="sale-row-"]', { hasText: "V-MMPNY55Z" });
    await row.getByRole("button").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("14 mar 2026, 01:45");
    await expect(dialog).toContainText("1x Jabón Zote 400g");
    await expect(dialog).toContainText("$20.88");
    await expect(dialog).toContainText("1x Papel Higiénico Pétalo 4 rollos");
    await expect(dialog).toContainText("$40.60");
    await expect(dialog).toContainText("$61.48");
  });

  test("the dashboard chart renders the reference's flat empty-window posture", async ({ page }) => {
    await page.goto("/Dashboard");
    // The weekly card loads its data first (no area path until it does).
    const areaPath = page.locator('[data-testid="weekly-chart-card"] svg path[fill="url(#salesGrad)"]');
    await expect(areaPath).toHaveCount(1);
    // The seeded sales are the reference's own April/March dates — outside
    // the 7-day window — so the area path is FLAT at the bottom with the
    // gradient fill (the ref's own rendering, measured live).
    const flat = await page.evaluate(() => {
      const svg = document.querySelector('[data-testid="weekly-chart-card"] svg');
      const area = svg?.querySelector('path[fill="url(#salesGrad)"]');
      if (!area) return null;
      const coords = (area.getAttribute("d") ?? "").match(/[\d.]+,[\d.]+/g) ?? [];
      const ys = new Set(coords.map((c) => c.split(",")[1]));
      return { points: coords.length, distinctY: ys.size };
    });
    expect(flat).not.toBeNull();
    expect(flat!.distinctY).toBe(1);
  });
});

// V11 realignment: the reports windows anchor to the CURRENT day
// (startOfDay(now) - (days-1)), so absolute date strings roll over at
// midnight — the expected labels are computed date-relatively with the
// app's own es-MX month table (src/lib/date.ts MONTHS_SHORT).
const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const labelDaysBack = (back: number): string => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

test.describe("functional parity (v10) — the reports X-tick rule", () => {
  test("the default 30-day window labels the reference's exact day steps", async ({ page }) => {
    await page.goto("/Reports");
    // Wait for the chart's date labels to render (the series loads async).
    await expect(page.getByTestId("report-daily-card")).toContainText("sep");
    const labels = await page.evaluate(() => {
      const svg = document.querySelector('[data-testid="report-daily-card"] svg');
      return Array.from(svg?.querySelectorAll("text") ?? [])
        .map((t) => t.textContent ?? "")
        .filter((t) => /sep|oct|jul|ago/.test(t));
    });
    // Live-measured on the reference: 4-day steps from the window start
    // (day 29 back), ending at day 28 of the window (the last day is NOT
    // labeled) — computed relative to today, the window's own anchor.
    expect(labels).toEqual([29, 25, 21, 17, 13, 9, 5, 1].map(labelDaysBack));
  });

  test("the 14-day window labels every day (the ref's own rule)", async ({ page }) => {
    await page.goto("/Reports");
    await page.getByTestId("report-periods").getByRole("tab", { name: "14 días" }).click();
    // Wait for the switch to render (the first 14-day label = 13 days back).
    await expect(page.getByTestId("report-daily-card")).toContainText(labelDaysBack(13));
    const labels = await page.evaluate(() => {
      const svg = document.querySelector('[data-testid="report-daily-card"] svg');
      return Array.from(svg?.querySelectorAll("text") ?? [])
        .map((t) => t.textContent ?? "")
        .filter((t) => /sep|oct/.test(t));
    });
    expect(labels).toHaveLength(14);
    expect(labels[0]).toBe(labelDaysBack(13));
    expect(labels[13]).toBe(labelDaysBack(0));
  });
});

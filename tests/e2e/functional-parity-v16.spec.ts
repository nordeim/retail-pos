import { expect, test, type Page } from "@playwright/test";

// The V16 pins (docs/remediation-plan-v16.md §B3):
//   F2 the category display order — the reference's entities surfaces render
//      Todos, Snacks, Lácteos, Higiene Personal, Limpieza, Alimentos,
//      Bebidas (DOM-measured twice); the donut keeps its own order.
//   F1 the v3-exactness proofs — after the palette pin block the computed
//      colors serialize as literal rgb()/rgba() (hex-defined vars), and the
//      high-drift surfaces read the reference's exact v3 values:
//      green-700 badge text rgb(21,128,61), the pill's violet-600/20
//      rgba(124,58,237,0.2), the amber-600 count rgb(217,119,6), the
//      indigo-600 ticket cell rgb(79,70,229).

const CHIP_ORDER = [
  "Todos",
  "Snacks",
  "Lácteos",
  "Higiene Personal",
  "Limpieza",
  "Alimentos",
  "Bebidas",
];

const CATEGORY_NAMES = [
  "Snacks",
  "Lácteos",
  "Higiene Personal",
  "Limpieza",
  "Alimentos",
  "Bebidas",
];

async function chipTexts(page: Page): Promise<string[]> {
  return page.evaluate((names: string[]) => {
    const out: string[] = [];
    for (const b of Array.from(document.querySelectorAll("button"))) {
      const t = b.textContent?.trim() ?? "";
      if (names.includes(t)) out.push(t);
    }
    return out;
  }, CHIP_ORDER);
}

test.describe("functional parity (v16) — the category display order", () => {
  test("F2a: the Inventario chips render the reference's sequence", async ({
    page,
  }) => {
    await page.goto("/Inventory");
    await expect(page.getByRole("heading", { name: "Inventario" })).toBeVisible();
    await page.waitForTimeout(400);
    const chips = await chipTexts(page);
    expect(chips).toEqual(CHIP_ORDER);
  });

  test("F2b: the Ajustes categorías list renders the reference's sequence", async ({
    page,
  }) => {
    await page.goto("/StoreSettings");
    await expect(
      page.getByRole("heading", { name: "Categorías de Producto" }),
    ).toBeVisible();
    await page.waitForTimeout(400);
    // The chips are <li> rows (name text + the Trash2 button) inside the
    // Categorías card's <ul>.
    const order = await page.evaluate(() =>
      Array.from(document.querySelectorAll("li.glass-button"))
        .map((e) => (e.textContent ?? "").trim().replace(/\s*Eliminar.*$/, ""))
        .filter((t) => t.length > 0),
    );
    expect(order).toEqual(CATEGORY_NAMES);
  });

  test("F2c: the donut legend keeps its own order (the v10 guard)", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    await expect(
      page.getByRole("heading", { name: "Productos por Categoría" }),
    ).toBeVisible();
    await page.waitForTimeout(600);
    const legend = await page.evaluate(() =>
      Array.from(document.querySelectorAll("div.flex.items-center.gap-2"))
        .map((e) => e.textContent?.trim() ?? "")
        .filter((t) =>
          ["Lácteos", "Limpieza", "Higiene Personal", "Alimentos", "Snacks", "Bebidas"].includes(
            t,
          ),
        ),
    );
    expect(legend.slice(0, 5)).toEqual([
      "Lácteos",
      "Limpieza",
      "Higiene Personal",
      "Alimentos",
      "Snacks",
    ]);
  });
});

test.describe("functional parity (v16) — the v3-exactness proofs (F1)", () => {
  test("F1a: the Completada badge text computes the v3 green-700 exactly", async ({
    page,
  }) => {
    await page.goto("/Sales");
    await expect(page.getByRole("heading", { name: "Ventas" })).toBeVisible();
    const color = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("*")).find(
        (e) => e.children.length === 0 && e.textContent?.trim() === "Completada",
      );
      if (!el) throw new Error("missing Completada badge");
      return getComputedStyle(el).color;
    });
    // Tailwind v3 green-700 = #15803d — the reference's measured badge text.
    expect(color).toBe("rgb(21, 128, 61)");
  });

  test("F1b: the active nav pill bg computes the v3 violet-600 at 20%", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    // Tailwind v4 compiles /20 through color-mix and Chromium serializes
    // the result as oklab(… / 0.2) even with the hex-pinned var (the v15
    // color-mix lesson) — the RENDERED color is verified through the sRGB
    // pixel bytes (±1 per channel), not the computed string.
    const px = await page.evaluate(() => {
      const el = document.querySelector('nav a[aria-current="page"]');
      if (!el) throw new Error("missing active nav link");
      const cs = getComputedStyle(el).backgroundColor;
      const cv = document.createElement("canvas");
      cv.width = cv.height = 1;
      const ctx = cv.getContext("2d", { willReadFrequently: true })!;
      ctx.fillStyle = cs;
      ctx.fillRect(0, 0, 1, 1);
      return {
        bytes: Array.from(ctx.getImageData(0, 0, 1, 1).data),
        alpha022: cs.endsWith("0.2)"),
      };
    });
    // Tailwind v3 violet-600 = #7c3aed at 20% — the reference's measured pill.
    expect(px.alpha022).toBe(true);
    expect(px.bytes[0]).toBeGreaterThan(122);
    expect(px.bytes[0]).toBeLessThan(127);
    expect(px.bytes[1]).toBeGreaterThan(55);
    expect(px.bytes[1]).toBeLessThan(62);
    expect(px.bytes[2]).toBeGreaterThan(231);
    expect(px.bytes[2]).toBeLessThan(243);
    expect(px.bytes[3]).toBeGreaterThan(48);
    expect(px.bytes[3]).toBeLessThan(56);
  });

  test("F1c: the low-stock count computes the v3 amber-600 exactly", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    await expect(
      page.getByRole("heading", { name: "Productos con stock bajo" }),
    ).toBeVisible();
    const color = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="low-stock-detail"]');
      if (!el) throw new Error("missing low-stock detail");
      return getComputedStyle(el).color;
    });
    // Tailwind v3 amber-600 = #d97706 — the reference's measured count.
    expect(color).toBe("rgb(217, 119, 6)");
  });

  test("F1d: the sales ticket cell computes the v3 indigo-600 exactly", async ({
    page,
  }) => {
    await page.goto("/Sales");
    await expect(page.getByRole("heading", { name: "Ventas" })).toBeVisible();
    const color = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("td")).find((t) =>
        t.textContent?.trim().startsWith("V-"),
      );
      if (!el) throw new Error("missing ticket cell");
      return getComputedStyle(el).color;
    });
    // Tailwind v3 indigo-600 = #4f46e5 — the reference's measured ticket cells.
    expect(color).toBe("rgb(79, 70, 229)");
  });
});

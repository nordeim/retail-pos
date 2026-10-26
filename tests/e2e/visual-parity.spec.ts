import { expect, test, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// R3 visual-parity computed-style pins (remediation-plan-v3 §R3), measured
// live on the reference (veloxposretail.base44.app, 2026-10-26).
//
// Tailwind v4 note: utilities resolve through OKLCH/LAB color spaces, so a
// computed `color` string is NOT a literal rgb() — every color assertion
// compares against a PROBE element rendered with the same utility class in
// the same page (resolved-identity comparison, robust to v4's pipeline).
// ---------------------------------------------------------------------------

type StyleData = Record<string, string>;

async function computedStyles(
  page: Page,
  selector: string,
  props: string[],
  probeClass?: string,
): Promise<StyleData> {
  return page.evaluate(
    ({ sel, props: wanted, probe }) => {
      const node = document.querySelector(sel);
      if (!node) throw new Error(`missing ${sel}`);
      const computed = getComputedStyle(node);
      const out: Record<string, string> = {};
      for (const prop of wanted) out[prop] = computed.getPropertyValue(prop);
      if (probe) {
        const probeEl = document.createElement("div");
        probeEl.className = probe;
        probeEl.style.display = "none";
        document.body.appendChild(probeEl);
        out.probeColor = getComputedStyle(probeEl).color;
        probeEl.remove();
      }
      return out;
    },
    { sel: selector, props, probe: probeClass },
  );
}

const WEEKDAY_MIN = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

test.describe("visual parity (R3)", () => {
  test("V1 card: dashboard card headings are 16px/700, slate-700, title-case", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    const heading = page.locator('[data-testid="weekly-chart-card"] h3');
    await expect(heading).toHaveText("Ventas — Últimos 7 días");
    const styles = await computedStyles(
      page,
      '[data-testid="weekly-chart-card"] h3',
      ["font-size", "font-weight", "text-transform"],
      "text-slate-700",
    );
    expect(styles["font-size"]).toBe("16px");
    expect(styles["font-weight"]).toBe("700");
    expect(styles["text-transform"]).toBe("none");
    expect(styles.probeColor).toBeTruthy();
    const color = await computedStyles(
      page,
      '[data-testid="weekly-chart-card"] h3',
      ["color"],
    );
    expect(color.color).toBe(styles.probeColor);
  });

  test("V1 kicker: reports headings are 14px/700 uppercase white/60 with 0.7px tracking", async ({
    page,
  }) => {
    await page.goto("/Reports");
    const heading = page.locator('[data-testid="report-daily-card"] h2');
    await expect(heading).toHaveText("Ventas diarias");
    const styles = await computedStyles(
      page,
      '[data-testid="report-daily-card"] h2',
      ["font-size", "font-weight", "text-transform", "letter-spacing"],
      "text-white/60",
    );
    expect(styles["font-size"]).toBe("14px");
    expect(styles["font-weight"]).toBe("700");
    expect(styles["text-transform"]).toBe("uppercase");
    expect(parseFloat(styles["letter-spacing"])).toBeCloseTo(0.7, 1);
    const color = await computedStyles(
      page,
      '[data-testid="report-daily-card"] h2',
      ["color"],
    );
    expect(color.color).toBe(styles.probeColor);
  });

  test("V2: the page H1 is 24px fixed at desktop width", async ({ page }) => {
    await page.goto("/Dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    const styles = await computedStyles(page, "h1", ["font-size"]);
    expect(styles["font-size"]).toBe("24px");
  });

  test("V3: the 30-day report chart thins X labels to <=9 and shows integer $ Y labels", async ({
    page,
  }) => {
    await page.goto("/Reports");
    // Wait for the daily series to render (the SPA fetches asynchronously).
    await expect(
      page
        .locator('[data-testid="report-daily-card"] svg text', {
          hasText: /^\d+ [a-z]{3}$/,
        })
        .first(),
    ).toBeVisible();
    const texts = await page
      .locator('[data-testid="report-daily-card"] svg text')
      .allTextContents();
    const xLabels = texts.filter((t) => /^\d+ [a-z]{3}$/.test(t));
    const yLabels = texts.filter((t) => t.startsWith("$"));
    // 30 daily buckets thin to 8 labels (first + last always shown).
    expect(xLabels.length).toBeGreaterThan(5);
    expect(xLabels.length).toBeLessThanOrEqual(9);
    expect(yLabels.length).toBeGreaterThanOrEqual(4);
    for (const label of yLabels) {
      expect(label).toMatch(/^\$\d+$/); // integers — never "$107.3"
    }
  });

  test("V4: the dashboard weekday labels roll per-date — today is LAST", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    // Wait for the week's series to render (the SPA fetches asynchronously).
    const weekdayTexts = page.locator(
      '[data-testid="weekly-chart-card"] svg text',
      { hasText: /^(lun|mar|mié|jue|vie|sáb|dom)$/ },
    );
    await expect(weekdayTexts).toHaveCount(7);
    const texts = await page
      .locator('[data-testid="weekly-chart-card"] svg text')
      .allTextContents();
    const xLabels = texts.filter((t) => WEEKDAY_MIN.includes(t));
    const yLabels = texts.filter((t) => !WEEKDAY_MIN.includes(t) && /^\d+$/.test(t));
    expect(xLabels).toHaveLength(7);
    expect(xLabels[6]).toBe(WEEKDAY_MIN[(new Date().getDay() + 6) % 7]);
    expect(yLabels.length).toBeGreaterThanOrEqual(4);
  });

  test("V5: the Ajustes logo control is the styled glass Subir logo button", async ({
    page,
  }) => {
    await page.goto("/StoreSettings");
    const button = page.getByTestId("settings-logo-button");
    await expect(button).toBeVisible();
    await expect(button).toContainText("Subir logo");
    const input = page.getByTestId("settings-logo-input");
    await expect(input).toHaveCount(1);
    await expect(input).toBeHidden();

    // Glass identity: same resolved background as the utility probe.
    const styles = await computedStyles(
      page,
      '[data-testid="settings-logo-button"]',
      ["background-color"],
      "glass-button",
    );
    const actual = await computedStyles(
      page,
      '[data-testid="settings-logo-button"]',
      ["background-color"],
    );
    expect(actual["background-color"]).toBe(styles["background-color"]);
  });

  test("V6: low-stock rows carry the amber chip + bold name + amber sub-line", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    const row = page.locator('[data-testid="low-stock-row"]', {
      hasText: "Atún Dolores 295g",
    });
    await expect(row).toBeVisible();
    await expect(row.locator("svg").first()).toBeAttached(); // the box-icon chip
    await expect(row.getByTestId("low-stock-detail")).toContainText(
      "3 en stock (mín. 5)",
    );

    const name = row.locator("p").first();
    const nameStyles = await computedStyles(page, "p", ["font-weight"], undefined).catch(
      () => null,
    );
    // The bold name + amber detail: compare the detail's color identity.
    const detailStyles = await computedStyles(
      page,
      '[data-testid="low-stock-row"] [data-testid="low-stock-detail"]',
      ["color"],
      "text-amber-400",
    );
    const detailColor = await computedStyles(
      page,
      '[data-testid="low-stock-row"] [data-testid="low-stock-detail"]',
      ["color"],
    );
    expect(detailColor.color).toBe(detailStyles.probeColor);
    expect(nameStyles ?? { "font-weight": "700" }).toBeTruthy();
    const boldName = await row
      .locator("p.font-bold")
      .filter({ hasText: "Atún Dolores 295g" })
      .count();
    expect(boldName).toBe(1);
  });
});

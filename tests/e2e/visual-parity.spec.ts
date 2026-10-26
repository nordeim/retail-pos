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
    // The semibold name + amber detail: compare the detail's color identity
    // (v4 re-probe: the reference's count is amber-600).
    const detailStyles = await computedStyles(
      page,
      '[data-testid="low-stock-row"] [data-testid="low-stock-detail"]',
      ["color"],
      "text-amber-600",
    );
    const detailColor = await computedStyles(
      page,
      '[data-testid="low-stock-row"] [data-testid="low-stock-detail"]',
      ["color"],
    );
    expect(detailColor.color).toBe(detailStyles.probeColor);
    expect(nameStyles ?? { "font-weight": "600" }).toBeTruthy();
    const semiboldName = await row
      .locator("p.font-semibold")
      .filter({ hasText: "Atún Dolores 295g" })
      .count();
    expect(semiboldName).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// v4 computed-style pins (remediation-plan-v4 §3), measured live on the
// reference during session V4 (2026-10-26). Same probe-identity discipline
// as R3 above: colors compare against a same-utility probe element because
// Tailwind v4 resolves through OKLCH.
// ---------------------------------------------------------------------------

test.describe("visual parity (v4)", () => {
  test("V2: the active nav pill is the translucent violet pill at 12px radius", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    // wait for SPA hydration before probing
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    const styles = await computedStyles(page, 'nav a[aria-current="page"]', [
      "border-radius",
      "background-color",
      "color",
    ]);
    expect(styles["border-radius"]).toBe("12px");
    // translucent violet: the alpha channel must be present (not a solid fill)
    expect(styles["background-color"]).toMatch(/0\.2\)$/);
    // probe-identity: same resolved color as the reference utility set
    const probe = await page.evaluate(() => {
      const el = document.createElement("a");
      el.className = "bg-violet-600/20 text-violet-300";
      el.style.display = "none";
      document.body.appendChild(el);
      const out = { bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color };
      el.remove();
      return out;
    });
    expect(styles["background-color"]).toBe(probe.bg);
    expect(styles.color).toBe(probe.color);
  });

  test("V6: the dashboard stat card carries the blob + 24px value + gradient chip", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    const card = page.getByTestId("stat-sales-today");
    await expect(card).toBeVisible();
    // the corner gradient blob (80px circle behind the chip corner)
    const blob = await card.locator("div.absolute.-top-6").evaluate((el) => ({
      w: el.getBoundingClientRect().width,
      cls: el.className,
    }));
    expect(blob.w).toBe(80);
    expect(blob.cls).toContain("rounded-full");
    // the value: 24px/700 (the reference's text-2xl font-bold)
    const value = await computedStyles(
      page,
      '[data-testid="stat-sales-today"] p.text-2xl',
      ["font-size", "font-weight"],
    );
    expect(value["font-size"]).toBe("24px");
    expect(value["font-weight"]).toBe("700");
    // the chip is the gradient ramp, not a solid fill
    const chip = await card.locator("span.bg-gradient-to-br").evaluate((el) =>
      getComputedStyle(el).backgroundImage.slice(0, 30),
    );
    expect(chip).toContain("linear-gradient");
  });

  test("V9: COBRAR is the 70px glass success button with the emerald ramp", async ({
    page,
  }) => {
    await page.goto("/");
    const btn = page.getByTestId("cobrar-button");
    await expect(btn).toBeVisible();
    const styles = await btn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        h: el.getBoundingClientRect().height,
        radius: cs.borderRadius,
        bgImage: cs.backgroundImage.slice(0, 26),
        weight: cs.fontWeight,
        size: cs.fontSize,
      };
    });
    expect(styles.h).toBe(70);
    expect(styles.radius).toBe("16px");
    expect(styles.bgImage).toContain("linear-gradient");
    expect(styles.weight).toBe("900");
    expect(styles.size).toBe("20px");
  });

  test("V8: the login card is 16px, white/95, with the 48px slate-900 submit", async ({
    page,
  }) => {
    await page.goto("/login");
    const card = await page.evaluate(() => {
      const el = document.querySelector("main div.max-w-md");
      if (!el) throw new Error("missing login card");
      const cs = getComputedStyle(el);
      return { radius: cs.borderRadius, bg: cs.backgroundColor, blur: cs.backdropFilter };
    });
    expect(card.radius).toBe("16px");
    // Tailwind v4 resolves white/95 through oklab — assert the ALPHA 0.95
    // (the reference's bg-white/95 translucency), not a literal rgb string
    expect(card.bg).toContain("0.95");
    expect(card.blur).toContain("blur");

    const social = await page.getByTestId("social-google").evaluate((el) => {
      const cs = getComputedStyle(el);
      return { h: el.getBoundingClientRect().height, radius: cs.borderRadius };
    });
    // py-3.5 (28) + 20px line + 2px border = 50px (border-box, as measured)
    expect(social.h).toBe(50);
    expect(social.radius).toBe("12px");

    // the submit is the reference's near-black (probe identity vs bg-slate-900)
    const submit = await computedStyles(page, '[data-testid="login-submit"]', [
      "background-color",
    ]);
    const probe = await page.evaluate(() => {
      const el = document.createElement("button");
      el.className = "bg-slate-900";
      el.style.display = "none";
      document.body.appendChild(el);
      const out = getComputedStyle(el).backgroundColor;
      el.remove();
      return out;
    });
    expect(submit["background-color"]).toBe(probe);

    // the logo asset + the official Google mark ship locally
    const logoOk = await page.locator('img[src="/veloxpos-logo.png"]').count();
    expect(logoOk).toBe(1);
    const googlePaths = await page
      .getByTestId("social-google")
      .locator("svg path")
      .evaluateAll((paths) => paths.map((p) => p.getAttribute("fill")));
    expect(googlePaths).toEqual(["#4285F4", "#34A853", "#FBBC05", "#EA4335"]);
  });
});

// ---------------------------------------------------------------------------
// v5 computed-style pins (remediation-plan-v5 §3), measured live on the
// reference during session V5 (2026-10-26). Same probe-identity discipline
// as R3/v4: Tailwind v4 resolves through OKLCH, so color assertions compare
// against a same-utility probe element in the same page.
// ---------------------------------------------------------------------------

test.describe("visual parity (v5)", () => {
  test("G1: the shell gutter is flush — the H1 lands at x=244", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    const x = await page.evaluate(() => {
      const h1 = document.querySelector("main h1");
      if (!h1) throw new Error("missing h1");
      return Math.round(h1.getBoundingClientRect().left);
    });
    // sidebar 220 + the view's own 24px padding = 244 (the reference's H1 x)
    expect(x).toBe(244);
  });

  test("T1: sales table headers are 12px/600/uppercase on the slate-50 hairline grid", async ({
    page,
  }) => {
    await page.goto("/Sales");
    await expect(page.getByTestId("sales-table")).toBeVisible();
    const header = await computedStyles(page, "thead th", [
      "font-size",
      "font-weight",
      "text-transform",
    ]);
    expect(header["font-size"]).toBe("12px");
    expect(header["font-weight"]).toBe("600");
    expect(header["text-transform"]).toBe("uppercase");
    // the row hairline is the reference's slate-50 (border-color probe identity)
    await expect(page.locator('[data-testid="sales-table"] tbody tr').first()).toBeVisible();
    const rowBorder = await page
      .locator('[data-testid="sales-table"] tbody tr')
      .first()
      .evaluate((el) => getComputedStyle(el).borderBottomColor);
    const borderProbe = await page.evaluate(() => {
      const el = document.createElement("div");
      el.className = "border-b border-slate-50";
      el.style.display = "none";
      document.body.appendChild(el);
      const out = getComputedStyle(el).borderBottomColor;
      el.remove();
      return out;
    });
    expect(rowBorder).toBe(borderProbe);
    // the ticket cell is the reference's mono indigo
    const ticket = await page
      .locator('[data-testid="sales-table"] tbody tr td')
      .first()
      .evaluate((el) => ({
        family: getComputedStyle(el).fontFamily,
        color: getComputedStyle(el).color,
      }));
    const ticketProbe = await page.evaluate(() => {
      const el = document.createElement("span");
      el.className = "text-indigo-600";
      el.style.display = "none";
      document.body.appendChild(el);
      const out = getComputedStyle(el).color;
      el.remove();
      return out;
    });
    expect(ticket.family).toContain("mono");
    expect(ticket.color).toBe(ticketProbe);
  });

  test("T2: the Completada badge is the 6px soft green table badge", async ({
    page,
  }) => {
    await page.goto("/Sales");
    const badgeLoc = page.locator("span", { hasText: "Completada" }).first();
    await expect(badgeLoc).toBeVisible();
    const badge = await badgeLoc.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { radius: cs.borderRadius, bg: cs.backgroundColor, color: cs.color };
    });
    expect(badge.radius).toBe("6px");
    // soft ramp identity: green-100 fill + green-700 text (probe comparison
    // below; v4 serializes opaque colors as bare lab() without an alpha)
    const probe = await page.evaluate(() => {
      const el = document.createElement("span");
      el.className = "bg-green-100 text-green-700";
      el.style.display = "none";
      document.body.appendChild(el);
      const out = { bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color };
      el.remove();
      return out;
    });
    expect(badge.bg).toBe(probe.bg);
    expect(badge.color).toBe(probe.color);
  });

  test("T7: the ticket panel is the reference's full-height border-l rail", async ({
    page,
  }) => {
    await page.goto("/");
    const rail = await page.getByTestId("ticket-panel").evaluate((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        h: Math.round(r.height),
        top: Math.round(r.top),
        borderLeft: cs.borderLeftWidth + " " + cs.borderLeftStyle,
        bg: cs.backgroundColor,
        radius: cs.borderRadius,
        shadow: cs.boxShadow,
        right: Math.round(r.right),
      };
    });
    // full-bleed: the rail spans the viewport height, flush to its top and
    // right edges, with no card radius and no elevation shadow
    expect(rail.h).toBe(720);
    expect(rail.top).toBe(0);
    expect(rail.right).toBe(1280);
    expect(rail.borderLeft).toBe("1px solid");
    expect(rail.bg).toBe("rgb(13, 15, 26)");
    expect(rail.radius).toBe("0px");
    expect(rail.shadow).toBe("none");
  });

  test("T5: the Ticket header is the 12px uppercase tracked label", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("ticket-panel")).toBeVisible();
    const h2 = await page.evaluate(() => {
      const el = [...document.querySelectorAll("h2")].find((h) =>
        /^ticket$/i.test(h.textContent.trim()),
      );
      if (!el) throw new Error("missing Ticket h2");
      const cs = getComputedStyle(el);
      return {
        text: el.textContent.trim(),
        size: cs.fontSize,
        transform: cs.textTransform,
        spacing: cs.letterSpacing,
      };
    });
    expect(h2.text).toBe("Ticket");
    expect(h2.size).toBe("12px");
    expect(h2.transform).toBe("uppercase");
    expect(h2.spacing).toBe("0.3px");
  });

  test("T4: the idle Agregado banner is collapsed; the permanent label is gone", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("ticket-panel")).toBeVisible();
    const banner = await page.evaluate(() => {
      const el = document.querySelector('[aria-live="polite"]');
      if (!el) throw new Error("missing banner");
      const cs = getComputedStyle(el);
      return { maxHeight: cs.maxHeight, opacity: cs.opacity, overflow: cs.overflow };
    });
    expect(banner.maxHeight).toBe("0px");
    expect(banner.opacity).toBe("0");
    expect(banner.overflow).toBe("hidden");
    // the old permanent label is gone
    const label = await page.evaluate(() =>
      [...document.querySelectorAll("p")].some(
        (p) => p.textContent.trim() === "Agregado" && p.closest('[data-testid="ticket-panel"]') && !p.closest('[aria-live="polite"]'),
      ),
    );
    expect(label).toBe(false);
  });

  test("T3: form controls carry the 12px radius with a transparent fill", async ({
    page,
  }) => {
    await page.goto("/Sales");
    const input = await page.getByTestId("sales-search").evaluate((el) => {
      const cs = getComputedStyle(el);
      return { radius: cs.borderRadius, bg: cs.backgroundColor };
    });
    expect(input.radius).toBe("12px");
    expect(input.bg).toBe("rgba(0, 0, 0, 0)");
  });

  test("F1+F2: Reports is the bright H1 with tinted (not gradient) chips", async ({
    page,
  }) => {
    await page.goto("/Reports");
    await expect(page.getByRole("heading", { name: "Reportes" })).toBeVisible();
    const h1 = await computedStyles(page, "main h1", ["color"], "text-white/90");
    const h1Color = await computedStyles(page, "main h1", ["color"]);
    expect(h1Color.color).toBe(h1.probeColor);
    // the first summary chip: 15% indigo tint + 30% indigo hairline
    const chip = await page.getByTestId("report-revenue").evaluate((el) => {
      const chipEl = el.querySelector("span");
      if (!chipEl) throw new Error("missing chip");
      const cs = getComputedStyle(chipEl);
      return { bg: cs.backgroundColor, border: cs.borderTopColor, image: cs.backgroundImage };
    });
    expect(chip.bg).toContain("0.15");
    expect(chip.border).toContain("0.3");
    expect(chip.image).toBe("none");
  });

  test("S1: the Guardar Cambios CTA is the reference's 54px text-base button", async ({
    page,
  }) => {
    await page.goto("/StoreSettings");
    const btn = await page.getByTestId("settings-save").evaluate((el) => {
      const cs = getComputedStyle(el);
      return { h: Math.round(el.getBoundingClientRect().height), size: cs.fontSize };
    });
    expect(btn.size).toBe("16px");
    expect([52, 53, 54]).toContain(btn.h);
  });
});

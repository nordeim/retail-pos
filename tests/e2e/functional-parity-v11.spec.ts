import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2e pins for remediation-plan-v11 — three families, all live-measured on
// both apps (agent-browser at 1440/1280/1024/390; docs/remediation-plan-v11
// §0):
//
// F1 the chart CONTAINER geometry: the reference's recharts
//    ResponsiveContainers re-wrap to the container width with FIXED heights
//    (dashboard 280 / reports 220 / donut 200) and a FIXED donut ring
//    (innerR 50/outerR 80). The clone's charts were aspect-locked
//    (640×260/640×280/333×200 scaled uniformly) — 254px vs 280 on the
//    dashboard, 424px vs 220 on the reports page, a 134px vs 160px donut
//    ring, all at this suite's 1280 viewport.
// F2 the form-control chrome: the app controls focus with a 1px #7f62f4
//    edge (ring-1, no offset); the select trigger is 12px; the switch
//    rides ring-2 + offset-2 in the solid violet; the glass button focus
//    is the violet browser outline; the auth inputs focus slate-400 over a
//    white offset at the measured 44px mobile height.
// F3 the chart tooltips: the reference's measured recharts default skin
//    (white card, 12px radius, 10px padding, the 0 4px 20px shadow) with
//    readable dark text (the SD-18 precedent — the reference's own tooltip
//    text is light-on-white, unreadable).
// ---------------------------------------------------------------------------

test.describe("functional parity (v11) — the responsive chart boxes", () => {
  test("the dashboard chart renders at the container width with the FIXED 280px height", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    const areaPath = page.locator('[data-testid="weekly-chart-card"] svg path[fill="url(#salesGrad)"]');
    await expect(areaPath).toHaveCount(1);
    const box = await page.evaluate(() => {
      const card = document.querySelector('[data-testid="weekly-chart-card"]');
      const wrap = card?.querySelector<HTMLDivElement>(".relative.w-full");
      const svg = card?.querySelector("svg");
      if (!wrap || !svg) return null;
      const r = svg.getBoundingClientRect();
      return {
        wrapW: Math.round(wrap.clientWidth),
        widthAttr: svg.getAttribute("width"),
        heightAttr: svg.getAttribute("height"),
        viewBox: svg.getAttribute("viewBox"),
        renderedH: Math.round(r.height),
      };
    });
    expect(box).not.toBeNull();
    // The box re-wraps to the container (the 640-wide aspect-lock is gone).
    expect(box!.widthAttr).toBe(String(box!.wrapW));
    expect(box!.viewBox).toBe(`0 0 ${box!.wrapW} 280`);
    // The height is the reference's FIXED 280 — not the old aspect-locked
    // 254 (at 1280) and not a stretched 297 (at 1440).
    expect(box!.heightAttr).toBe("280");
    expect(box!.renderedH).toBe(280);
  });

  test("the reports chart renders at the container width with the FIXED 220px height", async ({
    page,
  }) => {
    await page.goto("/Reports");
    await expect(page.getByTestId("report-daily-card")).toContainText("sep");
    const box = await page.evaluate(() => {
      const card = document.querySelector('[data-testid="report-daily-card"]');
      const wrap = card?.querySelector<HTMLDivElement>(".relative.w-full");
      const svg = card?.querySelector("svg");
      if (!wrap || !svg) return null;
      const r = svg.getBoundingClientRect();
      return {
        wrapW: Math.round(wrap.clientWidth),
        widthAttr: svg.getAttribute("width"),
        heightAttr: svg.getAttribute("height"),
        viewBox: svg.getAttribute("viewBox"),
        renderedH: Math.round(r.height),
      };
    });
    expect(box).not.toBeNull();
    expect(box!.widthAttr).toBe(String(box!.wrapW));
    expect(box!.viewBox).toBe(`0 0 ${box!.wrapW} 220`);
    // The reference's fixed 220 — the old aspect-locked box rendered 424px
    // at this viewport (nearly double).
    expect(box!.heightAttr).toBe("220");
    expect(box!.renderedH).toBe(220);
  });

  test("the donut keeps its FIXED 160px ring while the box re-wraps (cx = box/2)", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    const legendRow = page.getByTestId("category-chart-card").locator("div.space-y-2 > div");
    await expect(legendRow.first()).toContainText("Lácteos");
    const probe = await page.evaluate(() => {
      const card = document.querySelector('[data-testid="category-chart-card"]');
      const wrap = card?.querySelector<HTMLDivElement>(".relative");
      const svg = card?.querySelector("svg");
      if (!wrap || !svg) return null;
      const paths = [...svg.querySelectorAll('path[fill^="#"]')];
      let x1 = 1e9;
      let y1 = 1e9;
      let x2 = -1e9;
      let y2 = -1e9;
      for (const p of paths) {
        const b = (p as SVGPathElement).getBBox();
        x1 = Math.min(x1, b.x);
        y1 = Math.min(y1, b.y);
        x2 = Math.max(x2, b.x + b.width);
        y2 = Math.max(y2, b.y + b.height);
      }
      const boxW = Number(svg.getAttribute("width"));
      const scale = svg.getBoundingClientRect().width / boxW;
      return {
        wrapW: Math.round(wrap.clientWidth),
        boxW,
        viewBox: svg.getAttribute("viewBox"),
        ringUnitsW: Math.round(x2 - x1),
        ringScreenW: Math.round((x2 - x1) * scale),
        firstM: paths[0]?.getAttribute("d")?.split(" ")[1],
      };
    });
    expect(probe).not.toBeNull();
    // The box re-wraps to the container, capped at 333 (at this 1280
    // viewport the card column is narrower than 333 — the old fixed box
    // scaled the whole drawing down instead).
    expect(probe!.boxW).toBe(Math.min(probe!.wrapW, 333));
    expect(probe!.viewBox).toBe(`0 0 ${probe!.boxW} 200`);
    // The ring geometry is FIXED: 160 units (innerR 50 → outerR 80) at
    // 1:1 scale — the recharts contract (the old aspect-lock rendered it
    // at 134px here).
    expect(probe!.ringUnitsW).toBe(160);
    expect(probe!.ringScreenW).toBe(160);
    // The first sector starts exactly at 3 o'clock relative to the BOX
    // center: M = (box/2 + 80, 100) — at the 333 cap this is the v10
    // measurement (246.5, 100).
    expect(probe!.firstM).toBe(`${probe!.boxW / 2 + 80},100`);
  });
});

test.describe("functional parity (v11) — the form-control chrome", () => {
  test("the app input focuses with the reference's 1px #7f62f4 edge (no offset halo)", async ({
    page,
  }) => {
    await page.goto("/StoreSettings");
    const input = page.locator("#settings-name, input").first();
    await input.focus();
    const shadow = await input.evaluate((el) => getComputedStyle(el).boxShadow);
    // The measured edge: rgb(127, 98, 244) at spread 1 — NOT the shadcn
    // ring-2 + 2px-offset indigo halo (rgb(129,140,248) at 4px).
    expect(shadow).toContain("rgb(127, 98, 244) 0px 0px 0px 1px");
    expect(shadow).not.toContain("rgb(129, 140, 248)");
  });

  test("the select trigger carries the 12px radius and the same 1px focus edge", async ({
    page,
  }) => {
    await page.goto("/StoreSettings");
    const trigger = page.getByTestId("settings-currency");
    await expect(trigger).toBeVisible();
    const radius = await trigger.evaluate((el) => getComputedStyle(el).borderRadius);
    expect(radius).toBe("12px");
    await trigger.focus();
    const shadow = await trigger.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).toContain("rgb(127, 98, 244) 0px 0px 0px 1px");
  });

  test("the textarea rides the component base: 12px radius, ring-1 focus", async ({ page }) => {
    await page.goto("/StoreSettings");
    const ta = page.locator("#settings-footer");
    await expect(ta).toBeVisible();
    const radius = await ta.evaluate((el) => getComputedStyle(el).borderRadius);
    expect(radius).toBe("12px");
    await ta.focus();
    const shadow = await ta.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).toContain("rgb(127, 98, 244) 0px 0px 0px 1px");
  });

  test("the label→control gap is the reference's 4px (mt-1)", async ({ page }) => {
    await page.goto("/StoreSettings");
    // Wait for the settings form to load (the fields render with the data).
    const ta = page.locator("#settings-footer");
    await expect(ta).toBeVisible();
    const gap = await page.evaluate(() => {
      const input = document.querySelector("#settings-footer");
      if (!input) return null;
      const label = input.parentElement?.querySelector("label");
      if (!label) return null;
      return {
        gap: Math.round(
          input.getBoundingClientRect().y - label.getBoundingClientRect().bottom,
        ),
        labelH: Math.round(label.getBoundingClientRect().height),
      };
    });
    // Both apps measure 8px label-bottom → control-top (the 4px mt-1 +
    // the inline label's line-box overshoot — the reference measures the
    // same 8 with the same 16px label box).
    expect(gap!.gap).toBe(8);
    expect(gap!.labelH).toBe(16);
  });

  test("the glass button focuses through the violet browser outline (no ring halo)", async ({
    page,
  }) => {
    await page.goto("/StoreSettings");
    // Chromium's :focus-visible heuristic: a button focused by script only
    // matches when the previous focus was in keyboard modality — focus a
    // text input FIRST (the exact path the live measurement took), then the
    // button.
    await page.locator("input").first().focus();
    const btn = page.getByRole("button", { name: "Guardar Cambios" });
    await btn.focus();
    // transition-colors covers outline-color (the cva base's transition) —
    // the violet fades in from currentColor (white) over 150ms; settle-wait
    // before reading the computed value (the live-probe lesson).
    await page.waitForTimeout(300);
    const outline = await btn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        color: cs.outlineColor,
        style: cs.outlineStyle,
        w: cs.outlineWidth,
        shadow: cs.boxShadow,
      };
    });
    expect(outline.color).toBe("rgba(127, 98, 244, 0.5)");
    expect(outline.style).toBe("solid");
    expect(outline.w).toBe("3px");
    // No ring halo layered onto the glass glow.
    expect(outline.shadow).not.toContain("rgb(129, 140, 248)");
  });

  test("the login input focuses slate-400 over a WHITE offset at the measured heights", async ({
    page,
  }) => {
    await page.goto("/login");
    const email = page.locator('input[type="email"]');
    const h = await email.evaluate((el) => Math.round(el.getBoundingClientRect().height));
    expect(h).toBe(48); // h-11 mobile (44) / h-12 >= sm (48) — the desktop run
    await email.focus();
    const shadow = await email.evaluate((el) => getComputedStyle(el).boxShadow);
    // The reference's light-theme focus: a 4px slate-400 ring over a WHITE
    // 2px offset — never the app's dark canvas offset. The ring color is
    // asserted CLASS-based (Tailwind v4 compiles slate-400 through oklch —
    // the computed value serializes as lab(), the v10 lesson); the offset
    // is a literal rgb (the scoped white token).
    expect(shadow).toContain("0px 0px 0px 4px");
    expect(shadow).toContain("rgb(255, 255, 255) 0px 0px 0px 2px");
    expect(shadow).not.toContain("rgb(8, 10, 20)");
    const ringCls = await email.getAttribute("class");
    expect(ringCls).toContain("focus:ring-slate-400");
  });

  test("the login submit focuses through the 3px white outline", async ({ page }) => {
    await page.goto("/login");
    const btn = page.getByTestId("login-submit");
    await btn.focus();
    const outline = await btn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { w: cs.outlineWidth, c: cs.outlineColor, s: cs.outlineStyle };
    });
    expect(outline.w).toBe("3px");
    expect(outline.c).toBe("rgb(255, 255, 255)");
    expect(outline.s).toBe("solid");
  });
});

test.describe("functional parity (v11) — the chart tooltips", () => {
  test("the dashboard chart shows the measured white tooltip card on hover", async ({ page }) => {
    await page.goto("/Dashboard");
    const areaPath = page.locator('[data-testid="weekly-chart-card"] svg path[fill="url(#salesGrad)"]');
    await expect(areaPath).toHaveCount(1);
    const card = page.getByTestId("weekly-chart-card");
    const svg = card.locator("svg");
    await svg.hover({ position: { x: 300, y: 140 } });
    const tip = card.locator('[data-testid="chart-tooltip"]');
    await expect(tip).toBeVisible();
    const skin = await tip.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        radius: cs.borderRadius,
        pad: cs.padding,
        shadow: cs.boxShadow,
        wrap: cs.whiteSpace,
        pe: cs.pointerEvents,
      };
    });
    // The reference's measured recharts default skin.
    expect(skin.bg).toBe("rgb(255, 255, 255)");
    expect(skin.radius).toBe("12px");
    expect(skin.pad).toBe("10px");
    expect(skin.shadow).toContain("rgba(0, 0, 0, 0.1) 0px 4px 20px");
    expect(skin.wrap).toBe("nowrap");
    expect(skin.pe).toBe("none");
    // Readable dark text (the SD-18 precedent — the reference's own
    // light-on-white tooltip text is unreadable).
    const color = await tip.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(30, 41, 59)");
    // The label line carries the day (the seeded sales sit outside the
    // 7-day window, so every point is a weekday label with a $0 value).
    await expect(tip).toContainText(/lun|mar|mié|jue|vie|sáb|dom/);
    // Leaving the chart hides it.
    await page.mouse.move(10, 10);
    await expect(tip).toHaveCount(0);
  });

  test("the donut shows the category + count on sector hover", async ({ page }) => {
    await page.goto("/Dashboard");
    const legendRow = page.getByTestId("category-chart-card").locator("div.space-y-2 > div");
    await expect(legendRow.first()).toContainText("Lácteos");
    const card = page.getByTestId("category-chart-card");
    const svg = card.locator("svg");
    const box = (await svg.boundingBox())!;
    // Hover the 3 o'clock sector (Lácteos — the first slice, 0–60° CCW
    // from 3 o'clock): the ring midpoint at ~30°.
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const midAngle = (30 * Math.PI) / 180;
    const px = cx + Math.cos(midAngle) * 65;
    const py = cy - Math.sin(midAngle) * 65;
    await page.mouse.move(px, py);
    const tip = card.locator('[data-testid="chart-tooltip"]');
    await expect(tip).toBeVisible();
    await expect(tip).toContainText("Lácteos");
    await expect(tip).toContainText("2 productos");
  });
});

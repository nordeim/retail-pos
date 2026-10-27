import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2e pins for remediation-plan-v13 — the chart hover micro-interactions,
// all live-measured on BOTH apps (agent-browser at 1280;
// docs/remediation-plan-v13.md §0 L3-L16):
//
// F1 the sales-chart activeDot — the recharts default
//    <circle r="4" fill="#6366f1" stroke="#fff" stroke-width="2"> at the
//    active point (the ref renders it; the clone rendered nothing).
// F2 the sales-chart tooltip CURSOR — the vertical #ccc line at the active
//    x spanning the plot area.
// F3 the tooltip CONTENT — the recharts default item line: the day label +
//    the "ventas : RAW-value" item in the LINE color at 4px pad-y, 16px.
// F4 the tooltip POSITION + motion — (point.x + 10, pointer.y + 10), the
//    right-edge left-flip at the mirrored -10 gap, the transform 400ms
//    glide, the persistent visibility wrapper (leave HIDES, never unmounts).
// F5 the donut tooltip's OWN skin — the RAW recharts default: the 1px #ccc
//    border, NO radius, NO shadow, the EMPTY label p, the black
//    "Lácteos : 2" item, anchored at the sector centroid with the flip.
// ---------------------------------------------------------------------------

test.describe("functional parity (v13) — the sales-chart hover set", () => {
  test("the tooltip renders the recharts default content: the day + the 'ventas : raw' item line", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    const card = page.getByTestId("weekly-chart-card");
    // Gate on the DATA (the area path) before hovering — a move on the
    // empty-payload chart never activates a point (the v11 pin's lesson).
    await expect(card.locator('svg path[fill="url(#salesGrad)"]')).toHaveCount(1);
    const svg = card.locator("svg");
    const box = (await svg.boundingBox())!;
    await page.mouse.move(box.x + 300, box.y + 140);
    const tip = card.locator('[data-testid="chart-tooltip"]');
    await expect(tip).toBeVisible();
    // The label line: the day (the seeded sales sit outside the 7-day
    // window, so every point is a weekday with a raw 0).
    await expect(tip).toContainText(/lun|mar|mié|jue|vie|sáb|dom/);
    // The item line: the literal series name + the separator + the RAW value.
    await expect(tip).toContainText("ventas : 0");
    // The item's grammar: the LINE color, the 4px pad-y, the 16px font.
    const item = await tip.locator("li").evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, pt: cs.paddingTop, pb: cs.paddingBottom, fs: cs.fontSize };
    });
    expect(item.color).toBe("rgb(99, 102, 241)");
    expect(item.pt).toBe("4px");
    expect(item.pb).toBe("4px");
    expect(item.fs).toBe("16px");
    // The label: readable dark (the SD-18 superset — the ref's own inherited
    // #e7e9ef-on-white is invisible).
    const labelColor = await tip
      .locator("p")
      .first()
      .evaluate((el) => getComputedStyle(el).color);
    expect(labelColor).toBe("rgb(30, 41, 59)");
  });

  test("the activeDot + cursor render at the active point; the tooltip anchors (point.x+10, pointer.y+10)", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    const card = page.getByTestId("weekly-chart-card");
    await expect(card.locator('svg path[fill="url(#salesGrad)"]')).toHaveCount(1);
    const svg = card.locator("svg");
    const box = (await svg.boundingBox())!;
    const pointerY = 120;
    await page.mouse.move(box.x + 300, box.y + pointerY);
    await expect(card.locator('[data-testid="active-dot"]')).toBeVisible();
    // A 0-width SVG line has an empty Playwright bounding box (strokes don't
    // count) — assert ATTACHMENT here; the geometry asserts follow below.
    await expect(card.locator('[data-testid="tooltip-cursor"]')).toHaveCount(1);
    const geom = await card.evaluate((el) => {
      const dot = el.querySelector('[data-testid="active-dot"] circle')!;
      const cursor = el.querySelector('[data-testid="tooltip-cursor"]')!;
      const tip = el.querySelector('[data-testid="chart-tooltip"]')!;
      const dr = dot.getBoundingClientRect();
      const cr = cursor.getBoundingClientRect();
      const tr = tip.getBoundingClientRect();
      return {
        dot: {
          r: dot.getAttribute("r"),
          fill: dot.getAttribute("fill"),
          stroke: dot.getAttribute("stroke"),
          sw: dot.getAttribute("stroke-width"),
          x: dr.x + dr.width / 2,
        },
        cursor: { x: cr.x + cr.width / 2, y1: cr.y, y2: cr.y + cr.height, stroke: cursor.getAttribute("stroke") },
        tip: { x: tr.x, y: tr.y },
      };
    });
    // The recharts default active dot.
    expect(geom.dot.r).toBe("4");
    expect(geom.dot.fill).toBe("#6366f1");
    expect(geom.dot.stroke).toBe("#fff");
    expect(geom.dot.sw).toBe("2");
    // The cursor: at the dot's x, #ccc, spanning the plot area.
    expect(Math.abs(geom.cursor.x - geom.dot.x)).toBeLessThan(2);
    expect(geom.cursor.stroke).toBe("#ccc");
    expect(geom.cursor.y2 - geom.cursor.y1).toBeGreaterThan(200);
    // The anchor: the x SNAPS to the point, the y follows the pointer.
    expect(Math.abs(geom.tip.x - (geom.dot.x + 10))).toBeLessThan(2);
    expect(Math.abs(geom.tip.y - (box.y + pointerY + 10))).toBeLessThan(2);
    // The measured glide (Chromium serializes 400ms as 0.4s).
    const transition = await card
      .locator('[data-testid="chart-tooltip"]')
      .evaluate((el) => getComputedStyle(el).transition);
    expect(transition).toContain("transform");
    expect(transition).toContain("0.4s");
  });

  test("the tooltip flips LEFT at the container's right edge (the mirrored -10 gap)", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    const card = page.getByTestId("weekly-chart-card");
    await expect(card.locator('svg path[fill="url(#salesGrad)"]')).toHaveCount(1);
    const svg = card.locator("svg");
    const box = (await svg.boundingBox())!;
    // Hover the last point (near the right edge).
    await page.mouse.move(box.x + box.width - 6, box.y + 120);
    await expect(card.locator('[data-testid="active-dot"]')).toBeVisible();
    await page.waitForTimeout(450); // the 400ms glide settle
    const geom = await card.evaluate((el) => {
      const dot = el.querySelector('[data-testid="active-dot"] circle')!;
      const tip = el.querySelector('[data-testid="chart-tooltip"]')!;
      const dr = dot.getBoundingClientRect();
      const tr = tip.getBoundingClientRect();
      return { dotX: dr.x + dr.width / 2, tipLeft: tr.x, tipRight: tr.x + tr.width };
    });
    // Flipped: the tip's right edge sits 10px LEFT of the dot's center.
    expect(geom.tipRight).toBeLessThanOrEqual(geom.dotX - 8);
    // And it stays inside the chart box.
    expect(geom.tipLeft).toBeGreaterThan(box.x - 1);
  });

  test("leave hides the tooltip (visibility) — the wrapper persists; re-enter shows it again", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    const card = page.getByTestId("weekly-chart-card");
    await expect(card.locator('svg path[fill="url(#salesGrad)"]')).toHaveCount(1);
    const svg = card.locator("svg");
    const box = (await svg.boundingBox())!;
    await page.mouse.move(box.x + 300, box.y + 140);
    const tip = card.locator('[data-testid="chart-tooltip"]');
    await expect(tip).toBeVisible();
    // Leaving clears the dot + cursor…
    await page.mouse.move(10, 10);
    await expect(card.locator('[data-testid="active-dot"]')).toHaveCount(0);
    await expect(card.locator('[data-testid="tooltip-cursor"]')).toHaveCount(0);
    // …and HIDES the tooltip while it stays attached (the persistent
    // wrapper — the reference's own, it glides on re-enter).
    await expect(tip).toBeHidden();
    await expect(tip).toHaveCount(1);
    // Re-enter: visible again at the new position.
    await page.mouse.move(box.x + 100, box.y + 100);
    await expect(tip).toBeVisible();
  });
});

test.describe("functional parity (v13) — the donut tooltip (the raw skin)", () => {
  test("the donut tooltip is the RAW recharts default: #ccc border, no radius, no shadow, the black 'name : count' item", async ({
    page,
  }) => {
    await page.goto("/Dashboard");
    const card = page.getByTestId("category-chart-card");
    // Gate on the legend row (the data) before hovering.
    await expect(card.locator("div.space-y-2 > div").first()).toContainText("Lácteos");
    const svg = card.locator("svg");
    const box = (await svg.boundingBox())!;
    // Hover the first sector's ring midpoint (Lácteos — 0-56° CCW from
    // 3 o'clock, mid 28°): the sector centroid ≈ the ring midpoint.
    const mid = (28 * Math.PI) / 180;
    const anchorX = box.x + box.width / 2 + Math.cos(mid) * 65;
    const anchorY = box.y + box.height / 2 - Math.sin(mid) * 65;
    await page.mouse.move(anchorX, anchorY);
    const tip = card.locator('[data-testid="donut-tooltip"]');
    await expect(tip).toBeVisible();
    // The content: the name + the separator + the RAW count.
    await expect(tip).toContainText("Lácteos : 2");
    // The raw skin (NOT the sales chart's white card).
    const skin = await tip.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        radius: cs.borderRadius,
        shadow: cs.boxShadow,
        pad: cs.padding,
        wrap: cs.whiteSpace,
      };
    });
    expect(skin.bg).toBe("rgb(255, 255, 255)");
    expect(skin.border).toBe("1px solid rgb(204, 204, 204)");
    expect(skin.radius).toBe("0px");
    expect(skin.shadow).toBe("none");
    expect(skin.pad).toBe("10px");
    expect(skin.wrap).toBe("nowrap");
    // The EMPTY label p + the BLACK item at 16px.
    await expect(tip.locator("p")).toHaveText("");
    const item = await tip.locator("li").evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, fs: cs.fontSize, pt: cs.paddingTop };
    });
    expect(item.color).toBe("rgb(0, 0, 0)");
    expect(item.fs).toBe("16px");
    expect(item.pt).toBe("4px");
    // The anchor: the sector centroid +10/+10, flipped LEFT at the right
    // edge (the box caps at 333 — a ~110px tip at x≈224 overflows).
    await page.waitForTimeout(450);
    const geom = await tip.evaluate((el) => {
      const tr = el.getBoundingClientRect();
      return { left: tr.x, right: tr.x + tr.width, top: tr.y };
    });
    expect(geom.right).toBeLessThanOrEqual(anchorX - 8);
    expect(Math.abs(geom.top - (anchorY + 10))).toBeLessThan(2);
  });
});

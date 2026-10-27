import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2e pins for remediation-plan-v15 — the hover micro-interaction families,
// all live-measured on BOTH apps (agent-browser at 1280;
// docs/remediation-plan-v15.md §0 L5-L9):
//
// F1+F2 the icon action button family — the reference's row actions carry
//    `transition-colors` and per-action color families; the MAIL button
//    rides BLUE (hover:bg-blue-50 / hover:text-blue-600) where the Eye
//    stays indigo. Palette colors are CLASS-pinned (the established v10/v11
//    idiom — Tailwind v4 rebalanced the palette in oklch); the observable
//    "the hover actually changes the background" is computed-pinned.
// F3 the category chip's remove control is the lucide TRASH at 14×14
//    (w-3.5 h-3.5), not the ×.
// F4 the badge hover tint — the reference's Completada badge hovers to the
//    platform violet rgba(127, 98, 244, 0.8) over a 150ms color transition
//    (measured under a real mouse hover on both apps; the clone's --primary
//    is the same 127 98 244 triplet, so the computed value is exact).
// ---------------------------------------------------------------------------

test.describe("functional parity (v15) — the icon action button family", () => {
  test("the Ventas Eye/mail buttons: indigo vs BLUE families, both transitioning", async ({
    page,
  }) => {
    await page.goto("/Sales");
    const eye = page.locator('[data-testid^="view-sale-"]').first();
    const mail = page.locator('[data-testid^="mail-sale-"]').first();
    await expect(eye).toBeVisible();
    await expect(mail).toBeVisible();

    // The class families (L5/L6): the Eye keeps the indigo pair, the mail
    // button rides the reference's BLUE pair; both transition.
    const eyeCls = (await eye.getAttribute("class")) ?? "";
    const mailCls = (await mail.getAttribute("class")) ?? "";
    expect(eyeCls).toContain("transition-colors");
    expect(eyeCls).toContain("hover:bg-indigo-50");
    expect(eyeCls).toContain("hover:text-indigo-600");
    expect(mailCls).toContain("transition-colors");
    expect(mailCls).toContain("hover:bg-blue-50");
    expect(mailCls).toContain("hover:text-blue-600");
    expect(mailCls).not.toContain("indigo");

    // The observable: a real hover changes the mail button's background
    // (the computed family rides Tailwind v4's oklch palette — assert the
    // CHANGE, the exact family is class-pinned above).
    const bgBefore = await mail.evaluate((el) => getComputedStyle(el).backgroundColor);
    await mail.hover();
    await mail.evaluate((el) =>
      Promise.all(el.getAnimations().map((a) => a.finished.catch(() => {}))),
    );
    const bgAfter = await mail.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgAfter).not.toBe(bgBefore);
    const transition = await mail.evaluate(
      (el) =>
        `${getComputedStyle(el).transitionProperty} ${getComputedStyle(el).transitionDuration}`,
    );
    expect(transition).toContain("background-color");
    expect(transition).toContain("0.15s");
  });
});

test.describe("functional parity (v15) — the category chip remove control", () => {
  test("the chip's remove button is the lucide trash at 14×14 (not the x)", async ({
    page,
  }) => {
    await page.goto("/StoreSettings");
    const remove = page.locator('[data-testid="settings-category-chips"] button').first();
    await expect(remove).toBeVisible();

    const icon = remove.locator("svg");
    const box = await icon.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { cls: el.getAttribute("class") ?? "", w: Math.round(r.width), h: Math.round(r.height) };
    });
    // L7: lucide-trash2 w-3.5 h-3.5 — 14×14 measured on the reference.
    expect(box.cls).toContain("lucide-trash2");
    expect(box.w).toBe(14);
    expect(box.h).toBe(14);
    expect(box.cls).not.toContain("lucide-x");
  });
});

test.describe("functional parity (v15) — the badge hover tint", () => {
  test("the Completada badge hovers to the platform violet at 150ms", async ({ page }) => {
    await page.goto("/Sales");
    const badge = page.getByText("Completada", { exact: true }).first();
    await expect(badge).toBeVisible();

    // The rest skin is the v5 pin (T2); here the HOVER observable: the
    // reference's stock shadcn hover:bg-primary/80 — measured
    // rgba(127, 98, 244, 0.8) with the text tone unchanged (L8).
    const before = await badge.evaluate((el) => ({
      bg: getComputedStyle(el).backgroundColor,
      color: getComputedStyle(el).color,
    }));
    await badge.hover();
    await badge.evaluate((el) =>
      Promise.all(el.getAnimations().map((a) => a.finished.catch(() => {}))),
    );
    const after = await badge.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        color: cs.color,
        transition: `${cs.transitionProperty} ${cs.transitionDuration}`,
      };
    });
    // The clone's --primary is the same 127 98 244 triplet, so bg-primary/80
    // renders the exact measured reference violet at 80% — but Tailwind v4
    // computes the /80 through color-mix, and Chromium serializes the result
    // as oklab(...) (the v10/v11 palette lesson — even canvas fillStyle
    // preserves the notation). Read the actual sRGB PIXEL bytes instead.
    const pixel = await badge.evaluate((el) => {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = getComputedStyle(el).backgroundColor;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2], a: d[3] };
    });
    expect(pixel).not.toBeNull();
    // rgba(127, 98, 244, 0.8) — the value measured under hover on the
    // reference (L8); 0.8 alpha = 204. The oklab round-trip rounds the
    // red channel to 128 (±1 per channel is color-space rounding, not a
    // palette difference).
    const near = (v: number | undefined, target: number) =>
      typeof v === "number" && Math.abs(v - target) <= 1;
    expect(near(pixel?.r, 127)).toBe(true);
    expect(near(pixel?.g, 98)).toBe(true);
    expect(near(pixel?.b, 244)).toBe(true);
    expect(pixel?.a).toBe(204);
    expect(after.color).toBe(before.color);
    expect(after.transition).toContain("background-color");
    expect(after.transition).toContain("0.15s");
  });

  test("the categoría badge carries the secondary hover tint (class pin)", async ({ page }) => {
    await page.goto("/Inventario");
    const catBadge = page.locator("td span", { hasText: "Higiene Personal" }).first();
    await expect(catBadge).toBeVisible();
    const cls = (await catBadge.getAttribute("class")) ?? "";
    // L9: the reference's categoría badge rides the shadcn secondary hover.
    expect(cls).toContain("bg-secondary");
    expect(cls).toContain("transition-colors");
    expect(cls).toContain("hover:bg-secondary/80");
  });
});

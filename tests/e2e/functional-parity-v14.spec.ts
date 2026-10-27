import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2e pins for remediation-plan-v14 — the interaction-state families,
// all live-measured on BOTH apps (agent-browser at 1280 and 390;
// docs/remediation-plan-v14.md §0 L4-L25):
//
// F1 the dialog motion + geometry family — the reference's full
//    tailwindcss-animate grammar: the overlay FADES (computed `enter`),
//    the content runs the slide quartet, the computed duration is 0.15s
//    (the ref's own duration-200 is inert on its older stack — the clone
//    must NOT thread it to 200ms), the geometry is max-w-lg 512px /
//    rounded-2xl sm:rounded-lg (8px at ≥sm, 16px full-bleed at 390).
// F2 the focus family — the platform violet: a keyboard-focused nav link
//    draws the deterministic 3px solid rgba(127, 98, 244, 0.5) outline,
//    NOT the retired indigo 129,140,248 halo.
// F3 the reports empty-state skins — the measured h-40 flex-centered
//    text-white/25 boxes + the 20px (mb-5) heading→content gap.
// ---------------------------------------------------------------------------

test.describe("functional parity (v14) — the dialog motion + geometry family", () => {
  test("the open dialog: 150ms enter, 512px max-w-lg, 8px radius, the overlay fades", async ({
    page,
  }) => {
    await page.goto("/Cajas");
    await page.getByRole("button", { name: "Abrir Turno" }).first().click();
    const content = page.getByRole("dialog");
    await expect(content).toBeVisible();

    // Let the 150ms enter run finish before the geometry read —
    // mid-flight, zoom-in-95 scales the rect (512 reads ~508-510, the
    // v14 lesson; the same hardening the drawer test got for its flake).
    await content.evaluate((el) =>
      Promise.all(el.getAnimations().map((a) => a.finished.catch(() => {}))),
    );

    const motion = await content.evaluate((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        name: cs.animationName,
        duration: cs.animationDuration,
        w: Math.round(r.width),
        radius: cs.borderRadius,
      };
    });
    // The measured reference observable: the tw-animate .15s default (L5/L6).
    expect(motion.name).toBe("enter");
    expect(motion.duration).toBe("0.15s");
    expect(motion.w).toBe(512);
    expect(motion.radius).toBe("8px");

    // The overlay fades — its own animation runs (it never snaps; L7).
    const overlay = page.locator(".fixed.inset-0.z-50").first();
    const overlayMotion = await overlay.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { name: cs.animationName, duration: cs.animationDuration };
    });
    expect(overlayMotion.name).toBe("enter");
    expect(overlayMotion.duration).toBe("0.15s");

    // The slide family ships on the content (the source pin covers the
    // classes; the mid-enter matrix is spot-checked in the live probe).
    const classes = await content.getAttribute("class");
    expect(classes).toContain("slide-in-from-left-1/2");
    expect(classes).toContain("slide-in-from-top-[48%]");
  });

  test("the mobile dialog: full-bleed 390px with the 16px radius (rounded-2xl)", async ({
    page,
  }) => {
    // In-body viewport switch (the v12 convention — test.use() is only
    // legal at describe level).
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/Cajas");
    await page.getByRole("button", { name: "Abrir Turno" }).first().click();
    const content = page.getByRole("dialog");
    await expect(content).toBeVisible();
    // The same enter-settle wait — the rect reads only after the run.
    await content.evaluate((el) =>
      Promise.all(el.getAnimations().map((a) => a.finished.catch(() => {}))),
    );
    const geo = await content.evaluate((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), x: Math.round(r.x), radius: cs.borderRadius };
    });
    // The reference at 390: w-full under the 512 cap → 390 edge-to-edge,
    // rounded-2xl (16px) below the sm breakpoint (L9).
    expect(geo.w).toBe(390);
    expect(geo.x).toBe(0);
    expect(geo.radius).toBe("16px");
  });
});

test.describe("functional parity (v14) — the focus family (the platform violet)", () => {
  test("a keyboard-focused nav link draws the 3px violet outline, not the indigo halo", async ({
    page,
  }) => {
    await page.goto("/Cajas");
    await expect(page.getByRole("heading", { name: "Cajas Registradoras" })).toBeVisible();

    // Tab until focus lands on an aside nav link (keyboard modality —
    // the v11 lesson: :focus-visible only matches after key input, and
    // synthetic KeyboardEvents do not move focus — keyboard.press does).
    for (let i = 0; i < 8; i += 1) {
      const onNav = await page.evaluate(
        () =>
          !!document.activeElement &&
          !!document.activeElement.closest("aside nav a"),
      );
      if (onNav) break;
      await page.keyboard.press("Tab");
    }
    const onNav = await page.evaluate(
      () =>
        !!document.activeElement &&
        !!document.activeElement.closest("aside nav a"),
    );
    expect(onNav, "a nav link holds focus after the Tab sweep").toBe(true);

    // transition-all covers outline-color — the violet fades in over
    // 150ms; settle before reading (the v11 glass-button lesson).
    await page.waitForTimeout(300);
    const focus = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return { color: cs.outlineColor, style: cs.outlineStyle, w: cs.outlineWidth, shadow: cs.boxShadow };
    });
    expect(focus.color).toBe("rgba(127, 98, 244, 0.5)");
    expect(focus.style).toBe("solid");
    expect(focus.w).toBe("3px");
    // The retired indigo halo must not ride along.
    expect(focus.shadow).not.toContain("rgb(129, 140, 248)");
  });
});

test.describe("functional parity (v14) — the reports empty-state skins", () => {
  test("both empty states are the 160px flex-centered boxes; the heading gap is 20px", async ({
    page,
  }) => {
    // The e2e seed's sales sit outside the default window (the standing
    // reports.spec pin) — both cards render the empty state.
    await page.goto("/Reportes");
    const cards = ["report-by-method", "report-method-detail"];
    for (const testId of cards) {
      const card = page.getByTestId(testId);
      await expect(card).toContainText("Sin datos en este período");
      const box = await card
        .locator(".h-40")
        .evaluate((el) => {
          const cs = getComputedStyle(el);
          return {
            h: Math.round(el.getBoundingClientRect().height),
            display: cs.display,
            align: cs.alignItems,
            justify: cs.justifyContent,
          };
        });
      expect(box.h).toBe(160);
      expect(box.display).toBe("flex");
      expect(box.align).toBe("center");
      expect(box.justify).toBe("center");
    }

    // The heading → content gap: the measured mb-5 (L22).
    const gap = await page.getByTestId("report-method-detail").evaluate((el) => {
      const heading = el.querySelector("h2")!;
      const box = el.querySelector(".h-40")!;
      return Math.round(box.getBoundingClientRect().y - heading.getBoundingClientRect().bottom);
    });
    expect(gap).toBe(20);
  });
});

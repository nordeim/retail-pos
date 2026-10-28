import { expect, test } from "@playwright/test";

// V29/ADR-038 — the 404 content-family freeze (the neo-crm session-197
// doctrine adopted: the sweep-state coverage audit).
//
// The gap this closes: the designed 404 was DECODED (not-found.tsx,
// reference-measured — docs/reference-investigation.md §1), STATUS-pinned
// (V24: the TRUE HTTP 404 via page.request.get), VISIBILITY-pinned (the
// card + one getByText + the CTA click in navigation.spec.ts), TITLE-pinned
// (v7 slug-casing + the V27 guard), and a11y-REGISTERED (V24/F2, both
// widths) — but NO gate held the CONTENT FAMILY itself. getByText passes on
// a demoted <div>; the click-only CTA pin passes on any label; the copy and
// the badge were pinned nowhere; a missing heading is no critical/serious
// axe violation. A not-found.tsx regression (h1 demotion, copy drift,
// badge removal, CTA relabel) would keep every gate green — the s197
// verdict verbatim-mapped ("NO gate held its PIXELS").
//
// The freeze form is the house idiom (the v25 spine-freeze precedent):
// exact-value pins on the live-measured family (card max-w-md 448px,
// badge h-20 w-20 80×80, both measured this cycle), born-green on the
// standing tree, mutation-proven in the plan's §6 ledger (the planted h1
// demotion and the copy drift each go RED at the exact assertion below).
//
// The 404 is session-independent (the SD-20 public superset — the reference
// gates its own 404 behind the platform login; the clone renders it
// publicly), so the spec runs in the default project posture as-is.

test.describe("404 surface (v29 content-family freeze)", () => {
  test("T1: the designed content family — level-1 h1, exact copy, 404 badge, CTA accessible name", async ({
    page,
  }) => {
    await page.goto("/NonExistentAudit");

    const card = page.getByTestId("not-found-card");
    await expect(card).toBeVisible();

    // The h1 as a LEVEL-1 HEADING — getByText passes on a demoted div;
    // the role + level + exact name is what catches the demotion (the
    // s197 mutation shape).
    await expect(
      page.getByRole("heading", { level: 1, name: "Página no encontrada", exact: true }),
    ).toBeVisible();

    // The body copy, exact — any drift goes RED here.
    await expect(
      page.getByText("La página que buscas no existe o fue movida.", { exact: true }),
    ).toBeVisible();

    // The "404" gradient badge (the span inside the card — the only "404"
    // text on the surface).
    await expect(card.getByText("404", { exact: true })).toBeVisible();

    // The CTA's accessible name — the click-only pin in navigation.spec.ts
    // passes on ANY label; this freezes the reference's own CTA copy.
    await expect(page.getByTestId("not-found-cta")).toHaveAccessibleName("Ir al Terminal");
  });

  test("T2: the measured geometry — the max-w-md card (448px) and the 80×80 badge", async ({
    page,
  }) => {
    await page.goto("/NonExistentAudit");

    const card = page.getByTestId("not-found-card");
    await expect(card).toBeVisible();

    // The reference's card is max-w-md — 448px at desktop (live-measured
    // 2026-10-29 at the project viewport). Rounded reads, expect.poll —
    // the v25 starved-read idiom (harmless on a static SSR surface,
    // consistent with the geometry family).
    await expect
      .poll(async () => {
        const box = await card.boundingBox();
        return box ? Math.round(box.width) : 0;
      })
      .toBe(448);

    // The badge is h-20 w-20 — exactly 80×80, square.
    const badge = card.getByText("404", { exact: true });
    await expect
      .poll(async () => {
        const box = await badge.boundingBox();
        return box ? [Math.round(box.width), Math.round(box.height)] : [0, 0];
      })
      .toEqual([80, 80]);
  });
});

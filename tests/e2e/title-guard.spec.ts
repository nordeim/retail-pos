import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2e pins for remediation-plan-v27 — the shell title-guard pass.
//
// The root cause the V27 probe quantified (scripts/probe-v27-title-race.ts):
// Next's client metadata manager re-applies the root layout title
// ("VeloxPOS") 5-6 times per boot with the LAST write as late as ~295ms
// post-commit, and the shell's title effect (gated on the /api/auth/me
// round-trip) lands as little as 9ms after it. Single-digit-ms margins:
// under full-suite load variance the order flips, the manager's write
// lands AFTER the shell's, and the clobber is PERMANENT (a bare effect
// never re-fires) — the v9 Spanish-alias title flake's exact signature
// (V18 + V26 occurrences across a 9-cycle watch, always re-run green,
// zero code changes). The repo already solved the identical race on the
// 404 surface in v7 (src/app/not-found-title.tsx — the guarded
// MutationObserver that "wins the last write"); V27 ports the cure to
// the shell.
//
// These pins replace the probabilistic race with a CONTROLLED clobber
// (the same write family the manager performs — a title assignment after
// the shell is ready) and assert the defense's contract deterministically:
// the guard corrects the title. On the bare-effect build the clobber
// sticks forever → born RED; with the guarded observer → GREEN.
// ---------------------------------------------------------------------------

test.describe("title guard (v27) — a late metadata re-apply is corrected", () => {
  test("the clobber is corrected: the guarded observer wins the last write", async ({ page }) => {
    await page.goto("/Ventas");
    await expect(page.getByRole("heading", { name: "Historial de Ventas" })).toBeVisible();
    await expect(page).toHaveTitle("Ventas | VeloxPOS");

    // The empirically documented clobber (probe-v27): the metadata
    // manager's late re-apply of the root layout title AFTER the shell's
    // write. Simulated here as a controlled title assignment — the same
    // observable the flake leaves behind ("VeloxPOS" while the URL is
    // /Ventas).
    await page.evaluate(() => {
      document.title = "VeloxPOS";
    });

    // The guarded observer re-applies the path-driven title (the
    // not-found-title.tsx precedent: apply-when-different on every head
    // mutation). On the bare-effect build this clobber is permanent.
    await expect(page).toHaveTitle("Ventas | VeloxPOS");
  });

  test("after a clobber, SPA navigation still re-titles — and the guard re-arms", async ({ page }) => {
    await page.goto("/Ventas");
    await expect(page).toHaveTitle("Ventas | VeloxPOS");

    // Navigate first (the sidebar links ride pushState — the store's SPA
    // nav, src/lib/store.ts — and they link the CANONICAL paths).
    await page.getByTestId("nav-dashboard").click();
    await expect(page.locator("main h1")).toHaveText("Dashboard");
    await expect(page).toHaveTitle("Dashboard | VeloxPOS");

    // Clobber on the POST-NAV surface: the guard must correct here too,
    // not only at boot (the effect's apply + the armed observer).
    await page.evaluate(() => {
      document.title = "VeloxPOS";
    });
    await expect(page).toHaveTitle("Dashboard | VeloxPOS");

    // Navigate again: the view change re-applies (the [status, view]
    // effect) and the observer stays armed on the new route. The Ventas
    // sidebar link targets the canonical /Sales.
    await page.getByTestId("nav-ventas").click();
    await expect(page.locator("main h1")).toHaveText("Historial de Ventas");
    await expect(page).toHaveTitle("Sales | VeloxPOS");

    // And the guard corrects on the sales surface as well.
    await page.evaluate(() => {
      document.title = "VeloxPOS";
    });
    await expect(page).toHaveTitle("Sales | VeloxPOS");
  });
});

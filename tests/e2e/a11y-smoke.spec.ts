import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The a11y smoke: WCAG 2.2 A/AA violations (critical/serious), minus the
// color-contrast rule — the reference's own measured design renders
// slate-800 H1s on the #080a14 canvas and slate-400/500 metadata text
// (docs/reference-investigation.md §6); parity pins those exact tokens, and
// the deviation is disclosed rather than silently failed here.
const BUILDER_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function blockingViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(BUILDER_TAGS)
    .disableRules(["color-contrast"])
    .analyze();
  return results.violations.filter((violation) =>
    ["critical", "serious"].includes(violation.impact ?? ""),
  );
}

// V31 — the dialog-open registrations (the neo-crm session-199 doctrine
// adopted): a Radix Dialog's content is ABSENT from the DOM while closed,
// so every dialog-open state carries its own registration — the
// closed-surface scans never see dialog interiors. The shared scanner
// bakes in the L-164c2 vacuous-green cure: the dialog must be VISIBLE
// before the scan (a scan on a closed surface passes trivially), and the
// Escape close is ASSERTED (the Radix close contract), never assumed.
async function scanDialogOpen(
  page: import("@playwright/test").Page,
  label: string,
  open: () => Promise<void>,
) {
  await open();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const blocking = await blockingViolations(page);
  expect(
    blocking.map((v) => `${v.id}:${v.impact}`),
    `${label} — ${blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n")}`,
  ).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
}

test.describe("a11y smoke", () => {
  test("the shell + dashboard are clean of critical/serious violations", async ({ page }) => {
    await page.goto("/Dashboard");
    await expect(page.locator("main h1")).toHaveText("Dashboard");

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the mobile drawer traps nothing and labels its controls", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByTestId("mobile-menu-button").click();
    const panel = page.getByTestId("mobile-drawer-panel");
    await expect(panel).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  // V31 — the dialog-open registrations (the register census pins in
  // tests/a11y-register-census.test.ts hold this inventory by NAME). The
  // create/edit adjudication follows the s199 declined list: the create
  // registration scans the SAME dialog DOM the edit flow renders (one
  // component, key-remounted) — edit-mode registrations add no surface.
  test("the product dialog opens clean", async ({ page }) => {
    await page.goto("/Inventory");
    await scanDialogOpen(page, "product dialog", () =>
      page.getByTestId("new-product-button").click(),
    );
  });

  test("the product delete-confirm opens clean", async ({ page }) => {
    await page.goto("/Inventory");
    await scanDialogOpen(page, "product delete-confirm", () =>
      page.locator('[data-testid^="delete-product-"]').first().click(),
    );
  });

  test("the caja create dialog opens clean", async ({ page }) => {
    await page.goto("/Registers");
    await scanDialogOpen(page, "caja create dialog", () =>
      page.getByTestId("new-register-button").click(),
    );
  });

  test("the caja delete-confirm opens clean", async ({ page }) => {
    await page.goto("/Registers");
    await scanDialogOpen(page, "caja delete-confirm", () =>
      page.locator('[data-testid^="delete-register-"]').first().click(),
    );
  });

  test("the shift-open dialog opens clean", async ({ page }) => {
    await page.goto("/Registers");
    await scanDialogOpen(page, "shift-open dialog", () =>
      page.locator('[data-testid^="open-shift-"]').first().click(),
    );
  });

  test("the cashier dialog opens clean", async ({ page }) => {
    await page.goto("/Cashiers");
    await scanDialogOpen(page, "cashier dialog", () =>
      page.getByTestId("new-cashier-button").click(),
    );
  });

  test("the cashier delete-confirm opens clean", async ({ page }) => {
    await page.goto("/Cashiers");
    await scanDialogOpen(page, "cashier delete-confirm", () =>
      page.locator('[data-testid^="delete-cashier-"]').first().click(),
    );
  });

  test("the ticket modal opens clean", async ({ page }) => {
    await page.goto("/Sales");
    await scanDialogOpen(page, "ticket modal", () =>
      page.locator('[data-testid^="view-sale-"]').first().click(),
    );
  });

  test("the four Mi Cuenta dialogs open clean", async ({ page }) => {
    await page.goto("/StoreSettings");
    await scanDialogOpen(page, "Mi Cuenta change-password", () =>
      page.getByTestId("account-change-password-button").click(),
    );
    await scanDialogOpen(page, "Mi Cuenta change-email", () =>
      page.getByTestId("account-change-email-button").click(),
    );
    await scanDialogOpen(page, "Mi Cuenta change-name", () =>
      page.getByTestId("account-change-name-button").click(),
    );
    await scanDialogOpen(page, "Mi Cuenta delete-account", () =>
      page.getByTestId("account-delete-button").click(),
    );
  });

  // V31/F1b — the Ajustes view's own closed surface joins the register:
  // it is the defect-bearing surface (the Moneda + Proveedor selects —
  // the live census found the same unassociated-label shape there), and
  // the only authed view carrying the family.
  //
  // V32 — the view-register completion (the V31-declined future cycle,
  // taken now): the six remaining authed views' closed surfaces join
  // below, each with its own heading-anchored visible-wait (the lazy view
  // registry means the chunk may still be loading after goto — a scan on
  // a not-yet-rendered view passes vacuously; the L-164c2 guard, here at
  // the view layer). The Dashboard's closed surface rides the shell test
  // above — the register now covers every public surface, every authed
  // view, the drawer, and every dialog-open state.
  test("the Ajustes view is clean of critical/serious violations", async ({ page }) => {
    await page.goto("/StoreSettings");
    await expect(page.getByTestId("settings-categories-card")).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  // V32 — the six view closed-surface registrations (the census pins in
  // tests/a11y-register-census.test.ts hold this inventory by NAME). The
  // visible-wait anchors are the navigation spec's own ROUTES headings —
  // each view renders its own PageHeading, so the heading's visibility is
  // the view's mount proof. The Terminal registration scans the seeded
  // no-shift state (the default e2e posture; the state-gated pair below
  // owns the open-shift cycle).
  test("the Terminal view is clean of critical/serious violations", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("main h1, main h2").filter({ hasText: "No hay turno activo" }).first(),
    ).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the Inventario view is clean of critical/serious violations", async ({ page }) => {
    await page.goto("/Inventory");
    await expect(page.locator("main h1").filter({ hasText: "Inventario" })).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the Ventas view is clean of critical/serious violations", async ({ page }) => {
    await page.goto("/Sales");
    await expect(
      page.locator("main h1").filter({ hasText: "Historial de Ventas" }),
    ).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the Cajas view is clean of critical/serious violations", async ({ page }) => {
    await page.goto("/Registers");
    await expect(
      page.locator("main h1").filter({ hasText: "Cajas Registradoras" }),
    ).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the Cajeros view is clean of critical/serious violations", async ({ page }) => {
    await page.goto("/Cashiers");
    await expect(page.locator("main h1").filter({ hasText: "Cajeros" })).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the Reportes view is clean of critical/serious violations", async ({ page }) => {
    await page.goto("/Reports");
    await expect(page.locator("main h1").filter({ hasText: "Reportes" })).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  // V33 — the width-scope registrations (the neo-crm session-200 doctrine
  // adopted; the census pins in tests/a11y-register-census.test.ts hold
  // this inventory by NAME). The V32 register was desktop-form; the
  // phone-width closed surfaces join here — every authed surface at
  // 390×844, each with its own heading-anchored visible-wait (the lazy
  // view registry's L-164c2 guard, at the phone layer). The LIVE CATCH
  // this cycle rode the phone Cajeros surface (scrollable-region-focusable
  // — the recent-shifts table's scroll region was keyboard-unreachable;
  // cured in cashiers-view.tsx). The phone dialog-open family is the
  // DECLINED next-round candidate (remediation-plan-v33 §5).
  test("the phone shell + dashboard are clean of critical/serious violations", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/Dashboard");
    await expect(page.locator("main h1").filter({ hasText: "Dashboard" })).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the Terminal view is clean at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(
      page.locator("main h1, main h2").filter({ hasText: "No hay turno activo" }).first(),
    ).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the Inventario view is clean at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/Inventory");
    await expect(page.locator("main h1").filter({ hasText: "Inventario" })).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the Ventas view is clean at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/Sales");
    await expect(
      page.locator("main h1").filter({ hasText: "Historial de Ventas" }),
    ).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the Cajas view is clean at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/Registers");
    await expect(
      page.locator("main h1").filter({ hasText: "Cajas Registradoras" }),
    ).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the Cajeros view is clean at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/Cashiers");
    await expect(page.locator("main h1").filter({ hasText: "Cajeros" })).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the Reportes view is clean at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/Reports");
    await expect(page.locator("main h1").filter({ hasText: "Reportes" })).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the Ajustes view is clean at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/StoreSettings");
    await expect(page.getByTestId("settings-categories-card")).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  // The state-gated pair LAST (its cycle mutates server state and restores
  // it within the same test): a real shift opened on the first register,
  // the payment dialog scanned (Escape — no sale, no stock change), the
  // shift-close dialog scanned (Escape — no close), then the shift closed
  // for real with the float counted back (500 → 500, no discrepancy; the
  // later specs' assertions are containment-based — the probe verified
  // the exact cycle green end-to-end).
  test("the payment dialog opens clean", async ({ page }) => {
    await page.goto("/Registers");
    await page.locator('[data-testid^="open-shift-"]').first().click();
    await page.getByTestId("shift-cashier-select").click();
    await page.getByRole("option").first().click();
    await page.getByTestId("shift-float-input").fill("500");
    await page.getByTestId("shift-submit").click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.goto("/");
    await page.locator('[data-testid^="terminal-product-"]').first().click();
    await scanDialogOpen(page, "payment dialog", () =>
      page.getByTestId("cobrar-button").click(),
    );
  });

  test("the shift-close dialog opens clean", async ({ page }) => {
    await page.goto("/Registers");
    await scanDialogOpen(page, "shift-close dialog", () =>
      page.locator('[data-testid^="close-shift-"]').first().click(),
    );

    // State restoration: close the shift for real (the float 500 counted
    // back — no cash-short branch, no open shift left for later specs).
    await page.locator('[data-testid^="close-shift-"]').first().click();
    await page.getByTestId("shift-closing-input").fill("500");
    await page.getByTestId("shift-close-submit").click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test.describe("a11y smoke (logged-out)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("the login form is labeled", async ({ page }) => {
    await page.goto("/login");
    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  // V24/F2: the 404 is the one PUBLIC app surface (the SD-20 superset —
  // live-verified: no login bounce) that sat outside the smoke's
  // registrations. Its slate-800 H1 / slate-400 body ride the same
  // disclosed color-contrast deviation family the register already
  // excludes, so the scan rules match. Registered at BOTH widths — the
  // public family's both-widths duty (V33 completed the family: the
  // phone login/signup registrations + the reset-password form state
  // joined below; the authed phone surfaces carry their own
  // registrations above).
  test("the public 404 surface is clean at desktop and phone widths", async ({ page }) => {
    await page.goto("/NonExistent");
    await expect(page.getByTestId("not-found-card")).toBeVisible();

    let blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);

    await page.setViewportSize({ width: 390, height: 844 });
    blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  // V29/F2 — the register COMPLETED (the neo-crm session-197 coverage-audit
  // doctrine adopted): the AGENTS V24 doctrine says every public surface
  // belongs in this register, and two never made it — /signup (the SD-20
  // public superset: the reference gates /signup behind its platform login,
  // the clone renders it publicly) and /reset-password (the base44
  // platform-template page; the token rides the query string, so the
  // session-free render is the no-token "Invalid Reset Link" state). Both
  // ride the light-theme label families the login scan already passes on.
  test("the public signup surface is clean", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the public reset-password surface is clean", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: "Invalid Reset Link" })).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  // V33 — the public family's both-widths completion (the width-scope
  // doctrine): the login and signup phone faces, plus the reset-password
  // FORM state — the ?token= face (any non-empty token renders the form;
  // validity is submit-checked only, the shape-probe idiom), the richer
  // form (two htmlFor/id-wired password inputs + the submit). The
  // no-token card above stays the registered invalid-link face; the
  // shared-component adjudication follows the s200 precedent.
  test("the login surface is clean at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome to VeloxPOS" })).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the signup surface is clean at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();

    const blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });

  test("the reset-password form state is clean at desktop and phone widths", async ({ page }) => {
    await page.goto("/reset-password?token=e2e-shape-probe");
    await expect(page.getByRole("heading", { name: "Set new password" })).toBeVisible();

    let blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);

    await page.setViewportSize({ width: 390, height: 844 });
    blocking = await blockingViolations(page);
    expect(
      blocking.map((v) => `${v.id}:${v.impact}`),
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`).join("\n"),
    ).toEqual([]);
  });
});

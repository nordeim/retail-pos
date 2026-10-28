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
  // card is responsive (max-w-md under p-4) and the phone layout is the
  // one no other registration covers.
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
});

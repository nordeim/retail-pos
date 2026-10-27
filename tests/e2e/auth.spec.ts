import { expect, test } from "@playwright/test";

import { DEMO_EMAIL, DEMO_PASSWORD } from "./helpers";

// The logged-out surface. storageState is opt-out here: these tests run
// unauthenticated by design.

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("auth", () => {
  test("the login page renders the reference card", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("auth-page")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome to VeloxPOS");
    await expect(page.getByText("Sign in to continue")).toBeVisible();
    for (const provider of ["Google", "Microsoft", "Facebook", "Apple"]) {
      await expect(page.getByRole("button", { name: `Continue with ${provider}` })).toBeVisible();
    }
    // V12/F2: the OR chip's DOM text is the literal "or" (the reference
    // uppercases it through CSS — text-xs uppercase on the wrapper).
    await expect(page.getByText("or", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByTestId("login-submit")).toBeVisible();
    await expect(page.getByText("Forgot password?")).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  });

  test("a social button explains itself instead of dead-ending", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("social-google").click();
    // V12: the notice copy follows the reference's English auth family.
    await expect(page.getByTestId("social-notice")).toContainText(
      "Google is not configured",
    );
  });

  test("wrong credentials surface the uniform error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(DEMO_EMAIL);
    await page.getByLabel("Password").fill("wrong-password-1");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("auth-error")).toContainText(/invalid|incorrecto/i);
  });

  test("valid credentials land on the Terminal with the session cookie", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(DEMO_EMAIL);
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByTestId("login-submit").click();

    await page.waitForURL(/\/$|\/terminal/i);
    const hydrated = page.locator("html[data-app-hydrated=true]");
    await expect(hydrated).toBeAttached();
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
  });

  test("an unauthenticated visit to the app bounces to /login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/login/);
    await expect(page.getByTestId("auth-page")).toBeVisible();
  });
});

import { expect, request as playwrightRequest, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// V22 — the account-security UI, pinned end-to-end (remediation-plan-v22 /
// SD-85..SD-91). Three surfaces, one journey:
//
//   F2 — the signup verify stage DISPLAYS the register response's code (the
//        no-SMTP self-hosted delivery — previously discarded, making signup
//        verification UI-unusable on a fresh install).
//   F3 — the login 403 (unverified account) renders the verify sub-card:
//        "Resend the code" (fresh code, or the neutral no-enumeration copy
//        for unknown addresses) + the code entry that completes the journey
//        (verify-email sets the session cookie — sign in without a second
//        round-trip).
//   F1 — the "Mi Cuenta" section in Ajustes: the identity readout
//        (/api/auth/me), the change-password / change-email dialogs, and the
//        destructive delete-account AlertDialog (cascade warning + store
//        reset + /login redirect).
//
// Context discipline: this spec OPTS OUT of the shared storageState (the
// whole journey is the logged-out→verified→settings arc of ONE scratch
// account). Authenticated API assertions (the post-rotation logins) go
// through FRESH contexts — the account-security.spec pattern.
//
// Budget (single worker, shared buckets): ONE register (7/run total — the
// limit is 10/IP/15min), ONE failed login + ZERO successful login-form
// logins (the verify flow signs itself in), TWO resends (5/run total), and
// two fresh-context logins that RESET the limiter on success. The scratch
// account is deleted LAST (file order = run order: fullyParallel false,
// workers 1).
// ---------------------------------------------------------------------------

test.use({ storageState: { cookies: [], origins: [] } });

const SCRATCH_EMAIL = `account-ui-${Date.now()}@e2e.test`;
const SCRATCH_PASSWORD = "ScratchPass123!";
const ROTATED_PASSWORD = "RotatedPass456!";
const ROTATED_EMAIL = `account-ui-rotated-${Date.now()}@e2e.test`;

/** The scratch account's CURRENT credentials — the rotation tests re-point
 *  them mid-spec (module state is safe: one worker, serial — the
 *  account-security.spec scratchEmail pattern). */
let currentEmail = SCRATCH_EMAIL;
let currentPassword = SCRATCH_PASSWORD;

test.describe("F2 — the signup code note (the self-hosted delivery)", () => {
  test("the verify stage displays the 6-digit code the API issued", async ({
    page,
  }) => {
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Account UI Pin");
    await page.getByLabel("Email").fill(SCRATCH_EMAIL);
    await page.getByLabel("Password").fill(SCRATCH_PASSWORD);
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
    const note = page.getByTestId("signup-code-note");
    await expect(note).toBeVisible();
    // The note names the delivery model (self-hosted, no email service)…
    await expect(note).toContainText(/self-hosted/i);
    // …and carries the code itself in its own element.
    const code = await note.getByTestId("issued-code").innerText();
    expect(code).toMatch(/^\d{6}$/);
  });
});

test.describe("F3 — the login 403 verify sub-card (the dead-end closed)", () => {
  test("the unverified login renders the verify card with a working resend", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(SCRATCH_EMAIL);
    await page.getByLabel("Password").fill(SCRATCH_PASSWORD);
    await page.getByTestId("login-submit").click();

    // The inline 403 alert…
    await expect(page.getByTestId("auth-error")).toContainText(/verify your email/i);
    // …plus the verify sub-card with its resend affordance and code entry.
    const card = page.getByTestId("login-verify-card");
    await expect(card).toBeVisible();
    await expect(card.getByTestId("login-verify-code-input")).toBeVisible();

    await card.getByTestId("login-resend-button").click();
    const note = page.getByTestId("login-code-note");
    await expect(note).toBeVisible();
    const code = await note.getByTestId("issued-code").innerText();
    expect(code).toMatch(/^\d{6}$/);
  });

  test("the resend's neutral branch never leaks account state", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(SCRATCH_EMAIL);
    await page.getByLabel("Password").fill(SCRATCH_PASSWORD);
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("login-verify-card")).toBeVisible();

    // Point the form at an address no account owns — the API answers the
    // uniform 200 WITHOUT a code; the UI renders the neutral copy only.
    await page.getByLabel("Email").fill(`nobody-${Date.now()}@e2e.test`);
    await page.getByTestId("login-verify-card").getByTestId("login-resend-button").click();
    await expect(page.getByTestId("login-code-note")).toContainText(
      /has been issued/i,
    );
    await expect(page.getByTestId("issued-code")).toHaveCount(0);
  });

  test("entering the delivered code completes the journey — signed in", async ({
    page,
  }) => {
    // Bucket isolation (the H3 precedent): the full suite's verify-email
    // budget runs at exactly 10/15min on the shared localhost bucket
    // (security.spec's H2 spends 7 + M6 1 + account-security 1 + v12 1);
    // THIS spec's verify would be the 11th and 429. Declaring a distinct
    // rightmost proxy hop routes it to its own bucket — the limiter's
    // documented hop-selection contract, not a bypass (the cookie's
    // validity is IP-independent).
    await page.route("**/api/auth/verify-email", (route) =>
      route.continue({
        headers: {
          ...route.request().headers(),
          "x-forwarded-for": "198.51.100.9",
        },
      }),
    );

    await page.goto("/login");
    await page.getByLabel("Email").fill(SCRATCH_EMAIL);
    await page.getByLabel("Password").fill(SCRATCH_PASSWORD);
    await page.getByTestId("login-submit").click();
    const card = page.getByTestId("login-verify-card");
    await expect(card).toBeVisible();

    await card.getByTestId("login-resend-button").click();
    const code = await page.getByTestId("login-code-note").getByTestId("issued-code").innerText();

    await card.getByTestId("login-verify-code-input").fill(code);
    await card.getByTestId("login-verify-submit").click();

    // verify-email sets the session cookie — the app shell boots (the
    // Terminal's shift-gated H2 is the logged-in landmark).
    await expect(page.getByText("No hay turno activo")).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("F1 — the Mi Cuenta section (Ajustes)", () => {
  // Each test gets a fresh browser context, so the scratch account signs
  // in through the login form (successful logins RESET the IP limiter —
  // the documented model; the failed-login budget spends nothing here).
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(currentEmail);
    await page.getByLabel("Password").fill(currentPassword);
    await page.getByTestId("login-submit").click();
    await expect(page.getByText("No hay turno activo")).toBeVisible({ timeout: 20_000 });
    await page.goto("/StoreSettings");
    await expect(page.getByRole("heading", { name: "Ajustes de la Tienda" })).toBeVisible();
  });

  test("the section renders the identity readout with the verified badge", async ({
    page,
  }) => {
    const section = page.getByTestId("account-section");
    await expect(section).toBeVisible();
    await expect(section).toContainText("Mi Cuenta");
    await expect(page.getByTestId("account-email")).toHaveText(SCRATCH_EMAIL);
    await expect(page.getByTestId("account-verified-badge")).toBeVisible();
  });

  test("change-password: the wrong-current 400 surfaces inside the dialog", async ({
    page,
  }) => {
    await page.getByTestId("account-change-password-button").click();
    const dialog = page.getByTestId("change-password-dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByTestId("current-password-input").fill("DefinitelyWrong9!");
    await dialog.getByTestId("new-password-input").fill(ROTATED_PASSWORD);
    await dialog.getByTestId("confirm-password-input").fill(ROTATED_PASSWORD);
    await dialog.getByTestId("change-password-submit").click();

    await expect(dialog.getByTestId("change-password-error")).toContainText(
      /current password is incorrect/i,
    );
  });

  test("change-password: the happy path rotates — the new password logs in", async ({
    page,
  }) => {
    await page.getByTestId("account-change-password-button").click();
    const dialog = page.getByTestId("change-password-dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByTestId("current-password-input").fill(SCRATCH_PASSWORD);
    await dialog.getByTestId("new-password-input").fill(ROTATED_PASSWORD);
    await dialog.getByTestId("confirm-password-input").fill(ROTATED_PASSWORD);
    await dialog.getByTestId("change-password-submit").click();

    // The session SURVIVES the rotation (the cookie is an HMAC over
    // AUTH_SECRET) — the success note renders inside the dialog.
    await expect(dialog.getByTestId("change-password-success")).toBeVisible();
    currentPassword = ROTATED_PASSWORD;

    // The server state moved: a fresh-context login with the NEW password.
    const fresh = await playwrightRequest.newContext();
    try {
      const login = await fresh.post("/api/auth/login", {
        data: { email: SCRATCH_EMAIL, password: ROTATED_PASSWORD },
      });
      expect(login.status()).toBe(200);
    } finally {
      await fresh.dispose();
    }
  });

  test("change-email: must-differ 400, then the happy path updates the readout", async ({
    page,
  }) => {
    await page.getByTestId("account-change-email-button").click();
    const dialog = page.getByTestId("change-email-dialog");
    await expect(dialog).toBeVisible();

    // Must-differ: posting the current address.
    await dialog.getByTestId("email-password-input").fill(ROTATED_PASSWORD);
    await dialog.getByTestId("new-email-input").fill(SCRATCH_EMAIL);
    await dialog.getByTestId("change-email-submit").click();
    await expect(dialog.getByTestId("change-email-error")).toContainText(
      /already your email/i,
    );

    // The happy path: the readout re-points to the new address.
    await dialog.getByTestId("new-email-input").fill(ROTATED_EMAIL);
    await dialog.getByTestId("change-email-submit").click();
    await expect(dialog.getByTestId("change-email-success")).toBeVisible();
    await expect(page.getByTestId("account-email")).toHaveText(ROTATED_EMAIL);
    currentEmail = ROTATED_EMAIL;

    // The server state moved: a fresh-context login with the NEW address.
    const fresh = await playwrightRequest.newContext();
    try {
      const login = await fresh.post("/api/auth/login", {
        data: { email: ROTATED_EMAIL, password: ROTATED_PASSWORD },
      });
      expect(login.status()).toBe(200);
    } finally {
      await fresh.dispose();
    }
  });

  test("delete-account: the cascade warning, the exit, and the dead cookie", async ({
    page,
  }) => {
    await page.getByTestId("account-delete-button").click();
    const dialog = page.getByTestId("delete-account-dialog");
    await expect(dialog).toBeVisible();
    // The destructive warning names the wipe (Spanish, the retail domain).
    await expect(dialog).toContainText(/no se puede deshacer/i);

    await dialog.getByTestId("delete-password-input").fill(ROTATED_PASSWORD);
    await dialog.getByTestId("delete-account-confirm").click();

    // The route clears the cookie — the redirect lands on /login.
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Welcome to VeloxPOS" })).toBeVisible();

    // The account is GONE: the credentials no longer authenticate.
    const fresh = await playwrightRequest.newContext();
    try {
      const login = await fresh.post("/api/auth/login", {
        data: { email: ROTATED_EMAIL, password: ROTATED_PASSWORD },
      });
      expect(login.status()).toBe(401);
    } finally {
      await fresh.dispose();
    }
  });
});

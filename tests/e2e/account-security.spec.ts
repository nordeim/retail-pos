import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
} from "@playwright/test";

import { DEMO_EMAIL } from "./helpers";

// ---------------------------------------------------------------------------
// V21 — the account-security superset, pinned end-to-end
// (remediation-plan-v21 / SD-81). The four scaffold-inherited routes —
// POST /api/auth/change-password · change-email · delete-account ·
// resend-verification — are real, rate-limited, password-first endpoints
// the reference lacks entirely (ADR-030: a disclosed API-only superset).
// Until this spec they shipped with ZERO coverage.
//
// Context discipline (the security.spec M6 pattern): every AUTHENTICATED
// call goes through a FRESH context with the scratch cookie as an
// explicit header — the shared `request` fixture carries the demo
// owner's storageState cookie, and an authenticated scratch call through
// it could act on the OWNER's account instead. Unauthenticated calls
// (register/verify/login/resend) may use either.
//
// Budget note (single worker, shared buckets): this spec spends ONE
// register (6/run total — the limit is 10/IP/15min) and three logins
// (4/run total with the setup project's — also under 10). The scratch
// account is deleted LAST (file order = run order: fullyParallel false,
// workers 1).
// ---------------------------------------------------------------------------

const INITIAL_EMAIL = `account-security-${Date.now()}@e2e.test`;
const INITIAL_PASSWORD = "ScratchPass123!";
const ROTATED_PASSWORD = "RotatedPass456!";

/** The scratch account's CURRENT login identifier — change-email's happy
 *  path re-points it mid-spec (module state is safe: one worker, serial). */
let scratchEmail = INITIAL_EMAIL;

/** Register + verify the scratch account, returning its session cookie
 *  (the security.spec registerAndVerify pattern — the in-app code
 *  delivery IS the self-hosted design). */
async function registerAndVerify(
  request: APIRequestContext,
  email: string,
): Promise<string> {
  const register = await request.post("/api/auth/register", {
    data: { name: "Account Security Pin", email, password: INITIAL_PASSWORD },
  });
  expect(register.status()).toBe(201);
  const { code } = (await register.json()) as { ok: boolean; code: string };
  const verify = await request.post("/api/auth/verify-email", {
    data: { email, code },
  });
  expect(verify.status()).toBe(200);
  const setCookie = verify.headers()["set-cookie"] ?? "";
  const sessionCookie = setCookie.split(";")[0];
  if (!sessionCookie.startsWith("sf_session=")) {
    throw new Error(`verify-email did not set a session cookie (${setCookie})`);
  }
  return sessionCookie;
}

test.beforeAll(async ({ request }) => {
  // One scratch account for the whole spec; delete-account runs LAST.
  await registerAndVerify(request, INITIAL_EMAIL);
});

test.describe("change-password — the rotation contract", () => {
  test("a wrong current password is rejected PRE-WRITE with 400", async ({
    request,
  }) => {
    const login = await request.post("/api/auth/login", {
      data: { email: scratchEmail, password: INITIAL_PASSWORD },
    });
    expect(login.status()).toBe(200);
    const cookie = (login.headers()["set-cookie"] ?? "").split(";")[0];

    const fresh = await playwrightRequest.newContext();
    try {
      const wrong = await fresh.post("/api/auth/change-password", {
        headers: { cookie },
        data: {
          currentPassword: "DefinitelyWrong9!",
          newPassword: "NewPass789!",
        },
      });
      expect(wrong.status()).toBe(400);
    } finally {
      await fresh.dispose();
    }

    // PRE-WRITE: the old password still authenticates.
    const relogin = await request.post("/api/auth/login", {
      data: { email: scratchEmail, password: INITIAL_PASSWORD },
    });
    expect(relogin.status()).toBe(200);
  });

  test("the happy path rotates and the new password logs in", async ({
    request,
  }) => {
    const login = await request.post("/api/auth/login", {
      data: { email: scratchEmail, password: INITIAL_PASSWORD },
    });
    const cookie = (login.headers()["set-cookie"] ?? "").split(";")[0];

    const fresh = await playwrightRequest.newContext();
    try {
      const rotate = await fresh.post("/api/auth/change-password", {
        headers: { cookie },
        data: {
          currentPassword: INITIAL_PASSWORD,
          newPassword: ROTATED_PASSWORD,
        },
      });
      expect(rotate.status()).toBe(200);
    } finally {
      await fresh.dispose();
    }

    const withNew = await request.post("/api/auth/login", {
      data: { email: scratchEmail, password: ROTATED_PASSWORD },
    });
    expect(withNew.status()).toBe(200);
  });
});

test.describe("change-email — the identity rotation contract", () => {
  test("posting the current address fails with 400 (must-differ)", async ({
    request,
  }) => {
    const login = await request.post("/api/auth/login", {
      data: { email: scratchEmail, password: ROTATED_PASSWORD },
    });
    const cookie = (login.headers()["set-cookie"] ?? "").split(";")[0];

    const fresh = await playwrightRequest.newContext();
    try {
      const same = await fresh.post("/api/auth/change-email", {
        headers: { cookie },
        data: { password: ROTATED_PASSWORD, newEmail: scratchEmail },
      });
      expect(same.status()).toBe(400);
    } finally {
      await fresh.dispose();
    }
  });

  test("an address owned by ANY account fails with 409", async ({
    request,
  }) => {
    const login = await request.post("/api/auth/login", {
      data: { email: scratchEmail, password: ROTATED_PASSWORD },
    });
    const cookie = (login.headers()["set-cookie"] ?? "").split(";")[0];

    const fresh = await playwrightRequest.newContext();
    try {
      const taken = await fresh.post("/api/auth/change-email", {
        headers: { cookie },
        data: { password: ROTATED_PASSWORD, newEmail: DEMO_EMAIL },
      });
      expect(taken.status()).toBe(409);
    } finally {
      await fresh.dispose();
    }
  });

  test("the happy path moves the login identifier and it works", async ({
    request,
  }) => {
    const login = await request.post("/api/auth/login", {
      data: { email: scratchEmail, password: ROTATED_PASSWORD },
    });
    const cookie = (login.headers()["set-cookie"] ?? "").split(";")[0];
    const newEmail = `moved-${Date.now()}@e2e.test`;

    const fresh = await playwrightRequest.newContext();
    try {
      const move = await fresh.post("/api/auth/change-email", {
        headers: { cookie },
        data: { password: ROTATED_PASSWORD, newEmail },
      });
      expect(move.status()).toBe(200);
      const body = (await move.json()) as { ok: boolean; email: string };
      expect(body.email).toBe(newEmail);
    } finally {
      await fresh.dispose();
    }

    // The identifier moved — prove it by logging in with it, then re-point
    // the delete-account tests at the new address.
    const withNew = await request.post("/api/auth/login", {
      data: { email: newEmail, password: ROTATED_PASSWORD },
    });
    expect(withNew.status()).toBe(200);
    scratchEmail = newEmail;
  });
});

test.describe("resend-verification — the no-enumeration contract", () => {
  test("an unknown email answers the uniform 200 with NO code key", async ({
    request,
  }) => {
    const resend = await request.post("/api/auth/resend-verification", {
      data: { email: `nobody-${Date.now()}@e2e.test` },
    });
    expect(resend.status()).toBe(200);
    const body = (await resend.json()) as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(body.code).toBeUndefined();
  });
});

test.describe("delete-account — the ownership exit (runs LAST)", () => {
  test("a wrong password is rejected PRE-WRITE with 400", async ({
    request,
  }) => {
    const login = await request.post("/api/auth/login", {
      data: { email: scratchEmail, password: ROTATED_PASSWORD },
    });
    const cookie = (login.headers()["set-cookie"] ?? "").split(";")[0];

    const fresh = await playwrightRequest.newContext();
    try {
      const wrong = await fresh.post("/api/auth/delete-account", {
        headers: { cookie },
        data: { password: "DefinitelyWrong9!" },
      });
      expect(wrong.status()).toBe(400);
    } finally {
      await fresh.dispose();
    }
  });

  test("the happy path cascades, clears the cookie, and the account is gone", async ({
    request,
  }) => {
    const login = await request.post("/api/auth/login", {
      data: { email: scratchEmail, password: ROTATED_PASSWORD },
    });
    const cookie = (login.headers()["set-cookie"] ?? "").split(";")[0];

    const fresh = await playwrightRequest.newContext();
    try {
      const gone = await fresh.post("/api/auth/delete-account", {
        headers: { cookie },
        data: { password: ROTATED_PASSWORD },
      });
      expect(gone.status()).toBe(200);

      // The response clears the session cookie (maxAge 0) — the echoed
      // header must be a deletion, not a fresh grant.
      const setCookie = gone.headers()["set-cookie"] ?? "";
      expect(setCookie).toMatch(/sf_session=;/);

      // The account no longer authenticates: old cookie AND old creds.
      const after = await fresh.get("/api/auth/me", {
        headers: { cookie },
      });
      expect(after.status()).toBe(401);

      const relogin = await request.post("/api/auth/login", {
        data: { email: scratchEmail, password: ROTATED_PASSWORD },
      });
      expect(relogin.status()).toBe(401);
    } finally {
      await fresh.dispose();
    }
  });
});

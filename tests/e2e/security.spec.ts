import { execSync } from "node:child_process";
import path from "node:path";
import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
} from "@playwright/test";

import { DEMO_EMAIL } from "./helpers";

// ---------------------------------------------------------------------------
// R1 security pins — these run against the STANDALONE PRODUCTION server
// (NODE_ENV=production, see playwright.config.ts's webServer), i.e. the
// exact posture a network-reachable deploy answers in. The DB probe reads
// the isolated e2e database directly (WAL-safe from a second process) —
// production must never hand the one-shot reset token to the caller, so
// the M6 flow needs the server-side view instead.
//
// Rate-limit budget note (single worker, shared buckets): the H2 strike
// test spends 7 "verify:local" checks (<10), the H3 burst test burns a
// FRESH "register:203.0.113.7" bucket — it runs LAST so the exhausted
// budget can never leak into another spec.
// ---------------------------------------------------------------------------

const repo = path.resolve(__dirname, "..", "..");

/** Read the latest reset token for an email straight from the e2e DB.
 *  bun wraps `bun -e` output in ANSI escapes when FORCE_COLOR leaks from
 *  the Playwright env — neutralize the color env AND strip control chars
 *  before parsing. */
function probeLatestResetToken(email: string): string {
  const script =
    "const {Database} = require('bun:sqlite'); " +
    "const db = new Database(process.env.E2E_DB_PATH, {readonly: true}); " +
    "const row = db.query('SELECT t.token FROM PasswordResetToken t " +
    "JOIN User u ON u.id = t.userId WHERE u.email = ? " +
    "ORDER BY t.createdAt DESC LIMIT 1').get(process.env.PROBE_EMAIL); " +
    "console.log(JSON.stringify(row));";
  const out = execSync(`bun -e "${script}"`, {
    cwd: repo,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      E2E_DB_PATH: path.join(repo, "db", "e2e.db"),
      PROBE_EMAIL: email,
      NO_COLOR: "1",
      FORCE_COLOR: "0",
      TERM: "dumb",
    } as NodeJS.ProcessEnv,
  }).toString();
  const cleaned = out.replace(/[\u0000-\u001f\u007f]/g, "");
  const parsed = JSON.parse(cleaned.trim().split("\n").pop() ?? "null") as {
    token: string;
  } | null;
  if (!parsed?.token) throw new Error(`No reset token found for ${email}`);
  return parsed.token;
}

async function registerAndVerify(
  request: APIRequestContext,
  email: string,
): Promise<string> {
  const register = await request.post("/api/auth/register", {
    data: { name: "Security Pin", email, password: "Demo1234!" },
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

test.describe("security hardening (R1)", () => {
  test("C1: production forgot-password never carries the reset token", async ({
    request,
  }) => {
    const response = await request.post("/api/auth/forgot-password", {
      data: { email: DEMO_EMAIL },
    });
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('"ok":true');
    expect(body).not.toContain("resetPath");
    expect(body).not.toContain("resetUrl");
    expect(body).not.toContain("token");
    // The token DOES exist server-side (probed) — only the response is clean.
    expect(probeLatestResetToken(DEMO_EMAIL)).toMatch(/^[0-9a-f]{48}$/);
  });

  test("H1: invalid factory payloads answer 400, never 500", async ({
    request,
  }) => {
    const list = await request.get("/api/categories");
    expect(list.status()).toBe(200);
    const rows = (await list.json()) as { id: string }[];
    expect(rows.length).toBeGreaterThan(0);

    const created = await request.post("/api/categories", {
      data: { name: 123 },
    });
    expect(created.status()).toBe(400);

    const patched = await request.patch(`/api/categories/${rows[0].id}`, {
      data: { name: { nested: true } },
    });
    expect(patched.status()).toBe(400);
  });

  test("H2: six wrong OTP strikes kill the token — even the right code after", async ({
    request,
  }) => {
    const email = `otp-strikes-${Date.now()}@security.test`;
    const register = await request.post("/api/auth/register", {
      data: { name: "OTP Strikes", email, password: "Demo1234!" },
    });
    expect(register.status()).toBe(201);
    const { code } = (await register.json()) as { code: string };
    const wrongCode = code === "000000" ? "999999" : "000000";

    for (let strike = 0; strike < 6; strike += 1) {
      const attempt = await request.post("/api/auth/verify-email", {
        data: { email, code: wrongCode },
      });
      expect(attempt.status()).toBe(400);
    }

    // The right code must now answer the same uniform 400 — the token row
    // is spent, the fetch can no longer see it.
    const correct = await request.post("/api/auth/verify-email", {
      data: { email, code },
    });
    expect(correct.status()).toBe(400);
  });

  test("M6: a pre-reset session cookie dies the moment the password resets", async ({
    request,
  }) => {
    const email = `revocation-${Date.now()}@security.test`;
    const sessionCookie = await registerAndVerify(request, email);

    // Sanity: the fresh cookie authenticates (isolated context — only the
    // captured cookie rides the request).
    const fresh = await playwrightRequest.newContext();
    try {
      const before = await fresh.get("/api/auth/me", {
        headers: { cookie: sessionCookie },
      });
      expect(before.status()).toBe(200);

      const forgot = await request.post("/api/auth/forgot-password", {
        data: { email },
      });
      expect(forgot.status()).toBe(200);
      expect((await forgot.json()).resetPath).toBeUndefined();

      const token = probeLatestResetToken(email);
      const reset = await request.post("/api/auth/reset-password", {
        data: { token, password: "FreshPass123!" },
      });
      expect(reset.status()).toBe(200);

      // The pre-reset cookie is revoked: tokenVersion no longer matches.
      const after = await fresh.get("/api/auth/me", {
        headers: { cookie: sessionCookie },
      });
      expect(after.status()).toBe(401);
    } finally {
      await fresh.dispose();
    }
  });

  test("H3: rotating spoofed left hops cannot bypass the IP limiter (429)", async ({
    request,
  }) => {
    // Every request carries a DIFFERENT client-controlled left hop and the
    // same trusted rightmost hop. Pre-remediation (first-hop keying) each
    // request keyed a fresh bucket — the limiter never tripped. With the
    // rightmost-hop selection they all share ONE bucket: the 11th is 429.
    for (let i = 0; i < 10; i += 1) {
      const response = await request.post("/api/auth/register", {
        headers: { "x-forwarded-for": `spoof-hop-${i}.invalid, 203.0.113.7` },
        // Invalid payloads keep the bucket spend without creating rows —
        // the limiter sits BEFORE validation by design.
        data: { email: "not-an-email" },
      });
      expect(response.status()).toBe(400);
    }
    const blocked = await request.post("/api/auth/register", {
      headers: { "x-forwarded-for": "spoof-hop-10.invalid, 203.0.113.7" },
      data: { email: "not-an-email" },
    });
    expect(blocked.status()).toBe(429);
    expect(Number(blocked.headers()["retry-after"])).toBeGreaterThan(0);
  });
});

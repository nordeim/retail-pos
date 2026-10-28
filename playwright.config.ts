import { defineConfig, devices } from "@playwright/test";

// E2E layer (v2.3): boots the PRODUCTION standalone server on an isolated
// port with its own scratch database (db/e2e.db, schema-pushed + seeded by
// the global setup), then drives the real UI in Chromium.
//
// Prerequisites: `bun run build` (the standalone server must exist).
// Run with: `bun run test:e2e`.
//
// Auth strategy: the "setup" project signs the demo user in ONCE and saves
// the session cookie to tests/e2e/.auth/user.json; every spec in the main
// project starts with that storageState. This is not just speed — the auth
// endpoints are rate-limited (10 attempts/IP/15 min), so per-test logins
// would trip the limiter mid-suite. tests/e2e/auth.spec.ts opts back out
// with an empty storageState because it tests the logged-out surface.
//
// The unit layer stays in Vitest (see vitest.config.ts — it matches
// *.test.ts only, so these *.spec.ts / *.setup.ts files are never picked
// up twice).

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;
const E2E_DATABASE_URL = "file:../db/e2e.db";
const AUTH_STATE = "tests/e2e/.auth/user.json";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1, // one worker: the specs share a single seeded SQLite file
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_STATE,
      },
    },
  ],
  globalSetup: "./tests/e2e/global-setup.ts",
  webServer: {
    command: "bun .next/standalone/server.js",
    url: `${BASE_URL}/api/health`,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: "production",
      DATABASE_URL: E2E_DATABASE_URL,
      // S22: 64-hex shape (the documented production form — openssl rand
      // -hex 32) so the boot guard's weak-secret warn stays silent in the
      // suite's own boot. The setup project re-signs-in each run, so the
      // value change invalidates nothing. (V24/F5: the previous value was
      // 62-hex — the comment's claim was false; the pin in
      // tests/e2e-harness.test.ts caught it.)
      AUTH_SECRET: "5c488cfa9214da3ba7446c061a1ff7d6b6bb00fa2db8ba930b5dea807fda1a71",
      // V24/SD-100 (the neo-crm N-69a doctrine — "the dev server lies" on
      // the env axis): the child env must not inherit shell state that
      // flips the auth-behavior contracts the security/account specs
      // assert. A stray `RESET_INAPP_DELIVERY=1` export in the developer's
      // shell would hand the C1 production-posture spec the one-shot reset
      // token in the forgot-password response body; a stray
      // `AUTH_PROXY_HOPS=1` would break the H3 verify-bucket isolation (a
      // single-hop xff fails closed to "local" — the shared localhost
      // verify budget runs at exactly 10/15min). Pinning the defaults
      // after the spread makes the suite deterministic regardless of
      // shell state.
      RESET_INAPP_DELIVERY: "",
      AUTH_PROXY_HOPS: "0",
    } as Record<string, string>,
  },
});

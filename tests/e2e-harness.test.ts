// ---------------------------------------------------------------------------
// The V24 e2e-harness contract pins (remediation-plan-v24 / SD-100..SD-103,
// the gate-coverage truth pass — the neo-crm session-195 doctrine adopted:
// a shipped behavioral claim that a doc or a consumer leans on, but that no
// standing assertion pins, is a latent regression).
//
// This family file freezes the TEST HARNESS's own contract in source pins
// (the account-ui/recovery-a11y idiom — comment-stripped source, regex
// pins):
//
//   1. The webServer boots the PRODUCTION standalone server on the isolated
//      port + database (db/e2e.db — never the developer's custom.db).
//   2. The suite signs itself with the documented 64-hex AUTH_SECRET shape
//      so the boot guard's weak-secret warn stays silent (S22).
//   3. The two auth-behavior knobs — RESET_INAPP_DELIVERY and
//      AUTH_PROXY_HOPS — are PINNED in the webServer child env (SD-100,
//      the neo-crm N-69a "the dev server lies" family on the env axis):
//      the child env spreads ...process.env, so a stray parent-shell
//      export of RESET_INAPP_DELIVERY=1 would flip the C1
//      production-posture spec's expected response (the one-shot reset
//      token would appear in the forgot-password body), and a stray
//      AUTH_PROXY_HOPS=1 would break the H3 verify-bucket isolation (a
//      single-hop xff fails closed to "local" — the shared localhost
//      verify budget runs at exactly 10/15min). Pinning the defaults
//      makes the suite deterministic regardless of shell state.
//   4. The global setup pins the seed identity AFTER its own env spread —
//      an unset var would leak the developer's local owner into the e2e
//      database (the documented bun .env auto-load trap).
//
// Pins 3a/3b were written RED (the unfixed config spread inherited shell
// state); the rest freeze standing truths in the born-green form (battery
// gaps, not behavior bugs — disclosed per the house TDD doctrine).
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/** Strip // line comments and /* block comments so docs never trip code pins. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function read(...segments: string[]): string {
  return readFileSync(path.join(import.meta.dirname, "..", ...segments), "utf8");
}

const CONFIG = stripComments(read("playwright.config.ts"));
const GLOBAL_SETUP = stripComments(read("tests", "e2e", "global-setup.ts"));

describe("V24 — the e2e webServer boots the production app, isolated", () => {
  it("runs the standalone server in NODE_ENV=production", () => {
    expect(CONFIG).toMatch(/NODE_ENV:\s*"production"/);
  });

  it("points the suite at the isolated db/e2e.db (never the developer's custom.db)", () => {
    expect(CONFIG).toMatch(/E2E_DATABASE_URL\s*=\s*"file:\.\.\/db\/e2e\.db"/);
    expect(CONFIG).toMatch(/DATABASE_URL:\s*E2E_DATABASE_URL/);
  });

  it("signs the suite with the documented 64-hex secret shape (the boot guard stays silent)", () => {
    expect(CONFIG).toMatch(/AUTH_SECRET:\s*"[0-9a-f]{64}"/);
  });
});

describe("V24 — the e2e webServer child env is shell-state-proof (SD-100)", () => {
  it("pins RESET_INAPP_DELIVERY empty — the C1 production posture cannot be flipped by the parent shell", () => {
    expect(CONFIG).toMatch(/RESET_INAPP_DELIVERY:\s*""/);
  });

  it("pins AUTH_PROXY_HOPS zero — the H3 client-IP selection stays the rightmost-hop default", () => {
    expect(CONFIG).toMatch(/AUTH_PROXY_HOPS:\s*"0"/);
  });
});

describe("V24 — the e2e seed identity is pinned against .env leakage", () => {
  it("global-setup sets SEED_OWNER_EMAIL/PASSWORD/NAME after its env spread", () => {
    expect(GLOBAL_SETUP).toMatch(/SEED_OWNER_EMAIL:\s*"owner@veloxpos\.local"/);
    expect(GLOBAL_SETUP).toMatch(/SEED_OWNER_PASSWORD:\s*"VeloxDemo123!"/);
    expect(GLOBAL_SETUP).toMatch(/SEED_OWNER_NAME:\s*"Cesar Martínez"/);
  });
});

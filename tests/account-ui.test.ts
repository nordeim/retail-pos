// ---------------------------------------------------------------------------
// The V22 account-security UI pins (remediation-plan-v22 / SD-85..SD-92):
// the four account-security routes (ADR-030's tested API-only superset)
// gain their UI — the "Mi Cuenta" section in Ajustes (change-password,
// change-email, delete-account), the signup verify stage's self-hosted
// code note (the register response's OTP was DISCARDED — F2: signup
// verification was UI-unusable on a no-SMTP install), and the login 403's
// resend affordance (F3: the dead-end "check your email" copy pointed at
// an email that never arrives).
//
// V23 (remediation-plan-v23 / SD-93..SD-97) EXTENDS the set: the
// profile/name-edit surface — POST /api/auth/update-profile + the
// "Cambiar nombre" dialog (the account's fullName was read-only
// everywhere; the V22 session log's own suggested next step). The two
// V22 action pins grow to the four-action superset (SD-97 — extend,
// never weaken).
//
// Source pins in the recovery-a11y idiom (comment-stripped source, regex
// pins); the behavioral layer proves the flows end-to-end
// (tests/e2e/account-ui.spec.ts).
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from "node:fs";
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

const SETTINGS = stripComments(read("src", "components", "views", "settings-view.tsx"));
const SIGNUP = stripComments(read("src", "components", "auth", "signup-surface.tsx"));
const LOGIN = stripComments(read("src", "components", "auth", "login-surface.tsx"));
const STORE = stripComments(read("src", "lib", "store.ts"));
const NEXT_CONFIG = stripComments(read("next.config.ts"));
const VALIDATION = stripComments(read("src", "lib", "validation.ts"));
const PROFILE_ROUTE_PATH = path.join(
  import.meta.dirname,
  "..",
  "src",
  "app",
  "api",
  "auth",
  "update-profile",
  "route.ts",
);
const PROFILE_ROUTE = existsSync(PROFILE_ROUTE_PATH)
  ? stripComments(readFileSync(PROFILE_ROUTE_PATH, "utf8"))
  : "";

// ---- F1: the Mi Cuenta section (SD-85/86/89/90/91) ----------------------------

describe("F1 — the Mi Cuenta section (settings-view.tsx)", () => {
  it("renders the section with the ShieldCheck icon in the rose header family", () => {
    expect(SETTINGS).toMatch(/ShieldCheck/);
    expect(SETTINGS).toMatch(/text-rose-500/);
    expect(SETTINGS).toMatch(/Mi Cuenta/);
  });

  it("offers the four actions in Spanish (name, password, email, delete)", () => {
    expect(SETTINGS).toMatch(/Cambiar nombre/);
    expect(SETTINGS).toMatch(/Cambiar contraseña/);
    expect(SETTINGS).toMatch(/Cambiar correo/);
    expect(SETTINGS).toMatch(/Eliminar cuenta/);
  });

  it("wires the four authenticated account routes (update-profile joins the family)", () => {
    expect(SETTINGS).toMatch(/\/api\/auth\/update-profile/);
    expect(SETTINGS).toMatch(/\/api\/auth\/change-password/);
    expect(SETTINGS).toMatch(/\/api\/auth\/change-email/);
    expect(SETTINGS).toMatch(/\/api\/auth\/delete-account/);
  });

  it("reads the identity through the /api/auth/me seam", () => {
    expect(SETTINGS).toMatch(/\/api\/auth\/me/);
  });

  it("the delete path resets the store and redirects to /login (the logout mechanics)", () => {
    const resetCall = SETTINGS.match(/usePosStore\.getState\(\)\.reset\(\)/);
    expect(resetCall).not.toBeNull();
    expect(SETTINGS).toMatch(/window\.location\.replace\("\/login"\)/);
  });
});

// ---- F2: the signup verify stage's self-hosted code note (SD-87) ---------------

describe("F2 — the signup verify stage shows the code (signup-surface.tsx)", () => {
  it("keeps the register response's code in state", () => {
    expect(SIGNUP).toMatch(/setIssuedCode|issuedCode/);
  });

  it("renders the self-hosted code note on the verify stage", () => {
    expect(SIGNUP).toMatch(/self-hosted/i);
    expect(SIGNUP).toMatch(/data-testid="signup-code-note"/);
  });

  it("the note rides the auth Alert family (the slate variant)", () => {
    // The codebase's actual slate-Alert idiom (login-surface's social
    // notice): rounded-xl border border-slate-200 bg-slate-50/70 p-4.
    expect(SIGNUP).toMatch(/border border-slate-200 bg-slate-50\/70 p-4/);
  });
});

// ---- F3: the login 403 resend affordance (SD-88) --------------------------------

describe("F3 — the login 403 offers the resend (login-surface.tsx)", () => {
  it("tracks the 403 status distinctly from generic login errors", () => {
    expect(LOGIN).toMatch(/403/);
    expect(LOGIN).toMatch(/needsVerification|unverified/);
  });

  it("calls the resend route from the login surface", () => {
    expect(LOGIN).toMatch(/\/api\/auth\/resend-verification/);
  });

  it("renders the delivered code note (both branches — code and neutral)", () => {
    expect(LOGIN).toMatch(/data-testid="login-code-note"/);
    expect(LOGIN).toMatch(/issued a new code|Resend the code/);
  });
});

// ---- F4: AppUser.emailVerified ---------------------------------------------------

describe("F4 — AppUser carries emailVerified (store.ts)", () => {
  it("the client user type includes the verification flag", () => {
    const typeBlock = STORE.match(/export type AppUser = \{[\s\S]*?\}/)?.[0] ?? "";
    expect(typeBlock).toMatch(/emailVerified:\s*boolean/);
  });
});

// ---- F5: the docs-truth guard (SD-92) ---------------------------------------------

describe("F5 — next.config.ts sets no ignoreBuildErrors (the PAD #7 guard)", () => {
  it("the build is never configured to skip type errors", () => {
    expect(NEXT_CONFIG).not.toMatch(/ignoreBuildErrors/);
  });
});

// ---- V23/F1: the profile/name-edit surface (SD-93..SD-97) ------------------------

describe("V23/F1 — POST /api/auth/update-profile (the route family shape)", () => {
  it("the route file exists", () => {
    expect(PROFILE_ROUTE.length).toBeGreaterThan(0);
  });

  it("session-gates through requireUser and rate-limits per user (the account-family posture)", () => {
    expect(PROFILE_ROUTE).toMatch(/requireUser\(\)/);
    expect(PROFILE_ROUTE).toMatch(/updateProfile:/);
  });

  it("carries the route-side must-differ guard (server state, not a body field)", () => {
    expect(PROFILE_ROUTE).toMatch(/already your name/i);
  });

  it("answers in the publicUser envelope (the change-email shape)", () => {
    expect(PROFILE_ROUTE).toMatch(/publicUser\(/);
  });

  it("deliberately carries NO password proof (the benign-field family split, SD-94)", () => {
    expect(PROFILE_ROUTE).not.toMatch(/verifyPassword/);
  });
});

describe("V23/F1 — updateProfileSchema (validation.ts)", () => {
  it("validates fullName: trim, min 1, max 100 (the register ceiling)", () => {
    const schema = VALIDATION.match(
      /export const updateProfileSchema = z\.object\(\{[\s\S]*?\}\)/,
    )?.[0];
    expect(schema).toBeDefined();
    expect(schema).toMatch(/fullName:/);
    expect(schema).toMatch(/\.trim\(\)\.min\(1\)\.max\(100\)/);
  });
});

describe("V23/F1 — the Cambiar nombre dialog (settings-view.tsx)", () => {
  it("prefills the input with the current name and patches the readout on change", () => {
    expect(SETTINGS).toMatch(/account-change-name-button/);
    expect(SETTINGS).toMatch(/change-name-dialog/);
    expect(SETTINGS).toMatch(/data-testid="name-input"/);
  });

  it("rides the onChanged seam (the change-email precedent) to update me.name", () => {
    const patch = SETTINGS.match(
      /setMe\(\(prev\) => \(prev \? \{ \.\.\.prev, name \} : prev\)\)/,
    );
    expect(patch).not.toBeNull();
  });
});

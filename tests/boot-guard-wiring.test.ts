import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// V26/F2 — the boot-guard WIRING pinned (and the stale citation retired).
//
// The standing picture: tests/env-check.test.ts pins the PURE seam
// (authSecretBootStatus — the fatal/warn/ok classification), but the
// wiring in src/instrumentation.ts's register() — the code that turns a
// "fatal" classification into console.error + process.exit(1) — carried
// ZERO standing assertions. Worse: the file's own comment claimed "pinned
// by tests/e2e/s22-boot-guard.spec.ts" — a spec deleted in the V1 pivot
// (0b78972, the study-layer archive) and never replaced. A shipped pin
// claim that was FALSE today (the repo-wide citation sweep found 16 test
// citations in src/; this was the only one that did not resolve).
//
// The regression shape is the comment's OWN documented defect: "A plain
// throw is CAUGHT by Next and leaves a degraded 500-everything server —
// the explicit exit is the validated fail-fast mechanism." A wiring
// regression (exit swapped for a throw, or the exit code drifting) would
// flip the production fail-fast posture with every standing gate green.
// Mutation-proven per remediation-plan-v26 SD-110b (the planted
// exit→throw defect went RED; restored → GREEN).
//
// Safety contract of THIS file: process.exit is SPIED with a
// mockImplementation — never a real exit (a live exit(1) would kill the
// vitest worker). The console spies keep the test output clean. The env
// vars are saved and restored around every case (register() reads
// process.env itself — the env-check seam deliberately does not).
// ---------------------------------------------------------------------------

import { register } from "@/instrumentation";

const HEX_64 = "a".repeat(64); // the openssl rand -hex 32 shape
const WEAK_31 = "w".repeat(31); // one char under the 32 boundary

// NODE_ENV is readonly in @types/node (a typing constraint, not a runtime
// one) — the record-shaped view is the standard escape for env manipulation
// in tests.
const env = process.env as Record<string, string | undefined>;

let originalNodeEnv: string | undefined;
let originalAuthSecret: string | undefined;
let exitSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  originalNodeEnv = process.env.NODE_ENV;
  originalAuthSecret = process.env.AUTH_SECRET;
  exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  env.NODE_ENV = originalNodeEnv;
  env.AUTH_SECRET = originalAuthSecret;
  exitSpy.mockRestore();
  errorSpy.mockRestore();
  warnSpy.mockRestore();
  vi.restoreAllMocks();
});

describe("register() — the boot-guard wiring (V26/F2)", () => {
  it("fatal: production with a blank secret fails fast — console.error + process.exit(1), never a throw", async () => {
    env.NODE_ENV = "production";
    env.AUTH_SECRET = "";

    await register(); // must resolve — a throw here is the documented defect shape

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(String(errorSpy.mock.calls[0]?.[0])).toContain("AUTH_SECRET is required in production");
    expect(exitSpy).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("fatal: production with the .env.example placeholder secret fails fast the same way (the L9 shape)", async () => {
    env.NODE_ENV = "production";
    env.AUTH_SECRET = "dev-only-veloxpos-secret-change-me";

    await register();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(String(errorSpy.mock.calls[0]?.[0])).toContain("public example constant");
    expect(exitSpy).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("warn: production with a weak secret boots — console.warn, NO exit (a warn never blocks the boot)", async () => {
    env.NODE_ENV = "production";
    env.AUTH_SECRET = WEAK_31;

    await register();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain("looks weak");
    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("warn: dev with an unset secret boots on the fallback — console.warn, NO exit", async () => {
    delete env.NODE_ENV;
    delete env.AUTH_SECRET;

    await register();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain("dev-only fallback");
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("ok: production with a genuine 64-hex secret is silent — no exit, no console", async () => {
    env.NODE_ENV = "production";
    env.AUTH_SECRET = HEX_64;

    await register();

    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

import {
  checkRateLimit,
  createSessionToken,
  inAppResetDeliveryEnabled,
  rateLimitBucketCount,
  readSessionToken,
  resetRateLimit,
  resolveClientIp,
  sessionMatchesVersion,
  UNKNOWN_ACCOUNT_HASH,
  verifyPassword,
  type SessionPayload,
} from "@/lib/auth";
import { toErrorResponse } from "@/lib/server/http";

// ---------------------------------------------------------------------------
// R1 security-hardening pins (remediation-plan-v3 §R1). Every pin here was
// written RED against the pre-remediation code: resolveClientIp, the token
// `v` payload, the delivery gate, the equalizer hash, the pruning sweep and
// the ZodError mapping did not exist (or answered 500).
// ---------------------------------------------------------------------------

const readSource = (...segments: string[]) =>
  readFileSync(path.join(import.meta.dirname, "..", "src", ...segments), "utf8");

// ---- H3: proxy-hop-aware client-IP selection ----------------------------------

describe("resolveClientIp (H3)", () => {
  it("returns the single hop when only one exists", () => {
    expect(resolveClientIp("203.0.113.5")).toBe("203.0.113.5");
  });

  it("ignores client-supplied left hops at the default depth 0 (rightmost wins)", () => {
    // An attacker POSTs X-Forwarded-For: 1.2.3.4 through one trusted proxy
    // which appends the real client — the spoofed left hop must NOT become
    // the limiter key (the pre-remediation first-hop behavior).
    expect(resolveClientIp("1.2.3.4, 203.0.113.5")).toBe("203.0.113.5");
  });

  it("selects the declared trusted depth (AUTH_PROXY_HOPS=1 → second from right)", () => {
    expect(resolveClientIp("spoofed, 10.0.0.1, 203.0.113.5", 1)).toBe("10.0.0.1");
  });

  it("tolerates whitespace around hops", () => {
    expect(resolveClientIp("  1.2.3.4 ,  203.0.113.9  ")).toBe("203.0.113.9");
  });

  it("fails closed on absent, empty, or garbage headers (never the attacker's pick)", () => {
    expect(resolveClientIp(null)).toBe("local");
    expect(resolveClientIp("")).toBe("local");
    expect(resolveClientIp("   ")).toBe("local");
    expect(resolveClientIp("not an ip")).toBe("local");
    expect(resolveClientIp("<script>alert(1)</script>")).toBe("local");
  });

  it("fails closed when the trusted depth exceeds the hop count", () => {
    // One hop, two declared proxies: no trustworthy entry exists — pool,
    // never fall back to the client-controlled leftmost value.
    expect(resolveClientIp("1.2.3.4", 2)).toBe("local");
  });
});

// ---- M6: tokenVersion rides the session payload ---------------------------------

describe("session tokenVersion (M6)", () => {
  it("round-trips an explicit version", () => {
    const payload = readSessionToken(createSessionToken("user-v3", 3));
    expect(payload?.uid).toBe("user-v3");
    expect(payload?.v).toBe(3);
  });

  it("defaults to 0 (legacy tokens stay valid until a reset bumps the user)", () => {
    const payload = readSessionToken(createSessionToken("user-v0"));
    expect(payload?.v).toBe(0);
  });

  it("sessionMatchesVersion pins the revocation comparison", () => {
    const base: SessionPayload = { uid: "u", iat: 1, exp: 9e15, v: 2 };
    expect(sessionMatchesVersion(base, 2)).toBe(true);
    expect(sessionMatchesVersion(base, 1)).toBe(false);
    expect(sessionMatchesVersion(base, 0)).toBe(false);
  });
});

// ---- C1: the in-app reset-delivery gate ------------------------------------------

describe("inAppResetDeliveryEnabled (C1)", () => {
  it("is OFF in production unless explicitly enabled", () => {
    expect(inAppResetDeliveryEnabled("production", undefined)).toBe(false);
    expect(inAppResetDeliveryEnabled("production", "")).toBe(false);
    expect(inAppResetDeliveryEnabled("production", "0")).toBe(false);
  });

  it("is ON in production only with the explicit opt-in flag", () => {
    expect(inAppResetDeliveryEnabled("production", "1")).toBe(true);
    expect(inAppResetDeliveryEnabled("production", "true")).toBe(true);
  });

  it("stays ON outside production (the self-hosted dev/e2e contract)", () => {
    expect(inAppResetDeliveryEnabled("development", undefined)).toBe(true);
    expect(inAppResetDeliveryEnabled("test", undefined)).toBe(true);
  });
});

// ---- M7: the unknown-account timing equalizer --------------------------------------

describe("UNKNOWN_ACCOUNT_HASH (M7)", () => {
  it("is a well-formed scrypt hash (the equalizer actually burns scrypt)", () => {
    expect(UNKNOWN_ACCOUNT_HASH).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  });

  it("verifies without throwing (a real scrypt run, not a short-circuit)", () => {
    expect(typeof verifyPassword("any-typed-password", UNKNOWN_ACCOUNT_HASH)).toBe("boolean");
  });

  it("the login route burns it on the unknown-email branch (source pin)", () => {
    const source = readSource("app", "api", "auth", "login", "route.ts");
    expect(source).toContain("UNKNOWN_ACCOUNT_HASH");
  });
});

// ---- H1: the raw ZodError → 400 mapping ----------------------------------------------

describe("toErrorResponse ZodError mapping (H1)", () => {
  it("maps a raw ZodError to 400 (the delegates' .parse path)", async () => {
    const result = z.object({ name: z.string().min(1) }).safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const response = toErrorResponse(result.error);
      expect(response.status).toBe(400);
      const body = (await response.json()) as { error: string };
      expect(typeof body.error).toBe("string");
    }
  });
});

// ---- L10: the rate-limit pruning sweep -----------------------------------------------

describe("checkRateLimit pruning (L10)", () => {
  it("deletes expired buckets during a check (no unbounded map growth)", () => {
    vi.useFakeTimers();
    try {
      resetRateLimit("prune-a");
      resetRateLimit("prune-b");
      checkRateLimit("prune-a");
      checkRateLimit("prune-b");
      expect(rateLimitBucketCount()).toBeGreaterThanOrEqual(2);

      vi.advanceTimersByTime(15 * 60 * 1000 + 1); // past the 15-minute window
      checkRateLimit("prune-c"); // any check triggers the sweep

      expect(rateLimitBucketCount()).toBe(1); // only the fresh prune-c bucket
    } finally {
      vi.useRealTimers();
    }
  });
});

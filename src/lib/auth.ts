// ---------------------------------------------------------------------------
// Auth primitives: scrypt password hashing, HMAC session tokens, the shared
// in-memory rate limiter, and the S15 verification/reset seam functions.
// Pure — unit-pinned by tests/auth.test.ts. The cookie/server helpers that
// need next/headers live in src/lib/server/auth.ts (documented layering).
// ---------------------------------------------------------------------------

import {
  createHmac,
  randomBytes,
  randomFillSync,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

import { DEV_FALLBACK_SECRET } from "./env-check";

export { DEV_FALLBACK_SECRET };

const SCRYPT_KEYLEN = 64;
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * A real scrypt hash of a fixed throwaway constant. The login route burns
 * one verifyPassword() against it on the unknown-email branch so both 401
 * paths run the same scrypt work (M7: no timing enumeration oracle).
 * NOT a credential — it verifies nothing; it only spends the same cycles.
 */
export const UNKNOWN_ACCOUNT_HASH =
  "scrypt$304d5e537a210b140be019f2dec280fd$35207f16ad6789e85849c81cac735deaaee7d7a0d3389e1ffdd2a8e6de331f1cfc2fd2dccbdb741d9d6351928fc385b3da1128fdcedee5245627bcd9344bca4c";

/** Failed OTP attempts before a verification token is dead (H2). */
export const MAX_OTP_ATTEMPTS = 6;

// ---- password hashing (scrypt) ----------------------------------------------

/** Format: scrypt$<16-byte salt hex>$<64-byte derived key hex> */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (salt.length !== 16 || expected.length !== SCRYPT_KEYLEN) return false;
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  return timingSafeEqual(derived, expected);
}

// ---- session tokens (HMAC over { uid, iat, exp, v }) ------------------------

function sessionSecret(): string {
  return process.env.AUTH_SECRET?.trim() || DEV_FALLBACK_SECRET;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** The token payload — `v` is the user's tokenVersion at issue time (M6:
 *  a password reset bumps the user's version and every cookie carrying a
 *  lower version dies on its next request). */
export type SessionPayload = { uid: string; iat: number; exp: number; v: number };

export function createSessionToken(userId: string, tokenVersion = 0): string {
  const payload: SessionPayload = {
    uid: userId,
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
    v: tokenVersion,
  };
  const body = b64url(JSON.stringify(payload));
  const mac = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function readSessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [body, mac] = parts;
  const expected = createHmac("sha256", sessionSecret()).update(body).digest();
  let given: Buffer;
  try {
    given = Buffer.from(mac, "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload: unknown = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof payload !== "object" || payload === null) return null;
    const { uid, iat, exp, v } = payload as Record<string, unknown>;
    if (typeof uid !== "string" || typeof iat !== "number" || typeof exp !== "number") return null;
    if (exp <= Date.now()) return null;
    // Tokens minted before tokenVersion exist read as v=0 — they stay
    // valid until the user's version is bumped by a reset.
    return { uid, iat, exp, v: typeof v === "number" ? v : 0 };
  } catch {
    return null;
  }
}

/** M6: does this token's version still match the user's current one? */
export function sessionMatchesVersion(payload: SessionPayload, tokenVersion: number): boolean {
  return payload.v === tokenVersion;
}

// ---- rate limiting (in-memory; single instance only — documented) --------------

export const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

type Bucket = { count: number; windowStart: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

/** Live-bucket census — the L10 pruning pin's observable. */
export function rateLimitBucketCount(): number {
  return buckets.size;
}

export function checkRateLimit(key: string, max: number = MAX_ATTEMPTS): RateLimitResult {
  const now = Date.now();
  // L10: prune expired buckets on every check so long-lived processes
  // don't grow the map without bound (a spoofed-hop flood can't leak memory).
  if (buckets.size > 1) {
    for (const [bucketKey, bucket] of buckets) {
      if (now - bucket.windowStart >= WINDOW_MS) buckets.delete(bucketKey);
    }
  }
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { ok: true, retryAfterSec: 0 };
  }
  if (bucket.count >= max) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000));
    return { ok: false, retryAfterSec: Math.min(retryAfterSec, 900) };
  }
  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

// ---- S15 seams: verification codes + reset tokens -------------------------------

/** Exactly 6 digits, full zero-padded range (crypto random, not string floats). */
export function generateVerificationCode(): string {
  const bytes = randomBytes(4);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const value = view.getUint32(0) % 1_000_000;
  return value.toString().padStart(6, "0");
}

/** 48 lowercase hex characters (24 random bytes). */
export function generateResetToken(): string {
  return randomBytes(24).toString("hex");
}

/** Tolerate pasted formatting; reject non-digit garbage and wrong lengths. */
export function normalizeVerificationCode(
  input: string | null | undefined,
): string | null {
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/[\s.-]/g, "");
  return /^\d{6}$/.test(cleaned) ? cleaned : null;
}

// ---- misc -----------------------------------------------------------------------

/** Cryptographically fill a buffer (shared helper for one-shot seams). */
export function secureRandomBytes(size: number): Buffer {
  const buf = Buffer.alloc(size);
  randomFillSync(buf);
  return buf;
}

// ---- R1 security seams --------------------------------------------------------------

/**
 * H3: pick the limiter's client-IP material out of an x-forwarded-for
 * header at a DECLARED trusted depth. `hops` = how many trusted reverse
 * proxies sit in front of the app (AUTH_PROXY_HOPS, default 0 = one
 * hop appended by the closest trusted proxy). The client-controlled LEFT
 * hops are never selected: at depth 0 the rightmost entry wins (the one the
 * trusted proxy appended), at depth N the entry N-from-right wins. Anything
 * unparsable — absent, empty, garbage, or a declared depth beyond the actual
 * hop count — fails CLOSED to the shared "local" bucket (never the
 * attacker's pick).
 */
export function resolveClientIp(
  xff: string | null | undefined,
  hops = 0,
): string {
  const trimmedList = (xff ?? "").trim();
  if (trimmedList === "") return "local";
  const hopsList = trimmedList.split(",").map((hop) => hop.trim()).filter((hop) => hop !== "");
  if (hopsList.length === 0 || hops < 0 || hops >= hopsList.length) return "local";
  const selected = hopsList[hopsList.length - 1 - hops];
  // Fail closed on non-IP garbage (v4/v6 shapes only: digits, dots, colons,
  // hex letters). No IPv4 octet validation — the value is limiter key
  // material, not a routing target.
  if (!/^[0-9a-fA-F.:]+$/.test(selected) || !/\d/.test(selected)) return "local";
  return selected;
}

/**
 * C1: may the forgot-password response carry the reset link? In-app link
 * delivery is the self-hosted/no-SMTP convenience — fine for local dev and
 * the e2e suite, but a network-reachable PRODUCTION deploy answers with the
 * bare `{ ok: true }` (the operator recovers via the documented seed/CLI path
 * or opts in explicitly with RESET_INAPP_DELIVERY=1).
 */
export function inAppResetDeliveryEnabled(
  nodeEnv: string | undefined,
  flag: string | undefined,
): boolean {
  const normalized = (flag ?? "").trim().toLowerCase();
  if (normalized === "1" || normalized === "true") return true;
  return (nodeEnv ?? "") !== "production";
}

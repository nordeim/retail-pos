// ---------------------------------------------------------------------------
// POST /api/auth/verify-email — the OTP completion (S15/ADR-013). The code
// is normalized (pasted formatting tolerated), matched against the LATEST
// UNEXPIRED, UNEXHAUSTED token for the account, consumed, and — on success —
// the account is marked verified AND signed in (verify = the email proof).
//
// H2: the 6-digit OTP guards an account takeover, so it gets BOTH brakes:
//   · the shared IP limiter (login-bucket shape, 10/IP/15 min), and
//   · a per-token atomic attempt counter — a wrong code runs
//     `updateMany({ attempts: { lt: 6 } })`; the 6th strike spends the row
//     and the fetch below stops returning it (dead even if the right code
//     follows).
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { checkRateLimit, MAX_OTP_ATTEMPTS, normalizeVerificationCode } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp, publicUser, setSessionCookie } from "@/lib/server/auth";
import {
  errorResponse,
  parseWith,
  rateLimitedResponse,
  readJson,
  toErrorResponse,
} from "@/lib/server/http";

/** Relaxed on purpose: the code is normalized AFTER the parse (the strict
 *  6-digit regex lives in verifyEmailSchema, but pasted "123 456" must
 *  survive the boundary too). */
const verifyBodySchema = z.object({
  email: z.string().email(),
  code: z.string().min(1).max(32),
});

const INVALID_CODE = "That code is invalid or has expired.";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limit = checkRateLimit(`verify:${ip}`, 10);
    if (!limit.ok) {
      return rateLimitedResponse(
        limit.retryAfterSec,
        "Too many verification attempts. Try again shortly.",
      );
    }

    const { email, code } = parseWith(verifyBodySchema, await readJson(request));
    const normalized = normalizeVerificationCode(code);
    if (!normalized) {
      return errorResponse(400, "Enter the 6-digit code from your email.");
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, emailVerified: true },
    });
    if (!user) {
      // Uniform rejection — no account-state oracle.
      return errorResponse(400, INVALID_CODE);
    }

    const token = await db.verificationToken.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
        attempts: { lt: MAX_OTP_ATTEMPTS },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!token || token.code !== normalized) {
      // The atomic counter: only a row with budget left can spend a strike —
      // concurrent wrong codes cannot race past MAX_OTP_ATTEMPTS.
      if (token) {
        await db.verificationToken.updateMany({
          where: { id: token.id, attempts: { lt: MAX_OTP_ATTEMPTS } },
          data: { attempts: { increment: 1 } },
        });
      }
      return errorResponse(400, INVALID_CODE);
    }

    // The one-shot consumption + the verification mark in one transaction.
    const [verifiedUser] = await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
      db.verificationToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return setSessionCookie(
      NextResponse.json({ ok: true, user: publicUser(verifiedUser) }),
      user.id,
      { secure: request.nextUrl.protocol === "https:" },
    );
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}

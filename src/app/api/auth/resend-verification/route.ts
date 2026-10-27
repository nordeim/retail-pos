// ---------------------------------------------------------------------------
// POST /api/auth/resend-verification — re-issue the 6-digit code for an
// UNVERIFIED account (ADR-030: the API-only superset; pinned by
// tests/e2e/account-security.spec.ts — the signup verify stage ships no
// resend button; drive this over HTTP). Uniform 200 for every caller —
// the response shape's `code` presence is the only signal (no SMTP: the
// self-hosted delivery), and unknown/verified accounts never get one
// (no enumeration).
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { checkRateLimit, generateVerificationCode } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/server/auth";
import {
  parseWith,
  rateLimitedResponse,
  readJson,
  toErrorResponse,
} from "@/lib/server/http";

const CODE_TTL_MS = 15 * 60 * 1000;
const resendSchema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limit = checkRateLimit(`resend:${ip}`, 10);
    if (!limit.ok) {
      return rateLimitedResponse(
        limit.retryAfterSec,
        "Too many verification requests. Try again shortly.",
      );
    }

    const { email } = parseWith(resendSchema, await readJson(request));
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, emailVerified: true },
    });

    if (user && !user.emailVerified) {
      const code = generateVerificationCode();
      await db.verificationToken.create({
        data: {
          userId: user.id,
          code,
          expiresAt: new Date(Date.now() + CODE_TTL_MS),
        },
      });
      return NextResponse.json({ ok: true, code });
    }

    // Uniform 200 — unknown or already-verified callers learn nothing.
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}

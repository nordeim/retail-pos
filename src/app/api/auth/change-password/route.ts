// ---------------------------------------------------------------------------
// POST /api/auth/change-password — the account-security rotation
// (ADR-030: the API-only superset the hosted reference lacks; pinned by
// tests/e2e/account-security.spec.ts). Rate-limited 10/15-min per user.
// The current password is verified against the stored scrypt hash FIRST
// (a wrong current → 400 "Your current password is incorrect.",
// PRE-WRITE). The session SURVIVES the rotation by design — the cookie is
// an HMAC over AUTH_SECRET, not the password (revoking other sessions is
// the rejected alternative).
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { checkRateLimit, hashPassword, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validation";
import { requireUser } from "@/lib/server/auth";
import {
  errorResponse,
  parseWith,
  rateLimitedResponse,
  readJson,
  toErrorResponse,
} from "@/lib/server/http";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const limit = checkRateLimit(`changePw:${user.id}`, 10);
    if (!limit.ok) {
      return rateLimitedResponse(limit.retryAfterSec, "Too many attempts. Try again shortly.");
    }

    const { currentPassword, newPassword } = parseWith(
      changePasswordSchema,
      await readJson(request),
    );

    const stored = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!stored || !verifyPassword(currentPassword, stored.passwordHash)) {
      return errorResponse(400, "Your current password is incorrect.");
    }

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(newPassword) },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/delete-account — the ownership exit (ADR-030: the
// API-only superset; pinned by tests/e2e/account-security.spec.ts).
// Rate-limited 10/15-min per user. The password is verified FIRST (a
// wrong password → 400, PRE-WRITE), then the ONE cascade write:
// db.user.delete wipes every owned collection (products, categories,
// registers, cashiers, shifts, sales, settings — every user relation
// carries onDelete: Cascade). The session cookie is cleared with the
// account (maxAge 0 — the logout mechanism). No UI surface ships; back
// up the SQLite file first (docs/DEPLOYMENT.md §10).
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { checkRateLimit, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteAccountSchema } from "@/lib/validation";
import { clearSessionCookie, requireUser } from "@/lib/server/auth";
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
    const limit = checkRateLimit(`delAcc:${user.id}`, 10);
    if (!limit.ok) {
      return rateLimitedResponse(limit.retryAfterSec, "Too many attempts. Try again shortly.");
    }

    const { password } = parseWith(deleteAccountSchema, await readJson(request));

    const stored = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!stored || !verifyPassword(password, stored.passwordHash)) {
      return errorResponse(400, "Your password is incorrect.");
    }

    // The ONE cascade write — products, categories, registers, cashiers,
    // shifts, sales, settings, tokens: every user relation carries Cascade.
    await db.user.delete({ where: { id: user.id } });

    return clearSessionCookie(NextResponse.json({ ok: true }));
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}

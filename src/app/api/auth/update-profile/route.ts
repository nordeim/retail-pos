// ---------------------------------------------------------------------------
// POST /api/auth/update-profile — the profile name edit (V23/ADR-032: the
// account-surface family's last read-only field gains its route). Body
// { fullName }. Pinned by tests/account-ui.test.ts + the change-name
// journey in tests/e2e/account-ui.spec.ts.
//
// NO password proof on this route (SD-94, the deliberate family split):
// change-password / change-email / delete-account verify the password
// because they rotate credentials or destroy the account — fullName is a
// benign display field with zero auth-bearing semantics, so the posture
// that matches is the store SETTINGS PATCH (session-gated, no password,
// rate-limited). The session cookie IS the proof of identity here; the
// stateless session survives untouched and the response carries the new
// publicUser (the change-email envelope shape).
//
// Route-side guards: must-differ (posting the current name → 400 — server
// state, not a body field) and the schema's trim/min/max (Zod, strip mode).
// Rate-limited 10/15-min per user (the account-family posture).
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { checkRateLimit } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProfileSchema } from "@/lib/validation";
import { publicUser, requireUser } from "@/lib/server/auth";
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
    const limit = checkRateLimit(`updateProfile:${user.id}`, 10);
    if (!limit.ok) {
      return rateLimitedResponse(limit.retryAfterSec, "Too many attempts. Try again shortly.");
    }

    const { fullName } = parseWith(updateProfileSchema, await readJson(request));

    // The current name is server state, not a body field — must-differ.
    // (requireUser's SessionUser already carries fullName — no extra read.)
    if (fullName === user.fullName) {
      return errorResponse(400, "This is already your name.");
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: { fullName },
    });

    return NextResponse.json({ ok: true, name: fullName, user: publicUser(updated) });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}

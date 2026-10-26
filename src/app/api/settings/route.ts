// ---------------------------------------------------------------------------
// /api/settings — the store settings singleton. GET auto-creates the default
// row on first read (the reference's Ajustes page renders defaults); PATCH
// validates through the Zod schema. The colors ride the response and the
// shell applies them to the CSS vars (Personalización is live).
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { parseWith, readJson, withUser } from "@/lib/server/http";
import { settingsSchema } from "@/lib/validation";

export const GET = withUser(async (user) => {
  const row = await db.storeSetting.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  return NextResponse.json(row);
});

export const PATCH = withUser(async (user, request: NextRequest) => {
  const body = await readJson(request);
  const input = parseWith(settingsSchema, body);
  const row = await db.storeSetting.upsert({
    where: { userId: user.id },
    create: { ...input, userId: user.id },
    update: input,
  });
  return NextResponse.json(row);
});

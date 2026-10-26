// ---------------------------------------------------------------------------
// /api/sales/[id] — one sale with its items (the ticket-detail dialog).
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { NotFoundError, withUserParams } from "@/lib/server/http";

export const GET = withUserParams(async (user, _request, id) => {
  const row = await db.sale.findFirst({
    where: { id, userId: user.id },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!row) throw new NotFoundError();
  return NextResponse.json({ ...row, createdAt: row.createdAt.toISOString() });
});

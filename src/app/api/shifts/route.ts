// ---------------------------------------------------------------------------
// /api/shifts — the turnos. GET lists every shift newest-first with its
// aggregates (register/cashier names snapshot-joined; the per-shift sales
// total + count come from ONE groupBy pass — M5 — never per-shift row
// loads). POST opens one: the register must exist, must not already have
// an open shift (re-checked INSIDE the transaction → 409, L4), and the
// cashier must exist. Opening flips the register's status to "open".
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import {
  ConflictError,
  NotFoundError,
  parseWith,
  readJson,
  toErrorResponse,
  withUser,
} from "@/lib/server/http";
import { shiftOpenSchema } from "@/lib/validation";

export const DUPLICATE_SHIFT = "Esa caja ya tiene un turno abierto.";

async function listShifts(userId: string) {
  const [rows, aggregates] = await Promise.all([
    db.shift.findMany({
      where: { userId },
      orderBy: { openedAt: "desc" },
      include: {
        register: { select: { name: true } },
        cashier: { select: { name: true } },
      },
    }),
    // M5: one aggregated pass over the sales table — every shift's total
    // and count without loading a single sale row.
    db.sale.groupBy({
      by: ["shiftId"],
      where: { userId, shiftId: { not: null } },
      _sum: { total: true },
      _count: true,
    }),
  ]);
  const byShift = new Map(
    aggregates.map((row) => [
      row.shiftId,
      { total: row._sum.total ?? 0, count: row._count },
    ]),
  );
  return rows.map((row) => {
    const aggregate = byShift.get(row.id) ?? { total: 0, count: 0 };
    return {
      id: row.id,
      registerId: row.registerId,
      registerName: row.register.name,
      cashierId: row.cashierId,
      cashierName: row.cashier.name,
      openingFloat: row.openingFloat,
      closingAmount: row.closingAmount,
      openedAt: row.openedAt.toISOString(),
      closedAt: row.closedAt?.toISOString() ?? null,
      status: row.status,
      salesTotal: aggregate.total,
      salesCount: aggregate.count,
    };
  });
}

export const GET = withUser(async (user) =>
  NextResponse.json(await listShifts(user.id)),
);

export const POST = withUser(async (user, request: NextRequest) => {
  try {
    const body = await readJson(request);
    const input = parseWith(shiftOpenSchema, body);

    const register = await db.register.findFirst({
      where: { id: input.registerId, userId: user.id },
    });
    if (!register) throw new NotFoundError("La caja no existe.");

    const cashier = await db.cashier.findFirst({
      where: { id: input.cashierId, userId: user.id },
    });
    if (!cashier) throw new NotFoundError("El cajero no existe.");

    const alreadyOpen = await db.shift.findFirst({
      where: { registerId: register.id, status: "open" },
    });
    if (alreadyOpen) throw new ConflictError(DUPLICATE_SHIFT);

    // L4: the duplicate-open rule is re-checked INSIDE the transaction via
    // the dedicated ConflictError (→ 409) — the pre-transaction check is
    // only the fast path; the write lock makes the in-tx one authoritative.
    const [shift] = await db.$transaction(async (tx) => {
      const raced = await tx.shift.findFirst({
        where: { registerId: register.id, status: "open" },
      });
      if (raced) throw new ConflictError(DUPLICATE_SHIFT);
      const created = await tx.shift.create({
        data: {
          userId: user.id,
          registerId: register.id,
          cashierId: cashier.id,
          openingFloat: input.openingFloat,
          status: "open",
        },
      });
      await tx.register.update({
        where: { id: register.id },
        data: { status: "open" },
      });
      return [created];
    });

    return NextResponse.json(
      {
        id: shift.id,
        registerId: shift.registerId,
        registerName: register.name,
        cashierId: shift.cashierId,
        cashierName: cashier.name,
        openingFloat: shift.openingFloat,
        closingAmount: null,
        openedAt: shift.openedAt.toISOString(),
        closedAt: null,
        status: shift.status,
        salesTotal: 0,
        salesCount: 0,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
});

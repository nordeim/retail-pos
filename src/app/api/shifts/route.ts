// ---------------------------------------------------------------------------
// /api/shifts — the turnos. GET lists every shift newest-first with its
// aggregates (register/cashier names snapshot-joined, sales total + count).
// POST opens one: the register must exist, must not already have an open
// shift (409), and the cashier must exist. Opening flips the register's
// status to "open".
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import {
  NotFoundError,
  parseWith,
  readJson,
  toErrorResponse,
  ValidationError,
  withUser,
} from "@/lib/server/http";
import { shiftOpenSchema } from "@/lib/validation";

export const DUPLICATE_SHIFT = "Esa caja ya tiene un turno abierto.";

async function listShifts(userId: string) {
  const rows = await db.shift.findMany({
    where: { userId },
    orderBy: { openedAt: "desc" },
    include: {
      register: { select: { name: true } },
      cashier: { select: { name: true } },
      sales: { select: { total: true } },
    },
  });
  return rows.map((row) => ({
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
    salesTotal: row.sales.reduce((sum, sale) => sum + sale.total, 0),
    salesCount: row.sales.length,
  }));
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
    if (alreadyOpen) throw new ValidationError(DUPLICATE_SHIFT);

    const [shift] = await db.$transaction([
      db.shift.create({
        data: {
          userId: user.id,
          registerId: register.id,
          cashierId: cashier.id,
          openingFloat: input.openingFloat,
          status: "open",
        },
      }),
      db.register.update({
        where: { id: register.id },
        data: { status: "open" },
      }),
    ]);

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

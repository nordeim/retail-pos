// ---------------------------------------------------------------------------
// /api/shifts/[id]/close — closes a turno: stamps closingAmount + closedAt,
// flips status, and returns the register to "closed" (the 409-on-duplicate
// open rule means a register has at most one open shift, so closing it
// always closes the register too).
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  NotFoundError,
  parseWith,
  readJson,
  toErrorResponse,
  ValidationError,
  withUserParams,
} from "@/lib/server/http";
import { shiftCloseSchema } from "@/lib/validation";

export const POST = withUserParams(async (user, request, id) => {
  try {
    const shift = await db.shift.findFirst({ where: { id, userId: user.id } });
    if (!shift) throw new NotFoundError("El turno no existe.");
    if (shift.status === "closed") {
      throw new ValidationError("Ese turno ya está cerrado.");
    }

    const body = await readJson(request);
    const input = parseWith(shiftCloseSchema, body);

    const [updated] = await db.$transaction([
      db.shift.update({
        where: { id: shift.id },
        data: {
          status: "closed",
          closedAt: new Date(),
          closingAmount: input.closingAmount,
        },
      }),
      db.register.update({
        where: { id: shift.registerId },
        data: { status: "closed" },
      }),
    ]);

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      closingAmount: updated.closingAmount,
      closedAt: updated.closedAt?.toISOString() ?? null,
    });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
});

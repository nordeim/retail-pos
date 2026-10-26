// ---------------------------------------------------------------------------
// /api/sales — GET lists the sale history (items included — the detail
// dialog reads straight from this list). POST creates a sale:
//   · an OPEN shift on the requested register is required (the reference
//     gates the Terminal on "No hay turno activo");
//   · prices/IVA come from the DB rows, never the client;
//   · stock decrements in the same transaction; insufficient stock → 422;
//   · ticket numbers are generated server-side (V-XXXXXXXX).
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { lineTotalCents, ticketTotals } from "@/lib/money";
import { ticketNumber } from "@/lib/ticket";
import {
  NotFoundError,
  parseWith,
  readJson,
  toErrorResponse,
  ValidationError,
  withUser,
} from "@/lib/server/http";
import { saleCreateSchema } from "@/lib/validation";

export const NO_ACTIVE_SHIFT =
  "No hay turno activo. Ve a Cajas para abrir un turno antes de realizar ventas.";

export const INSUFFICIENT_STOCK = "Stock insuficiente para completar la venta.";

function uniqueTicket(): string {
  return ticketNumber();
}

export const GET = withUser(async (user) => {
  const rows = await db.sale.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { id: "asc" } } },
  });
  return NextResponse.json(
    rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      items: row.items,
    })),
  );
});

export const POST = withUser(async (user, request: NextRequest) => {
  try {
    const body = await readJson(request);
    const input = parseWith(saleCreateSchema, body);

    const register = await db.register.findFirst({
      where: { id: input.registerId, userId: user.id },
    });
    if (!register) throw new NotFoundError("La caja no existe.");

    const shift = await db.shift.findFirst({
      where: { registerId: register.id, status: "open" },
      include: { cashier: { select: { name: true } } },
    });
    if (!shift) throw new ValidationError(NO_ACTIVE_SHIFT);

    // Load every requested product in ONE query; a missing/foreign id fails
    // the whole sale (the ticket is atomic).
    const ids = [...new Set(input.items.map((item) => item.productId))];
    const products = await db.product.findMany({
      where: { id: { in: ids }, userId: user.id },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    for (const item of input.items) {
      if (!byId.has(item.productId)) {
        throw new NotFoundError("Un producto del ticket ya no existe.");
      }
    }

    // Stock + totals come from the DB rows.
    const lines = input.items.map((item) => {
      const product = byId.get(item.productId)!;
      if (product.stock < item.qty) throw new ValidationError(INSUFFICIENT_STOCK);
      return {
        product,
        qty: item.qty,
        lineTotal: lineTotalCents(product.price, item.qty, product.ivaRate),
      };
    });
    const totals = ticketTotals(
      lines.map((l) => ({
        unitPrice: l.product.price,
        qty: l.qty,
        ivaRate: l.product.ivaRate,
      })),
    );

    const created = await db.$transaction(async (tx) => {
      let saleId = "";
      // Ticket collisions are astronomically unlikely (36^8); two retries
      // still bound the loop honestly.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const sale = await tx.sale.create({
            data: {
              userId: user.id,
              ticketNo: uniqueTicket(),
              method: input.method,
              status: "completada",
              subtotal: totals.subtotal,
              tax: totals.tax,
              total: totals.total,
              clientName: input.clientName,
              cashierName: shift.cashier.name,
              registerName: register.name,
              registerId: register.id,
              shiftId: shift.id,
              items: {
                create: lines.map((line) => ({
                  productId: line.product.id,
                  name: line.product.name,
                  qty: line.qty,
                  unitPrice: line.product.price,
                  ivaRate: line.product.ivaRate,
                  lineTotal: line.lineTotal,
                })),
              },
            },
            include: { items: true },
          });
          saleId = sale.id;
          break;
        } catch (err: unknown) {
          const code =
            typeof err === "object" && err !== null && "code" in err
              ? String((err as { code: unknown }).code)
              : "";
          if (code === "P2002" && attempt < 2) continue;
          throw err;
        }
      }
      for (const line of lines) {
        await tx.product.update({
          where: { id: line.product.id },
          data: { stock: { decrement: line.qty } },
        });
      }
      return tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true },
      });
    });

    if (!created) throw new Error("The sale was not persisted.");
    return NextResponse.json(
      { ...created, createdAt: created.createdAt.toISOString() },
      { status: 201 },
    );
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
});

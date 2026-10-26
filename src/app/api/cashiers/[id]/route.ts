// ---------------------------------------------------------------------------
// /api/cashiers/[id] — PATCH / DELETE a cashier. Deletion is blocked while
// an open shift references them (409 — close the turno first).
// ---------------------------------------------------------------------------

import { db } from "@/lib/db";
import { cashierDelegate } from "@/lib/server/entities";
import { makeItemRoutes, ValidationError } from "@/lib/server/http";

const OPEN_SHIFT_GUARD = "Cierra el turno abierto antes de eliminar al cajero.";

const routes = makeItemRoutes({
  ...cashierDelegate,
  remove: async (userId, id) => {
    const owned = await db.cashier.findFirst({ where: { id, userId } });
    if (owned) {
      const open = await db.shift.findFirst({
        where: { cashierId: id, status: "open" },
      });
      if (open) throw new ValidationError(OPEN_SHIFT_GUARD);
    }
    return cashierDelegate.remove(userId, id);
  },
});

export const { PATCH, DELETE } = routes;

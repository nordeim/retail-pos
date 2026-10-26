// ---------------------------------------------------------------------------
// /api/registers/[id] — PATCH / DELETE a register. Deletion is blocked while
// an open shift references it (a caja cannot vanish mid-turno).
// ---------------------------------------------------------------------------

import { db } from "@/lib/db";
import { registerDelegate } from "@/lib/server/entities";
import { makeItemRoutes, ValidationError } from "@/lib/server/http";

const OPEN_SHIFT_GUARD = "Cierra el turno abierto antes de eliminar la caja.";

const routes = makeItemRoutes({
  ...registerDelegate,
  remove: async (userId, id) => {
    // Ownership + 404 stay the delegate's job; this layer only adds the
    // open-shift guard, keyed off the same ownership-scoped existence.
    const owned = await db.register.findFirst({ where: { id, userId } });
    if (owned) {
      const open = await db.shift.findFirst({
        where: { registerId: id, status: "open" },
      });
      if (open) throw new ValidationError(OPEN_SHIFT_GUARD);
    }
    return registerDelegate.remove(userId, id);
  },
});

export const { PATCH, DELETE } = routes;

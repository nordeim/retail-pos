// ---------------------------------------------------------------------------
// /api/registers — Cajas. A register's row carries its derived status;
// DELETE is refused while a shift is open on it (409).
// ---------------------------------------------------------------------------

import { registerDelegate } from "@/lib/server/entities";
import { makeCollectionRoutes } from "@/lib/server/http";

export const { GET, POST } = makeCollectionRoutes(registerDelegate);

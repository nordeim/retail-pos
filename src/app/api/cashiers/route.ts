// ---------------------------------------------------------------------------
// /api/cashiers — Cajeros. The reference ships this page without any way to
// create a cashier (its open-shift dropdown is permanently empty); the clone
// fills that gap: full CRUD here.
// ---------------------------------------------------------------------------

import { cashierDelegate } from "@/lib/server/entities";
import { makeCollectionRoutes } from "@/lib/server/http";

export const { GET, POST } = makeCollectionRoutes(cashierDelegate);

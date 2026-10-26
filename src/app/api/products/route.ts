// ---------------------------------------------------------------------------
// /api/products — the inventory. GET also embeds categoryName (the table's
// CATEGORÍA cell renders it directly).
// ---------------------------------------------------------------------------

import { productDelegate } from "@/lib/server/entities";
import { makeCollectionRoutes } from "@/lib/server/http";

export const { GET, POST } = makeCollectionRoutes(productDelegate);

// ---------------------------------------------------------------------------
// /api/categories — the store's product categories.
// ---------------------------------------------------------------------------

import { categoryDelegate } from "@/lib/server/entities";
import { makeCollectionRoutes } from "@/lib/server/http";

export const { GET, POST } = makeCollectionRoutes(categoryDelegate);

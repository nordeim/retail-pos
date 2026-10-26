// ---------------------------------------------------------------------------
// /api/products/[id] — PATCH / DELETE a single product.
// ---------------------------------------------------------------------------

import { productDelegate } from "@/lib/server/entities";
import { makeItemRoutes } from "@/lib/server/http";

export const { PATCH, DELETE } = makeItemRoutes(productDelegate);

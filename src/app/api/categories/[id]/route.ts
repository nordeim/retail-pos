// ---------------------------------------------------------------------------
// /api/categories/[id] — PATCH / DELETE. Products keep their rows when a
// category goes (categoryId is SetNull).
// ---------------------------------------------------------------------------

import { categoryDelegate } from "@/lib/server/entities";
import { makeItemRoutes } from "@/lib/server/http";

export const { PATCH, DELETE } = makeItemRoutes(categoryDelegate);

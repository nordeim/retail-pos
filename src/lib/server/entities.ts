// ---------------------------------------------------------------------------
// The entity delegates (ADR-006): one configuration object per owned model,
// consumed by the makeCollectionRoutes/makeItemRoutes factories. Every query
// is scoped where:{userId} — ownership by construction; updates/removes
// verify ownership BEFORE mutating. Every payload passes its Zod schema
// first.
//
// Delegates that need more than CRUD (product→category naming, shift close,
// sale creation with stock decrement) live with their routes, not here —
// this file only hosts the plain-config delegates.
// ---------------------------------------------------------------------------

import type { ZodType } from "zod";

import { db } from "../db";
import {
  cashierCreateSchema,
  cashierUpdateSchema,
  categorySchema,
  productCreateSchema,
  productUpdateSchema,
  registerCreateSchema,
  registerUpdateSchema,
} from "../validation";
import { NotFoundError, type EntityDelegate } from "./http";

// ---- the minimal structural Prisma model --------------------------------------

type OrderByClause = Record<string, "asc" | "desc">;

type OwnedModel = {
  findMany(args: {
    where: { userId: string };
    orderBy?: OrderByClause[];
  }): Promise<unknown[]>;
  findFirst(args: { where: Record<string, unknown> }): Promise<unknown>;
  findFirstOrThrow?(args: { where: Record<string, unknown> }): Promise<unknown>;
  create(args: { data: unknown }): Promise<unknown>;
  update(args: { where: { id: string }; data: unknown }): Promise<unknown>;
  delete(args: { where: { id: string } }): Promise<unknown>;
};

type Row = Record<string, unknown>;

// ---- the owned-delegate factory -------------------------------------------------

type OwnedConfig = {
  model: OwnedModel;
  createSchema: ZodType<Row>;
  updateSchema: ZodType<Row>;
  orderBy?: "asc" | "desc";
  // V16/F2: a delegate may override the list ordering (the category's
  // entities surfaces order by sortOrder — the reference's measured chip
  // sequence — while the default stays the v10 createdAt+id rule).
  listOrderBy?: OrderByClause[];
  // V16/F2: a delegate may enrich the create payload server-side (the
  // category's sortOrder = max+1 so user-created rows append).
  prepareCreate?: (userId: string, parsed: Row) => Promise<Row>;
};

export const sentKeysPatch = (input: unknown, parsed: Row): Row => {
  const source = (input ?? {}) as Row;
  const writes: Row = {};
  for (const key of Object.keys(source)) {
    if (source[key] === undefined) continue;
    if (!(key in parsed)) continue;
    writes[key] = parsed[key];
  }
  return writes;
};

function makeOwnedDelegate(config: OwnedConfig): EntityDelegate {
  async function owned(userId: string, id: string): Promise<Row> {
    const row = (await config.model.findFirst({
      where: { id, userId },
    })) as Row | null;
    if (!row) throw new NotFoundError();
    return row;
  }
  return {
    list: (userId) =>
      config.model.findMany({
        where: { userId },
        // V10/F1h: createdAt ties (rows seeded in one tight loop) made
        // SQLite's order arbitrary — the id tiebreaker keeps every list
        // deterministic (the visible orders are pinned against the
        // reference's own pages). V16/F2: listOrderBy overrides the whole
        // array when a delegate needs its own rule.
        orderBy:
          config.listOrderBy ?? [
            { createdAt: config.orderBy ?? "asc" },
            { id: "asc" },
          ],
      }),
    create: async (userId, input) => {
      const parsed = config.createSchema.parse(input) as Row;
      const data = config.prepareCreate
        ? await config.prepareCreate(userId, parsed)
        : parsed;
      return config.model.create({ data: { ...data, userId } });
    },
    update: async (userId, id, input) => {
      await owned(userId, id);
      const parsed = config.updateSchema.parse(input) as Row;
      const writes = sentKeysPatch(input, parsed);
      return config.model.update({ where: { id }, data: writes });
    },
    remove: async (userId, id) => {
      await owned(userId, id);
      return config.model.delete({ where: { id } });
    },
  };
}

// ---- the POS delegates ----------------------------------------------------------

export const categoryDelegate = makeOwnedDelegate({
  model: db.category as unknown as OwnedModel,
  createSchema: categorySchema,
  updateSchema: categorySchema,
  orderBy: "asc",
  // V16/F2: the ENTITIES display order (Inventario chips + Ajustes list)
  // is the reference's measured chip sequence — sortOrder first, the v10
  // createdAt+id rule breaking ties (rows that predate the column carry 0).
  listOrderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  // V16/F2: user-created categories append (sortOrder = max+1); the
  // column is never client-writable (absent from categorySchema).
  prepareCreate: async (userId, parsed) => {
    const rows = (await db.category.findMany({
      where: { userId },
      select: { sortOrder: true },
    })) as Array<{ sortOrder: number }>;
    const max = rows.reduce((m, r) => Math.max(m, r.sortOrder), 0);
    return { ...parsed, sortOrder: max + 1 };
  },
});

export const registerDelegate = makeOwnedDelegate({
  model: db.register as unknown as OwnedModel,
  createSchema: registerCreateSchema,
  updateSchema: registerUpdateSchema,
  orderBy: "asc",
});

export const cashierDelegate = makeOwnedDelegate({
  model: db.cashier as unknown as OwnedModel,
  createSchema: cashierCreateSchema,
  updateSchema: cashierUpdateSchema,
  orderBy: "asc",
});

// The product list carries its category name (the table's CATEGORÍA cell).
type ProductRow = {
  id: string;
  userId: string;
  name: string;
  barcode: string;
  categoryId: string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  ivaRate: number;
  unit: string;
  imageUrl: string | null;
  active: boolean;
  category: { name: string } | null;
};

function productToBoundary(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    barcode: row.barcode,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    price: row.price,
    cost: row.cost,
    stock: row.stock,
    minStock: row.minStock,
    ivaRate: row.ivaRate,
    unit: row.unit,
    imageUrl: row.imageUrl,
    active: row.active,
  };
}

export const productDelegate = {
  list: async (userId: string) => {
    const rows = (await db.product.findMany({
      where: { userId },
      // V10/F1h: the id tiebreaker keeps the inventory order deterministic
      // against createdAt ties (the reference's page order is the seed's
      // insertion order — pinned by the v10 e2e).
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: { category: { select: { name: true } } },
    })) as unknown as ProductRow[];
    return rows.map(productToBoundary);
  },
  create: async (userId: string, input: unknown) => {
    const parsed = productCreateSchema.parse(input) as Row;
    const created = (await db.product.create({
      data: { ...parsed, userId } as never,
      include: { category: { select: { name: true } } },
    })) as unknown as ProductRow;
    return productToBoundary(created);
  },
  update: async (userId: string, id: string, input: unknown) => {
    const existing = (await db.product.findFirst({
      where: { id, userId },
    })) as ProductRow | null;
    if (!existing) throw new NotFoundError();
    const parsed = productUpdateSchema.parse(input) as Row;
    const writes = sentKeysPatch(input, parsed);
    const updated = (await db.product.update({
      where: { id },
      data: writes as never,
      include: { category: { select: { name: true } } },
    })) as unknown as ProductRow;
    return productToBoundary(updated);
  },
  remove: async (userId: string, id: string) => {
    const existing = await db.product.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundError();
    return db.product.delete({ where: { id } });
  },
} satisfies EntityDelegate;

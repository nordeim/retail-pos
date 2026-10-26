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

type OwnedModel = {
  findMany(args: {
    where: { userId: string };
    orderBy?: { createdAt: "asc" | "desc" };
  }): Promise<unknown[]>;
  findFirst(args: { where: Record<string, unknown> }): Promise<unknown>;
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
        orderBy: config.orderBy
          ? { createdAt: config.orderBy }
          : { createdAt: "asc" },
      }),
    create: async (userId, input) => {
      const parsed = config.createSchema.parse(input) as Row;
      return config.model.create({ data: { ...parsed, userId } });
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
      orderBy: { createdAt: "asc" },
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

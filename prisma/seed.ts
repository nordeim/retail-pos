// ---------------------------------------------------------------------------
// VeloxPOS seed — the reference-verified dataset (docs/reference-investigation.md):
// the 6 categories, the 12 products (11 rows read live + the count-pinned
// 12th), 2 registers, the 2 completed sales + their closed Cesar Martínez
// shifts. The owner account comes from the environment (SEED_OWNER_EMAIL /
// SEED_OWNER_PASSWORD) — credentials never live in source.
//
//   DATABASE_URL="file:../db/custom.db" bun prisma/seed.ts
// ---------------------------------------------------------------------------

import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/auth";
import { lineTotalCents, ticketTotals } from "../src/lib/money";
import { resolveProcessDatabaseUrl } from "../src/lib/db-path";

process.env.DATABASE_URL = resolveProcessDatabaseUrl();

const db = new PrismaClient();

// The seed identity mirrors the reference account the operator provisions
// (docs/reference-investigation.md §2). bun's dotenv expands `$` in .env
// values, so the password default lives HERE; the env vars override it.
// NOTE: demo-seed credentials only — never a production secret.
const OWNER_EMAIL = (process.env.SEED_OWNER_EMAIL || "owner@veloxpos.local").toLowerCase();
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD || "$Abcd1234";
const OWNER_NAME = process.env.SEED_OWNER_NAME || "Cesar Martínez";

function daysAgo(n: number, hour = 12, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const owner = await db.user.upsert({
    where: { email: OWNER_EMAIL },
    create: {
      email: OWNER_EMAIL,
      passwordHash: hashPassword(OWNER_PASSWORD),
      fullName: OWNER_NAME,
      emailVerified: true,
    },
    update: { emailVerified: true },
  });

  await db.storeSetting.upsert({
    where: { userId: owner.id },
    create: {
      userId: owner.id,
      name: "Mi Tienda",
      address: "",
      phone: "",
      email: "",
      fiscalId: "",
      currency: "MXN - Peso Mexicano",
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
      ticketFooter: "¡Gracias por su compra!",
      cardProvider: "Ninguno",
    },
    update: {},
  });

  const categoryNames = ["Lácteos", "Limpieza", "Higiene Personal", "Alimentos", "Snacks", "Bebidas"];
  const categories = new Map<string, { id: string }>();
  for (const name of categoryNames) {
    const row = await db.category.upsert({
      where: { userId_name: { userId: owner.id, name } },
      create: { userId: owner.id, name },
      update: {},
    });
    categories.set(name, row);
  }

  // (name, barcode, price pesos, stock, category, iva%)
  const products: [string, string, number, number, string, number][] = [
    ["Yogurt Danone Natural 900g", "7501005102148", 38.5, 10, "Lácteos", 16],
    ["Frijoles La Costeña 560g", "7501017006113", 22.5, 30, "Alimentos", 16],
    ["Leche Lala Entera 1L", "7501055301114", 26.5, 24, "Lácteos", 16],
    ["Shampoo Pantene 400ml", "7501001165599", 89.0, 12, "Higiene Personal", 16],
    ["Cloro Cloralex 1L", "7501025400117", 24.0, 22, "Limpieza", 16],
    ["Papel Higiénico Pétalo 4 rollos", "7501019600012", 35.0, 17, "Higiene Personal", 16],
    ["Sabritas Original 45g", "7501011115019", 16.0, 35, "Snacks", 16],
    ["Agua Bonafont 1L", "7501013100018", 12.0, 60, "Bebidas", 16],
    ["Coca-Cola 600ml", "7501055300120", 18.5, 47, "Bebidas", 16],
    ["Atún Dolores 295g", "7501024520148", 32.0, 3, "Alimentos", 16],
    ["Pan Bimbo Blanco", "7441029500103", 52.0, 15, "Alimentos", 16],
    // The 12th row: below the fold on the reference — count-pinned (12),
    // values Assumed (dossier §8).
    ["Jabón Zote Barra 400g", "7501234567890", 18.0, 20, "Limpieza", 16],
  ];

  const productRows = new Map<string, { id: string; name: string; price: number; ivaRate: number }>();
  for (const [name, barcode, price, stock, category, ivaRate] of products) {
    const row = await db.product.upsert({
      where: { userId_name: { userId: owner.id, name } },
      create: {
        userId: owner.id,
        name,
        barcode,
        categoryId: categories.get(category)!.id,
        price: Math.round(price * 100),
        cost: Math.round(price * 100 * 0.75),
        stock,
        minStock: 5,
        ivaRate,
        unit: "Pieza",
        active: true,
      },
      update: {},
    });
    productRows.set(name, { id: row.id, name: row.name, price: row.price, ivaRate: row.ivaRate });
  }

  const existingRegisters = await db.register.findMany({ where: { userId: owner.id } });
  const registers = new Map<string, string>();
  if (existingRegisters.length === 0) {
    const caja1 = await db.register.create({
      data: { userId: owner.id, name: "Caja 1", location: "Entrada principal", status: "closed" },
    });
    const caja2 = await db.register.create({
      data: { userId: owner.id, name: "Caja 2", location: "Área de abarrotes", status: "closed" },
    });
    registers.set("Caja 1", caja1.id);
    registers.set("Caja 2", caja2.id);
  } else {
    for (const row of existingRegisters) registers.set(row.name, row.id);
  }

  const cashierCount = await db.cashier.count({ where: { userId: owner.id } });
  if (cashierCount === 0) {
    await db.cashier.create({
      data: { userId: owner.id, name: OWNER_NAME, email: OWNER_EMAIL, active: true },
    });
  }

  const existingSales = await db.sale.count({ where: { userId: owner.id } });
  if (existingSales === 0 && registers.has("Caja 1")) {
    const cashier = await db.cashier.findFirst({ where: { userId: owner.id } });
    if (cashier) {
      // The two verified historical sales + their closed shifts.
      const salesSpec = [
        {
          ticketNo: "V-MO6BJT7G",
          openedAt: daysAgo(7, 1, 39),
          closedAt: daysAgo(1, 22, 16),
          saleAt: daysAgo(1, 22, 9),
          items: [{ name: "Coca-Cola 600ml", qty: 1 }],
        },
        {
          ticketNo: "V-MMPNY55Z",
          openedAt: daysAgo(45, 1, 36),
          closedAt: daysAgo(42, 3, 30),
          saleAt: daysAgo(43, 1, 45),
          items: [
            { name: "Coca-Cola 600ml", qty: 2 },
            { name: "Sabritas Original 45g", qty: 1 },
          ],
        },
      ];

      for (const spec of salesSpec) {
        const shift = await db.shift.create({
          data: {
            userId: owner.id,
            registerId: registers.get("Caja 1")!,
            cashierId: cashier.id,
            openingFloat: 50000,
            openedAt: spec.openedAt,
            closedAt: spec.closedAt,
            status: "closed",
            closingAmount: 50000,
          },
        });

        const lines = spec.items.map((item) => {
          const product = productRows.get(item.name)!;
          return {
            product,
            qty: item.qty,
            lineTotal: lineTotalCents(product.price, item.qty, product.ivaRate),
          };
        });
        const totals = ticketTotals(
          lines.map((l) => ({ unitPrice: l.product.price, qty: l.qty, ivaRate: l.product.ivaRate })),
        );

        await db.sale.create({
          data: {
            userId: owner.id,
            ticketNo: spec.ticketNo,
            method: "efectivo",
            status: "completada",
            subtotal: totals.subtotal,
            tax: totals.tax,
            total: totals.total,
            cashierName: cashier.name,
            registerName: "Caja 1",
            registerId: registers.get("Caja 1")!,
            shiftId: shift.id,
            createdAt: spec.saleAt,
            items: {
              create: lines.map((line) => ({
                productId: line.product.id,
                name: line.product.name,
                qty: line.qty,
                unitPrice: line.product.price,
                ivaRate: line.product.ivaRate,
                lineTotal: line.lineTotal,
              })),
            },
          },
        });
      }
    }
  }

  const counts = {
    products: await db.product.count({ where: { userId: owner.id } }),
    categories: await db.category.count({ where: { userId: owner.id } }),
    registers: await db.register.count({ where: { userId: owner.id } }),
    sales: await db.sale.count({ where: { userId: owner.id } }),
    shifts: await db.shift.count({ where: { userId: owner.id } }),
  };
  console.log(
    `[seed] VeloxPOS ready for ${OWNER_EMAIL}: ${JSON.stringify(counts)}`,
  );
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => void db.$disconnect());

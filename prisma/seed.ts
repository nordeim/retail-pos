// ---------------------------------------------------------------------------
// VeloxPOS seed — the reference-verified dataset (docs/reference-investigation.md
// + the V10 live re-measurement, docs/remediation-plan-v10.md §0): the 6
// categories (creation order = the reference's donut order), the 12 products
// (every row now read live — the reference renders all 12 — in ITS page
// order), 2 registers (Caja 2 first — the reference's page order), and the
// 2 completed sales + their closed Cesar Martínez shifts at the reference's
// EXACT datetimes (V10/SD-34: the old relativized daysAgo seeding drifted
// the visible dates on every reseed; the reference's own state is fixed
// historical dates — its dashboard chart and reports render empty, and the
// clone now mirrors that). The owner account comes from the environment
// (SEED_OWNER_EMAIL / SEED_OWNER_PASSWORD) — credentials never live in
// source.
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

/** V10/SD-34: a fixed, staggered base for the invisible ordering timestamps
 *  (categories/products) — createdAt ties made SQLite's order arbitrary;
 *  one minute per row keeps every list deterministic without any visible
 *  date surface (no view renders these). */
const ROW_BASE = Date.UTC(2026, 0, 1, 0, 0, 0);
const rowAt = (i: number) => new Date(ROW_BASE + i * 60_000);

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

  // V10/F1: the creation order IS the reference's donut order (Lácteos →
  // Bebidas — measured live: its donut maps the palette by this sequence).
  // Staggered createdAt keeps the ordering deterministic against ties.
  const categoryNames = ["Lácteos", "Limpieza", "Higiene Personal", "Alimentos", "Snacks", "Bebidas"];
  const categories = new Map<string, { id: string }>();
  for (const [i, name] of categoryNames.entries()) {
    const row = await db.category.upsert({
      where: { userId_name: { userId: owner.id, name } },
      create: { userId: owner.id, name, createdAt: rowAt(i) },
      update: {},
    });
    categories.set(name, row);
  }

  // (name, barcode, price pesos, stock, category, iva%) — V10/F5: the
  // reference's PAGE order (every row read live on 2026-10-27; the 12th
  // row's dossier-era ASSUMED values are retired — its real name/barcode/
  // stock are "Jabón Zote 400g" / 7501025403010 / 19).
  const products: [string, string, number, number, string, number][] = [
    ["Shampoo Pantene 400ml", "7501001165599", 89.0, 12, "Higiene Personal", 16],
    ["Agua Bonafont 1L", "7501013100018", 12.0, 60, "Bebidas", 16],
    ["Coca-Cola 600ml", "7501055300120", 18.5, 47, "Bebidas", 16],
    ["Papel Higiénico Pétalo 4 rollos", "7501019600012", 35.0, 17, "Higiene Personal", 16],
    ["Yogurt Danone Natural 900g", "7501005102148", 38.5, 10, "Lácteos", 16],
    ["Frijoles La Costeña 560g", "7501017006113", 22.5, 30, "Alimentos", 16],
    ["Cloro Cloralex 1L", "7501025400117", 24.0, 22, "Limpieza", 16],
    ["Leche Lala Entera 1L", "7501055301114", 26.5, 24, "Lácteos", 16],
    ["Sabritas Original 45g", "7501011115019", 16.0, 35, "Snacks", 16],
    ["Atún Dolores 295g", "7501024520148", 32.0, 3, "Alimentos", 16],
    ["Jabón Zote 400g", "7501025403010", 18.0, 19, "Limpieza", 16],
    ["Pan Bimbo Blanco", "7441029500103", 52.0, 15, "Alimentos", 16],
  ];

  const productRows = new Map<string, { id: string; name: string; price: number; ivaRate: number }>();
  for (const [i, [name, barcode, price, stock, category, ivaRate]] of products.entries()) {
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
        createdAt: rowAt(100 + i),
      },
      update: {},
    });
    productRows.set(name, { id: row.id, name: row.name, price: row.price, ivaRate: row.ivaRate });
  }

  const existingRegisters = await db.register.findMany({ where: { userId: owner.id } });
  const registers = new Map<string, string>();
  if (existingRegisters.length === 0) {
    // V10/F4: Caja 2 is created FIRST — the reference's Cajas page renders
    // Caja 2 above Caja 1 (its ordering rule is backend-internal; creation
    // order reproduces the observable page order).
    const caja2 = await db.register.create({
      data: { userId: owner.id, name: "Caja 2", location: "Área de abarrotes", status: "closed", createdAt: rowAt(200) },
    });
    const caja1 = await db.register.create({
      data: { userId: owner.id, name: "Caja 1", location: "Entrada principal", status: "closed", createdAt: rowAt(201) },
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
      // The two verified historical sales + their closed shifts — V10/F6+F7:
      // the reference's EXACT datetimes (measured live in its Ventas table,
      // ticket modals, and Turnos table) and the second sale's REAL items
      // (1x Jabón Zote + 1x Papel Higiénico — the line math lands on the
      // same verified $61.48 totals the old assumed items happened to hit).
      const salesSpec = [
        {
          ticketNo: "V-MO6BJT7G",
          openedAt: new Date("2026-04-09T01:39:00Z"),
          closedAt: new Date("2026-04-19T22:16:00Z"),
          saleAt: new Date("2026-04-19T22:09:00Z"),
          items: [{ name: "Coca-Cola 600ml", qty: 1 }],
        },
        {
          ticketNo: "V-MMPNY55Z",
          openedAt: new Date("2026-03-14T01:36:00Z"),
          closedAt: new Date("2026-03-20T03:30:00Z"),
          saleAt: new Date("2026-03-14T01:45:00Z"),
          items: [
            { name: "Jabón Zote 400g", qty: 1 },
            { name: "Papel Higiénico Pétalo 4 rollos", qty: 1 },
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

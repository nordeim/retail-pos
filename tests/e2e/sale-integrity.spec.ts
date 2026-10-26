import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// R2 data-integrity pins (remediation-plan-v3 §R2), API-level against the
// production server. File name ordering is load-bearing: this spec runs
// AFTER reports.spec.ts (its seeded-total pins must not see our control
// sale) and BEFORE security.spec.ts + terminal-sales.spec.ts — every shift
// opened here is closed in afterAll so terminal-sales starts from a clean
// register state (the e2e DB is force-reset per RUN, not per spec).
// ---------------------------------------------------------------------------

test.describe("sale integrity (R2)", () => {
  let registerId = "";
  let cashierId = "";
  let atunId = "";
  let atunStock = 0;
  let sabritasId = "";
  let sabritasPrice = 0;
  let sabritasIva = 0;
  let shiftId = "";

  test.beforeAll(async ({ request }) => {
    const registers = ((await (
      await request.get("/api/registers")
    ).json()) as { id: string }[]).sort((a, b) => a.id.localeCompare(b.id));
    registerId = registers[0].id;

    const cashiers = (await (
      await request.get("/api/cashiers")
    ).json()) as { id: string }[];
    cashierId = cashiers[0].id;

    const products = (await (
      await request.get("/api/products")
    ).json()) as {
      id: string;
      name: string;
      stock: number;
      price: number;
      ivaRate: number;
    }[];
    const atun = products.find((p) => p.name === "Atún Dolores 295g");
    const sabritas = products.find((p) => p.name === "Sabritas Original 45g");
    if (!atun || !sabritas) throw new Error("seeded products missing");
    atunId = atun.id;
    atunStock = atun.stock;
    sabritasId = sabritas.id;
    sabritasPrice = sabritas.price;
    sabritasIva = sabritas.ivaRate;

    const open = await request.post("/api/shifts", {
      data: { registerId, cashierId, openingFloat: 0 },
    });
    expect(open.status()).toBe(201);
    shiftId = ((await open.json()) as { id: string }).id;
  });

  test.afterAll(async ({ request }) => {
    if (shiftId) {
      const close = await request.post(`/api/shifts/${shiftId}/close`, {
        data: { closingAmount: 0 },
      });
      expect(close.status()).toBe(200);
    }
  });

  test("M1: selling more than stock answers 422 and the stock is untouched", async ({
    request,
  }) => {
    const response = await request.post("/api/sales", {
      data: {
        registerId,
        items: [{ productId: atunId, qty: atunStock + 1 }],
        method: "efectivo",
        cashReceived: atunStock + 100,
      },
    });
    expect(response.status()).toBe(422);

    const products = (await (
      await request.get("/api/products")
    ).json()) as { id: string; stock: number }[];
    expect(products.find((p) => p.id === atunId)?.stock).toBe(atunStock);
  });

  test("L2: efectivo short of the total answers 422 and nothing persists", async ({
    request,
  }) => {
    const total = Math.round(sabritasPrice * (1 + sabritasIva / 100));
    const response = await request.post("/api/sales", {
      data: {
        registerId,
        items: [{ productId: sabritasId, qty: 1 }],
        method: "efectivo",
        cashReceived: (total - 1) / 100,
      },
    });
    expect(response.status()).toBe(422);

    const products = (await (
      await request.get("/api/products")
    ).json()) as { id: string; stock: number }[];
    expect(products.find((p) => p.id === sabritasId)?.stock).toBeGreaterThan(0);

    const sales = (await (
      await request.get("/api/sales")
    ).json()) as { clientName: string }[];
    expect(
      sales.some((s) => s.clientName === "integrity-cash-short"),
    ).toBe(false);
  });

  test("a valid cash sale still sails through (the control)", async ({
    request,
  }) => {
    const before = (await (
      await request.get("/api/products")
    ).json()) as { id: string; stock: number }[];
    const beforeStock = before.find((p) => p.id === sabritasId)?.stock ?? 0;
    const total = Math.round(sabritasPrice * (1 + sabritasIva / 100));

    const response = await request.post("/api/sales", {
      data: {
        registerId,
        items: [{ productId: sabritasId, qty: 1 }],
        method: "efectivo",
        cashReceived: total / 100,
        clientName: "integrity-control",
      },
    });
    expect(response.status()).toBe(201);

    const after = (await (
      await request.get("/api/products")
    ).json()) as { id: string; stock: number }[];
    expect(after.find((p) => p.id === sabritasId)?.stock).toBe(beforeStock - 1);
  });

  test("L4: a second open on the same register answers 409", async ({
    request,
  }) => {
    const response = await request.post("/api/shifts", {
      data: { registerId, cashierId, openingFloat: 0 },
    });
    expect(response.status()).toBe(409);
  });

  test("M5: the open shift's aggregates survive the groupBy rewrite", async ({
    request,
  }) => {
    const shifts = (await (
      await request.get("/api/shifts")
    ).json()) as { id: string; salesTotal: number; salesCount: number }[];
    const open = shifts.find((s) => s.id === shiftId);
    expect(open).toBeDefined();
    expect(open?.salesCount).toBe(1);
    expect(open?.salesTotal).toBeGreaterThan(0);
  });
});

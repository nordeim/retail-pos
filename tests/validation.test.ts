// ---------------------------------------------------------------------------
// The POS payload schemas: money-as-string → cents, the nullable-id atom,
// the shift/sale gates, and the settings enum walls.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";

import {
  cashierCreateSchema,
  categorySchema,
  productCreateSchema,
  registerCreateSchema,
  reportDays,
  saleCreateSchema,
  settingsSchema,
  shiftCloseSchema,
  shiftOpenSchema,
  UNITS,
} from "@/lib/validation";

describe("moneyCents (price fields)", () => {
  it("accepts decimal strings and numbers, emits integer cents", () => {
    const parsed = productCreateSchema.parse({
      name: "Coca-Cola 600ml",
      barcode: "7501055300120",
      price: "18.50",
    });
    expect(parsed.price).toBe(1850);
    expect(parsed.ivaRate).toBe(16);
    expect(parsed.minStock).toBe(5);
    expect(parsed.unit).toBe("Pieza");
    expect(parsed.active).toBe(true);
  });

  it("rejects negatives and garbage", () => {
    const result = productCreateSchema.safeParse({ name: "X", price: "-1" });
    expect(result.success).toBe(false);
    const garbage = productCreateSchema.safeParse({ name: "X", price: "1.2.3" });
    expect(garbage.success).toBe(false);
  });

  it("strips unknown keys (repo-wide strip mode)", () => {
    const parsed = categorySchema.parse({ name: "Snacks", evil: "nope" }) as Record<string, unknown>;
    expect("evil" in parsed).toBe(false);
  });
});

describe("nullableId (the dialogs' cleared-relation atom)", () => {
  it('maps "" and undefined to null, keeps real ids', () => {
    const base = { name: "P", barcode: "B", price: "1" };
    expect(productCreateSchema.parse({ ...base, categoryId: "" }).categoryId).toBeNull();
    expect(productCreateSchema.parse({ ...base, categoryId: "abc" }).categoryId).toBe("abc");
    expect(productCreateSchema.parse({ ...base }).categoryId).toBeNull();
  });
});

describe("shift + sale gates", () => {
  it("shiftOpenSchema requires both ids", () => {
    const ok = shiftOpenSchema.safeParse({ registerId: "r1", cashierId: "c1" });
    expect(ok.success).toBe(true);
    const missing = shiftOpenSchema.safeParse({ registerId: "r1" });
    expect(missing.success).toBe(false);
  });

  it("shiftCloseSchema defaults the closing amount to 0", () => {
    expect(shiftCloseSchema.parse({}).closingAmount).toBe(0);
  });

  it("saleCreateSchema rejects an empty ticket", () => {
    const result = saleCreateSchema.safeParse({
      registerId: "r1",
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("saleCreateSchema rejects zero quantities", () => {
    const result = saleCreateSchema.safeParse({
      registerId: "r1",
      items: [{ productId: "p1", qty: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("saleCreateSchema accepts a cash sale with items", () => {
    const result = saleCreateSchema.safeParse({
      registerId: "r1",
      items: [{ productId: "p1", qty: 2 }],
      method: "efectivo",
    });
    expect(result.success).toBe(true);
  });
});

describe("settings + registers + cashiers", () => {
  it("settingsSchema defaults to the reference colors", () => {
    const parsed = settingsSchema.parse({ name: "Mi Tienda" });
    expect(parsed.primaryColor).toBe("#6366f1");
    expect(parsed.secondaryColor).toBe("#8b5cf6");
    expect(parsed.currency).toBe("MXN - Peso Mexicano");
    expect(parsed.cardProvider).toBe("Ninguno");
  });

  it("settingsSchema rejects non-hex colors", () => {
    const result = settingsSchema.safeParse({ name: "X", primaryColor: "violet" });
    expect(result.success).toBe(false);
  });

  it("registerCreateSchema requires a name", () => {
    expect(registerCreateSchema.safeParse({ name: "Caja 3" }).success).toBe(true);
    expect(registerCreateSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("cashierCreateSchema defaults active", () => {
    const parsed = cashierCreateSchema.parse({ name: "Ana" });
    expect(parsed.active).toBe(true);
  });
});

describe("reportDays", () => {
  it("whitelists the four reference periods", () => {
    expect(reportDays("7")).toBe(7);
    expect(reportDays("14")).toBe(14);
    expect(reportDays("30")).toBe(30);
    expect(reportDays("90")).toBe(90);
    expect(reportDays("13")).toBe(30); // default
    expect(reportDays(null)).toBe(30);
    expect(reportDays("9999")).toBe(30);
  });
});

describe("UNITS", () => {
  it("carries the reference default first", () => {
    expect(UNITS[0]).toBe("Pieza");
  });
});

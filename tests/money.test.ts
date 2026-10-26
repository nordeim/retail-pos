// ---------------------------------------------------------------------------
// The money seam — pinned to the reference-verified ticket math
// (docs/reference-investigation.md §4.4): 1 × Coca-Cola 600ml @ $18.50,
// 16% IVA → subtotal 18.50 / IVA 2.96 / total 21.46.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";

import {
  changeDue,
  formatMoney,
  ivaMultiplier,
  isCashSufficient,
  lineSubtotalCents,
  lineTotalCents,
  parseMoneyToCents,
  ticketTotals,
} from "@/lib/money";

describe("formatMoney", () => {
  it("formats cents with the $ sign and two decimals", () => {
    expect(formatMoney(2146)).toBe("$21.46");
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(5)).toBe("$0.05");
    expect(formatMoney(185000)).toBe("$1,850.00");
  });

  it("keeps negatives and rejects non-finite input", () => {
    expect(formatMoney(-250)).toBe("-$2.50");
    expect(formatMoney(Number.NaN)).toBe("$0.00");
  });
});

describe("parseMoneyToCents", () => {
  it("parses user-entered decimals", () => {
    expect(parseMoneyToCents("38.50")).toBe(3850);
    expect(parseMoneyToCents("38")).toBe(3800);
    expect(parseMoneyToCents("1,250.9")).toBe(125090);
    expect(parseMoneyToCents("$24.00")).toBe(2400);
    expect(parseMoneyToCents(12.5)).toBe(1250);
  });

  it("rejects garbage", () => {
    expect(parseMoneyToCents("")).toBeNull();
    expect(parseMoneyToCents("abc")).toBeNull();
    expect(parseMoneyToCents("1.2.3")).toBeNull();
    expect(parseMoneyToCents("-5")).toBeNull();
  });
});

describe("IVA line math", () => {
  it("multiplies by 1 + rate/100", () => {
    expect(ivaMultiplier(16)).toBeCloseTo(1.16);
    expect(ivaMultiplier(0)).toBe(1);
  });

  it("matches the verified reference ticket (18.50 → 21.46)", () => {
    expect(lineTotalCents(1850, 1, 16)).toBe(2146);
    expect(lineSubtotalCents(1850, 1)).toBe(1850);
  });

  it("rounds half-up per line and scales with quantity", () => {
    // 1250 × 1.16 = 1450 exactly; 1055 × 1.16 = 1223.8 → 1224
    expect(lineTotalCents(1250, 1, 16)).toBe(1450);
    expect(lineTotalCents(1055, 1, 16)).toBe(1224);
    expect(lineTotalCents(1850, 2, 16)).toBe(4292);
  });
});

describe("ticketTotals", () => {
  it("reproduces the reference sale: subtotal 18.50 / IVA 2.96 / total 21.46", () => {
    const totals = ticketTotals([{ unitPrice: 1850, qty: 1, ivaRate: 16 }]);
    expect(totals).toEqual({ subtotal: 1850, tax: 296, total: 2146 });
  });

  it("handles mixed IVA rates per line", () => {
    const totals = ticketTotals([
      { unitPrice: 1850, qty: 1, ivaRate: 16 }, // 2146
      { unitPrice: 1000, qty: 2, ivaRate: 0 }, // 2000
    ]);
    expect(totals.subtotal).toBe(3850);
    expect(totals.total).toBe(4146);
    expect(totals.tax).toBe(296);
  });

  it("empty ticket zeroes out", () => {
    expect(ticketTotals([])).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });
});

describe("cash change", () => {
  it("computes change and sufficiency", () => {
    expect(changeDue(2146, 5000)).toBe(2854);
    expect(changeDue(2146, 2000)).toBe(0);
    expect(isCashSufficient(2146, 5000)).toBe(true);
    expect(isCashSufficient(2146, 2146)).toBe(true);
    expect(isCashSufficient(2146, 2145)).toBe(false);
  });
});

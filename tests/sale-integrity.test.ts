import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { lineTotalCents, paymentCoversTotal } from "@/lib/money";

// ---------------------------------------------------------------------------
// R2 data-integrity pins (remediation-plan-v3 §R2). The pure money seams are
// behavior pins; the route/view contracts are source pins (the codebase's
// established idiom for server files that need next/headers at import time).
// Every pin was written RED against the pre-remediation code.
// ---------------------------------------------------------------------------

const readSource = (...segments: string[]) =>
  readFileSync(path.join(import.meta.dirname, "..", "src", ...segments), "utf8");

describe("line math (M3)", () => {
  it("rounds ONCE over the whole line — the 1¢ divergence case", () => {
    // $12.34 @ 16% ×2: round(1234 × 1.16 × 2) = round(2862.88) = 2863.
    // The pre-remediation view computed round(1234×1.16)×2 = 2862 — a
    // visible total that did not match the stored one.
    expect(lineTotalCents(1234, 2, 16)).toBe(2863);
    expect(Math.round(1234 * 1.16) * 2).toBe(2862); // the OLD shape, pinned as wrong
  });

  it("the terminal renders lines through lineTotalCents (source pin)", () => {
    const view = readSource("components", "views", "terminal-view.tsx");
    expect(view).toContain("lineTotalCents");
    expect(view).not.toContain("Math.round(line.product.price");
  });
});

describe("cash coverage (L2)", () => {
  it("efectivo requires cash on hand that covers the total", () => {
    expect(paymentCoversTotal("efectivo", 2863, 2000)).toBe(false);
    expect(paymentCoversTotal("efectivo", 2863, undefined)).toBe(false);
    expect(paymentCoversTotal("efectivo", 2863, 2863)).toBe(true);
    expect(paymentCoversTotal("efectivo", 2863, 5000)).toBe(true);
  });

  it("tarjeta ignores the cash field entirely", () => {
    expect(paymentCoversTotal("tarjeta", 2863, undefined)).toBe(true);
    expect(paymentCoversTotal("tarjeta", 2863, 0)).toBe(true);
  });

  it("the sales route enforces the rule server-side (source pin)", () => {
    const route = readSource("app", "api", "sales", "route.ts");
    expect(route).toContain("paymentCoversTotal");
    expect(route).toContain("BusinessRuleError");
  });
});

describe("stock guard (M1)", () => {
  it("the decrement is guarded inside the transaction (source pin)", () => {
    const route = readSource("app", "api", "sales", "route.ts");
    expect(route).toContain("stock: { gte: line.qty }");
  });
});

describe("shift conflicts (L4)", () => {
  it("duplicate opens re-checked inside the transaction via ConflictError (source pin)", () => {
    const route = readSource("app", "api", "shifts", "route.ts");
    expect(route).toContain("ConflictError");
    expect(route).toMatch(/tx\.shift\.findFirst/);
  });
});

describe("bounded reads (M5)", () => {
  it("the sales list is capped newest-first (source pin)", () => {
    const route = readSource("app", "api", "sales", "route.ts");
    expect(route).toContain("SALES_LIST_CAP = 200");
    expect(route).toContain("take: SALES_LIST_CAP");
  });

  it("shift aggregates come from groupBy, not per-shift row loads (source pin)", () => {
    const route = readSource("app", "api", "shifts", "route.ts");
    expect(route).toContain("groupBy");
    expect(route).not.toContain("sales: { select: { total: true } }");
  });
});

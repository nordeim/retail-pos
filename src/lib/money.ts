// ---------------------------------------------------------------------------
// Money domain: integer-cents math, IVA (VAT) computation, and cash-change
// rounding. Pure — unit-pinned by tests/money.test.ts.
//
// Verified reference contract (docs/reference-investigation.md §4.4): the
// product price is IVA-EXCLUSIVE; a line's ticket total is
// round(price × (1 + ivaRate/100) × qty); the sale's subtotal is the sum of
// pre-tax amounts, tax = sum of per-line tax, total = subtotal + tax.
// The reference ticket (1 × Coca-Cola 600ml @ $18.50, 16%) shows
// subtotal 18.50 / IVA 2.96 / total 21.46 — 1850×1.16 = 2146 exactly.
// ---------------------------------------------------------------------------

/** Format integer cents as the app's money string: `$21.46` (MXN `$`). */
export function formatMoney(cents: number): string {
  if (!Number.isFinite(cents)) return "$0.00";
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const pesos = Math.floor(abs / 100);
  const rest = abs % 100;
  return `${sign}$${pesos.toLocaleString("en-US")}.${rest.toString().padStart(2, "0")}`;
}

/** Parse a user-entered money string ("38.50", "1,250.9", "38") into cents. */
export function parseMoneyToCents(input: string | number): number | null {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null;
    return Math.round(input * 100);
  }
  const cleaned = input.replace(/[$,\s]/g, "");
  if (cleaned.length === 0) return null;
  if (!/^\d*(\.\d*)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/** IVA multiplier for a percent rate (16 → 1.16). */
export function ivaMultiplier(ivaRate: number): number {
  const rate = Number.isFinite(ivaRate) ? Math.max(0, ivaRate) : 0;
  return 1 + rate / 100;
}

/**
 * One line's IVA-INCLUSIVE total, rounded to the cent.
 * 1850 cents @16% → 2146.
 */
export function lineTotalCents(
  unitPriceCents: number,
  qty: number,
  ivaRate: number,
): number {
  const q = Math.max(0, Math.round(qty));
  return Math.round(unitPriceCents * ivaMultiplier(ivaRate) * q);
}

/** The pre-tax slice of one line: the unit price × qty (never rounded twice). */
export function lineSubtotalCents(unitPriceCents: number, qty: number): number {
  return Math.max(0, Math.round(unitPriceCents)) * Math.max(0, Math.round(qty));
}

export type TicketTotals = { subtotal: number; tax: number; total: number };

/**
 * Sum a ticket's lines into the sale totals. Tax is computed per line
 * (inclusive-total minus pre-tax slice) then summed — the reference's
 * per-product IVA rates make a single-rate shortcut wrong.
 */
export function ticketTotals(
  lines: { unitPrice: number; qty: number; ivaRate: number }[],
): TicketTotals {
  let subtotal = 0;
  let total = 0;
  for (const line of lines) {
    subtotal += lineSubtotalCents(line.unitPrice, line.qty);
    total += lineTotalCents(line.unitPrice, line.qty, line.ivaRate);
  }
  return { subtotal, tax: total - subtotal, total };
}

/** Change due for a cash payment, in cents (never negative). */
export function changeDue(totalCents: number, cashReceivedCents: number): number {
  return Math.max(0, cashReceivedCents - totalCents);
}

/** A quick usability guard: is the cash enough to cover the total? */
export function isCashSufficient(totalCents: number, cashReceivedCents: number): boolean {
  return cashReceivedCents >= totalCents;
}

/**
 * L2: does this payment method + cash on hand cover the ticket? The
 * SERVER-side gate for sale creation — efectivo must arrive with declared
 * cash that covers the total (the client's cobrar gate is UX, not
 * integrity); tarjeta ignores the cash field entirely.
 */
export function paymentCoversTotal(
  method: string,
  totalCents: number,
  cashReceivedCents: number | undefined,
): boolean {
  if (method !== "efectivo") return true;
  return cashReceivedCents !== undefined && cashReceivedCents >= totalCents;
}

// ---------------------------------------------------------------------------
// Shared POS view types — the pieces that cross the store/view boundary.
// ---------------------------------------------------------------------------

import type { Product } from "./store";

export type TicketLineInput = {
  product: Product;
  qty: number;
  lineTotal: number; // cents, IVA-inclusive
};

export type SaleMethod = "efectivo" | "tarjeta";

/** The payment dialog's shape. */
export type PaymentDraft = {
  method: SaleMethod;
  cashReceived: number; // cents (efectivo only)
};

// ---------------------------------------------------------------------------
// V6/F4 — the Ventas row's "Enviar ticket" mail action. The reference emails
// through its platform API (native prompt + base44 backend); the clone has no
// SMTP channel (disclosed since v3), so the local-first equivalent is a
// fully-formed mailto: — the operator's own mail client opens with the
// complete ticket pre-filled. Real functionality, no faked send (SD-8).
// ---------------------------------------------------------------------------

import { formatMoney } from "@/lib/money";
import type { Sale } from "@/lib/store";

/** Formats the human-readable ticket body (also asserted by unit pins). */
export function ticketEmailBody(sale: Sale): string {
  const lines: string[] = [];

  lines.push(`Ticket ${sale.ticketNo}`);
  lines.push(`Fecha: ${new Date(sale.createdAt).toLocaleString("es-MX")}`);
  lines.push(`Cajero: ${sale.cashierName}`);
  if (sale.registerName) lines.push(`Caja: ${sale.registerName}`);
  if (sale.clientName) lines.push(`Cliente: ${sale.clientName}`);
  lines.push(`Método: ${sale.method === "tarjeta" ? "Tarjeta" : "Efectivo"}`);

  if (sale.items.length > 0) {
    lines.push("");
    lines.push("Productos:");
    for (const item of sale.items) {
      lines.push(`  ${item.qty} x ${item.name} — ${formatMoney(item.lineTotal)}`);
    }
  }

  lines.push("");
  lines.push(`Subtotal: ${formatMoney(sale.subtotal)}`);
  lines.push(`IVA: ${formatMoney(sale.tax)}`);
  lines.push(`Total: ${formatMoney(sale.total)}`);

  return lines.join("\n");
}

/** Builds the mailto: URL the row action navigates to. */
export function buildTicketMailto(sale: Sale): string {
  const subject = encodeURIComponent(`Ticket ${sale.ticketNo}`);
  const body = encodeURIComponent(ticketEmailBody(sale));
  return `mailto:?subject=${subject}&body=${body}`;
}

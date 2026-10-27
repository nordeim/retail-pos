"use client";

// ---------------------------------------------------------------------------
// The Ventas view (/Sales): the sale history table + the ticket detail
// dialog. Reference copy: "Historial de Ventas", search "Buscar por ticket,
// cliente o cajero...", columns TICKET / FECHA / CAJERO / MÉTODO / TOTAL /
// ESTADO / ACCIONES.
// ---------------------------------------------------------------------------

import * as React from "react";
import { Eye, Mail, Receipt, ReceiptText, Search } from "lucide-react";

import { MethodPill, PageHeading, StatusPill } from "@/components/pos/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/lib/api";
import { buildTicketMailto } from "@/lib/ticket-mail";
import { formatMediumSpanish, formatSlashShort } from "@/lib/date";
import { formatMoney } from "@/lib/money";
import { usePosStore, type Sale } from "@/lib/store";

export function SalesView() {
  const sales = usePosStore((s) => s.sales);
  const loadCollections = usePosStore((s) => s.loadCollections);
  const [query, setQuery] = React.useState("");
  const [detail, setDetail] = React.useState<Sale | null>(null);

  React.useEffect(() => {
    void loadCollections(["sales"]);
  }, [loadCollections]);

  const visible = sales.filter((sale) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      sale.ticketNo.toLowerCase().includes(q) ||
      sale.clientName.toLowerCase().includes(q) ||
      sale.cashierName.toLowerCase().includes(q)
    );
  });

  const openDetail = async (sale: Sale) => {
    // The list already carries items; refresh the single row for freshness.
    try {
      const fresh = await apiGet<Sale>(`/api/sales/${sale.id}`);
      setDetail(fresh);
    } catch {
      setDetail(sale);
    }
  };

  // V6/F4: the row's "Enviar ticket" — the reference emails via its platform
  // API; the clone's local-first equivalent opens the operator's mail client
  // with the complete ticket pre-filled (no SMTP channel — disclosed).
  // V8/F3: the reference prompts for the destination ("Enviar ticket a:")
  // before sending through its platform's SMTP (live-measured XHR to
  // Core/SendEmail). The clone's honest equivalent hands the PRE-ADDRESSED
  // ticket to the operator's mail client; a cancelled prompt is a no-op,
  // exactly like the reference.
  const sendByEmail = async (sale: Sale) => {
    const to = window.prompt("Enviar ticket a:");
    if (!to) return;
    try {
      const fresh = await apiGet<Sale>(`/api/sales/${sale.id}`);
      window.location.href = buildTicketMailto(fresh, to.trim());
    } catch {
      window.location.href = buildTicketMailto(sale, to.trim());
    }
  };

  return (
    <div>
      <PageHeading
        title="Historial de Ventas"
        subtitle={`${sales.length} ventas registradas`}
      />

      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por ticket, cliente o cajero..."
          aria-label="Buscar ventas"
          data-testid="sales-search"
          className="pl-9"
        />
      </div>

      <div className="vx-card overflow-hidden">
        <div className="vx-scroll overflow-x-auto">
          <table className="w-full min-w-[820px]" data-testid="sales-table">
            <thead>
              {/* V5/T1: the reference's headers — text-xs font-semibold
                  slate-500 UPPERCASE, per-column alignment, px-5 py-3. */}
              <tr className="border-b border-[#1e2235]">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase px-5 py-3">Ticket</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase px-5 py-3">Fecha</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase px-5 py-3">Cajero</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase px-5 py-3">Método</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase px-5 py-3">Total</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase px-5 py-3">Estado</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <ReceiptText className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                    Sin ventas que coincidan.
                  </td>
                </tr>
              ) : (
                visible.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b border-slate-50 transition-colors last:border-0 hover:bg-white/40"
                    data-testid={`sale-row-${sale.ticketNo}`}
                  >
                    <td className="px-5 py-3 font-mono text-sm font-semibold text-indigo-600">
                      {sale.ticketNo}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {formatSlashShort(new Date(sale.createdAt))}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{sale.cashierName}</td>
                    <td className="px-5 py-3 text-center">
                      <MethodPill method={sale.method} />
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800">
                      {formatMoney(sale.total)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {sale.status === "completada" ? (
                        <StatusPill tone="success">Completada</StatusPill>
                      ) : (
                        <StatusPill tone="neutral">{sale.status}</StatusPill>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Ver ticket ${sale.ticketNo}`}
                          data-testid={`view-sale-${sale.ticketNo}`}
                          onClick={() => void openDetail(sale)}
                          className="vx-focus rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Enviar ticket ${sale.ticketNo} por correo`}
                          data-testid={`mail-sale-${sale.ticketNo}`}
                          onClick={() => void sendByEmail(sale)}
                          className="vx-focus rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SaleDetailDialog sale={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function SaleDetailDialog({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  return (
    <Dialog open={sale !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-[#262a36] bg-[#0f121a] text-[#e7e9ef]">
        <DialogHeader>
          {/* V8/F2: the reference's title icon — lucide-receipt, indigo. */}
          <DialogTitle className="flex items-center gap-2" data-testid="sale-detail-title">
            <Receipt className="h-5 w-5 text-indigo-500" />
            {sale ? `Ticket ${sale.ticketNo}` : ""}
          </DialogTitle>
        </DialogHeader>
        {sale ? (
          <div className="space-y-4 text-sm">
            {/* V8/F2: the reference's meta block is a 2×2 GRID of stacked
                label/value cells (live-measured: Fecha/Cajero share a row,
                Método/Caja the next; label slate-500, value font-medium). */}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Fecha:</dt>
                <dd className="font-medium">
                  {formatMediumSpanish(new Date(sale.createdAt))}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Cajero:</dt>
                <dd className="font-medium">{sale.cashierName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Método:</dt>
                <dd className="font-medium">
                  {sale.method === "tarjeta" ? "Tarjeta" : "Efectivo"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Caja:</dt>
                <dd className="font-medium">{sale.registerName || "—"}</dd>
              </div>
              {sale.clientName ? (
                <div>
                  <dt className="text-slate-500">Cliente:</dt>
                  <dd className="font-medium">{sale.clientName}</dd>
                </div>
              ) : null}
            </dl>

            {/* V8/F2: the reference's items block — "{qty}x {name}" plain
                spans + font-medium prices over the LIGHT slate-100 hairline
                (its own divider choice inside the dark modal — measured). */}
            <ul className="space-y-2 border-t border-slate-100 pt-3" data-testid="sale-detail-items">
              {sale.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.qty}x {item.name}
                  </span>
                  <span className="font-medium">{formatMoney(item.lineTotal)}</span>
                </li>
              ))}
            </ul>

            {/* V8/F2: totals over the slate-200 hairline; the Total row is
                the reference's text-lg font-bold closer. Its own slate-800
                color is unreadable on this surface (contrast ≈1.4:1,
                VLM-verified) — a readable light tone ships instead
                (SD-18, the aspect-true-preview posture). */}
            <dl className="space-y-1 border-t border-slate-200 pt-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <dt>Subtotal</dt>
                <dd>{formatMoney(sale.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-500">
                <dt>IVA</dt>
                <dd>{formatMoney(sale.tax)}</dd>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-100">
                <dt>Total</dt>
                <dd data-testid="sale-detail-total">{formatMoney(sale.total)}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

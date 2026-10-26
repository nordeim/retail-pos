"use client";

// ---------------------------------------------------------------------------
// The Ventas view (/Sales): the sale history table + the ticket detail
// dialog. Reference copy: "Historial de Ventas", search "Buscar por ticket,
// cliente o cajero...", columns TICKET / FECHA / CAJERO / MÉTODO / TOTAL /
// ESTADO / ACCIONES.
// ---------------------------------------------------------------------------

import * as React from "react";
import { Eye, Mail, ReceiptText, Search } from "lucide-react";

import { MethodPill, PageHeading, StatusPill } from "@/components/pos/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/lib/api";
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

  return (
    <div>
      <PageHeading
        title="Historial de Ventas"
        subtitle={`${sales.length} ventas registradas`}
      />

      <div className="relative mb-5 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por ticket, cliente o cajero..."
          aria-label="Buscar ventas"
          data-testid="sales-search"
          className="bg-[#12141f] pl-9"
        />
      </div>

      <div className="vx-card overflow-hidden">
        <div className="vx-scroll overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm" data-testid="sales-table">
            <thead>
              <tr className="border-b border-[#1e2235] text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Ticket</th>
                <th className="px-4 py-3.5">Fecha</th>
                <th className="px-4 py-3.5">Cajero</th>
                <th className="px-4 py-3.5">Método</th>
                <th className="px-4 py-3.5">Total</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
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
                    className="border-b border-[#1e2235] transition-colors last:border-0 hover:bg-white/[0.02]"
                    data-testid={`sale-row-${sale.ticketNo}`}
                  >
                    <td className="px-5 py-3 font-semibold text-violet-400">
                      {sale.ticketNo}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatSlashShort(new Date(sale.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{sale.cashierName}</td>
                    <td className="px-4 py-3">
                      <MethodPill method={sale.method} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-500">
                      {formatMoney(sale.total)}
                    </td>
                    <td className="px-4 py-3">
                      {sale.status === "completada" ? (
                        <StatusPill tone="success">Completada</StatusPill>
                      ) : (
                        <StatusPill tone="neutral">{sale.status}</StatusPill>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Ver ticket ${sale.ticketNo}`}
                          data-testid={`view-sale-${sale.ticketNo}`}
                          onClick={() => void openDetail(sale)}
                          className="vx-focus rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-violet-300"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Enviar ticket ${sale.ticketNo} por correo`}
                          className="vx-focus rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-violet-300"
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
      <DialogContent className="max-w-md border-[#262a36] bg-[#12141f] text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="sale-detail-title">
            <ReceiptText className="h-5 w-5 text-violet-400" />
            {sale ? `Ticket ${sale.ticketNo}` : ""}
          </DialogTitle>
        </DialogHeader>
        {sale ? (
          <div className="space-y-4 text-sm">
            <dl className="space-y-2 text-slate-400">
              <div className="flex justify-between gap-3">
                <dt>Fecha:</dt>
                <dd className="text-slate-200">
                  {formatMediumSpanish(new Date(sale.createdAt))}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Cajero:</dt>
                <dd className="text-slate-200">{sale.cashierName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Método:</dt>
                <dd className="text-slate-200">
                  {sale.method === "tarjeta" ? "Tarjeta" : "Efectivo"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Caja:</dt>
                <dd className="text-slate-200">{sale.registerName || "—"}</dd>
              </div>
              {sale.clientName ? (
                <div className="flex justify-between gap-3">
                  <dt>Cliente:</dt>
                  <dd className="text-slate-200">{sale.clientName}</dd>
                </div>
              ) : null}
            </dl>

            <ul className="space-y-2 border-t border-[#1e2235] pt-3" data-testid="sale-detail-items">
              {sale.items.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3">
                  <span className="text-slate-200">
                    <strong>{item.qty}</strong> × {item.name}
                  </span>
                  <span className="font-semibold">{formatMoney(item.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <dl className="space-y-1 border-t border-[#1e2235] pt-3">
              <div className="flex justify-between text-slate-400">
                <dt>Subtotal</dt>
                <dd>{formatMoney(sale.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-400">
                <dt>IVA</dt>
                <dd>{formatMoney(sale.tax)}</dd>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-100">
                <dt>Total</dt>
                <dd data-testid="sale-detail-total">{formatMoney(sale.total)}</dd>
              </div>
            </dl>
          </div>
        ) : null}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#262a36] bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

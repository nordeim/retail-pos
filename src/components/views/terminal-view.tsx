"use client";

// ---------------------------------------------------------------------------
// The Terminal view (the app's root): LEFT = the product grid (search +
// category chips + product cards), RIGHT = the TICKET panel.
//
// Reference-verified anatomy:
//   · No active shift → the left pane renders the "No hay turno activo"
//     empty card ("Ve a Cajas para abrir un turno antes de realizar
//     ventas.") and the ticket panel shows "Escanea o selecciona
//     productos" with a disabled COBRAR button.
//   · With a shift open (the superset: the reference cannot open one —
//     it has no cashier to assign) the grid sells: cards add to the
//     ticket, qty +/- adjust, COBRAR opens the payment dialog, the sale
//     persists and stock decrements.
// ---------------------------------------------------------------------------

import * as React from "react";
import {
  Monitor,
  Minus,
  Plus,
  ShoppingCart,
  ShoppingBag,
  CircleCheck,
  Trash2,
  Banknote,
  CreditCard,
  Search,
} from "lucide-react";

import { MethodPill } from "@/components/pos/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiSend, ApiError } from "@/lib/api";
import {
  changeDue,
  formatMoney,
  isCashSufficient,
  lineTotalCents,
  parseMoneyToCents,
} from "@/lib/money";
import { computeTicketTotals, useAppStore, usePosStore, type Product } from "@/lib/store";
import { cn } from "@/lib/utils";

export function TerminalView() {
  const products = usePosStore((s) => s.products);
  const categories = usePosStore((s) => s.categories);
  const activeShift = usePosStore((s) => s.activeShift);
  const ticket = usePosStore((s) => s.ticket);
  const ticketAdd = usePosStore((s) => s.ticketAdd);
  const ticketSetQty = usePosStore((s) => s.ticketSetQty);
  const ticketRemove = usePosStore((s) => s.ticketRemove);
  const ticketClear = usePosStore((s) => s.ticketClear);
  const loadCollections = usePosStore((s) => s.loadCollections);
  const setActiveShiftFrom = usePosStore((s) => s.setActiveShiftFrom);
  const navigate = useAppStore((s) => s.navigate);

  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("Todos");
  const [payOpen, setPayOpen] = React.useState(false);
  // V5/T4: the reference's transient "Agregado" banner — the product name
  // of the last line added, shown for ~1.6s then collapsed away (the
  // reference keeps it in the DOM hidden behind max-h-0/opacity-0).
  const [addedName, setAddedName] = React.useState<string | null>(null);
  const addedTimer = React.useRef<number | null>(null);

  const totals = computeTicketTotals(ticket);

  const visible = products.filter((p) => {
    if (!p.active) return false;
    if (category !== "Todos" && p.categoryName !== category) return false;
    const q = query.trim().toLowerCase();
    if (q.length === 0) return true;
    return p.name.toLowerCase().includes(q) || p.barcode.includes(q);
  });

  const sellable = Boolean(activeShift);

  const onAdd = (product: Product) => {
    ticketAdd(product);
    setAddedName(product.name);
    if (addedTimer.current !== null) window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setAddedName(null), 1600);
  };

  React.useEffect(() => () => {
    if (addedTimer.current !== null) window.clearTimeout(addedTimer.current);
  }, []);

  const onSaleCreated = React.useCallback(() => {
    void loadCollections(["products", "sales", "shifts"]).then(() => {
      const shifts = usePosStore.getState().shifts;
      setActiveShiftFrom(shifts);
    });
  }, [loadCollections, setActiveShiftFrom]);

  return (
    // V5/T7: the reference's terminal skeleton — a full-height two-pane
    // layout (flex h-screen at lg; main is full-bleed there). Below lg the
    // panes stack in normal page flow (the clone's mobile superset keeps
    // the app bar + drawer + page scroll).
    <div className="flex h-full flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* LEFT: scan/grid area */}
      <div className="flex flex-1 flex-col gap-4 p-4 lg:min-w-0 lg:overflow-y-auto vx-scroll">
        {!sellable ? (
          <div className="flex flex-1 items-center justify-center">
            {/* V5/T8: the reference's muted empty card — 64px violet-400/30
                monitor, white/70 heading, white/35 copy with a white/60
                Cajas mention (ours keeps navigation — a superset affordance
                styled as their strong). */}
            <div className="vx-card max-w-md p-8 text-center">
              <Monitor className="mx-auto mb-4 h-16 w-16 text-violet-400/30" strokeWidth={1.6} />
              <h2 className="mb-2 text-xl font-bold text-white/70">No hay turno activo</h2>
              <p className="text-sm text-white/35">
                Ve a{" "}
                <button
                  type="button"
                  data-testid="go-to-registers"
                  onClick={() => navigate("cajas")}
                  className="font-bold text-white/60"
                >
                  Cajas
                </button>{" "}
                para abrir un turno antes de realizar ventas.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar producto o escanear código..."
                  aria-label="Buscar producto"
                  data-testid="terminal-search"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2" data-testid="terminal-categories">
                {["Todos", ...categories.map((c) => c.name)].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCategory(name)}
                    className={cn(
                      "vx-focus rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap",
                      category === name
                        ? "glass-button-primary"
                        : "glass-button",
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="vx-card p-10 text-center text-sm text-slate-400">
                Sin productos que coincidan.
              </div>
            ) : (
              <ul
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
                data-testid="terminal-grid"
              >
                {visible.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      disabled={product.stock <= 0}
                      onClick={() => onAdd(product)}
                      data-testid={`terminal-product-${product.id}`}
                      className={cn(
                        "vx-card vx-focus flex h-full w-full flex-col items-start gap-1 p-3 text-left transition-colors",
                        product.stock > 0
                          ? "hover:border-violet-500/60 hover:bg-white/[0.03]"
                          : "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12141f] text-violet-300">
                        <ShoppingCart className="h-4.5 w-4.5" strokeWidth={2} />
                      </span>
                      <span className="line-clamp-2 text-sm font-semibold text-slate-100">
                        {product.name}
                      </span>
                      <span className="text-sm font-bold text-violet-300">
                        {formatMoney(product.price)}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {product.stock} en stock
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* RIGHT: the TICKET rail — the reference's flat full-height panel
          (border-l, solid #0d0f1a, no card chrome). */}
      <aside
        className="flex w-full flex-col rounded-none border-l border-[#1e2235] bg-[#0d0f1a] p-4 md:w-[380px] lg:min-h-0"
        data-testid="ticket-panel"
      >
        {/* V5/T4: the transient "Agregado" feedback banner (always mounted,
            collapsed to max-h-0/opacity-0 when idle — the reference's own
            markup verbatim). */}
        <div
          className={cn(
            "transition-all duration-300 overflow-hidden",
            addedName ? "max-h-24 opacity-100 mb-3" : "max-h-0 opacity-0",
          )}
          aria-live="polite"
        >
          <div className="bg-gradient-to-r from-emerald-600/80 to-teal-600/70 rounded-2xl px-4 py-3 flex items-center gap-3 border border-emerald-500/30">
            <CircleCheck className="h-6 w-6 shrink-0 text-emerald-300" />
            <div className="min-w-0">
              <p className="text-emerald-300/70 text-[10px] font-bold uppercase tracking-widest">
                Agregado
              </p>
              <p className="text-white text-lg font-black leading-tight truncate">
                {addedName}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-3 flex flex-shrink-0 items-center justify-between">
          <h2 className="text-xs font-bold text-white/80 tracking-wide uppercase">Ticket</h2>
        </div>

        {ticket.length === 0 ? (
          <div className="vx-scroll flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto py-8 text-white/20">
            <ShoppingCart className="h-16 w-16" strokeWidth={1.5} />
            <p className="mt-3 text-sm text-white/25">Escanea o selecciona productos</p>
          </div>
        ) : (
          <ul className="vx-scroll mb-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1" data-testid="ticket-lines">
            {ticket.map((line) => (
              <li key={line.product.id} className="rounded-xl bg-[#12141f] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-sm font-semibold text-slate-100">
                    {line.product.name}
                  </p>
                  <button
                    type="button"
                    aria-label={`Quitar ${line.product.name}`}
                    onClick={() => ticketRemove(line.product.id)}
                    className="vx-focus rounded-md p-1 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Quitar uno"
                      onClick={() => ticketSetQty(line.product.id, line.qty - 1)}
                      className="vx-focus flex h-7 w-7 items-center justify-center rounded-md bg-[#1e2235] text-slate-200 hover:bg-white/10"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold" data-testid="ticket-qty">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Agregar uno"
                      disabled={line.qty >= line.product.stock}
                      onClick={() => ticketSetQty(line.product.id, line.qty + 1)}
                      className="vx-focus flex h-7 w-7 items-center justify-center rounded-md bg-[#1e2235] text-slate-200 hover:bg-white/10 disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-100">
                    {/* M3: the SAME once-per-line rounding as money.ts and the
                        sale route — round(price × (1+iva) × qty), never
                        round(unit)×qty (the on-screen/persisted 1¢ divergence). */}
                    {formatMoney(
                      lineTotalCents(line.product.price, line.qty, line.product.ivaRate),
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* V5/T5: the footer keeps the reference's white/5 hairline and
            mt-auto pinning; the totals rows only exist when there are lines
            (the reference's empty footer is the COBRAR button alone). */}
        <div className="mt-auto flex-shrink-0 space-y-3 border-t border-white/5 pt-4">
          {ticket.length > 0 ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatMoney(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>IVA</span>
                <span>{formatMoney(totals.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-100">
                <span>Total</span>
                <span data-testid="ticket-total">{formatMoney(totals.total)}</span>
              </div>
            </div>
          ) : null}

          {ticket.length > 0 ? (
            <Button
              data-testid="cobrar-button"
              className="glass-button-success h-auto w-full rounded-2xl px-8 py-5 text-xl font-black"
              onClick={() => setPayOpen(true)}
            >
              <ShoppingBag className="h-6 w-6" />
              COBRAR {formatMoney(totals.total)}
            </Button>
          ) : (
            <Button
              disabled
              data-testid="cobrar-button"
              className="glass-button-success pointer-events-none h-auto w-full rounded-2xl px-8 py-5 text-xl font-black opacity-50"
            >
              <ShoppingBag className="h-6 w-6" />
              COBRAR {formatMoney(0)}
            </Button>
          )}
        </div>
      </aside>

      {payOpen ? (
        <PaymentDialog
          onOpenChange={setPayOpen}
          totalCents={totals.total}
          onCompleted={() => {
            ticketClear();
            setPayOpen(false);
            onSaleCreated();
          }}
        />
      ) : null}
    </div>
  );
}

// ---- the payment dialog --------------------------------------------------------

function PaymentDialog({
  onOpenChange,
  totalCents,
  onCompleted,
}: {
  onOpenChange: (open: boolean) => void;
  totalCents: number;
  onCompleted: () => void;
}) {
  const activeShift = usePosStore((s) => s.activeShift);
  const registers = usePosStore((s) => s.registers);
  const [method, setMethod] = React.useState<"efectivo" | "tarjeta">("efectivo");
  const [cashInput, setCashInput] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const cashCents = parseMoneyToCents(cashInput) ?? 0;
  const change = changeDue(totalCents, cashCents);
  const cashShort = method === "efectivo" && cashInput.trim() !== "" && !isCashSufficient(totalCents, cashCents);

  const registerId =
    activeShift?.registerId ??
    registers.find((r) => r.status === "open")?.id ??
    registers[0]?.id ??
    "";

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const products = usePosStore.getState().products;
      const lines = usePosStore.getState().ticket.map((line) => ({
        productId: line.product.id,
        qty: line.qty,
      }));
      // Re-validate stock against the freshest product rows before sending.
      for (const line of lines) {
        const product = products.find((p) => p.id === line.productId);
        if (!product || product.stock < line.qty) {
          throw new ApiError(422, "Stock insuficiente para completar la venta.");
        }
      }
      // The API recomputes prices from the DB rows; the ticket lines drive
      // the payload (L3: the built-then-voided productById map is gone).
      await apiSend("POST", "/api/sales", {
        registerId,
        items: lines,
        method,
        clientName,
        ...(method === "efectivo" && cashCents > 0 ? { cashReceived: cashCents / 100 } : {}),
      });
      onCompleted();
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo registrar la venta. Intenta de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-[#262a36] bg-[#12141f] text-slate-100">
        <DialogHeader>
          <DialogTitle>Cobrar venta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl bg-[#0d0f1a] p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total a cobrar</p>
            <p className="text-3xl font-bold" data-testid="pay-total">
              {formatMoney(totalCents)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Método de pago">
            <button
              type="button"
              role="radio"
              aria-checked={method === "efectivo"}
              data-testid="method-efectivo"
              onClick={() => setMethod("efectivo")}
              className={cn(
                "vx-focus flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold",
                method === "efectivo"
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                  : "border-[#262a36] text-slate-300 hover:bg-white/5",
              )}
            >
              <Banknote className="h-4 w-4" /> Efectivo
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={method === "tarjeta"}
              data-testid="method-tarjeta"
              onClick={() => setMethod("tarjeta")}
              className={cn(
                "vx-focus flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold",
                method === "tarjeta"
                  ? "border-violet-500 bg-violet-500/15 text-violet-300"
                  : "border-[#262a36] text-slate-300 hover:bg-white/5",
              )}
            >
              <CreditCard className="h-4 w-4" /> Tarjeta
            </button>
          </div>

          {method === "efectivo" ? (
            <div>
              <label htmlFor="pay-cash" className="mb-1.5 block text-sm text-slate-300">
                Efectivo recibido
              </label>
              <Input
                id="pay-cash"
                inputMode="decimal"
                value={cashInput}
                onChange={(event) => setCashInput(event.target.value)}
                placeholder="0.00"
                data-testid="pay-cash"
              />
              {cashShort ? (
                <p className="mt-1 text-xs text-red-400">El efectivo no cubre el total.</p>
              ) : (
                cashInput.trim() !== "" && (
                  <p className="mt-1 text-sm text-emerald-400" data-testid="pay-change">
                    Cambio: {formatMoney(change)}
                  </p>
                )
              )}
            </div>
          ) : null}

          <div>
            <label htmlFor="pay-client" className="mb-1.5 block text-sm text-slate-300">
              Cliente (opcional)
            </label>
            <Input
              id="pay-client"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Nombre del cliente"
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <MethodPill method={method} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="glass-button rounded-xl border-0 px-4 py-2.5 text-sm font-medium"
              >
                Cancelar
              </Button>
              <Button
                data-testid="confirm-payment"
                disabled={
                  submitting ||
                  (method === "efectivo" && (cashShort || cashInput.trim() === ""))
                }
                onClick={() => void submit()}
                className="glass-button-primary rounded-xl px-4 py-2.5 text-sm font-medium"
              >
                {submitting ? "Procesando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

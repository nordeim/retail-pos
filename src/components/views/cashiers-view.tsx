"use client";

// ---------------------------------------------------------------------------
// The Cajeros view (/Cashiers): the cashier table + "Turnos Recientes"
// + the Nuevo Cajero dialog (the superset — the reference ships this page
// with no way to create a cashier).
// ---------------------------------------------------------------------------

import * as React from "react";
import { Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";

import { PageHeading, StatusPill } from "@/components/pos/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiSend, ApiError } from "@/lib/api";
import { formatMoney, } from "@/lib/money";
import { formatShiftStamp } from "@/lib/date";
import { usePosStore, type Cashier } from "@/lib/store";
import { useToast } from "@/components/ui/toast";

export function CashiersView() {
  const cashiers = usePosStore((s) => s.cashiers);
  const { toast } = useToast();
  const shifts = usePosStore((s) => s.shifts);
  const loadCollections = usePosStore((s) => s.loadCollections);

  const [editing, setEditing] = React.useState<Cashier | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<Cashier | null>(null);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(
    () => loadCollections(["cashiers", "shifts"]),
    [loadCollections],
  );

  const remove = async (cashier: Cashier) => {
    setBusy(true);
    try {
      await apiSend("DELETE", `/api/cashiers/${cashier.id}`);
      setDeleting(null);
      await refresh();
    } catch (err: unknown) {
      // V6/F3: surface the failure (the old `void err` was silent).
      toast.error(err instanceof ApiError ? err.message : `No se pudo eliminar ${cashier.name}.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeading
        title="Cajeros"
        subtitle={`${cashiers.length} usuarios registrados`}
        actions={
          <Button
            data-testid="new-cashier-button"
          variant="glass"
          className="glass-button-primary rounded-xl px-4 py-2.5 text-sm font-medium"
            onClick={() => setEditing("new")}
          >
            <Plus className="h-4 w-4" /> Nuevo Cajero
          </Button>
        }
      />

      {cashiers.length === 0 ? (
        <div className="vx-card mb-6 flex flex-col items-center gap-2 p-10 text-center">
          <Users className="h-10 w-10 text-slate-600" strokeWidth={1.5} />
          <p className="text-sm text-slate-400">No hay usuarios registrados</p>
        </div>
      ) : (
        <div className="vx-card mb-6 overflow-hidden">
          <div className="vx-scroll overflow-x-auto">
            <table className="w-full min-w-[640px]" data-testid="cashiers-table">
              <thead>
                <tr className="border-b border-[#1e2235]">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-5 py-3">Cajero</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-5 py-3">Email</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase px-5 py-3">Estado</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cashiers.map((cashier) => (
                  <tr
                    key={cashier.id}
                    className="border-b border-slate-50 transition-colors last:border-0 hover:bg-white/40"
                    data-testid={`cashier-row-${cashier.id}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">
                          <UserRound className="h-4.5 w-4.5" />
                        </span>
                        <span className="font-semibold text-sm text-slate-800">{cashier.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{cashier.email || "—"}</td>
                    <td className="px-5 py-3 text-center">
                      {cashier.active ? (
                        <StatusPill tone="success">Activo</StatusPill>
                      ) : (
                        <StatusPill tone="neutral">Inactivo</StatusPill>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Editar ${cashier.name}`}
                          data-testid={`edit-cashier-${cashier.id}`}
                          onClick={() => setEditing(cashier)}
                          className="vx-focus rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar ${cashier.name}`}
                          data-testid={`delete-cashier-${cashier.id}`}
                          onClick={() => setDeleting(cashier)}
                          className="vx-focus rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* V5/C1: the reference's heading — 16px title-case slate-700 (not a
          violet uppercase kicker). */}
      <h3 className="mb-4 font-bold text-slate-700">
        Turnos Recientes
      </h3>
      <div className="vx-card overflow-hidden">
        <div className="vx-scroll overflow-x-auto">
          <table className="w-full min-w-[720px]" data-testid="recent-shifts-table">
            <thead>
              {/* V5/C1: the reference's dense shifts table — px-4 py-2 headers
                  with per-column alignment, px-4 py-2.5 cells, slate-50
                  hairlines, no row hover. */}
              <tr className="border-b border-[#1e2235]">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-2">Cajero</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-2">Caja</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-2">Inicio</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-2">Fin</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase px-4 py-2">Ventas</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Sin turnos registrados.
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr
                    key={shift.id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-700">{shift.cashierName}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-500">{shift.registerName}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-500">
                      {formatShiftStamp(new Date(shift.openedAt))}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-500">
                      {shift.closedAt ? formatShiftStamp(new Date(shift.closedAt)) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-bold text-slate-800 text-right">{formatMoney(shift.salesTotal)}</td>
                    <td className="px-4 py-2.5 text-center">
                      {shift.status === "open" ? (
                        <StatusPill tone="success">Abierto</StatusPill>
                      ) : (
                        <StatusPill tone="neutral">Cerrado</StatusPill>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== null ? (
        <CashierDialog
          key={editing === "new" ? "new" : editing.id}
          cashier={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void refresh();
          }}
        />
      ) : null}

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-sm border-[#262a36] bg-[#0f121a] text-[#e7e9ef]">
          <DialogHeader>
            <DialogTitle>Eliminar cajero</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            ¿Eliminar a <strong className="text-slate-100">{deleting?.name}</strong>? Sus
            turnos pasados se conservan.
          </p>
          <DialogFooter className="gap-2">
            <Button
              onClick={() => setDeleting(null)}
          variant="glass"
          className="glass-button h-auto rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              data-testid="confirm-delete-cashier"
              onClick={() => deleting && void remove(deleting)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CashierDialog({
  cashier,
  onClose,
  onSaved,
}: {
  cashier: Cashier | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState(cashier?.name ?? "");
  const [email, setEmail] = React.useState(cashier?.email ?? "");
  const [active, setActive] = React.useState(cashier?.active ?? true);
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { name: name.trim(), email: email.trim(), active };
      if (cashier) {
        await apiSend("PATCH", `/api/cashiers/${cashier.id}`, payload);
      } else {
        await apiSend("POST", "/api/cashiers", payload);
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el cajero.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-sm border-[#262a36] bg-[#0f121a] text-[#e7e9ef]">
        <DialogHeader>
          <DialogTitle>{cashier ? "Editar Cajero" : "Nuevo Cajero"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cashier-name" className="text-slate-200">Nombre *</Label>
            <Input
              id="cashier-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              data-testid="cashier-name-input"
              className="mt-1 bg-[#0d0f1a]"
            />
          </div>
          <div>
            <Label htmlFor="cashier-email" className="text-slate-200">Email</Label>
            <Input
              id="cashier-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 bg-[#0d0f1a]"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch id="cashier-active" checked={active} onCheckedChange={setActive} />
            <Label htmlFor="cashier-active" className="text-slate-200">Cajero activo</Label>
          </div>
          {error ? (
            <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="glass"
            onClick={onClose}
            className="glass-button h-auto rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            Cancelar
          </Button>
          <Button
            data-testid="cashier-submit"
            disabled={name.trim().length === 0 || saving}
            onClick={() => void submit()}
          variant="glass"
          className="glass-button-primary h-auto rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            {cashier ? "Guardar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

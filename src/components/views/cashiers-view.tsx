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

export function CashiersView() {
  const cashiers = usePosStore((s) => s.cashiers);
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
      void err;
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
            className="vx-gradient border-0 text-white"
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
            <table className="w-full min-w-[640px] text-sm" data-testid="cashiers-table">
              <thead>
                <tr className="border-b border-[#1e2235] text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Cajero</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cashiers.map((cashier) => (
                  <tr
                    key={cashier.id}
                    className="border-b border-[#1e2235] transition-colors last:border-0 hover:bg-white/[0.02]"
                    data-testid={`cashier-row-${cashier.id}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">
                          <UserRound className="h-4.5 w-4.5" />
                        </span>
                        <span className="font-medium text-slate-200">{cashier.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{cashier.email || "—"}</td>
                    <td className="px-4 py-3">
                      {cashier.active ? (
                        <StatusPill tone="success">Activo</StatusPill>
                      ) : (
                        <StatusPill tone="neutral">Inactivo</StatusPill>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Editar ${cashier.name}`}
                          data-testid={`edit-cashier-${cashier.id}`}
                          onClick={() => setEditing(cashier)}
                          className="vx-focus rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-violet-300"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar ${cashier.name}`}
                          data-testid={`delete-cashier-${cashier.id}`}
                          onClick={() => setDeleting(cashier)}
                          className="vx-focus rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-red-400"
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

      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-400">
        Turnos Recientes
      </h3>
      <div className="vx-card overflow-hidden">
        <div className="vx-scroll overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm" data-testid="recent-shifts-table">
            <thead>
              <tr className="border-b border-[#1e2235] text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Cajero</th>
                <th className="px-4 py-3.5">Caja</th>
                <th className="px-4 py-3.5">Inicio</th>
                <th className="px-4 py-3.5">Fin</th>
                <th className="px-4 py-3.5">Ventas</th>
                <th className="px-4 py-3.5">Estado</th>
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
                    className="border-b border-[#1e2235] transition-colors last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 text-slate-200">{shift.cashierName}</td>
                    <td className="px-4 py-3 text-slate-400">{shift.registerName}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatShiftStamp(new Date(shift.openedAt))}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {shift.closedAt ? formatShiftStamp(new Date(shift.closedAt)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatMoney(shift.salesTotal)}</td>
                    <td className="px-4 py-3">
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
        <DialogContent className="max-w-sm border-[#262a36] bg-[#12141f] text-slate-100">
          <DialogHeader>
            <DialogTitle>Eliminar cajero</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            ¿Eliminar a <strong className="text-slate-100">{deleting?.name}</strong>? Sus
            turnos pasados se conservan.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              className="border-[#262a36] bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
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
      <DialogContent className="max-w-sm border-[#262a36] bg-[#12141f] text-slate-100">
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
              className="mt-1.5 bg-[#0d0f1a]"
            />
          </div>
          <div>
            <Label htmlFor="cashier-email" className="text-slate-200">Email</Label>
            <Input
              id="cashier-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 bg-[#0d0f1a]"
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
            variant="outline"
            onClick={onClose}
            className="border-[#262a36] bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            data-testid="cashier-submit"
            disabled={name.trim().length === 0 || saving}
            onClick={() => void submit()}
            className="vx-gradient border-0 text-white"
          >
            {cashier ? "Guardar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

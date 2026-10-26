"use client";

// ---------------------------------------------------------------------------
// The Cajas view (/Registers): register cards + Nueva Caja + the
// Abrir/Cerrar Turno dialogs. Card anatomy (reference): white top strip,
// monitor chip, name, location, status pill, full-width emerald
// "Abrir Turno" (or "Cerrar Turno" when open), trash.
// ---------------------------------------------------------------------------

import * as React from "react";
import { LogIn, LogOut, Monitor, Plus, Trash2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiSend, ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { usePosStore, type Register } from "@/lib/store";

export function RegistersView() {
  const registers = usePosStore((s) => s.registers);
  const cashiers = usePosStore((s) => s.cashiers);
  const shifts = usePosStore((s) => s.shifts);
  const loadCollections = usePosStore((s) => s.loadCollections);

  const [creating, setCreating] = React.useState(false);
  const [opening, setOpening] = React.useState<Register | null>(null);
  const [closing, setClosing] = React.useState<Register | null>(null);
  const [deleting, setDeleting] = React.useState<Register | null>(null);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(
    () => loadCollections(["registers", "shifts", "cashiers"]),
    [loadCollections],
  );

  const openShiftOf = (register: Register) =>
    shifts.find((shift) => shift.registerId === register.id && shift.status === "open") ?? null;

  const remove = async (register: Register) => {
    setBusy(true);
    try {
      await apiSend("DELETE", `/api/registers/${register.id}`);
      setDeleting(null);
      await refresh();
    } catch (err: unknown) {
      void err; // the confirm dialog closes only on success
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeading
        title="Cajas Registradoras"
        subtitle={`${registers.length} cajas configuradas`}
        actions={
          <Button
            data-testid="new-register-button"
            className="glass-button-primary rounded-xl px-4 py-2.5 text-sm font-medium"
            onClick={() => setCreating(true)}
          >
            <Plus className="h-4 w-4" /> Nueva Caja
          </Button>
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="register-cards">
        {registers.map((register) => {
          const openShift = openShiftOf(register);
          return (
            <li
              key={register.id}
              className="vx-card relative overflow-hidden p-5"
              data-testid={`register-card-${register.id}`}
            >
              {/* V5/R1: the reference's closed strip is a 4px slate-200 bar;
                  the open state (unobservable there — its shift flow is a
                  dead end) extends it with the emerald accent. */}
              <div
                aria-hidden
                className={register.status === "open" ? "absolute inset-x-0 top-0 h-1 bg-emerald-500" : "absolute inset-x-0 top-0 h-1 bg-slate-200"}
              />
              <div className="mb-4 flex items-start justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <span className="flex w-12 h-12 rounded-xl bg-slate-50 items-center justify-center text-slate-400">
                    <Monitor className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-800">{register.name}</h3>
                    <p className="text-xs text-slate-500">{register.location || "—"}</p>
                  </div>
                </div>
                {register.status === "open" ? (
                  <StatusPill tone="success" variant="card">Abierta</StatusPill>
                ) : (
                  <StatusPill tone="neutral" variant="card">Cerrada</StatusPill>
                )}
              </div>

              {openShift ? (
                <p className="mb-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  Turno de {openShift.cashierName} · desde{" "}
                  {new Date(openShift.openedAt).toLocaleString("es-MX", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              ) : null}

              <div className="flex items-center gap-2">
                {openShift ? (
                  <Button
                    data-testid={`close-shift-${register.id}`}
                    className="glass-button-warning flex-1 rounded-lg px-3 py-1.5 text-sm font-medium"
                    onClick={() => setClosing(register)}
                  >
                    <LogOut className="h-4 w-4" /> Cerrar Turno
                  </Button>
                ) : (
                  <Button
                    data-testid={`open-shift-${register.id}`}
                    className="glass-button-success flex-1 rounded-lg px-3 py-1.5 text-sm font-medium"
                    onClick={() => setOpening(register)}
                  >
                    <LogIn className="h-4 w-4" /> Abrir Turno
                  </Button>
                )}
                <button
                  type="button"
                  aria-label={`Eliminar ${register.name}`}
                  data-testid={`delete-register-${register.id}`}
                  onClick={() => setDeleting(register)}
                  className="vx-focus rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {creating ? (
        <NewRegisterDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            void refresh();
          }}
        />
      ) : null}

      {opening ? (
        <OpenShiftDialog
          key={opening.id}
          register={opening}
          cashiers={cashiers}
          onClose={() => setOpening(null)}
          onSaved={() => {
            setOpening(null);
            void refresh();
          }}
        />
      ) : null}

      {closing ? (
        <CloseShiftDialog
          key={closing.id}
          register={closing}
          onClose={() => setClosing(null)}
          onSaved={() => {
            setClosing(null);
            void refresh();
          }}
        />
      ) : null}

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-sm border-[#262a36] bg-[#12141f] text-slate-100">
          <DialogHeader>
            <DialogTitle>Eliminar caja</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            ¿Eliminar <strong className="text-slate-100">{deleting?.name}</strong>? El
            historial de turnos y ventas se conserva.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              className="glass-button rounded-xl border-0 px-4 py-2.5 text-sm font-medium"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              data-testid="confirm-delete-register"
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

// ---- Nueva Caja -----------------------------------------------------------------

function NewRegisterDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await apiSend("POST", "/api/registers", { name: name.trim(), location });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la caja.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-sm border-[#262a36] bg-[#12141f] text-slate-100">
        <DialogHeader>
          <DialogTitle>Nueva Caja</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="register-name" className="text-slate-200">Nombre *</Label>
            <Input
              id="register-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              data-testid="register-name-input"
              className="mt-1.5 bg-[#0d0f1a]"
            />
          </div>
          <div>
            <Label htmlFor="register-location" className="text-slate-200">Ubicación</Label>
            <Input
              id="register-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              data-testid="register-location-input"
              className="mt-1.5 bg-[#0d0f1a]"
            />
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
            className="glass-button rounded-xl border-0 px-4 py-2.5 text-sm font-medium"
          >
            Cancelar
          </Button>
          <Button
            data-testid="register-submit"
            disabled={name.trim().length === 0 || saving}
            onClick={() => void submit()}
            className="glass-button-primary rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Abrir Turno -------------------------------------------------------------------

function OpenShiftDialog({
  register,
  cashiers,
  onClose,
  onSaved,
}: {
  register: Register;
  cashiers: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [cashierId, setCashierId] = React.useState("");
  const [floatInput, setFloatInput] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await apiSend("POST", "/api/shifts", {
        registerId: register.id,
        cashierId,
        openingFloat: floatInput.trim() === "" ? "0" : floatInput,
      });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo abrir el turno.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-sm border-[#262a36] bg-[#12141f] text-slate-100">
        <DialogHeader>
          <DialogTitle>Abrir Turno — {register.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-slate-200">Cajero/a *</Label>
            <Select value={cashierId || undefined} onValueChange={setCashierId}>
              <SelectTrigger className="mt-1.5 w-full bg-[#0d0f1a]" data-testid="shift-cashier-select">
                <SelectValue placeholder="Seleccionar cajero" />
              </SelectTrigger>
              <SelectContent className="border-[#262a36] bg-[#12141f] text-slate-100">
                {cashiers.map((cashier) => (
                  <SelectItem key={cashier.id} value={cashier.id}>
                    {cashier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cashiers.length === 0 ? (
              <p className="mt-1.5 text-xs text-amber-400">
                No hay cajeros registrados. Crea uno en la vista Cajeros.
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="shift-float" className="text-slate-200">Fondo de caja inicial</Label>
            <Input
              id="shift-float"
              inputMode="decimal"
              value={floatInput}
              onChange={(event) => setFloatInput(event.target.value)}
              placeholder="0.00"
              data-testid="shift-float-input"
              className="mt-1.5 bg-[#0d0f1a]"
            />
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
            className="glass-button rounded-xl border-0 px-4 py-2.5 text-sm font-medium"
          >
            Cancelar
          </Button>
          <Button
            data-testid="shift-submit"
            disabled={cashierId === "" || saving}
            onClick={() => void submit()}
            className="glass-button-success rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            <LogIn className="h-4 w-4" /> Iniciar Turno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Cerrar Turno ---------------------------------------------------------------------

function CloseShiftDialog({
  register,
  onClose,
  onSaved,
}: {
  register: Register;
  onClose: () => void;
  onSaved: () => void;
}) {
  const shifts = usePosStore((s) => s.shifts);
  const [amountInput, setAmountInput] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const openShift =
    shifts.find(
      (shift) => shift.registerId === register.id && shift.status === "open",
    ) ?? null;

  const expected = openShift ? openShift.openingFloat + openShift.salesTotal : 0;

  const submit = async () => {
    if (!openShift) return; // the dialog renders only from an open-shift card
    setSaving(true);
    setError("");
    try {
      await apiSend("POST", `/api/shifts/${openShift.id}/close`, {
        closingAmount: amountInput.trim() === "" ? "0" : amountInput,
      });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo cerrar el turno.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-sm border-[#262a36] bg-[#12141f] text-slate-100">
        <DialogHeader>
          <DialogTitle>Cerrar Turno — {register.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {openShift ? (
            <div className="rounded-xl bg-[#0d0f1a] p-4 text-sm">
              <p className="text-slate-400">
                Cajero: <span className="text-slate-100">{openShift.cashierName}</span>
              </p>
              <p className="mt-1 text-slate-400">
                Ventas del turno:{" "}
                <span className="font-semibold text-emerald-400">
                  {formatMoney(openShift.salesTotal)} ({openShift.salesCount} ventas)
                </span>
              </p>
              <p className="mt-1 text-slate-400">
                Esperado en caja: <span className="font-semibold text-slate-100">{formatMoney(expected)}</span>
              </p>
            </div>
          ) : null}
          <div>
            <Label htmlFor="shift-closing" className="text-slate-200">
              Dinero contado en caja
            </Label>
            <Input
              id="shift-closing"
              inputMode="decimal"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              placeholder="0.00"
              data-testid="shift-closing-input"
              className="mt-1.5 bg-[#0d0f1a]"
            />
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
            className="glass-button rounded-xl border-0 px-4 py-2.5 text-sm font-medium"
          >
            Cancelar
          </Button>
          <Button
            data-testid="shift-close-submit"
            disabled={saving}
            onClick={() => void submit()}
            className="glass-button-warning rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            Cerrar Turno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

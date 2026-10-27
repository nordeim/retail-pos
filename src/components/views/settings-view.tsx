"use client";

// ---------------------------------------------------------------------------
// The Ajustes view (/StoreSettings): Información del Negocio,
// Personalización (the two color pickers write the runtime accent vars —
// the theme IS the store settings), Ticket/Recibo footer, Proveedor de
// Pagos, Categorías de Producto, Guardar Cambios.
// ---------------------------------------------------------------------------

import * as React from "react";
import { Store, Palette, FileText, CreditCard, Tag, Plus, Upload, Trash2, ShieldCheck } from "lucide-react";

import { PageHeading, SectionCard } from "@/components/pos/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiGet, apiSend, ApiError } from "@/lib/api";
import { fileToDataUrl } from "@/lib/image";
import { usePosStore, type StoreSettings, type AppUser } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { CARD_PROVIDERS, CURRENCIES } from "@/lib/validation";
import { formatMediumSpanish } from "@/lib/date";

const DEFAULTS = {
  name: "",
  address: "",
  phone: "",
  email: "",
  fiscalId: "",
  currency: "MXN - Peso Mexicano",
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  ticketFooter: "",
  cardProvider: "Ninguno",
  // V7/F2: the logo can be explicitly CLEARED (Quitar sets null — the
  // column boots NULL and the PATCH wiring persists null).
  logoUrl: "" as string | null,
};

export function SettingsView() {
  const settings = usePosStore((s) => s.settings);
  const loadCollections = usePosStore((s) => s.loadCollections);

  React.useEffect(() => {
    void loadCollections(["settings", "categories"]);
  }, [loadCollections]);

  // The form mounts ONCE per store-load state (key-remount — no
  // effect-driven state writes; the react-hooks/set-state-in-effect rule).
  // The key is the loaded/defaults STATE, not the snapshot identity: a save
  // refreshes the store without remounting, so the "saved" status survives.
  // The store pre-warms settings before the shell flips ready, so the
  // loaded branch is the ordinary path; the default branch is the
  // cold-store fallback only.
  if (!settings) {
    return <SettingsForm key="defaults" initial={DEFAULTS} />;
  }
  return <SettingsForm key="loaded" initial={settings} />;
}

function SettingsForm({ initial }: { initial: StoreSettings | typeof DEFAULTS }) {
  const categories = usePosStore((s) => s.categories);
  const loadCollections = usePosStore((s) => s.loadCollections);
  const { toast } = useToast();
  const [form, setForm] = React.useState<StoreSettings | typeof DEFAULTS>(initial);
  const [newCategory, setNewCategory] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = React.useState("");
  const [logoName, setLogoName] = React.useState("");
  // V6/F2b: the picked logo (data URL) — stored via settings.logoUrl on save.
  // The filename chip below the control shows the pick; the preview shows the
  // stored/pending image (the reference keeps its sidebar a gradient tile, so
  // the clone renders the logo HERE only — parity with its observable UI).

  const set = <K extends keyof typeof DEFAULTS>(key: K, value: (typeof DEFAULTS)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setStatus("saving");
    setError("");
    try {
      await apiSend("PATCH", "/api/settings", form);
      await loadCollections(["settings"]);
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "No se pudo guardar.");
    }
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      await apiSend("POST", "/api/categories", { name });
      setNewCategory("");
      await loadCollections(["categories"]);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo agregar la categoría.");
    }
  };

  const removeCategory = async (id: string) => {
    try {
      await apiSend("DELETE", `/api/categories/${id}`);
      await loadCollections(["categories"]);
    } catch (err: unknown) {
      // V6/F3: surface the failure (categories with products stay put).
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar la categoría.");
    }
  };

  return (
    <div>
      <PageHeading title="Ajustes de la Tienda" subtitle="Personaliza tu negocio" />

      {/* V5/S1: the reference's wrapper — max-w-4xl (896px). */}
      <div className="max-w-4xl space-y-6">
        <SectionCard
          title="Información del Negocio"
          icon={<Store className="h-5 w-5 text-indigo-500" />}
          testId="settings-business-card"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="settings-name" className="text-slate-200">Nombre de la tienda *</Label>
              <Input
                id="settings-name"
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                data-testid="settings-name-input"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="settings-logo" className="text-slate-200">Logotipo</Label>
              {/* V5: the reference's styled control — a glass "Subir logo"
                  button (label wrapping the hidden input keeps it a single
                  click-target with native input semantics). */}
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <label
                  htmlFor="settings-logo"
                  data-testid="settings-logo-button"
                  className="glass-button vx-focus inline-flex max-w-xs cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
                >
                  <Upload className="h-4 w-4 shrink-0" />
                  <span>Subir logo</span>
                  {logoName ? (
                    <span className="truncate text-xs text-slate-400">{logoName}</span>
                  ) : null}
                </label>
                {/* V7/F2: the reference renders a data-URL preview at pick
                    time; ours keeps the aspect true at 56px and persists it
                    (logoUrl rides the PATCH — null clears, see Quitar). */}
                {form.logoUrl ? (
                  <span
                    className="flex items-center gap-2"
                    data-testid="settings-logo-preview"
                  >
                    <img
                      src={form.logoUrl}
                      alt="Vista previa del logotipo"
                      className="h-[56px] w-[56px] rounded-xl border border-[#1e2235] object-contain p-1"
                    />
                    <button
                      type="button"
                      className="vx-focus rounded-lg p-1 text-xs text-slate-400 transition-colors hover:text-red-500"
                      onClick={() => {
                        set("logoUrl", null);
                        setLogoName("");
                        const input = document.getElementById("settings-logo") as HTMLInputElement | null;
                        if (input) input.value = "";
                      }}
                    >
                      Quitar
                    </button>
                  </span>
                ) : null}
              </div>
              <input
                id="settings-logo"
                type="file"
                accept="image/*"
                data-testid="settings-logo-input"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setLogoName(file?.name ?? "");
                  if (!file) return;
                  // V6/F2b: resize client-side and ride the PATCH payload.
                  void fileToDataUrl(file).then((result) => {
                    if (result.ok) {
                      set("logoUrl", result.dataUrl);
                    } else {
                      toast.error(
                        result.reason === "too-large"
                          ? "El logotipo supera 300 KB."
                          : "No se pudo leer el logotipo.",
                      );
                    }
                  });
                }}
              />
            </div>
            <div>
              <Label htmlFor="settings-address" className="text-slate-200">Dirección</Label>
              <Input
                id="settings-address"
                value={form.address}
                onChange={(event) => set("address", event.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="settings-phone" className="text-slate-200">Teléfono</Label>
                <Input
                  id="settings-phone"
                  value={form.phone}
                  onChange={(event) => set("phone", event.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="settings-email" className="text-slate-200">Email</Label>
                <Input
                  id="settings-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => set("email", event.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="settings-fiscal" className="text-slate-200">RFC / ID Fiscal</Label>
                <Input
                  id="settings-fiscal"
                  value={form.fiscalId}
                  onChange={(event) => set("fiscalId", event.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-200">Moneda</Label>
                <Select value={form.currency} onValueChange={(value) => set("currency", value)}>
                  <SelectTrigger className="mt-1 w-full" data-testid="settings-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#262a36] bg-[#161922] text-[#e7e9ef]">
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Personalización"
          icon={<Palette className="h-5 w-5 text-purple-500" />}
        >
          {/* V8/F4: the reference's Personalización grid (grid-cols-1 →
              md:grid-cols-2) with each color as a swatch PAIRED with an
              editable hex Input (live-measured: "w-10 h-10 rounded-lg
              cursor-pointer" + the shadcn h-9 rounded-xl text field,
              same value, two-way). */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="settings-primary" className="text-slate-200">Color primario</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  id="settings-primary"
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(form.primaryColor) ? form.primaryColor : "#000000"}
                  onChange={(event) => set("primaryColor", event.target.value)}
                  data-testid="settings-primary-color"
                  className="h-10 w-10 cursor-pointer rounded-lg"
                />
                <Input
                  aria-label="Color primario (hex)"
                  value={form.primaryColor}
                  onChange={(event) => set("primaryColor", event.target.value)}
                  data-testid="settings-primary-hex"
                  className="h-9 w-full"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="settings-secondary" className="text-slate-200">Color secundario</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  id="settings-secondary"
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(form.secondaryColor) ? form.secondaryColor : "#000000"}
                  onChange={(event) => set("secondaryColor", event.target.value)}
                  data-testid="settings-secondary-color"
                  className="h-10 w-10 cursor-pointer rounded-lg"
                />
                <Input
                  aria-label="Color secundario (hex)"
                  value={form.secondaryColor}
                  onChange={(event) => set("secondaryColor", event.target.value)}
                  data-testid="settings-secondary-hex"
                  className="h-9 w-full"
                />
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Los colores tiñen la barra lateral y los botones principales al guardar.
          </p>
        </SectionCard>

        <SectionCard
          title="Ticket / Recibo"
          icon={<FileText className="h-5 w-5 text-green-500" />}
        >
          <div>
            <Label htmlFor="settings-footer" className="text-slate-200">Pie del ticket</Label>
            <Textarea
              id="settings-footer"
              value={form.ticketFooter}
              onChange={(event) => set("ticketFooter", event.target.value)}
              rows={3}
              className="mt-1"
              placeholder="¡Gracias por su compra!"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Proveedor de Pagos con Tarjeta"
          icon={<CreditCard className="h-5 w-5 text-blue-500" />}
        >
          <div>
            <Label className="text-slate-200">Proveedor</Label>
            <Select value={form.cardProvider} onValueChange={(value) => set("cardProvider", value)}>
              <SelectTrigger className="mt-1 w-full max-w-xs" data-testid="settings-card-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#262a36] bg-[#161922] text-[#e7e9ef]">
                {CARD_PROVIDERS.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SectionCard>

        <SectionCard
          title="Categorías de Producto"
          icon={<Tag className="h-5 w-5 text-amber-500" />}
          testId="settings-categories-card"
        >
          <div className="mb-4 flex gap-2">
            <Input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void addCategory();
                }
              }}
              placeholder="Nueva categoría"
              data-testid="settings-new-category"
              className="max-w-xs"
            />
            <Button
              onClick={() => void addCategory()}
              disabled={newCategory.trim().length === 0}
              data-testid="settings-add-category"
          variant="glass"
          className="glass-button h-auto rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>
          <ul className="flex flex-wrap gap-2" data-testid="settings-category-chips">
            {/* V5/S1: the reference's chips are glass-button controls
                (rounded-xl px-3 py-2 text-sm) — v15/L7: the remove control is
                the reference's lucide TRASH at w-3.5 h-3.5 (14×14 measured),
                not the ×. */}
            {categories.map((category) => (
              <li
                key={category.id}
                className="glass-button flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700"
              >
                {category.name}
                <button
                  type="button"
                  aria-label={`Eliminar categoría ${category.name}`}
                  onClick={() => void removeCategory(category.id)}
                  className="vx-focus text-slate-400 transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* V22/F1 (SD-85): the account-security superset — the four
            ADR-030 routes gain their UI. The reference has NO account
            surface (its sidebar bottom is the collapse chevron alone), so
            this section is pure superset in the settings family's own
            grammar. */}
        <AccountSection />

        {error ? (
          <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button
            data-testid="settings-save"
            disabled={form.name.trim().length === 0 || status === "saving"}
            onClick={() => void save()}
          variant="glass"
          className="glass-button-primary h-auto rounded-xl px-6 py-3.5 text-base font-medium"
          >
            {status === "saving" ? "Guardando…" : "Guardar Cambios"}
          </Button>
          {status === "saved" ? (
            <p role="status" data-testid="settings-saved" className="text-sm text-emerald-400">
              Cambios guardados.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V22/F1 — "Mi Cuenta" (SD-85..SD-91): the account-security superset. The
// four ADR-030 routes (change-password · change-email · delete-account ·
// resend-verification — the last surfaces on the login page, F3) gain their
// UI here. The reference ships NO account surface (its sidebar bottom is
// the collapse chevron alone, live-verified v22/L8), so every line below
// is pure superset built from the settings family's own measured grammar:
// the SectionCard + icon family (ShieldCheck/rose — the tone the five store
// sections leave free), the Dialog family (max-w-lg, the 42px footer, glass
// buttons), and the destructive AlertDialog for the exit.
// ---------------------------------------------------------------------------

function AccountSection() {
  const [me, setMe] = React.useState<AppUser | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [dialog, setDialog] = React.useState<
    "name" | "password" | "email" | "delete" | null
  >(null);

  // Self-contained identity read (SD-90): /api/auth/me through the api
  // seam — the async resolution is the sanctioned setState shape (the
  // page.tsx boot pattern; never synchronous-in-effect).
  React.useEffect(() => {
    let cancelled = false;
    apiGet<{ user: AppUser }>("/api/auth/me")
      .then(({ user }) => {
        if (!cancelled) setMe(user);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    // The section degrades quietly — the store settings stay usable when
    // the identity read fails (a transient blip, not a view-killing error).
    return null;
  }

  return (
    <SectionCard
      title="Mi Cuenta"
      icon={<ShieldCheck className="h-5 w-5 text-rose-500" />}
      testId="account-section"
    >
      {me ? (
        <div className="space-y-4">
          {/* The identity readout (SD-90): email, name, the verified badge,
              and the member-since line in the es-MX date family. */}
          <div className="space-y-1.5" data-testid="account-readout">
            <div className="flex flex-wrap items-center gap-2">
              <span
                data-testid="account-email"
                className="font-semibold text-slate-200"
              >
                {me.email}
              </span>
              {me.emailVerified ? (
                <span
                  data-testid="account-verified-badge"
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400"
                >
                  Verificada
                </span>
              ) : null}
            </div>
            {me.name ? <p className="text-sm text-slate-400">{me.name}</p> : null}
            <p className="text-xs text-slate-500">
              Miembro desde {formatMediumSpanish(new Date(me.createdAt))}
            </p>
          </div>

          {/* The four actions — the settings card-action family (glass
              buttons at the 34px size). The exit carries the destructive
              red text; its dialog owns the cascade warning. V23: the name
              edit joins between the email rotation and the destructive
              exit (SD-96 — the benign edit never precedes the credentials,
              the destructive stays last). */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="glass"
              onClick={() => setDialog("password")}
              data-testid="account-change-password-button"
              className="glass-button h-auto rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              Cambiar contraseña
            </Button>
            <Button
              variant="glass"
              onClick={() => setDialog("email")}
              data-testid="account-change-email-button"
              className="glass-button h-auto rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              Cambiar correo
            </Button>
            <Button
              variant="glass"
              onClick={() => setDialog("name")}
              data-testid="account-change-name-button"
              className="glass-button h-auto rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              Cambiar nombre
            </Button>
            <Button
              variant="glass"
              onClick={() => setDialog("delete")}
              data-testid="account-delete-button"
              className="glass-button h-auto rounded-lg px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300"
            >
              Eliminar cuenta
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="h-4 w-52 animate-pulse rounded bg-white/5" />
          <div className="h-3 w-36 animate-pulse rounded bg-white/5" />
        </div>
      )}

      {/* Key-remount per dialog open (the React-conventions rule — no
          effect-driven form resets). */}
      {dialog === "name" ? (
        <ChangeNameDialog
          currentName={me?.name ?? ""}
          onClose={() => setDialog(null)}
          onChanged={(name) =>
            setMe((prev) => (prev ? { ...prev, name } : prev))
          }
        />
      ) : null}
      {dialog === "password" ? (
        <ChangePasswordDialog onClose={() => setDialog(null)} />
      ) : null}
      {dialog === "email" ? (
        <ChangeEmailDialog
          currentEmail={me?.email ?? ""}
          onClose={() => setDialog(null)}
          onChanged={(email) =>
            setMe((prev) => (prev ? { ...prev, email } : prev))
          }
        />
      ) : null}
      {dialog === "delete" ? <DeleteAccountDialog onClose={() => setDialog(null)} /> : null}
    </SectionCard>
  );
}

// V23/ADR-032 (SD-96): the profile name edit — the account-surface
// family's last read-only field gains its dialog. The measured Dialog
// grammar (max-w-lg, the 42px glass-button footer, key-remount), the
// TRANSPARENT settings-view input (measured trap 13), the prefilled
// current name, and the onChanged seam (the change-email precedent).
function ChangeNameDialog({
  currentName,
  onClose,
  onChanged,
}: {
  currentName: string;
  onClose: () => void;
  /** SD-96: the readout re-points from the route's response. */
  onChanged: (name: string) => void;
}) {
  const { toast } = useToast();
  const [fullName, setFullName] = React.useState(currentName);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      // SD-93/94: session-gated, rate-limited, NO password proof (the
      // benign-field family split — fullName carries no auth semantics).
      const res = await apiSend<{ ok: boolean; name: string }>(
        "POST",
        "/api/auth/update-profile",
        { fullName },
      );
      setSaved(true);
      if (typeof res?.name === "string") {
        onChanged(res.name);
      }
      toast.success("Nombre actualizado.");
      window.setTimeout(onClose, 900);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar el nombre.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent
        data-testid="change-name-dialog"
        className="border-[#262a36] bg-[#0f121a] text-[#e7e9ef]"
      >
        <DialogHeader>
          <DialogTitle>Cambiar nombre</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="full-name" className="text-slate-200">Nombre completo *</Label>
            <Input
              id="full-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              data-testid="name-input"
              className="mt-1"
              maxLength={100}
              required
            />
          </div>
          {error ? (
            <p
              role="alert"
              data-testid="change-name-error"
              className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400"
            >
              {error}
            </p>
          ) : null}
          {saved ? (
            <p
              role="status"
              data-testid="change-name-success"
              className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400"
            >
              Nombre actualizado.
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
            variant="glass"
            disabled={busy || saved || fullName.trim().length === 0}
            onClick={() => void submit()}
            data-testid="change-name-submit"
            className="glass-button-primary h-auto rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            {busy ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    if (newPassword !== confirmPassword) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      // ADR-030: the session SURVIVES the rotation by design (the cookie
      // is an HMAC over AUTH_SECRET, not the password).
      await apiSend("POST", "/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setSaved(true);
      toast.success("Contraseña actualizada.");
      window.setTimeout(onClose, 900);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent
        data-testid="change-password-dialog"
        className="border-[#262a36] bg-[#0f121a] text-[#e7e9ef]"
      >
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="current-password" className="text-slate-200">Contraseña actual *</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              data-testid="current-password-input"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="new-password" className="text-slate-200">Nueva contraseña *</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              data-testid="new-password-input"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="confirm-password" className="text-slate-200">Confirmar contraseña *</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              data-testid="confirm-password-input"
              className="mt-1"
              required
            />
          </div>
          {error ? (
            <p
              role="alert"
              data-testid="change-password-error"
              className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400"
            >
              {error}
            </p>
          ) : null}
          {saved ? (
            <p
              role="status"
              data-testid="change-password-success"
              className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400"
            >
              Contraseña actualizada.
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
            variant="glass"
            disabled={
              busy ||
              saved ||
              currentPassword.length === 0 ||
              newPassword.length === 0 ||
              confirmPassword.length === 0
            }
            onClick={() => void submit()}
            data-testid="change-password-submit"
            className="glass-button-primary h-auto rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            {busy ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangeEmailDialog({
  currentEmail,
  onClose,
  onChanged,
}: {
  currentEmail: string;
  onClose: () => void;
  /** SD-90: the readout re-points from the route's response. */
  onChanged: (email: string) => void;
}) {
  const { toast } = useToast();
  const [password, setPassword] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await apiSend<{ ok: boolean; email: string }>(
        "POST",
        "/api/auth/change-email",
        { password, newEmail },
      );
      setSaved(true);
      if (typeof res?.email === "string") {
        onChanged(res.email);
      }
      toast.success("Correo actualizado.");
      window.setTimeout(onClose, 900);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar el correo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent
        data-testid="change-email-dialog"
        className="border-[#262a36] bg-[#0f121a] text-[#e7e9ef]"
      >
        <DialogHeader>
          <DialogTitle>Cambiar correo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            El correo de inicio de sesión actual es{" "}
            <span className="font-medium text-slate-200">{currentEmail}</span>.
          </p>
          <div>
            <Label htmlFor="email-password" className="text-slate-200">Contraseña *</Label>
            <Input
              id="email-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              data-testid="email-password-input"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="new-email" className="text-slate-200">Nuevo correo *</Label>
            <Input
              id="new-email"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              data-testid="new-email-input"
              className="mt-1"
              placeholder="nuevo@correo.com"
              required
            />
          </div>
          {error ? (
            <p
              role="alert"
              data-testid="change-email-error"
              className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400"
            >
              {error}
            </p>
          ) : null}
          {saved ? (
            <p
              role="status"
              data-testid="change-email-success"
              className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400"
            >
              Correo actualizado.
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
            variant="glass"
            disabled={busy || saved || password.length === 0 || newEmail.trim().length === 0}
            onClick={() => void submit()}
            data-testid="change-email-submit"
            className="glass-button-primary h-auto rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            {busy ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      // The route wipes every owned collection (Cascade) and clears the
      // session cookie — the client mirrors the logout() mechanics: reset
      // the store, land on /login.
      await apiSend("POST", "/api/auth/delete-account", { password });
      usePosStore.getState().reset();
      window.location.replace("/login");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar la cuenta.");
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent
        data-testid="delete-account-dialog"
        className="border-[#262a36] bg-[#0f121a] text-[#e7e9ef]"
      >
        <DialogHeader>
          <DialogTitle>Eliminar cuenta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* The cascade warning (SD-89) — the retail domain's wipe, in the
              destructive red family. */}
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm leading-relaxed text-red-400">
            Esta acción no se puede deshacer. Se eliminarán permanentemente tu
            cuenta, tus productos, categorías, cajas, cajeros, turnos, ventas y
            ajustes. Haz una copia de la base de datos antes de continuar si
            necesitas conservar la información.
          </p>
          <div>
            <Label htmlFor="delete-password" className="text-slate-200">
              Confirma con tu contraseña *
            </Label>
            <Input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              data-testid="delete-password-input"
              className="mt-1"
              required
            />
          </div>
          {error ? (
            <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          ) : null}
        </div>
        {/* The codebase's UNIFORM dialog family (the registers/cajas delete
            guards) — a plain Dialog + glass Buttons. The AlertDialog
            primitive's cva defaults would clobber the glass fills (the
            V6/F6 trap), and consistency with every other destructive
            confirm in this app wins. */}
        <DialogFooter className="gap-2">
          <Button
            variant="glass"
            onClick={onClose}
            className="glass-button h-auto rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            Cancelar
          </Button>
          <Button
            variant="glass"
            disabled={busy || password.length === 0}
            onClick={() => void submit()}
            data-testid="delete-account-confirm"
            className="glass-button-danger h-auto rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            {busy ? "Eliminando…" : "Eliminar definitivamente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

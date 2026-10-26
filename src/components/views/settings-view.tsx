"use client";

// ---------------------------------------------------------------------------
// The Ajustes view (/StoreSettings): Información del Negocio,
// Personalización (the two color pickers write the runtime accent vars —
// the theme IS the store settings), Ticket/Recibo footer, Proveedor de
// Pagos, Categorías de Producto, Guardar Cambios.
// ---------------------------------------------------------------------------

import * as React from "react";
import { Store, Palette, FileText, CreditCard, Tag, Plus, Upload, X } from "lucide-react";

import { PageHeading, SectionCard } from "@/components/pos/shared";
import { Button } from "@/components/ui/button";
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
import { fileToDataUrl } from "@/lib/image";
import { usePosStore, type StoreSettings } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { CARD_PROVIDERS, CURRENCIES } from "@/lib/validation";

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
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="settings-logo" className="text-slate-200">Logotipo</Label>
              {/* V5: the reference's styled control — a glass "Subir logo"
                  button (label wrapping the hidden input keeps it a single
                  click-target with native input semantics). */}
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
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
                      className="vx-focus rounded-lg p-1 text-xs text-slate-400 hover:text-red-400"
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
                className="mt-1.5"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="settings-phone" className="text-slate-200">Teléfono</Label>
                <Input
                  id="settings-phone"
                  value={form.phone}
                  onChange={(event) => set("phone", event.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="settings-email" className="text-slate-200">Email</Label>
                <Input
                  id="settings-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => set("email", event.target.value)}
                  className="mt-1.5"
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
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-slate-200">Moneda</Label>
                <Select value={form.currency} onValueChange={(value) => set("currency", value)}>
                  <SelectTrigger className="mt-1.5 w-full" data-testid="settings-currency">
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
            <textarea
              id="settings-footer"
              value={form.ticketFooter}
              onChange={(event) => set("ticketFooter", event.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
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
              <SelectTrigger className="mt-1.5 w-full max-w-xs" data-testid="settings-card-provider">
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
                (rounded-xl px-3 py-2 text-sm) with the red-hover X. */}
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
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

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

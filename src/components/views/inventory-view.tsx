"use client";

// ---------------------------------------------------------------------------
// The Inventario view: search + category chips + the product table + the
// Nuevo Producto / edit dialog. The dialog's field set is reference-verified:
// Nombre*, Código de barras*, Categoría, Precio de venta*, Costo, Stock
// actual (0), Stock mínimo (5), IVA (%) (16), Unidad (Pieza), Imagen del
// producto, Producto activo (switch), Cancelar/Crear.
// ---------------------------------------------------------------------------

import * as React from "react";
import { Package, Pencil, Plus, Save, Search, Trash2 } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { apiSend, ApiError } from "@/lib/api";
import { fileToDataUrl } from "@/lib/image";
import { formatMoney } from "@/lib/money";
import { UNITS } from "@/lib/validation";
import { usePosStore, type Product } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function InventoryView() {
  const products = usePosStore((s) => s.products);
  const categories = usePosStore((s) => s.categories);
  const loadCollections = usePosStore((s) => s.loadCollections);
  const { toast } = useToast();

  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("Todos");
  const [editing, setEditing] = React.useState<Product | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<Product | null>(null);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(
    () => loadCollections(["products", "categories"]),
    [loadCollections],
  );

  const visible = products.filter((p) => {
    if (category !== "Todos" && p.categoryName !== category) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.barcode.includes(q);
  });

  const remove = async (product: Product) => {
    setBusy(true);
    try {
      await apiSend("DELETE", `/api/products/${product.id}`);
      setDeleting(null);
      await refresh();
    } catch (err: unknown) {
      // V6/F3: the failure is TOASTED (the dialog stays open, the row stays);
      // the old `void err` left the user with zero feedback.
      toast.error(err instanceof ApiError ? err.message : `No se pudo eliminar ${product.name}.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeading
        title="Inventario"
        subtitle={`${products.length} productos registrados`}
        actions={
          <Button
            data-testid="new-product-button"
          variant="glass"
          className="glass-button-primary rounded-xl px-4 py-2.5 text-sm font-medium"
            onClick={() => setEditing("new")}
          >
            <Plus className="h-4 w-4" /> Nuevo Producto
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o código..."
            aria-label="Buscar productos"
            data-testid="inventory-search"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2" data-testid="inventory-chips">
          {[("Todos" as const), ...categories.map((c) => c.name)].map((name) => (
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

      <div className="vx-card overflow-hidden">
        <div className="vx-scroll overflow-x-auto">
          <table className="w-full min-w-[860px]" data-testid="inventory-table">
            <thead>
              {/* V5/T1b: the reference's header + cell contract (live-probed):
                  headers text-xs/600/slate-500 uppercase px-5 py-3; producto
                  chip w-10 h-10 indigo-50 + indigo-300 package; código mono
                  slate-500; precio bold slate-800 right; stock bold slate-700;
                  categoría = the shadcn secondary badge. */}
              <tr className="border-b border-[#1e2235]">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase px-5 py-3">Producto</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase px-5 py-3">Código</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase px-5 py-3">Precio</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase px-5 py-3">Stock</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase px-5 py-3">Categoría</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase px-5 py-3">Estado</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <Package className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                    Sin productos que coincidan.
                  </td>
                </tr>
              ) : (
                visible.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-50 transition-colors last:border-0 hover:bg-white/40"
                    data-testid={`product-row-${product.id}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex w-10 h-10 rounded-lg bg-indigo-50 shrink-0 items-center justify-center text-indigo-300">
                          <Package className="w-5 h-5" strokeWidth={2} />
                        </span>
                        <span className="font-semibold text-sm text-slate-800">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500 font-mono">{product.barcode}</td>
                    <td className="px-5 py-3 text-sm font-bold text-slate-800 text-right">{formatMoney(product.price)}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm font-bold text-slate-700">{product.stock}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80">
                        {product.categoryName ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {product.active ? (
                        <StatusPill tone="success">Activo</StatusPill>
                      ) : (
                        <StatusPill tone="neutral">Inactivo</StatusPill>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Editar ${product.name}`}
                          data-testid={`edit-product-${product.id}`}
                          onClick={() => setEditing(product)}
                          className="vx-focus rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar ${product.name}`}
                          data-testid={`delete-product-${product.id}`}
                          onClick={() => setDeleting(product)}
                          className="vx-focus rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {editing !== null ? (
        <ProductDialog
          key={editing === "new" ? "new" : editing.id}
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void refresh();
          }}
        />
      ) : null}

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="border-[#262a36] bg-[#0f121a] text-[#e7e9ef]">
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            ¿Eliminar <strong className="text-slate-100">{deleting?.name}</strong>? Las ventas
            anteriores conservan su historial.
          </p>
          <DialogFooter className="gap-2">
            <Button
              onClick={() => setDeleting(null)}
          variant="glass"
          className="glass-button h-auto rounded-xl px-4 py-2.5 text-sm font-medium"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              data-testid="confirm-delete-product"
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

// ---- the create/edit dialog ------------------------------------------------------

function ProductDialog({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const categories = usePosStore((s) => s.categories);
  const [name, setName] = React.useState(product?.name ?? "");
  const [barcode, setBarcode] = React.useState(product?.barcode ?? "");
  const [categoryId, setCategoryId] = React.useState(product?.categoryId ?? "");
  const [price, setPrice] = React.useState(product ? (product.price / 100).toFixed(2) : "");
  const [cost, setCost] = React.useState(product ? (product.cost / 100).toFixed(2) : "");
  const [stock, setStock] = React.useState(product ? String(product.stock) : "0");
  const [minStock, setMinStock] = React.useState(product ? String(product.minStock) : "5");
  const [ivaRate, setIvaRate] = React.useState(product ? String(product.ivaRate) : "16");
  const [unit, setUnit] = React.useState(product?.unit ?? "Pieza");
  // V6/F2: the picked image's data URL (canvas-resized by src/lib/image.ts);
  // null = untouched, "" = cleared, otherwise the stored data URL.
  const [imageUrl, setImageUrl] = React.useState(product?.imageUrl ?? "");
  const [imageError, setImageError] = React.useState("");
  const [active, setActive] = React.useState(product?.active ?? true);
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const valid = name.trim().length > 0 && barcode.trim().length > 0 && price.trim().length > 0;

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        barcode: barcode.trim(),
        categoryId: categoryId === "none" ? "" : categoryId,
        price,
        cost: cost.trim() === "" ? "0" : cost,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        ivaRate: Number(ivaRate) || 0,
        unit,
        // V7/F1: null (not undefined) when cleared — an undefined key is
        // dropped by JSON.stringify and skipped by sentKeysPatch, so the
        // old form left the stored image on the server forever.
        imageUrl: imageUrl === "" ? null : imageUrl,
        active,
      };
      if (product) {
        await apiSend("PATCH", `/api/products/${product.id}`, payload);
      } else {
        await apiSend("POST", "/api/products", payload);
      }
      onSaved();
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo guardar el producto.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#262a36] bg-[#0f121a] text-[#e7e9ef]">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="product-name" className="text-slate-200">Nombre *</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              data-testid="product-name-input"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="product-barcode" className="text-slate-200">Código de barras *</Label>
              <Input
                id="product-barcode"
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                data-testid="product-barcode-input"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-200">Categoría</Label>
              <Select
                value={categoryId || undefined}
                onValueChange={setCategoryId}
              >
                <SelectTrigger
                className="mt-1 w-full"
                data-testid="product-category-select"
              >
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className="border-[#262a36] bg-[#161922] text-[#e7e9ef]">
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="product-price" className="text-slate-200">Precio de venta *</Label>
              {/* V7/V2: type=number — the reference's own control type (its
                  spinners render on hover; native keystroke filtering). */}
              <Input
                id="product-price"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                data-testid="product-price-input"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="product-cost" className="text-slate-200">Costo</Label>
              <Input
                id="product-cost"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="product-stock" className="text-slate-200">Stock actual</Label>
              <Input
                id="product-stock"
                type="number"
                step="1"
                inputMode="numeric"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="product-min-stock" className="text-slate-200">Stock mínimo</Label>
              <Input
                id="product-min-stock"
                type="number"
                step="1"
                inputMode="numeric"
                value={minStock}
                onChange={(event) => setMinStock(event.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="product-iva" className="text-slate-200">IVA (%)</Label>
              <Input
                id="product-iva"
                type="number"
                step="1"
                inputMode="numeric"
                value={ivaRate}
                onChange={(event) => setIvaRate(event.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-200">Unidad</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="mt-1 w-full" data-testid="product-unit-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#262a36] bg-[#161922] text-[#e7e9ef]">
                  {UNITS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="product-image" className="text-slate-200">Imagen del producto</Label>
            {/* V6/F2: the picked file is resized to a data URL client-side
                and STORED (imageUrl) — a real upload, no longer a no-op. */}
            <Input
              id="product-image"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setImageError("");
                // V7/F3: a bare return on picker-cancel — the old branch
                // cleared the preview when a browser fired change with an
                // empty FileList; only an explicit Quitar clears.
                if (!file) return;
                void fileToDataUrl(file).then((result) => {
                  if (result.ok) {
                    setImageUrl(result.dataUrl);
                  } else {
                    // A failed pick leaves any previously stored image in
                    // place — only the inline error changes (V7/F1).
                    setImageError(
                      result.reason === "too-large"
                        ? "La imagen supera 300 KB."
                        : "No se pudo leer la imagen.",
                    );
                  }
                });
              }}
              className="mt-1 text-slate-400"
            />
            {imageError ? (
              <p role="alert" className="mt-1 text-xs text-red-400">{imageError}</p>
            ) : null}
            {imageUrl ? (
              <span className="mt-2 flex items-center gap-2" data-testid="product-image-preview">
                <img src={imageUrl} alt="Vista previa" className="h-10 w-10 rounded-lg object-cover" />
                <button
                  type="button"
                  className="vx-focus rounded-lg p-1 text-xs text-slate-400 transition-colors hover:text-red-500"
                  onClick={() => {
                    setImageUrl("");
                    const input = document.getElementById("product-image") as HTMLInputElement | null;
                    if (input) input.value = "";
                  }}
                >
                  Quitar
                </button>
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} id="product-active" />
            <Label htmlFor="product-active" className="text-slate-200">Producto activo</Label>
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
          {/* V6/V1: the reference's 42px dialog submit — glass-button-primary
              + h-auto (the cva h-9 base was clamping it to 36px) with a
              VISIBLE lucide-save icon (the hidden study-app remnant is gone). */}
          <Button
            data-testid="product-submit"
            disabled={!valid || saving}
            onClick={() => void submit()}
          variant="glass"
          className="glass-button-primary h-auto rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            <Save className="h-4 w-4" />
            {product ? "Guardar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

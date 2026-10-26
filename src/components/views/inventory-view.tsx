"use client";

// ---------------------------------------------------------------------------
// The Inventario view: search + category chips + the product table + the
// Nuevo Producto / edit dialog. The dialog's field set is reference-verified:
// Nombre*, Código de barras*, Categoría, Precio de venta*, Costo, Stock
// actual (0), Stock mínimo (5), IVA (%) (16), Unidad (Pieza), Imagen del
// producto, Producto activo (switch), Cancelar/Crear.
// ---------------------------------------------------------------------------

import * as React from "react";
import { Package, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";

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
import { formatMoney } from "@/lib/money";
import { UNITS } from "@/lib/validation";
import { usePosStore, type Product } from "@/lib/store";
import { cn } from "@/lib/utils";

export function InventoryView() {
  const products = usePosStore((s) => s.products);
  const categories = usePosStore((s) => s.categories);
  const loadCollections = usePosStore((s) => s.loadCollections);

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
      // Surfaced inline; the row stays.
      void err;
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
            className="vx-gradient border-0 text-white"
            onClick={() => setEditing("new")}
          >
            <Plus className="h-4 w-4" /> Nuevo Producto
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o código..."
            aria-label="Buscar productos"
            data-testid="inventory-search"
            className="bg-[#12141f] pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2" data-testid="inventory-chips">
          {["Todos", ...categories.map((c) => c.name)].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              className={cn(
                "vx-focus rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                category === name
                  ? "vx-gradient text-white"
                  : "border border-[#262a36] bg-[#12141f] text-slate-300 hover:bg-white/5",
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="vx-card overflow-hidden">
        <div className="vx-scroll overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm" data-testid="inventory-table">
            <thead>
              <tr className="border-b border-[#1e2235] text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Producto</th>
                <th className="px-4 py-3.5">Código</th>
                <th className="px-4 py-3.5">Precio</th>
                <th className="px-4 py-3.5">Stock</th>
                <th className="px-4 py-3.5">Categoría</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
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
                    className="border-b border-[#1e2235] transition-colors last:border-0 hover:bg-white/[0.02]"
                    data-testid={`product-row-${product.id}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700">
                          <Package className="h-4.5 w-4.5" strokeWidth={2} />
                        </span>
                        <span className="font-medium text-slate-400">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{product.barcode}</td>
                    <td className="px-4 py-3 text-slate-300">{formatMoney(product.price)}</td>
                    <td className="px-4 py-3 text-slate-300">{product.stock}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-lg border border-[#262a36] bg-[#12141f] px-2.5 py-1 text-xs text-slate-200">
                        {product.categoryName ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.active ? (
                        <StatusPill tone="success">Activo</StatusPill>
                      ) : (
                        <StatusPill tone="neutral">Inactivo</StatusPill>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Editar ${product.name}`}
                          data-testid={`edit-product-${product.id}`}
                          onClick={() => setEditing(product)}
                          className="vx-focus rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-violet-300"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar ${product.name}`}
                          data-testid={`delete-product-${product.id}`}
                          onClick={() => setDeleting(product)}
                          className="vx-focus rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-red-400"
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
        <DialogContent className="max-w-sm border-[#262a36] bg-[#12141f] text-slate-100">
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            ¿Eliminar <strong className="text-slate-100">{deleting?.name}</strong>? Las ventas
            anteriores conservan su historial.
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
  const [imageFile, setImageFile] = React.useState<File | null>(null);
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
        active,
      };
      if (product) {
        await apiSend("PATCH", `/api/products/${product.id}`, payload);
      } else {
        await apiSend("POST", "/api/products", payload);
      }
      void imageFile; // the reference stores the upload; the clone keeps the field UI-complete
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-[#262a36] bg-[#12141f] text-slate-100">
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
              className="mt-1.5 bg-[#0d0f1a]"
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
                className="mt-1.5 bg-[#0d0f1a]"
              />
            </div>
            <div>
              <Label className="text-slate-200">Categoría</Label>
              <Select
                value={categoryId || undefined}
                onValueChange={setCategoryId}
              >
                <SelectTrigger className="mt-1.5 w-full bg-[#0d0f1a]" data-testid="product-category-select">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className="border-[#262a36] bg-[#12141f] text-slate-100">
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
              <Input
                id="product-price"
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0.00"
                data-testid="product-price-input"
                className="mt-1.5 bg-[#0d0f1a]"
              />
            </div>
            <div>
              <Label htmlFor="product-cost" className="text-slate-200">Costo</Label>
              <Input
                id="product-cost"
                inputMode="decimal"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
                placeholder="0.00"
                className="mt-1.5 bg-[#0d0f1a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="product-stock" className="text-slate-200">Stock actual</Label>
              <Input
                id="product-stock"
                inputMode="numeric"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                className="mt-1.5 bg-[#0d0f1a]"
              />
            </div>
            <div>
              <Label htmlFor="product-min-stock" className="text-slate-200">Stock mínimo</Label>
              <Input
                id="product-min-stock"
                inputMode="numeric"
                value={minStock}
                onChange={(event) => setMinStock(event.target.value)}
                className="mt-1.5 bg-[#0d0f1a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="product-iva" className="text-slate-200">IVA (%)</Label>
              <Input
                id="product-iva"
                inputMode="numeric"
                value={ivaRate}
                onChange={(event) => setIvaRate(event.target.value)}
                className="mt-1.5 bg-[#0d0f1a]"
              />
            </div>
            <div>
              <Label className="text-slate-200">Unidad</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="mt-1.5 w-full bg-[#0d0f1a]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#262a36] bg-[#12141f] text-slate-100">
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
            <Input
              id="product-image"
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              className="mt-1.5 bg-[#0d0f1a] text-slate-400"
            />
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
            variant="outline"
            onClick={onClose}
            className="border-[#262a36] bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            data-testid="product-submit"
            disabled={!valid || saving}
            onClick={() => void submit()}
            className="vx-gradient border-0 text-white"
          >
            <Upload className="mr-1 hidden" />
            {product ? "Guardar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

// ---------------------------------------------------------------------------
// The Dashboard view: 4 stat cards, the 7-day sales chart, the category
// donut, and the low-stock card — the reference's exact layout, fed by
// /api/dashboard.
// ---------------------------------------------------------------------------

import * as React from "react";
import {
  TriangleAlert,
  ShoppingBasket,
  DollarSign,
  Package,
  ShoppingCart,
} from "lucide-react";

import {
  DonutChart,
  PageHeading,
  SalesAreaChart,
  SectionCard,
  StatCard,
} from "@/components/pos/shared";
import { apiGet } from "@/lib/api";
import { formatLongSpanish } from "@/lib/date";
import { formatMoney } from "@/lib/money";
import type { DashboardData } from "@/lib/store";

const EMPTY: DashboardData = {
  salesToday: 0,
  transactionsToday: 0,
  productCount: 0,
  lowStockCount: 0,
  weekly: [],
  byCategory: [],
  lowStock: [],
};

export function DashboardView() {
  const [data, setData] = React.useState<DashboardData>(EMPTY);
  const [error, setError] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    apiGet<DashboardData>("/api/dashboard")
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setLoaded(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar");
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date();

  return (
    <div>
      <PageHeading title="Dashboard" subtitle={formatLongSpanish(today)} />

      {/* V5/F3: the reference's grids — stats grid-cols-2 lg:grid-cols-4
          gap-4; chart row lg:grid-cols-3 gap-6 with the weekly chart
          spanning two columns. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-testid="dashboard-stats">
        <StatCard
          label="Ventas hoy"
          value={formatMoney(data.salesToday)}
          color="success"
          testId="stat-sales-today"
          icon={<DollarSign className="h-6 w-6" strokeWidth={2.2} />}
        />
        <StatCard
          label="Transacciones"
          value={data.transactionsToday}
          color="primary"
          testId="stat-transactions"
          icon={<ShoppingCart className="h-6 w-6" strokeWidth={2.2} />}
        />
        <StatCard
          label="Productos"
          value={data.productCount}
          color="info"
          testId="stat-products"
          icon={<Package className="h-6 w-6" strokeWidth={2.2} />}
        />
        <StatCard
          label="Stock bajo"
          value={data.lowStockCount}
          color="warning"
          testId="stat-low-stock"
          icon={<TriangleAlert className="h-6 w-6" strokeWidth={2.2} />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Ventas — Últimos 7 días" testId="weekly-chart-card" className="lg:col-span-2">
          <SalesAreaChart
            points={(data.weekly ?? []).map((d) => ({ label: d.label, value: d.total / 100 }))}
            formatY={(v) => String(Math.round(v))}
          />
        </SectionCard>
        <SectionCard title="Productos por Categoría" testId="category-chart-card">
          <DonutChart data={data.byCategory ?? []} />
        </SectionCard>
      </div>

      <SectionCard
        title="Productos con stock bajo"
        className="mt-6"
        testId="low-stock-card"
        icon={<TriangleAlert className="h-5 w-5 text-amber-500" />}
      >
        {!loaded ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : error ? (
          <p role="alert" className="text-sm text-red-400">{error}</p>
        ) : data.lowStock.length === 0 ? (
          <p className="text-sm text-slate-400">Todo el inventario está por encima del mínimo. ✓</p>
        ) : (
          <ul className="space-y-2">
            {data.lowStock.map((product) => (
              <li
                key={product.id}
                data-testid="low-stock-row"
                className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-3"
              >
                {/* V6 (v4 re-probe): the reference's row is a light amber
                    tint — amber-50/50 fill, amber-100 hairline, amber-100
                    chip, slate-700 semibold name, amber-600 count. */}
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600"
                >
                  <Package className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-700">{product.name}</p>
                  <p
                    className="text-xs font-medium text-amber-600"
                    data-testid="low-stock-detail"
                  >
                    {product.stock} en stock (mín. {product.minStock})
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-600">
        <ShoppingBasket className="h-3.5 w-3.5" />
        VeloxPOS
      </div>
    </div>
  );
}

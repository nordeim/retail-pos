"use client";

// ---------------------------------------------------------------------------
// Shared POS presentational pieces: the page heading, the stat card (with
// the reference's ghost duplicate icon), section cards, status pills, and
// the hand-rolled SVG charts (area / donut) — zero chart dependencies,
// deterministic, dark-canvas measured.
// ---------------------------------------------------------------------------

import * as React from "react";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";

// ---- page heading ------------------------------------------------------------

export function PageHeading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {/* V2: the reference's H1 is 24px FIXED at every width (390 + 1280
            measured) — no sm: bump. */}
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}

// ---- stat card -----------------------------------------------------------------

// v4 live-probed ramps: the dashboard's blob + chip gradients.
const STAT_COLORS = {
  success: {
    blob: "from-green-400 to-emerald-500",
    chip: "from-green-400 to-emerald-500",
  },
  primary: {
    blob: "from-indigo-400 to-purple-500",
    chip: "from-indigo-400 to-purple-500",
  },
  info: {
    blob: "from-blue-400 to-indigo-500",
    chip: "from-blue-400 to-indigo-500",
  },
  warning: {
    blob: "from-amber-400 to-orange-500",
    chip: "from-amber-400 to-orange-500",
  },
} as const;

export function StatCard({
  label,
  value,
  icon,
  color,
  layout = "stack",
  testId,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: keyof typeof STAT_COLORS;
  /** "stack" = the dashboard KPI (blob + label/value left, chip right);
   *  "row" = the reports summary (chip left, label/value right). Both
   *  anatomies measured live on the reference (v4). */
  layout?: "stack" | "row";
  testId?: string;
}) {
  const palette = STAT_COLORS[color];
  const chip = (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center p-2.5 rounded-xl bg-gradient-to-br text-white",
        palette.chip,
      )}
    >
      {icon}
    </span>
  );

  if (layout === "row") {
    return (
      <div data-testid={testId} className="vx-card flex items-center gap-4 p-5">
        <span
          className={cn(
            "flex w-12 h-12 rounded-2xl shrink-0 items-center justify-center bg-gradient-to-br text-white",
            palette.chip,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-white/35">{label}</p>
          <p className="mt-0.5 truncate text-2xl font-black text-white">{value}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={testId}
      className="vx-card relative overflow-hidden p-5"
    >
      {/* The reference's corner gradient blob (80px circle, 20% opacity). */}
      <div
        aria-hidden
        className={cn(
          "absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br opacity-20",
          palette.blob,
        )}
      />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {label}
          </p>
          {/* SD-1: the reference pins text-slate-800 here — 1.27:1 on its own
              card (unreadable; its Reports page uses white for the same
              value). We keep the readable tone. */}
          <p className="mt-1 text-2xl font-bold text-slate-100">{value}</p>
        </div>
        {chip}
      </div>
    </div>
  );
}

// ---- section card ----------------------------------------------------------------

export function SectionCard({
  title,
  icon,
  children,
  className,
  testId,
  variant = "card",
}: {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  testId?: string;
  /** V1: "card" = the dashboard/ajustes heading (h3, title-case, 16px/700,
   *  slate-700 — measured live); "kicker" = the reports heading (h2,
   *  uppercase, 14px/700, white/60, 0.7px tracking — measured live). */
  variant?: "card" | "kicker";
}) {
  return (
    <div data-testid={testId} className={cn("vx-card p-5", className)}>
      {title ? (
        <div className="mb-4 flex items-center gap-2">
          {icon}
          {variant === "kicker" ? (
            <h2 className="text-sm font-bold uppercase tracking-[0.7px] text-white/60">
              {title}
            </h2>
          ) : (
            <h3 className="text-base font-bold text-slate-700">{title}</h3>
          )}
        </div>
      ) : null}
      {children}
    </div>
  );
}

// ---- pills ------------------------------------------------------------------------

export function StatusPill({
  tone,
  children,
}: {
  tone: "success" | "neutral" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const tones = {
    success: "bg-emerald-400/90 text-emerald-950",
    neutral: "bg-slate-200/90 text-slate-800",
    warning: "bg-amber-400/90 text-amber-950",
    danger: "bg-red-500/90 text-red-950",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function MethodPill({ method }: { method: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#262a36] bg-[#12141f] px-2.5 py-1 text-xs font-medium text-slate-200">
      <BanknoteIcon className="h-3.5 w-3.5 text-emerald-400" />
      {method === "tarjeta" ? "Tarjeta" : "Efectivo"}
    </span>
  );
}

export function BanknoteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

// ---- charts -------------------------------------------------------------------------

/** V3: evenly spaced label indices for a series too dense to label fully —
 *  ALWAYS keeps the first and the last, at most `maxLabels` of them. */
export function thinLabelIndices(count: number, maxLabels = 8): number[] {
  if (count <= 0) return [];
  if (count <= maxLabels) {
    return Array.from({ length: count }, (_, i) => i);
  }
  const step = (count - 1) / (maxLabels - 1);
  const seen = new Set<number>();
  for (let i = 0; i < maxLabels; i += 1) {
    seen.add(Math.round(i * step));
  }
  return [...seen].sort((a, b) => a - b);
}

/** The 7-day/daily sales area: violet stroke, dashed grid, flat when empty —
 *  exactly how the reference's zero data renders. X labels are thinned to
 *  ≤8 evenly spaced (first + last always shown) per the reference's ~8
 *  visible date ticks on a 30-day window. */
export function SalesAreaChart({
  points,
  height = 260,
  formatY = (v: number) => String(v),
}: {
  points: { label: string; value: number }[];
  height?: number;
  formatY?: (v: number) => string;
}) {
  const width = 640;
  const padLeft = 52;
  const padBottom = 28;
  const padTop = 12;
  const innerW = width - padLeft - 12;
  const innerH = height - padBottom - padTop;
  const max = Math.max(4, ...points.map((p) => p.value));
  const stepX = points.length > 1 ? innerW / (points.length - 1) : innerW;
  // Computed once per render (not inside the map).
  const labelIndices = thinLabelIndices(points.length, 8);

  const x = (i: number) => padLeft + i * stepX;
  const y = (v: number) => padTop + innerH - (v / max) * innerH;

  const path =
    points.length > 0
      ? points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ")
      : "";
  const area =
    points.length > 1
      ? `${path} L${x(points.length - 1)},${padTop + innerH} L${x(0)},${padTop + innerH} Z`
      : "";

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Gráfica de ventas"
    >
      {gridLines.map((g) => {
        const gy = padTop + innerH - g * innerH;
        const value = Math.round(max * g * 100) / 100;
        return (
          <g key={g}>
            <line
              x1={padLeft}
              x2={width - 8}
              y1={gy}
              y2={gy}
              stroke="#262a36"
              strokeDasharray="3 4"
            />
            <text x={padLeft - 8} y={gy + 4} textAnchor="end" fontSize="11" fill="#64748b">
              {formatY(value)}
            </text>
          </g>
        );
      })}
      {area ? <path d={area} fill="rgba(139,92,246,0.12)" /> : null}
      {path ? <path d={path} fill="none" stroke="#8b5cf6" strokeWidth="2" /> : null}
      {labelIndices.map((i) => (
        <text
          key={`${points[i].label}-${i}`}
          x={x(i)}
          y={height - 8}
          textAnchor="middle"
          fontSize="11"
          fill="#64748b"
        >
          {points[i].label}
        </text>
      ))}
    </svg>
  );
}

const DONUT_COLORS = ["#8b5cf6", "#7c3aed", "#a78bfa", "#c4b5fd", "#22c55e", "#e2e8f0", "#6366f1", "#f59e0b"];

/** The category donut + legend with counts. */
export function DonutChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const size = 190;
  const r = 70;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const visible = data.filter((d) => d.count > 0);

  // L5: ONE color assignment over the ORIGINAL array feeds BOTH the arcs
  // and the legend swatches — indexing the filtered list for arcs while the
  // swatches indexed the unfiltered one mismatched colors whenever a
  // zero-count category preceded a non-zero one.
  const colorByName = new Map(
    data.map((d, i) => [d.name, DONUT_COLORS[i % DONUT_COLORS.length]]),
  );

  const fractions = visible.map((d) => (total > 0 ? d.count / total : 0));
  const starts: number[] = [];
  let running = 0;
  for (const fraction of fractions) {
    starts.push(running);
    running += fraction;
  }
  const arcs = visible.map((d, i) => {
    const fraction = fractions[i];
    return {
      ...d,
      color: colorByName.get(d.name) ?? DONUT_COLORS[0],
      dash: fraction * circumference,
      offset: starts[i] * circumference,
      gap: total > 0 && visible.length > 1 ? 2 : 0,
    };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Productos por categoría"
        className="shrink-0"
      >
        {arcs.length === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2235" strokeWidth="26" />
        ) : (
          arcs.map((arc) => (
            <circle
              key={arc.name}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth="26"
              strokeDasharray={`${Math.max(0, arc.dash - arc.gap)} ${circumference}`}
              strokeDashoffset={-arc.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ))
        )}
      </svg>
      <ul className="w-full space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-slate-300">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colorByName.get(d.name) ?? DONUT_COLORS[0] }}
              />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="font-semibold text-slate-400">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

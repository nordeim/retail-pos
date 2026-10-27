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

// ---- the responsive-container seam (V11/SD-37) ---------------------------------

/** The recharts ResponsiveContainer contract, hand-rolled: the chart box
 *  re-wraps to the CONTAINER width while the chart's height (and the
 *  donut's ring radii) stay FIXED. The callback ref measures
 *  getBoundingClientRect().width synchronously at commit — BEFORE first
 *  paint, so the fallback box never flashes — and the ResizeObserver
 *  tracks later resizes (React 19's ref-cleanup return disconnects it).
 *  The fallback is the natural width, so SSR markup and the hydration
 *  render agree (no mismatch), and the commit-phase correction lands
 *  before anything is painted. */
export function useContainerWidth(
  fallback: number,
): [React.RefCallback<HTMLDivElement>, number] {
  const [width, setWidth] = React.useState<number>(fallback);
  const ref = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const measured = node.getBoundingClientRect().width;
    if (measured > 0) setWidth(measured);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const next = entry.contentRect.width;
        if (next > 0) setWidth(next);
      }
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

// ---- the chart tooltips (V11/SD-40 + V13/SD-46..48) ----------------------------

/** The sales chart's series name — the reference's own recharts dataKey,
 *  measured in its tooltip item line ("ventas : 0"). */
const SALES_SERIES_NAME = "ventas";

/** A tooltip's self-measurement: the callback-ref + ResizeObserver pattern
 *  (V13/SD-47 — the same shape as useContainerWidth; no setState inside an
 *  effect body). The measured outer box feeds the overflow flips. */
function useSelfMeasure(): [
  (node: HTMLDivElement | null) => (() => void) | undefined,
  { w: number; h: number } | null,
] {
  const [box, setBox] = React.useState<{ w: number; h: number } | null>(null);
  const ref = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    setBox({ w: node.offsetWidth, h: node.offsetHeight });
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLDivElement;
        if (el.offsetWidth > 0) setBox({ w: el.offsetWidth, h: el.offsetHeight });
      }
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  return [ref, box];
}

/** The reference's recharts tooltip anchoring (V13/SD-47, live-measured):
 *  (anchorX + 10, anchorY + 10), flipping to the mirrored −10 gap when the
 *  box would overflow the container's right edge (and above the bottom). */
function tipTransform(
  anchorX: number,
  anchorY: number,
  w: number,
  h: number,
  containerW: number,
  containerH: number,
): { tx: number; ty: number } {
  const flipX = anchorX + 10 + w > containerW;
  const tx = flipX ? anchorX - w - 10 : anchorX + 10;
  const flipY = anchorY + 10 + h > containerH;
  const ty = flipY ? anchorY - h - 10 : anchorY + 10;
  return { tx, ty };
}

/** The sales chart's tooltip (V13/SD-46): the reference's recharts DEFAULT
 *  content on the measured white-card skin (the v11 skin pins hold) — the
 *  margin-0 label p (the day) + the ul/li item line (4px pad-y, the LINE
 *  color) carrying the literal series name, the " : " separator, and the
 *  RAW value (never the formatted Y string). The label keeps the readable
 *  #1e293b (the SD-18 disclosed superset — the reference's inherited
 *  #e7e9ef is invisible on white). The wrapper glides (transform 400ms)
 *  and PERSISTS after the first hover: leave flips visibility (never an
 *  unmount) so re-entering glides from the last position — recharts' own
 *  wrapper behavior. */
function SalesTip({
  anchorX,
  pointerY,
  containerW,
  containerH,
  visible,
  label,
  value,
  lineColor,
}: {
  anchorX: number;
  pointerY: number;
  containerW: number;
  containerH: number;
  visible: boolean;
  label: string;
  value: string;
  lineColor: string;
}) {
  const [ref, box] = useSelfMeasure();
  const { tx, ty } = tipTransform(
    anchorX,
    pointerY,
    box?.w ?? 0,
    box?.h ?? 0,
    containerW,
    containerH,
  );
  return (
    <div
      data-testid="chart-tooltip"
      ref={ref}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate(${tx}px, ${ty}px)`,
        transition: "transform 400ms",
        visibility: visible && box ? "visible" : "hidden",
        pointerEvents: "none",
        zIndex: 20,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 10,
        boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 20px",
        whiteSpace: "nowrap",
        color: "#1e293b",
        fontSize: 16,
      }}
    >
      <p style={{ margin: 0 }}>{label}</p>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        <li style={{ display: "block", paddingTop: 4, paddingBottom: 4, color: lineColor }}>
          <span>{SALES_SERIES_NAME}</span>
          <span>{" : "}</span>
          <span>{value}</span>
        </li>
      </ul>
    </div>
  );
}

/** The donut's tooltip (V13/SD-48): the RAW recharts default skin — NOT
 *  the sales chart's white card (the reference's two tooltips ship
 *  different skins; the v11 single-skin application was the bug): white bg
 *  + the 1px #ccc border, NO radius, NO shadow, the EMPTY label p (the pie
 *  tooltip's own shape), and the item in BLACK — the name + " : " + the
 *  raw count. Same flip + glide + persistent wrapper. */
function DonutTip({
  anchorX,
  anchorY,
  containerW,
  containerH,
  visible,
  name,
  count,
}: {
  anchorX: number;
  anchorY: number;
  containerW: number;
  containerH: number;
  visible: boolean;
  name: string;
  count: number;
}) {
  const [ref, box] = useSelfMeasure();
  const { tx, ty } = tipTransform(
    anchorX,
    anchorY,
    box?.w ?? 0,
    box?.h ?? 0,
    containerW,
    containerH,
  );
  return (
    <div
      data-testid="donut-tooltip"
      ref={ref}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate(${tx}px, ${ty}px)`,
        transition: "transform 400ms",
        visibility: visible && box ? "visible" : "hidden",
        pointerEvents: "none",
        zIndex: 20,
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        padding: 10,
        whiteSpace: "nowrap",
        fontSize: 16,
      }}
    >
      <p style={{ margin: 0 }} />
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        <li style={{ display: "block", paddingTop: 4, paddingBottom: 4, color: "#000" }}>
          <span>{name}</span>
          <span>{" : "}</span>
          <span>{count}</span>
        </li>
      </ul>
    </div>
  );
}

/** The tooltip state for a sales chart: the nearest point to the pointer.
 *  V13/SD-47: the anchor x SNAPS to the point while the y follows the
 *  pointer — the reference's measured hybrid anchoring. */
function tooltipForSales(
  points: { label: string; value: number }[],
  x: number,
  padLeft: number,
  innerW: number,
  pointerY: number,
): { idx: number; pointerY: number } | null {
  if (points.length === 0) return null;
  const stepX = points.length > 1 ? innerW / (points.length - 1) : innerW;
  const rel = x - padLeft;
  const idx = Math.round(rel / stepX);
  if (idx < 0 || idx > points.length - 1) return null;
  return { idx, pointerY };
}

/** The tooltip state for the donut: the sector under the pointer. V13/SD-48:
 *  the anchor is the ring midpoint at the mid-angle — the measured recharts
 *  sector centroid (within 1px) — and the item carries the raw count. */
function tooltipForDonut(
  sectors: { name: string; count: number; a0: number; a1: number }[],
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  x: number,
  y: number,
): { name: string; count: number; x: number; y: number } | null {
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  if (dist < innerR || dist > outerR) return null;
  // Screen angle, math-style CCW from 3 o'clock (y grows downward).
  let deg = (Math.atan2(-dy, dx) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  const hit = sectors.find((s) => deg >= s.a0 && deg < s.a1);
  if (!hit) return null;
  const mid = ((hit.a0 + hit.a1) / 2) * (Math.PI / 180);
  return {
    name: hit.name,
    count: hit.count,
    x: cx + Math.cos(mid) * ((innerR + outerR) / 2),
    y: cy - Math.sin(mid) * ((innerR + outerR) / 2),
  };
}

// ---- page heading ------------------------------------------------------------

export function PageHeading({
  title,
  subtitle,
  actions,
  tone = "default",
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** V5/F1: Reports is the reference's ONLY bright H1 (text-white/90) —
   *  every other view keeps the muted slate-800 heading. */
  tone?: "default" | "bright";
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {/* V2: the reference's H1 is 24px FIXED at every width (390 + 1280
            measured) — no sm: bump. */}
        <h1
          className={cn(
            "text-2xl font-bold tracking-tight",
            tone === "bright" ? "text-white/90" : "text-slate-800",
          )}
        >
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
    tint: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  },
  primary: {
    blob: "from-indigo-400 to-purple-500",
    chip: "from-indigo-400 to-purple-500",
    tint: "bg-indigo-500/15 border-indigo-500/30 text-indigo-400",
  },
  info: {
    blob: "from-blue-400 to-indigo-500",
    chip: "from-blue-400 to-indigo-500",
    tint: "bg-violet-500/15 border-violet-500/30 text-violet-400",
  },
  warning: {
    blob: "from-amber-400 to-orange-500",
    chip: "from-amber-400 to-orange-500",
    tint: "bg-amber-500/15 border-amber-500/30 text-amber-400",
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
            "flex w-12 h-12 rounded-2xl shrink-0 items-center justify-center border",
            palette.tint,
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
  titleClassName,
  testId,
  variant = "card",
}: {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** V10/F2: the ref's card headers are mb-4 EXCEPT the low-stock card
   *  (its H3 carries mb-3 — the 12px header→list gap, measured live). */
  titleClassName?: string;
  testId?: string;
  /** V1: "card" = the dashboard/ajustes heading (h3, title-case, 16px/700,
   *  slate-700 — measured live); "kicker" = the reports heading (h2,
   *  uppercase, 14px/700, white/60, 0.7px tracking — measured live). */
  variant?: "card" | "kicker";
}) {
  return (
    <div data-testid={testId} className={cn("vx-card p-5", className)}>
      {title ? (
        <div className={cn("mb-4 flex items-center gap-2", titleClassName)}>
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
//
// V5/T2 — the reference ships TWO badge systems, both measured live:
//   · table badges = the shadcn Badge (rounded-md = 6px, border-transparent,
//     SOFT ramps: green-100/green-700 for success, slate-100/slate-500 for
//     neutral) — "Completada", "Activo", "Cerrado";
//   · card badges = a rounded-full px-2.5 py-1 pill (slate-100/slate-500) —
//     the register card's "Cerrada"/"Abierta".
// The warning/danger table ramps are unobservable on the reference and
// extend its own soft-badge language (amber-100/amber-700, red-100/red-700).

const STATUS_TONES = {
  success: "bg-green-100 text-green-700",
  neutral: "bg-slate-100 text-slate-500",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
} as const;

export function StatusPill({
  tone,
  variant = "table",
  children,
}: {
  tone: keyof typeof STATUS_TONES;
  /** "table" = the 6px shadcn badge; "card" = the register-card round pill. */
  variant?: "table" | "card";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border border-transparent text-xs font-semibold",
        variant === "card"
          ? "rounded-full px-2.5 py-1"
          : "rounded-md px-2.5 py-0.5 transition-colors hover:bg-primary/80",
        STATUS_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function MethodPill({ method }: { method: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold text-foreground">
      <BanknoteIcon className="h-3 w-3" />
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

/** Thin the X labels the reference's way (V10/F8 — its recharts
 *  preserveStart behavior, live-measured on all four report windows):
 *  windows of 14 days or fewer label EVERY day; longer windows step by
 *  ceil((count - 1) / 9) days FROM THE WINDOW START (30 days → every 4th,
 *  8 labels ending day 28; 90 → every 10th, 9 labels ending day 80) and
 *  the trailing remainder is dropped — the last day is NOT force-labeled
 *  (the reference's 30-day window labels end at day 28, its 90-day at
 *  day 80). The dashboard chart (7 points) labels every day on both apps. */
export function thinLabelIndices(count: number, _maxLabels = 8): number[] {
  if (count <= 0) return [];
  if (count <= 14) {
    return Array.from({ length: count }, (_, i) => i);
  }
  const step = Math.ceil((count - 1) / 9);
  const indices: number[] = [];
  for (let i = 0; i < count; i += step) {
    indices.push(i);
  }
  return indices;
}

/** V9/SD-27: the reference renders TWO chart skins — measured live on
 *  both pages. DASHBOARD: gridlines #e2e8f0 dash "3 3" (light — prominent),
 *  axis labels #94a3b8 at 12px, line #6366f1 at strokeWidth 2.5, the area
 *  fills the `salesGrad` gradient (#6366f1, stop-opacity 0.3 at 5% → 0 at
 *  95%). REPORTS: gridlines rgba(255,255,255,0.04), labels
 *  rgba(255,255,255,0.3) at 11px, line strokeWidth 2, gradient top 0.35.
 *  Shared: the gradient id, the line color, the dash pattern. X labels are
 *  thinned to ≤8 evenly spaced (first + last always shown) per the
 *  reference's ~8 visible date ticks on a 30-day window. */
const CHART_SKINS = {
  dashboard: {
    gridStroke: "#e2e8f0",
    gridDash: "3 3",
    labelFill: "#94a3b8",
    labelSize: 12,
    lineStroke: "#6366f1",
    lineWidth: 2.5,
    gradientTopOpacity: 0.3,
  },
  reports: {
    gridStroke: "rgba(255,255,255,0.04)",
    gridDash: "3 3",
    labelFill: "rgba(255,255,255,0.3)",
    labelSize: 11,
    lineStroke: "#6366f1",
    lineWidth: 2,
    gradientTopOpacity: 0.35,
  },
} as const;

/** The 7-day/daily sales area on the reference's measured skin — flat when
 *  empty. `variant` picks the page's skin (dashboard default).
 *  V11/SD-37: the box is container-responsive the recharts way — the width
 *  comes from the measured container while the HEIGHT stays FIXED per
 *  surface (dashboard 280, reports 220 — the reference's own heights at
 *  every measured viewport, 1440/1280/1024). The internal paddings stay
 *  fixed and the plot area flexes, exactly how recharts lays out at a new
 *  width; the old aspect-locked 640×260/640×280 boxes retired (they
 *  matched the reference at NO viewport — 254px vs 280 at 1280 on the
 *  dashboard, 424px vs 220 on the reports page). */
const SALES_CHART_HEIGHTS = {
  dashboard: 280,
  reports: 220,
} as const;

export function SalesAreaChart({
  points,
  formatY = (v: number) => String(v),
  variant = "dashboard",
}: {
  points: { label: string; value: number }[];
  formatY?: (v: number) => string;
  variant?: "dashboard" | "reports";
}) {
  const skin = CHART_SKINS[variant];
  const height = SALES_CHART_HEIGHTS[variant];
  const [boxRef, measured] = useContainerWidth(640);
  const width = Math.max(120, Math.round(measured));
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

  // V13/SD-47: the hover state carries the snapped point index + the
  // pointer's y (the anchor hybrid) and PERSISTS after leave (visible flips
  // — the recharts wrapper's own glide-on-reenter behavior).
  const [hover, setHover] = React.useState<{
    idx: number;
    pointerY: number;
    visible: boolean;
  } | null>(null);

  return (
    <div ref={boxRef} className="relative w-full" style={{ height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Gráfica de ventas"
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const svgX = ((e.clientX - box.x) / box.width) * width;
          const svgY = ((e.clientY - box.y) / box.height) * height;
          const hit = tooltipForSales(points, svgX, padLeft, innerW, svgY);
          setHover((h) =>
            hit ? { ...hit, visible: true } : h ? { ...h, visible: false } : null,
          );
        }}
        onPointerLeave={() => setHover((h) => (h ? { ...h, visible: false } : null))}
      >
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={skin.gradientTopOpacity} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
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
                stroke={skin.gridStroke}
                strokeDasharray={skin.gridDash}
              />
              <text
                x={padLeft - 8}
                y={gy + 4}
                textAnchor="end"
                fontSize={skin.labelSize}
                fill={skin.labelFill}
              >
                {formatY(value)}
              </text>
            </g>
          );
        })}
        {area ? <path d={area} fill="url(#salesGrad)" /> : null}
        {path ? (
          <path d={path} fill="none" stroke={skin.lineStroke} strokeWidth={skin.lineWidth} />
        ) : null}
        {labelIndices.map((i) => (
          <text
            key={`${points[i].label}-${i}`}
            x={x(i)}
            y={height - 8}
            textAnchor="middle"
            fontSize={skin.labelSize}
            fill={skin.labelFill}
          >
            {points[i].label}
          </text>
        ))}
        {/* V13/SD-49+50: the reference's recharts hover artifacts — the #ccc
            cursor line spanning the plot at the active x, and the default
            active dot (r=4, the line fill, the #fff 2px stroke) on the
            point. Both clear with the hover. */}
        {hover?.visible ? (
          <>
            <line
              data-testid="tooltip-cursor"
              x1={x(hover.idx)}
              x2={x(hover.idx)}
              y1={padTop}
              y2={padTop + innerH}
              stroke="#ccc"
              strokeWidth={1}
            />
            <g data-testid="active-dot">
              <circle
                cx={x(hover.idx)}
                cy={y(points[hover.idx].value)}
                r={4}
                fill={skin.lineStroke}
                stroke="#fff"
                strokeWidth={2}
              />
            </g>
          </>
        ) : null}
      </svg>
      {hover ? (
        <SalesTip
          anchorX={x(hover.idx)}
          pointerY={hover.pointerY}
          containerW={width}
          containerH={height}
          visible={hover.visible}
          label={points[hover.idx].label}
          value={String(points[hover.idx].value)}
          lineColor={skin.lineStroke}
        />
      ) : null}
    </div>
  );
}

/** V10/SD-29: the reference's donut palette, live-measured (the classic
 *  recharts ramp): indigo-500 → violet-500 → violet-400 → violet-300 →
 *  violet-200, green-500 in the sixth slot. */
export const DONUT_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#22c55e"];

/** One donut sector as a filled path: outer arc → radial edge → inner arc
 *  back → close (V10/SD-29 — the reference's recharts sectors, measured
 *  live). Angles are math-style degrees COUNTERCLOCKWISE from 3 o'clock
 *  (the reference's own start and direction). The reference's padding is
 *  TRAILING-ONLY: every sector starts EXACTLY at its slice boundary and
 *  ends `gapDeg` short of the next one (measured: [0,56], [60,116],
 *  [120,176], [300,356] — uniform 4° gaps between neighbors). */
export function sectorPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  a0: number,
  a1: number,
  gapDeg = 4,
): string {
  const pt = (r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    // Screen y grows downward — a rising math angle renders counterclockwise.
    const x = Math.round((cx + r * Math.cos(rad)) * 100) / 100;
    const y = Math.round((cy - r * Math.sin(rad)) * 100) / 100;
    return `${x},${y}`;
  };
  const start = a0;
  const end = a1 - gapDeg;
  const span = end - start;
  if (span <= 0) return "";
  const largeArc = span > 180 ? 1 : 0;
  return [
    `M ${pt(outerR, start)}`,
    `A ${outerR},${outerR},0 ${largeArc},0 ${pt(outerR, end)}`,
    `L ${pt(innerR, end)}`,
    `A ${innerR},${innerR},0 ${largeArc},1 ${pt(innerR, start)}`,
    "Z",
  ].join(" ");
}

/** The category donut + legend — the reference's measured rendering
 *  (V10/SD-29/30 + V11/SD-37): filled sector PATHS (not stroked circles) on
 *  a ring innerR 50 / outerR 80 that stays FIXED (the radii and cy 100
 *  never scale with the box), centered at cx = box/2 (recharts' 50%
 *  default) inside a box that re-wraps to the CONTAINER width capped at
 *  333 (the reference's own max-width — at the 1440 sweet spot the box is
 *  333 and cx = 166.5, the v10 measurement), sectors counterclockwise
 *  from 3 o'clock with the trailing 4° gap, a #fff 1px stroke on every
 *  sector, and the legend — capped at the FIRST 5 rows (the reference
 *  renders 6 sectors but 5 legend rows — its internal rule is
 *  unobservable; slice(0, 5) reproduces the measured behavior) — stacked
 *  BELOW the chart with slate-600 names, semibold slate-700 counts, and
 *  12px round swatches. */
export function DonutChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const [boxRef, measured] = useContainerWidth(333);
  const box = Math.min(333, Math.max(120, Math.round(measured)));
  const cx = box / 2;
  const cy = 100;
  const innerR = 50;
  const outerR = 80;
  const gapDeg = 4;

  // L5 (standing): ONE color assignment over the ORIGINAL array feeds BOTH
  // the sectors and the legend swatches — indexing the filtered list for
  // sectors while the swatches indexed the unfiltered one mismatched
  // colors whenever a zero-count category preceded a non-zero one.
  const colorByName = new Map(
    data.map((d, i) => [d.name, DONUT_COLORS[i % DONUT_COLORS.length]]),
  );

  const visible = data.filter((d) => d.count > 0);
  const spans = visible.map((d) => (total > 0 ? (d.count / total) * 360 : 0));
  const starts: number[] = [];
  let angle = 0;
  for (const span of spans) {
    starts.push(angle);
    angle += span;
  }
  const sectors = visible.map((d, i) => ({
    ...d,
    a0: starts[i],
    a1: starts[i] + spans[i],
    path: sectorPath(
      cx,
      cy,
      innerR,
      outerR,
      starts[i],
      starts[i] + spans[i],
      visible.length > 1 ? gapDeg : 0,
    ),
  }));

  // V13/SD-48: the donut's hover state — the hit sector (name + count + the
  // ring-midpoint anchor) and the persistent visibility flag (leave flips
  // it, never unmounts — the same glide-on-reenter as the sales chart).
  const [hover, setHover] = React.useState<{
    name: string;
    count: number;
    x: number;
    y: number;
    visible: boolean;
  } | null>(null);

  return (
    <div>
      <div ref={boxRef} className="relative mx-auto h-[200px] w-full max-w-[333px]">
        <svg
          width={box}
          height={200}
          viewBox={`0 0 ${box} 200`}
          className="h-full w-full"
          role="img"
          aria-label="Productos por categoría"
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const w = rect.width > 0 ? Math.min(333, rect.width) : box;
            const svgX = ((e.clientX - rect.x) / rect.width) * w;
            const svgY = ((e.clientY - rect.y) / rect.height) * 200;
            const hit = tooltipForDonut(
              sectors.map((s) => ({ name: s.name, count: s.count, a0: s.a0, a1: s.a1 })),
              cx,
              cy,
              innerR,
              outerR,
              svgX,
              svgY,
            );
            setHover((h) =>
              hit ? { ...hit, visible: true } : h ? { ...h, visible: false } : null,
            );
          }}
          onPointerLeave={() => setHover((h) => (h ? { ...h, visible: false } : null))}
        >
          {sectors.length === 0 ? (
            <circle cx={cx} cy={cy} r={65} fill="none" stroke="#1e2235" strokeWidth={30} />
          ) : (
            sectors.map((d) => (
              <path
                key={d.name}
                d={d.path}
                fill={colorByName.get(d.name) ?? DONUT_COLORS[0]}
                stroke="#fff"
                strokeWidth={1}
              />
            ))
          )}
        </svg>
        {hover ? (
          <DonutTip
            anchorX={hover.x}
            anchorY={hover.y}
            containerW={box}
            containerH={200}
            visible={hover.visible}
            name={hover.name}
            count={hover.count}
          />
        ) : null}
      </div>
      <div className="space-y-2 mt-2">
        {data.slice(0, 5).map((d) => (
          <div key={d.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: colorByName.get(d.name) ?? DONUT_COLORS[0] }}
              />
              <span className="text-slate-600">{d.name}</span>
            </div>
            <span className="font-semibold text-slate-700">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

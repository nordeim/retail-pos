import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The V16 pins (docs/remediation-plan-v16.md):
//   F1 the Tailwind v4 default palette re-derived every color in oklch and
//      DRIFTED from the reference's v3 hexes (17/22 spot-checked entries
//      beyond ±2 per channel — indigo-500 Δ56, red-500 Δ24, green-700 Δ21,
//      violet-600 Δ24; pixel-read in Chromium via
//      scripts/palette-drift-v16.ts). The reference renders v3 values; the
//      fix pins every palette entry the app uses (61) to its v3 hex in
//      globals.css @theme — class parity ≠ color parity, the pins make
//      the VALUES identical.
//   F2 the category display order — the reference's entities surfaces
//      (Inventario chips + Ajustes categorías) render Snacks, Lácteos,
//      Higiene Personal, Limpieza, Alimentos, Bebidas (measured twice via
//      DOM); its donut renders a DIFFERENT order (Lácteos, Limpieza,
//      Higiene, Alimentos, Snacks — the v10 seed's createdAt order, kept).
//      The clone's chips/Ajustes move to a sortOrder column seeded to the
//      reference's chip sequence; the donut stays on createdAt.

const root = resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

// ---- B1/F1 — the v3 palette pin block -----------------------------------------

// Every palette entry the app uses (61 — enumerated from src/ via the
// utility-prefix grep in the plan §B1), pinned to its Tailwind V3 hex —
// the values the reference renders (live-measured).
const V3_PALETTE: Record<string, string> = {
  "slate-50": "#f8fafc",
  "slate-100": "#f1f5f9",
  "slate-200": "#e2e8f0",
  "slate-300": "#cbd5e1",
  "slate-400": "#94a3b8",
  "slate-500": "#64748b",
  "slate-600": "#475569",
  "slate-700": "#334155",
  "slate-800": "#1e293b",
  "slate-900": "#0f172a",
  "gray-50": "#f9fafb",
  "gray-200": "#e5e7eb",
  "gray-300": "#d1d5db",
  "gray-400": "#9ca3af",
  "gray-500": "#6b7280",
  "gray-600": "#4b5563",
  "gray-700": "#374151",
  "gray-800": "#1f2937",
  "gray-900": "#111827",
  "red-50": "#fef2f2",
  "red-100": "#fee2e2",
  "red-200": "#fecaca",
  "red-400": "#f87171",
  "red-500": "#ef4444",
  "red-600": "#dc2626",
  "red-700": "#b91c1c",
  "red-950": "#450a0a",
  "orange-500": "#f97316",
  "amber-50": "#fffbeb",
  "amber-100": "#fef3c7",
  "amber-400": "#fbbf24",
  "amber-500": "#f59e0b",
  "amber-600": "#d97706",
  "amber-700": "#b45309",
  "green-50": "#f0fdf4",
  "green-100": "#dcfce7",
  "green-200": "#bbf7d0",
  "green-400": "#4ade80",
  "green-500": "#22c55e",
  "green-700": "#15803d",
  "emerald-200": "#a7f3d0",
  "emerald-300": "#6ee7b7",
  "emerald-400": "#34d399",
  "emerald-500": "#10b981",
  "emerald-600": "#059669",
  "emerald-950": "#022c22",
  "teal-600": "#0d9488",
  "blue-50": "#eff6ff",
  "blue-400": "#60a5fa",
  "blue-500": "#3b82f6",
  "blue-600": "#2563eb",
  "indigo-50": "#eef2ff",
  "indigo-300": "#a5b4fc",
  "indigo-400": "#818cf8",
  "indigo-500": "#6366f1",
  "indigo-600": "#4f46e5",
  "violet-300": "#c4b5fd",
  "violet-400": "#a78bfa",
  "violet-500": "#8b5cf6",
  "violet-600": "#7c3aed",
  "purple-500": "#a855f7",
};

describe("B1 — the v3 palette pin block (the F1 drift fix)", () => {
  const css = read("src/app/globals.css");

  it("pins every used palette entry to its Tailwind v3 hex inside @theme", () => {
    for (const [name, hex] of Object.entries(V3_PALETTE)) {
      expect(css).toContain(`--color-${name}: ${hex};`);
    }
  });

  it("the pin block documents the drift and the new-usage rule", () => {
    expect(css).toMatch(/V16\/F1/);
    expect(css).toMatch(/palette/);
  });

  it("the chart + donut literals stay v3 exact (untouched by the block)", () => {
    const shared = read("src/components/pos/shared.tsx");
    expect(shared).toContain('"#6366f1"');
    expect(shared).toContain('"#22c55e"');
  });
});

// ---- B2/F2 — the category sortOrder ------------------------------------------

describe("B2 — the category sortOrder (the F2 display-order fix)", () => {
  it("the schema carries the column", () => {
    const schema = read("prisma/schema.prisma");
    expect(schema).toMatch(/sortOrder\s+Int\s+@default\(0\)/);
  });

  it("the seed stamps the reference's chip sequence (Snacks first)", () => {
    const seed = read("prisma/seed.ts");
    // The reference's entities order: Snacks, Lácteos, Higiene, Limpieza,
    // Alimentos, Bebidas (L13/L14) — sortOrder 1-6 in that sequence.
    expect(seed).toMatch(/CATEGORY_SORT_ORDER/);
    expect(seed).toContain('Snacks: 1');
    expect(seed).toContain('Lácteos: 2');
    expect(seed).toContain('"Higiene Personal": 3');
    expect(seed).toContain("Limpieza: 4");
    expect(seed).toContain("Alimentos: 5");
    expect(seed).toContain("Bebidas: 6");
    // The creation order (the DONUT order) is unchanged — the guard.
    expect(seed).toContain(
      '["Lácteos", "Limpieza", "Higiene Personal", "Alimentos", "Snacks", "Bebidas"]',
    );
  });

  it("the category delegate lists by sortOrder (createdAt tiebreak) and appends on create", () => {
    const entities = read("src/lib/server/entities.ts");
    expect(entities).toContain("listOrderBy");
    expect(entities).toMatch(/\{ sortOrder: "asc" \}, \{ createdAt: "asc" \}, \{ id: "asc" \}/);
    expect(entities).toContain("prepareCreate");
  });

  it("sortOrder is never client-writable (absent from the category schema)", () => {
    const validation = read("src/lib/validation.ts");
    const schemaBlock = validation.slice(
      validation.indexOf("categorySchema"),
      validation.indexOf("categorySchema") + 600,
    );
    expect(schemaBlock).not.toContain("sortOrder");
  });

  it("the dashboard byCategory keeps its own createdAt order (the donut guard)", () => {
    const dashboard = read("src/app/api/dashboard/route.ts");
    expect(dashboard).toMatch(/createdAt: "asc"/);
  });
});

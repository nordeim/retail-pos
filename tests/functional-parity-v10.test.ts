import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Pins for remediation-plan-v10 (session V10, 2026-10-27) — the category
// DONUT family, fully measured for the first time (the reference's donut
// renders with real data now: 6 sectors, the recharts ramp
// #6366f1→#ddd6fe + #22c55e, ring innerR 50 / outerR 80 at (166.5, 100) in
// a 333×200 box, counterclockwise from 3 o'clock, 2°-per-side padding,
// #fff 1px sector strokes, a legend capped at the first 5 items with
// slate-600/slate-700 rows stacked BELOW the chart), the low-stock header
// gap (the ref's mb-3 = 12px), the Ajustes per-section header icons
// (store/indigo, palette/purple, file-text/green, credit-card/blue,
// tag/amber at w-5 h-5), the seeded DATA parity (the ref's product row
// order + the 12th row's real values, Caja 2 before Caja 1, the two
// historical sales' exact datetimes and the second sale's real items),
// and the reports X-tick rule (≤14 days → every day; else a day-step from
// the window start: 30 → every 4th, 90 → every 10th, last day NOT forced).
// Every finding was measured LIVE on both apps (agent-browser); see
// docs/remediation-plan-v10.md §0.
// Pins written RED first.
// ---------------------------------------------------------------------------

const root = resolve(import.meta.dirname, "..");
const src = (p: string) => readFileSync(resolve(root, p), "utf8");

const shared = () => src("src/components/pos/shared.tsx");
const dashboardRoute = () => src("src/app/api/dashboard/route.ts");
const dashboardView = () => src("src/components/views/dashboard-view.tsx");
const settingsView = () => src("src/components/views/settings-view.tsx");
const entities = () => src("src/lib/server/entities.ts");
const seed = () => src("prisma/seed.ts");

// ---- B1/F1 — the donut geometry, palette, and legend --------------------------

describe("B1/F1 — the donut renders the reference's measured geometry", () => {
  it("sectorPath emits the measured first slice: exact 3 o'clock start, CCW rise, trailing 4° gap", async () => {
    const { sectorPath } = await import("@/components/pos/shared");
    // The first 60° slice (2/12 products): starts EXACTLY at 0° (the ref's
    // M point is literally 246.5,100) and ends 4° short of 60°.
    const d = sectorPath(166.5, 100, 50, 80, 0, 60, 4);
    expect(d.startsWith("M 246.5,100")).toBe(true);
    // The outer arc's far endpoint: angle 56° at r=80 → (211.24, 33.68).
    expect(d).toContain("A 80,80");
    expect(d).toMatch(/211\.2\d*,33\.6\d*/);
    // The inner return arc at r=50, back to the 0° start.
    expect(d).toContain("A 50,50");
    expect(d).toMatch(/194\.4\d*,58\.5\d*/);
    expect(d.endsWith("Z")).toBe(true);
  });

  it("the trailing gap keeps every slice's leading edge at its boundary", async () => {
    const { sectorPath } = await import("@/components/pos/shared");
    // Snacks: 30° slice [270°, 300°] → rendered [270°, 296°]. The M point
    // sits at straight-down (166.5, 180) — the slice's exact boundary; the
    // trailing endpoint (201.57, 171.90) matches the reference's own S5
    // arc endpoint digit-for-digit.
    const d = sectorPath(166.5, 100, 50, 80, 270, 300, 4);
    expect(d).toMatch(/M 166\.5,180/);
    expect(d).toMatch(/201\.5\d*,171\.9\d*/);
  });

  it("the palette is the reference's measured ramp (indigo→violet-200 + green last)", async () => {
    const mod = await import("@/components/pos/shared");
    const colors = (mod as { DONUT_COLORS: string[] }).DONUT_COLORS;
    expect(colors).toEqual([
      "#6366f1",
      "#8b5cf6",
      "#a78bfa",
      "#c4b5fd",
      "#ddd6fe",
      "#22c55e",
    ]);
  });

  it("the chart rides the measured box, strokes, and stacked layout (source pins)", () => {
    const s = shared();
    expect(s).toContain('viewBox="0 0 333 200"');
    expect(s).toContain('stroke="#fff"');
    expect(s).toContain('strokeWidth={1}');
    // The legend caps at the first 5 items (the ref renders 6 sectors, 5 rows).
    expect(s).toContain("slice(0, 5)");
    // The ref's legend row anatomy.
    expect(s).toContain('"space-y-2 mt-2"');
    expect(s).toContain("w-3 h-3 rounded-full");
    expect(s).toContain("text-slate-600");
    expect(s).toContain("font-semibold text-slate-700");
    // The stacked layout: the chart container sits above the legend — the
    // old side-by-side row is gone.
    expect(s).not.toContain("sm:flex-row");
  });

  it("byCategory ordering is deterministic (createdAt then id)", () => {
    expect(dashboardRoute()).toContain(
      '[{ createdAt: "asc" }, { id: "asc" }]',
    );
  });
});

// ---- B2/F2 — the low-stock header spacing --------------------------------------

describe("B2/F2 — the low-stock header gap is the reference's 12px", () => {
  it("SectionCard supports titleClassName and the low-stock card passes mb-3", () => {
    const s = shared();
    expect(s).toContain("titleClassName");
    // The low-stock call opts into the ref's mb-3 (chart cards keep mb-4).
    const d = dashboardView();
    expect(d).toMatch(/titleClassName="mb-3"/);
  });
});

// ---- B3/F3 — the Ajustes header icon system ------------------------------------

describe("B3/F3 — the Ajustes section headers carry the ref's per-section icons", () => {
  it("the five measured icon + color pairs at w-5 h-5", () => {
    const s = settingsView();
    expect(s).toContain("FileText");
    expect(s).toMatch(/FileText[^/]*className="h-5 w-5 text-green-500"/);
    expect(s).toMatch(/Store[^/]*className="h-5 w-5 text-indigo-500"/);
    expect(s).toMatch(/Palette[^/]*className="h-5 w-5 text-purple-500"/);
    expect(s).toMatch(/CreditCard[^/]*className="h-5 w-5 text-blue-500"/);
    expect(s).toMatch(/<Tag\s/);
    expect(s).toMatch(/<Tag[^/]*className="h-5 w-5 text-amber-500"/);
    // The v10-retired substitutions are gone.
    expect(s).not.toContain("ReceiptText");
    expect(s).not.toContain("<Tags");
    expect(s).not.toContain("text-violet-400");
  });
});

// ---- B4/F4-F7 — the seeded data mirrors the reference account -------------------

describe("B4/F4-F7 — the seed mirrors the reference's observable data", () => {
  it("the products seed in the reference's page order with the 12th row's real values", () => {
    const s = seed();
    // Slice out the products ARRAY (the header comment also mentions the
    // 12th row's name — indexOf over the whole file would hit it).
    const start = s.indexOf("const products");
    const array = s.slice(start, s.indexOf("];", start));
    expect(array.indexOf("Shampoo Pantene 400ml")).toBeLessThan(
      array.indexOf("Agua Bonafont 1L"),
    );
    expect(array.indexOf("Agua Bonafont 1L")).toBeLessThan(
      array.indexOf("Coca-Cola 600ml"),
    );
    expect(array.indexOf("Atún Dolores 295g")).toBeLessThan(
      array.indexOf("Jabón Zote 400g"),
    );
    expect(array.indexOf("Jabón Zote 400g")).toBeLessThan(
      array.indexOf("Pan Bimbo Blanco"),
    );
    // The dossier-era ASSUMED 12th row is retired.
    expect(s).not.toContain("Jabón Zote Barra 400g");
    expect(s).not.toContain("7501234567890");
    // The measured 12th row: name, barcode, stock 19 (price 18 / Limpieza stand).
    expect(array).toContain('"Jabón Zote 400g", "7501025403010", 18.0, 19');
  });

  it("Caja 2 is created before Caja 1 (the ref's page order)", () => {
    const s = seed();
    expect(s.indexOf('"Caja 2"')).toBeLessThan(s.indexOf('"Caja 1"'));
  });

  it("the two historical sales ride the reference's exact datetimes", () => {
    const s = seed();
    // Sale 1: 19/04/26 22:09 — shift 09/04 01:39 → 19/04 22:16.
    expect(s).toContain("2026-04-19T22:09:00");
    expect(s).toContain("2026-04-09T01:39:00");
    expect(s).toContain("2026-04-19T22:16:00");
    // Sale 2: 14/03/26 01:45 — shift 14/03 01:36 → 20/03 03:30.
    expect(s).toContain("2026-03-14T01:45:00");
    expect(s).toContain("2026-03-14T01:36:00");
    expect(s).toContain("2026-03-20T03:30:00");
    // The relativized daysAgo seeding is retired.
    expect(s).not.toContain("daysAgo(1, 22, 9)");
    expect(s).not.toContain("daysAgo(43, 1, 45)");
  });

  it("sale 2 carries the reference's real items (Jabón Zote + Papel Higiénico)", () => {
    const s = seed();
    const v2 = s.slice(s.indexOf("V-MMPNY55Z"));
    expect(v2).toContain("Jabón Zote 400g");
    expect(v2).toContain("Papel Higiénico Pétalo 4 rollos");
    expect(v2).not.toContain("Sabritas");
  });

  it("the owned delegates break createdAt ties deterministically (id)", () => {
    const e = entities();
    expect(e).toContain('[{ createdAt: "asc" }, { id: "asc" }]');
  });
});

// ---- B5/F8 — the reports X-tick rule ---------------------------------------------

describe("B5/F8 — the reports chart thins X labels the reference's way", () => {
  it("windows of 14 days or fewer label every day", async () => {
    const { thinLabelIndices } = await import("@/components/pos/shared");
    expect(thinLabelIndices(7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(thinLabelIndices(9)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(thinLabelIndices(14)).toEqual(Array.from({ length: 14 }, (_, i) => i));
  });

  it("a 30-day window steps by 4 from the start (8 labels, ends day 28)", async () => {
    const { thinLabelIndices } = await import("@/components/pos/shared");
    expect(thinLabelIndices(30)).toEqual([0, 4, 8, 12, 16, 20, 24, 28]);
  });

  it("a 90-day window steps by 10 from the start (9 labels, ends day 80)", async () => {
    const { thinLabelIndices } = await import("@/components/pos/shared");
    expect(thinLabelIndices(90)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80]);
  });

  it("degenerate counts stay safe", async () => {
    const { thinLabelIndices } = await import("@/components/pos/shared");
    expect(thinLabelIndices(0)).toEqual([]);
    expect(thinLabelIndices(1)).toEqual([0]);
  });
});

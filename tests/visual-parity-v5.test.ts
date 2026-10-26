import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Source pins for remediation-plan-v5 (session V5, 2026-10-26) — the
// view-internals parity sweep. Every pin was measured LIVE on the reference
// (veloxposretail.base44.app) with computed-style probes / DOM dumps; the
// exact strings below are the reference's own class lists. Pins are written
// RED first, then the fix, then the full gate.
// ---------------------------------------------------------------------------

const root = resolve(import.meta.dirname, "..");
const src = (p: string) => readFileSync(resolve(root, p), "utf8");

const page = () => src("src/app/page.tsx");
const shared = () => src("src/components/pos/shared.tsx");
const sales = () => src("src/components/views/sales-view.tsx");
const inventory = () => src("src/components/views/inventory-view.tsx");
const cashiers = () => src("src/components/views/cashiers-view.tsx");
const registers = () => src("src/components/views/registers-view.tsx");
const terminal = () => src("src/components/views/terminal-view.tsx");
const reports = () => src("src/components/views/reports-view.tsx");
const dashboard = () => src("src/components/views/dashboard-view.tsx");
const settings = () => src("src/components/views/settings-view.tsx");
const input = () => src("src/components/ui/input.tsx");
const button = () => src("src/components/ui/button.tsx");

// ---- B1/G1-G2 — app shell (page.tsx) ---------------------------------------

describe("B1/G1 — the shell gutter is flush (no 24px extra)", () => {
  it("main lands flush against the sidebar: ml-[220px] / ml-[68px]", () => {
    const s = page();
    expect(s).toContain("lg:ml-[220px]");
    expect(s).toContain("lg:ml-[68px]");
    expect(s).not.toContain("lg:ml-[244px]");
    expect(s).not.toContain("lg:ml-[92px]");
  });

  it("the non-terminal bottom rhythm is p-6 (24px), not pb-8", () => {
    expect(page()).toContain("lg:pb-6");
    expect(page()).not.toContain("lg:pb-8");
  });
});

describe("B1/G2 — the terminal view is full-bleed", () => {
  it("main drops its padding and locks the viewport height on terminal", () => {
    const s = page();
    expect(s).toContain('view === "terminal"');
    expect(s).toContain("lg:h-screen");
    expect(s).toContain("lg:overflow-hidden");
    expect(s).toContain("lg:p-0");
  });
});

// ---- B2/T2 — pills (shared.tsx) ---------------------------------------------

describe("B2/T2 — StatusPill carries the reference's two badge shapes", () => {
  it("table badges are rounded-md soft ramps (green-100/green-700, slate-100/slate-500)", () => {
    const s = shared();
    expect(s).toContain("rounded-md");
    expect(s).toContain("bg-green-100 text-green-700");
    expect(s).toContain("bg-slate-100 text-slate-500");
    expect(s).not.toContain("bg-emerald-400/90");
    expect(s).not.toContain("rounded-full px-2.5 py-0.5");
  });

  it("card badges are rounded-full px-2.5 py-1 (register cards)", () => {
    const s = shared();
    expect(s).toContain("rounded-full");
    expect(s).toContain("px-2.5 py-1");
    expect(s).toContain('variant?: "table" | "card"');
  });
});

describe("B2/T2 — MethodPill is the reference's outline badge", () => {
  it("no fill, default border, 6px radius, w-3 banknote", () => {
    const s = shared();
    expect(s).toContain("rounded-md border px-2.5 py-0.5 text-xs font-semibold");
    expect(s).toContain("text-foreground");
    expect(s).toContain("h-3 w-3");
    expect(s).not.toContain("bg-[#12141f]");
  });
});

// ---- B2/T1 — the Ventas table -----------------------------------------------

describe("B2/T1 — sales table matches the reference contract", () => {
  it("headers are text-xs font-semibold slate-500 uppercase with per-column alignment", () => {
    const s = sales();
    expect(s).toContain("text-xs font-semibold text-slate-500 uppercase");
    expect(s).not.toContain("text-[11px] font-bold");
    expect(s).toMatch(/px-5 py-3[^.]*">\s*Ticket/);
  });

  it("rows ride the slate-50 hairline + white/40 hover", () => {
    const s = sales();
    expect(s).toContain("border-b border-slate-50");
    expect(s).toContain("hover:bg-white/40");
    expect(s).not.toContain("hover:bg-white/[0.02]");
  });

  it("the ticket cell is mono indigo-600; body cells slate-600; total bold slate-800 right", () => {
    const s = sales();
    expect(s).toContain("font-mono text-sm font-semibold text-indigo-600");
    expect(s).toContain("text-sm text-slate-600");
    expect(s).toContain("text-right font-bold text-slate-800");
    // the old violet ticket cell is gone (the superset detail dialog keeps
    // its own icon tint)
    expect(s).not.toContain("font-semibold text-violet-400");
  });
});

// ---- B2/T1b — the Inventario table cells -------------------------------------

describe("B2/T1b — inventory cells match the reference", () => {
  it("producto chip is w-10 h-10 indigo-50 with an indigo-300 package", () => {
    const s = inventory();
    expect(s).toContain("w-10 h-10 rounded-lg bg-indigo-50");
    expect(s).toContain("text-indigo-300");
    expect(s).not.toContain("h-9 w-9");
  });

  it("name semibold slate-800; código mono slate-500; precio bold slate-800 right; stock bold slate-700", () => {
    const s = inventory();
    expect(s).toContain("font-semibold text-sm text-slate-800");
    expect(s).toContain("text-slate-500 font-mono");
    expect(s).toContain("font-bold text-slate-800 text-right");
    expect(s).toContain("text-sm font-bold text-slate-700");
  });

  it("categoría badge is the shadcn secondary badge", () => {
    const s = inventory();
    expect(s).toContain("rounded-md bg-secondary");
    expect(s).toContain("text-secondary-foreground");
    // the old bordered chip is gone from the table (dialog surfaces keep
    // their own panels)
    expect(s).not.toContain("rounded-lg border border-[#262a36] bg-[#12141f]");
  });
});

// ---- B2/T9 — icon-button hovers everywhere -----------------------------------

describe("B2/T9 — icon-button hovers are indigo-50/red-50 in every table view", () => {
  it("sales view (no delete affordance there — indigo hovers only)", () => {
    const s = sales();
    expect(s).toContain("hover:bg-indigo-50 hover:text-indigo-600");
    expect(s).not.toContain("hover:bg-white/5 hover:text-violet-300");
  });

  it("cashiers view", () => {
    const s = cashiers();
    expect(s).toContain("hover:bg-indigo-50 hover:text-indigo-600");
    expect(s).toContain("hover:bg-red-50 hover:text-red-500");
    expect(s).not.toContain("hover:bg-white/5 hover:text-violet-300");
  });
});

// ---- B3/T3 — inputs ------------------------------------------------------------

describe("B3/T3 — inputs are 12px-radius transparent shadcn controls", () => {
  it("the Input base uses rounded-xl (12px native)", () => {
    const s = input();
    expect(s).toContain("rounded-xl");
    expect(s).not.toContain("rounded-md");
    expect(s).not.toContain("GRAY ramp");
  });

  it("no form control fills itself with a solid surface (surfaces keep theirs)", () => {
    // The old input overrides, verbatim, are gone from every view.
    expect(terminal()).not.toContain('className="bg-[#12141f] pl-9"');
    expect(sales()).not.toContain('className="bg-[#12141f] pl-9"');
    expect(inventory()).not.toContain('className="bg-[#12141f] pl-9"');
    expect(terminal()).not.toContain('className="bg-[#0d0f1a]"');
    expect(settings()).not.toContain('bg-[#0d0f1a]');
    expect(settings()).not.toContain('border-[#262a36] bg-[#0d0f1a]');
  });

  it("search icons are text-slate-400", () => {
    expect(sales()).toContain("text-slate-400");
    expect(inventory()).toContain("text-slate-400");
    expect(terminal()).toContain("text-slate-400");
  });
});

// ---- B4 — the terminal ---------------------------------------------------------

describe("B4/T7 — the terminal is the reference's two-pane full-bleed layout", () => {
  it("the root is a full-height row at lg with internal panes", () => {
    const s = terminal();
    expect(s).toContain("lg:h-screen");
    expect(s).toContain("lg:flex-row");
    expect(s).toContain("lg:overflow-hidden");
  });

  it("the ticket panel is a border-l rail on solid #0d0f1a — not a card", () => {
    const s = terminal();
    expect(s).toContain("rounded-none border-l border-[#1e2235]");
    expect(s).toContain("bg-[#0d0f1a]");
    expect(s).toContain("md:w-[380px]");
    expect(s).not.toContain("vx-card flex h-fit");
    expect(s).not.toContain("lg:sticky");
  });
});

describe("B4/T4 — Agregado is the reference's transient banner, not a label", () => {
  it("the permanent label is gone", () => {
    expect(terminal()).not.toContain("tracking-widest text-slate-500");
  });

  it("the banner carries the emerald ramp + circle-check + product name", () => {
    const s = terminal();
    expect(s).toContain("from-emerald-600/80 to-teal-600/70");
    expect(s).toContain("border-emerald-500/30");
    expect(s).toContain("CircleCheck");
    expect(s).toContain("text-emerald-300/70");
    expect(s).toContain("text-lg font-black");
    expect(s).toContain("max-h-0 opacity-0");
  });
});

describe("B4/T5 — the ticket header + empty state + footer match", () => {
  it("the Ticket h2 is 12px uppercase white/80 with tracking", () => {
    const s = terminal();
    expect(s).toContain("text-xs font-bold text-white/80 tracking-wide uppercase");
    expect(s).not.toContain("text-lg font-bold text-slate-100");
  });

  it("the empty ticket is the 64px white/20 cart on white/25 copy", () => {
    const s = terminal();
    expect(s).toContain("h-16 w-16");
    expect(s).toContain("text-white/20");
    expect(s).toContain("text-white/25");
    expect(s).not.toContain("h-12 w-12 text-slate-600");
  });

  it("the footer is border-white/5 and totals only render with lines", () => {
    const s = terminal();
    expect(s).toContain("border-t border-white/5");
    expect(s).toContain("mt-auto");
    expect(s).toMatch(/ticket\.length > 0 \?/);
  });
});

describe("B4/T6 — COBRAR carries the reference's ShoppingBag", () => {
  it("the COBRAR buttons carry ShoppingBag (Banknote only survives in the payment dialog)", () => {
    const s = terminal();
    expect(s).toContain("ShoppingBag");
    // The COBRAR buttons no longer ride the banknote glyph.
    expect(s).not.toMatch(/COBRAR[^<]*<Banknote/);
    expect(s).toMatch(/<ShoppingBag className="h-6 w-6" \/>\s*\n\s*COBRAR/);
  });
});

describe("B4/T8 — the no-shift empty state is the reference's muted card", () => {
  it("64px violet-400/30 monitor, white/70 h2, white/35 copy, white/60 Cajas", () => {
    const s = terminal();
    expect(s).toContain("h-16 w-16 text-violet-400/30");
    expect(s).toContain("text-xl font-bold text-white/70");
    expect(s).toContain("text-white/35");
    expect(s).toContain("text-white/60");
    expect(s).not.toContain("text-violet-400\"");
    expect(s).not.toContain("min-h-[320px]");
  });
});

// ---- B5 — register cards --------------------------------------------------------

describe("B5/R1 — register cards match the reference", () => {
  it("h-1 strip, 48px slate-50 chip with slate-400 monitor, slate-800 name, text-xs location", () => {
    const s = registers();
    expect(s).toContain("h-1 bg-slate-200");
    expect(s).not.toContain("h-1.5");
    expect(s).toContain("w-12 h-12 rounded-xl bg-slate-50");
    expect(s).toContain("text-slate-400");
    expect(s).toContain("font-bold text-slate-800");
    expect(s).not.toContain("text-sm text-slate-500\">{register.location");
  });

  it("the status pill is the card variant; the delete button is p-2 slate-400", () => {
    const s = registers();
    expect(s).toContain('variant="card"');
    expect(s).toContain("hover:bg-red-50 hover:text-red-500");
    expect(s).not.toContain("p-2.5 text-slate-500");
  });
});

// ---- B6 — cajeros ---------------------------------------------------------------

describe("B6/C1 — Turnos Recientes matches the reference's dense table", () => {
  it("the heading is 16px title-case slate-700 (no violet uppercase)", () => {
    const s = cashiers();
    expect(s).toContain("mb-4 font-bold text-slate-700");
    expect(s).not.toContain("text-violet-400");
  });

  it("the shifts table is px-4 py-2 headers, py-2.5 cells, slate-50 hairlines", () => {
    const s = cashiers();
    expect(s).toContain("text-xs font-semibold text-slate-500 uppercase px-4 py-2");
    expect(s).toContain("px-4 py-2.5");
    expect(s).toContain("text-sm font-medium text-slate-700");
    expect(s).toContain("text-sm font-bold text-slate-800 text-right");
  });
});

// ---- B7 — reports + dashboard ----------------------------------------------------

describe("B7/F1 — Reports is the reference's only bright H1", () => {
  it("PageHeading exposes tone and reports passes bright", () => {
    const s = shared();
    expect(s).toContain('tone?: "default" | "bright"');
    expect(s).toContain("text-white/90");
    expect(reports()).toContain('tone="bright"');
  });
});

describe("B7/F2 — the reports row chips are tinted, not gradient", () => {
  it("15% fill + 30% border + 400-tone icon per color", () => {
    const s = shared();
    expect(s).toContain("bg-indigo-500/15 border-indigo-500/30");
    expect(s).toContain("bg-emerald-500/15 border-emerald-500/30");
    expect(s).toContain("bg-violet-500/15 border-violet-500/30");
  });
});

describe("B7/F3 — the dashboard grids match", () => {
  it("stats are grid-cols-2 lg:grid-cols-4; the chart row is lg:grid-cols-3 with a col-span-2 chart", () => {
    const s = dashboard();
    expect(s).toContain("grid grid-cols-2 gap-4 lg:grid-cols-4");
    expect(s).toContain("lg:grid-cols-3 gap-6");
    expect(s).toContain("lg:col-span-2");
  });
});

describe("B7/F4 — the low-stock chip icon is 20px", () => {
  it("h-5 w-5 package inside the amber chip", () => {
    expect(dashboard()).toContain('<Package className="h-5 w-5" />');
  });
});

// ---- B8 — settings -----------------------------------------------------------------

describe("B8/S1 — settings match the reference", () => {
  it("max-w-4xl wrapper + 54px Guardar + square swatches", () => {
    const s = settings();
    expect(s).toContain("max-w-4xl");
    expect(s).not.toContain("max-w-3xl");
    expect(s).toContain("h-auto rounded-xl px-6 py-3.5 text-base");
    expect(s).toContain("h-10 w-10");
    expect(s).not.toContain("w-14");
    expect(s).not.toContain('rounded-lg border border-[#262a36] bg-transparent');
  });

  it("Agregar + category chips are glass controls", () => {
    const s = settings();
    expect(s).toMatch(/glass-button[^"]*text-slate-700/);
    expect(s).toContain("glass-button flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700");
    expect(s).toContain("text-slate-400 transition-colors hover:text-red-500");
  });
});

// ---- B9/H1 — button hygiene ----------------------------------------------------------

describe("B9/H1 — button.tsx carries no dead study tokens", () => {
  it("no sf-* classes, no gradient/neutral variants, outline is dark-native", () => {
    const s = button();
    expect(s).not.toContain("sf-");
    expect(s).not.toContain("neutral:");
    expect(s).toContain("outline:");
    expect(s).toContain("border-input bg-transparent");
    expect(s).not.toContain("#e5e5e5");
    expect(s).not.toContain("#0a0a0a");
  });
});

// ---- B2/T1b — the secondary badge token (VLM-caught follow-up) -------------

describe("B2/T1b — the secondary token is the reference's neutral, not violet", () => {
  it("globals.css pins --secondary to the reference's measured badge colors", () => {
    const s = src("src/app/globals.css");
    expect(s).toContain("--secondary: 33 37 49;");
    expect(s).toContain("--secondary-foreground: 182 188 201;");
    expect(s).not.toContain("--secondary: 139 92 246;");
  });
});

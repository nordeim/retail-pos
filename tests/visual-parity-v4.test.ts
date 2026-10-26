import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// remediation-plan-v4 source pins (§2 batches B1–B4), measured live on the
// reference (veloxposretail.base44.app, 2026-10-26 session V4) with
// computed-style probes — see docs/remediation-plan-v4.md §0 ledger.
//
// These are SOURCE pins: they freeze the measured class contracts into the
// component/utility sources so a refactor cannot silently drift them.
// Computed-style e2e twins live in tests/e2e/visual-parity.spec.ts (v4
// describe block).
// ---------------------------------------------------------------------------

const readSource = (...segments: string[]) =>
  readFileSync(path.join(import.meta.dirname, "..", "src", ...segments), "utf8");

// ---- B1: radius scale + nav chrome --------------------------------------------

describe("B1/V1 — native Tailwind radius scale", () => {
  it("globals.css keeps the native radius steps (no shadcn remap)", () => {
    const css = readSource("app", "globals.css");
    expect(css).toContain("--radius-sm: 0.25rem");
    expect(css).toContain("--radius-md: 0.375rem");
    expect(css).toContain("--radius-lg: 0.5rem");
    expect(css).toContain("--radius-xl: 0.75rem");
    // the v3-era remap is gone
    expect(css).not.toContain("calc(var(--radius) + 4px)");
  });
});

describe("B1/V2-V3 — nav item states (nav-items.tsx)", () => {
  it("the ACTIVE item is the reference's translucent violet pill", () => {
    const src = readSource("components", "layout", "nav-items.tsx");
    expect(src).toContain("bg-violet-600/20");
    expect(src).toContain("text-violet-300");
    // the 1px violet edge rides a RING (box-shadow), never a border — a
    // border would inflate the active row 2px and break the drawer's
    // uniform 44px pitch contract (mobile-navigation TRAP-4 guard)
    expect(src).toContain("ring-1 ring-violet-500/30");
    expect(src).toContain("shadow-violet-500/10");
    expect(src).not.toContain("vx-gradient text-white");
  });

  it("the INACTIVE item is white/40 with the reference's hover", () => {
    const src = readSource("components", "layout", "nav-items.tsx");
    expect(src).toContain("text-white/40");
    expect(src).toContain("hover:text-white/80");
    expect(src).toContain("transition-all duration-150");
    expect(src).not.toContain("text-slate-400");
  });

  it("the nav icons are the reference's lucide set (v4 probe)", () => {
    const src = readSource("components", "layout", "nav-items.tsx");
    expect(src).toContain("dashboard: ChartColumn");
    expect(src).toContain("reportes: FileChartColumnIncreasing");
    expect(src).toContain("terminal: ShoppingCart");
    expect(src).not.toContain("LayoutDashboard");
    expect(src).not.toContain("FileText");
  });
});

describe("B1/V4 — sidebar brand block (sidebar.tsx)", () => {
  it("the brand chip is the reference's 32px diagonal gradient", () => {
    const src = readSource("components", "layout", "sidebar.tsx");
    expect(src).toContain("h-8 w-8");
    expect(src).toContain("bg-gradient-to-br from-violet-500 to-indigo-600");
    expect(src).not.toContain("vx-gradient");
  });

  it("the brand text + row + nav spacing match the reference", () => {
    const src = readSource("components", "layout", "sidebar.tsx");
    expect(src).toContain("text-sm font-bold text-white/90 tracking-wide");
    expect(src).toContain("py-5");
    expect(src).toContain("gap-0.5"); // the reference space-y-0.5 rhythm, expressed trap-safely
  });
});

describe("B1/V5 — collapse toggle (sidebar.tsx)", () => {
  it("is full-width, rounded-xl, white/30 with the reference hover", () => {
    const src = readSource("components", "layout", "sidebar.tsx");
    expect(src).toContain("w-full");
    expect(src).toContain("text-white/30 hover:text-white/70");
    expect(src).not.toContain("text-slate-500");
  });
});

// ---- B2: card surfaces + stat cards + reports ----------------------------------

describe("B2/V0 — vx-card surface system (globals.css)", () => {
  it("carries the reference's translucent surface + white-alpha hairline + elevation", () => {
    const css = readSource("app", "globals.css");
    expect(css).toContain("rgba(16, 18, 32, 0.9)");
    expect(css).toContain("rgba(255, 255, 255, 0.07)");
    expect(css).toMatch(/box-shadow:\s*0 8px 32px rgba\(0, 0, 0, 0.5\)/);
  });
});

describe("B2/V6 — StatCard anatomy (shared.tsx)", () => {
  it("renders the gradient blob, the horizontal label+value row, and the gradient chip", () => {
    const src = readSource("components", "pos", "shared.tsx");
    expect(src).toContain("-top-6 -right-6 w-20 h-20 rounded-full");
    expect(src).toContain("opacity-20");
    expect(src).toContain("flex items-start justify-between");
    expect(src).toContain("text-xs font-semibold text-slate-500");
    expect(src).toContain("text-2xl font-bold");
    expect(src).toMatch(/p-2\.5 rounded-xl bg-gradient-to-br/);
    expect(src).not.toContain("text-3xl");
    expect(src).not.toContain("h-11 w-11");
  });

  it("the color ramps are the reference's from-400 to-500 pairs", () => {
    const src = readSource("components", "pos", "shared.tsx");
    expect(src).toContain("from-green-400 to-emerald-500");
    expect(src).toContain("from-indigo-400 to-purple-500");
    expect(src).toContain("from-blue-400 to-indigo-500");
    expect(src).toContain("from-amber-400 to-orange-500");
  });
});

describe("B2/V7 — reports summary cards (shared.tsx + reports-view.tsx)", () => {
  it("exposes the icon-LEFT horizontal variant", () => {
    const src = readSource("components", "pos", "shared.tsx");
    expect(src).toContain('layout?: "stack" | "row"');
    expect(src).toContain("flex items-center gap-4");
    expect(src).toContain("w-12 h-12 rounded-2xl");
    expect(src).toContain("text-white/35");
    expect(src).toContain("font-black");
  });

  it("the reports view opts into the row layout", () => {
    const src = readSource("components", "views", "reports-view.tsx");
    expect(src).toMatch(/layout="row"/);
  });
});

describe("B2/V7b — reports period tabs (reports-view.tsx)", () => {
  it("container + active + inactive match the reference", () => {
    const src = readSource("components", "views", "reports-view.tsx");
    expect(src).toContain("flex gap-2 p-1 rounded-2xl");
    expect(src).toContain("bg-[#1c1f34]/85");
    expect(src).toContain("border-white/[0.07]");
    expect(src).toContain("bg-violet-600 text-white shadow-lg shadow-violet-500/30");
    expect(src).toContain("text-white/40 hover:text-white/70");
    // the old gradient-pill tab active is gone (the chart bar fill keeps
    // vx-gradient — it is a data element, not a control)
    expect(src).not.toContain("vx-gradient text-white");
  });
});

describe("B2/V11 — low-stock count color (dashboard-view.tsx)", () => {
  it("the count sub-line is amber-600 (the reference's tone)", () => {
    const src = readSource("components", "views", "dashboard-view.tsx");
    expect(src).toContain("text-amber-600");
    expect(src).not.toContain("text-amber-400\"");
  });
});

// ---- B3: button system ----------------------------------------------------------

describe("B3/V9 — glass button utilities (globals.css)", () => {
  it("ships glass-button-primary / -success / -warning with the reference ramps", () => {
    const css = readSource("app", "globals.css");
    expect(css).toContain("@utility glass-button-primary");
    expect(css).toContain("@utility glass-button-success");
    expect(css).toContain("@utility glass-button-warning");
    expect(css).toContain("rgb(124, 58, 237), rgb(99, 102, 241)");
    expect(css).toContain("rgb(5, 150, 105), rgb(16, 185, 129)");
  });
});

describe("B3/V9 — CTAs use the glass system", () => {
  it("inventory: Nuevo Producto", () => {
    const src = readSource("components", "views", "inventory-view.tsx");
    expect(src).toContain("glass-button-primary");
    expect(src).not.toContain("vx-gradient");
  });

  it("registers: Nueva Caja + Abrir/Cerrar Turno", () => {
    const src = readSource("components", "views", "registers-view.tsx");
    expect(src).toContain("glass-button-primary");
    expect(src).toContain("glass-button-success");
    expect(src).toContain("glass-button-warning");
    expect(src).not.toContain("vx-gradient");
  });

  it("cashiers + settings: the create/save CTAs", () => {
    const cashiers = readSource("components", "views", "cashiers-view.tsx");
    expect(cashiers).toContain("glass-button-primary");
    const settings = readSource("components", "views", "settings-view.tsx");
    expect(settings).toContain("glass-button-primary");
  });

  it("terminal: COBRAR is the 70px glass success button", () => {
    const src = readSource("components", "views", "terminal-view.tsx");
    expect(src).toContain("glass-button-success");
    expect(src).toContain("py-5");
    expect(src).toContain("text-xl font-black");
    // the old solid-emerald COBRAR treatments are gone (the payment dialog's
    // emerald-500/15 method toggle is a different element and stays)
    expect(src).not.toContain("bg-emerald-500 font-semibold");
    expect(src).not.toContain("bg-emerald-800/60");
  });
});

describe("B3/V10 — table icon-button hovers (inventory-view.tsx)", () => {
  it("edit hovers indigo-50/600, delete hovers red-50/500", () => {
    const src = readSource("components", "views", "inventory-view.tsx");
    expect(src).toContain("hover:bg-indigo-50 hover:text-indigo-600");
    expect(src).toContain("hover:bg-red-50 hover:text-red-500");
    expect(src).not.toContain("hover:bg-white/5");
  });
});

// ---- B4: login/signup parity -----------------------------------------------------

describe("B4/V8 — auth surfaces (login-surface.tsx)", () => {
  it("AuthShell: the reference card + page background", () => {
    const src = readSource("components", "auth", "login-surface.tsx");
    expect(src).toContain("rounded-2xl");
    expect(src).toContain("bg-white/95");
    expect(src).toContain("backdrop-blur-sm");
    expect(src).toContain("shadow-2xl");
    expect(src).not.toContain("rounded-3xl");
    const css = readSource("app", "globals.css");
    expect(css).toContain("to right bottom");
  });

  it("the logo is the reference PNG with ring + glow", () => {
    const src = readSource("components", "auth", "login-surface.tsx");
    expect(src).toContain("veloxpos-logo.png");
    expect(src).toContain("ring-4 ring-white/50");
    expect(src).toContain("shadow-lg");
  });

  it("social buttons: official SVG marks + the reference geometry", () => {
    const src = readSource("components", "auth", "login-surface.tsx");
    expect(src).toContain("SocialGlyph");
    expect(src).toContain("#4285F4");
    expect(src).toContain("#F25022");
    expect(src).toContain("#1877F2");
    expect(src).toContain("px-5 py-3.5");
    expect(src).toContain("border-slate-200");
    expect(src).toContain("hover:shadow");
  });

  it("inputs: h-12, slate-50/50 fill, text-base, slate-200 border", () => {
    const src = readSource("components", "auth", "login-surface.tsx");
    expect(src).toContain("h-12");
    expect(src).toContain("bg-slate-50/50");
    expect(src).toContain("text-base");
    expect(src).toContain("border-slate-200");
  });

  it("submit: the reference's near-black 48px button", () => {
    const src = readSource("components", "auth", "login-surface.tsx");
    expect(src).toContain("bg-slate-900");
    expect(src).toContain("hover:bg-slate-800");
    expect(src).not.toContain("bg-indigo-600");
  });
});

describe("B4/V8b — signup shares the parity shell (signup-surface.tsx)", () => {
  it("uses the same AuthShell + the parity input treatment", () => {
    const src = readSource("components", "auth", "signup-surface.tsx");
    expect(src).toContain("AuthShell");
    expect(src).toContain("h-12 rounded-xl border-slate-200 bg-slate-50/50");
    expect(src).not.toContain("rounded-3xl");
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Pins for remediation-plan-v9 (session V9, 2026-10-26) — the Spanish route
// aliases the rewrites accept but viewFromPath never mapped (every Spanish
// name silently rendered the TERMINAL — the documented superset was
// half-implemented), the document-title algorithm (the reference's titles
// are PATH-driven: exact-case canonical match, everything else slug-cased —
// "/SALES" is "SALES | VeloxPOS" there, not "Sales"), the table-level
// text-sm that shrank the Ventas Total to 14px (the reference's bare
// tables inherit 16px), the --foreground token (#e7e9ef measured, not
// #f8fafc), and the TWO chart skins the reference renders (Dashboard:
// #e2e8f0 gridlines "3 3" + #94a3b8 12px labels + salesGrad gradient
// 0.3 + #6366f1 line w2.5; Reports: white/4% gridlines + white/30% 11px
// labels + 0.35 + w2). Every finding was measured LIVE on both apps
// (agent-browser); see docs/remediation-plan-v9.md §0.
// Pins written RED first.
// ---------------------------------------------------------------------------

const root = resolve(import.meta.dirname, "..");
const src = (p: string) => readFileSync(resolve(root, p), "utf8");

const router = () => src("src/lib/router.ts");
const page = () => src("src/app/page.tsx");
const globals = () => src("src/app/globals.css");
const shared = () => src("src/components/pos/shared.tsx");
const sales = () => src("src/components/views/sales-view.tsx");
const inventory = () => src("src/components/views/inventory-view.tsx");
const cashiers = () => src("src/components/views/cashiers-view.tsx");
const dashboard = () => src("src/components/views/dashboard-view.tsx");
const reports = () => src("src/components/views/reports-view.tsx");

// ---- B1/F1 — the Spanish alias map ------------------------------------------------

describe("B1/F1 — viewFromPath resolves the Spanish aliases to their views", () => {
  it("maps every Spanish route name (case-insensitive) to its view", async () => {
    const { viewFromPath } = await import("@/lib/router");
    expect(viewFromPath("/Ventas")).toBe("ventas");
    expect(viewFromPath("/ventas")).toBe("ventas");
    expect(viewFromPath("/Inventario")).toBe("inventario");
    expect(viewFromPath("/inventario")).toBe("inventario");
    expect(viewFromPath("/Cajas")).toBe("cajas");
    expect(viewFromPath("/cajas")).toBe("cajas");
    expect(viewFromPath("/Cajeros")).toBe("cajeros");
    expect(viewFromPath("/cajeros")).toBe("cajeros");
    expect(viewFromPath("/Reportes")).toBe("reportes");
    expect(viewFromPath("/reportes")).toBe("reportes");
    expect(viewFromPath("/Ajustes")).toBe("ajustes");
    expect(viewFromPath("/ajustes")).toBe("ajustes");
  });

  it("maps /Terminal explicitly (the ref 404s it; the clone's rewrite accepts it)", async () => {
    const { viewFromPath } = await import("@/lib/router");
    expect(viewFromPath("/Terminal")).toBe("terminal");
    expect(viewFromPath("/terminal")).toBe("terminal");
  });

  it("keeps the canonical English paths and the fallback unchanged", async () => {
    const { viewFromPath } = await import("@/lib/router");
    expect(viewFromPath("/Sales")).toBe("ventas");
    expect(viewFromPath("/sales")).toBe("ventas");
    expect(viewFromPath("/SALES")).toBe("ventas");
    expect(viewFromPath("/Dashboard")).toBe("dashboard");
    expect(viewFromPath("/StoreSettings")).toBe("ajustes");
    expect(viewFromPath("/")).toBe("terminal");
    expect(viewFromPath("/NonExistent")).toBe("terminal");
  });

  it("isKnownPath accepts the Spanish names + /Terminal (source-of-truth comment honored)", async () => {
    const { isKnownPath } = await import("@/lib/router");
    expect(isKnownPath("/Ventas")).toBe(true);
    expect(isKnownPath("/Inventario")).toBe(true);
    expect(isKnownPath("/Cajas")).toBe(true);
    expect(isKnownPath("/Cajeros")).toBe(true);
    expect(isKnownPath("/Reportes")).toBe(true);
    expect(isKnownPath("/Ajustes")).toBe(true);
    expect(isKnownPath("/Terminal")).toBe(true);
    expect(isKnownPath("/ventas")).toBe(true);
    expect(isKnownPath("/foo-bar-baz")).toBe(false);
    expect(isKnownPath("/NonExistent")).toBe(false);
  });
});

// ---- B1/F2 — the path-driven title algorithm ---------------------------------------

describe("B1/F2 — documentTitleForPath goes exact-case (the ref's algorithm)", () => {
  it("canonical PascalCase paths keep their canonical titles", async () => {
    const { documentTitleForPath } = await import("@/lib/router");
    expect(documentTitleForPath("/")).toBe("VeloxPOS");
    expect(documentTitleForPath("/Dashboard")).toBe("Dashboard | VeloxPOS");
    expect(documentTitleForPath("/Sales")).toBe("Sales | VeloxPOS");
    expect(documentTitleForPath("/StoreSettings")).toBe("Store Settings | VeloxPOS");
  });

  it("non-canonical casing SLUG-cases like the reference (measured)", async () => {
    const { documentTitleForPath } = await import("@/lib/router");
    // Live-measured on the ref: /SALES → "SALES | VeloxPOS" (NOT canonical).
    expect(documentTitleForPath("/SALES")).toBe("SALES | VeloxPOS");
    expect(documentTitleForPath("/DASHBOARD")).toBe("DASHBOARD | VeloxPOS");
    // /sales slug-cases to "Sales" (coincides with the canonical title).
    expect(documentTitleForPath("/sales")).toBe("Sales | VeloxPOS");
    // /storesettings slug-cases (the ref shows "Storesettings", NOT "Store
    // Settings" — its exact-case lookup missed).
    expect(documentTitleForPath("/storesettings")).toBe("Storesettings | VeloxPOS");
    expect(documentTitleForPath("/INVENTORY")).toBe("INVENTORY | VeloxPOS");
  });

  it("the Spanish aliases keep the ref's own titles for those URLs", async () => {
    const { documentTitleForPath } = await import("@/lib/router");
    // The ref 404s /Ventas but still titles it "Ventas | VeloxPOS" — the
    // clone renders the VIEW there and carries the same path-derived title.
    expect(documentTitleForPath("/Ventas")).toBe("Ventas | VeloxPOS");
    expect(documentTitleForPath("/Ajustes")).toBe("Ajustes | VeloxPOS");
    expect(documentTitleForPath("/Terminal")).toBe("Terminal | VeloxPOS");
  });

  it("unknown paths still slug-case (the v7 contract, unchanged)", async () => {
    const { documentTitleForPath } = await import("@/lib/router");
    expect(documentTitleForPath("/foo-bar-baz")).toBe("Foo Bar Baz | VeloxPOS");
    expect(documentTitleForPath("/no-such-view")).toBe("No Such View | VeloxPOS");
  });

  it("the shell titles from the PATH, not the view (source pin)", () => {
    const s = page();
    expect(s).toContain("documentTitleForPath(window.location.pathname)");
    expect(s).toMatch(/document\.title\s*=/);
    // The view-driven form is gone (F2's whole point).
    expect(s).not.toContain("document.title = DOCUMENT_TITLES[view]");
  });
});

// ---- B2/F3 — the tables go bare (cells carry their own sizes) ----------------------

describe("B2/F3 — no table-level text-sm on the ref-aligned tables", () => {
  const tableLines = (s: string) =>
    s
      .split("\n")
      .filter((line) => line.includes("<table"))
      .map((line) => line.trim());

  it("sales-view: the table is bare (the Total inherits 16px like the ref)", () => {
    const lines = tableLines(sales());
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line).not.toMatch(/<table[^>]*text-sm/);
    }
  });

  it("inventory-view: the table is bare", () => {
    const lines = tableLines(inventory());
    for (const line of lines) {
      expect(line).not.toMatch(/<table[^>]*text-sm/);
    }
  });

  it("cashiers-view: BOTH tables are bare", () => {
    const lines = tableLines(cashiers());
    expect(lines.length).toBe(2);
    for (const line of lines) {
      expect(line).not.toMatch(/<table[^>]*text-sm/);
    }
  });

  it("the Ventas Total cell keeps the ref's own classes (16px via inheritance)", () => {
    const s = sales();
    expect(s).toContain("px-5 py-3 text-right font-bold text-slate-800");
  });
});

// ---- B3/F4 — the foreground token --------------------------------------------------

describe("B3/F4 — the foreground token matches the ref's body default", () => {
  it("globals.css pins --foreground to 231 233 239 (#e7e9ef)", () => {
    const s = globals();
    expect(s).toMatch(/--foreground:\s*231 233 239/);
    expect(s).not.toMatch(/--foreground:\s*248 250 252/);
  });
});

// ---- B4/F5-F8 — the two chart skins ------------------------------------------------

describe("B4/F5-F8 — SalesAreaChart carries the measured skins", () => {
  it("the component declares the variant prop", () => {
    const s = shared();
    expect(s).toMatch(/variant[?]:\s*"dashboard" \| "reports"/);
    expect(s).toMatch(/variant = "dashboard"/);
  });

  it("the area fill is the salesGrad gradient (not a flat rgba)", () => {
    const s = shared();
    expect(s).toContain('id="salesGrad"');
    expect(s).toContain("url(#salesGrad)");
    expect(s).not.toContain('fill="rgba(139,92,246,0.12)"');
  });

  it("the dashboard skin: #e2e8f0 gridlines 3 3, #94a3b8 12px labels, #6366f1 line w2.5, gradient 0.3", () => {
    const s = shared();
    expect(s).toContain('gridStroke: "#e2e8f0"');
    expect(s).toContain('gridDash: "3 3"');
    expect(s).toContain('labelFill: "#94a3b8"');
    expect(s).toContain('labelSize: 12');
    expect(s).toContain('lineStroke: "#6366f1"');
    expect(s).toContain('lineWidth: 2.5');
    expect(s).toContain('gradientTopOpacity: 0.3');
    // the ref's measured dashboard values ride the SKIN, applied to the SVG
    expect(s).toContain('fontSize={skin.labelSize}');
    expect(s).toContain('fill={skin.labelFill}');
  });

  it("the reports skin: white/4% gridlines, white/30% 11px labels, line w2, gradient 0.35", () => {
    const s = shared();
    expect(s).toContain('gridStroke: "rgba(255,255,255,0.04)"');
    expect(s).toContain('labelFill: "rgba(255,255,255,0.3)"');
    expect(s).toContain('labelSize: 11');
    expect(s).toContain('lineWidth: 2');
    expect(s).toContain('gradientTopOpacity: 0.35');
  });

  it("the old violet line and dark gridlines are gone", () => {
    const s = shared();
    expect(s).not.toContain('stroke="#8b5cf6"');
    expect(s).not.toContain('stroke="#262a36"');
    expect(s).not.toContain('strokeDasharray="3 4"');
    expect(s).not.toContain('fill="#64748b"');
  });

  it("the call sites pass their variants", () => {
    expect(dashboard()).toContain('variant="dashboard"');
    expect(reports()).toContain('variant="reports"');
  });
});

// ---- B4b/F10 — the dashboard footer is clone-invented (the ref has none) ---------

describe("B4b/F10 — no clone-invented dashboard footer", () => {
  it("the reference's dashboard ends at the low-stock list — no VeloxPOS credit", () => {
    // Live-measured (V9/L11 follow-up): the ref's dashboard scrollHeight ends
    // right after the low-stock rows; there is NO ShoppingBasket + "VeloxPOS"
    // line. The v6-era footer was clone-invented — removed.
    const s = dashboard();
    expect(s).not.toContain("ShoppingBasket");
    expect(s).not.toMatch(/>\s*VeloxPOS\s*</);
  });
});

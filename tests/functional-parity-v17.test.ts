import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The V17 pins (docs/remediation-plan-v17.md §B1/F2):
//   The views bundle shipped ALL 8 views to every surface — page.tsx
//   statically imported the whole registry, so the dashboard paid for
//   the terminal/inventory/sales/… code it never runs (69 KiB gz unused
//   on any single view; the authed dashboard measured TBT 550 ms /
//   LCP 3.7 s / perf 54 in Lighthouse 13). The fix (SD-67): the registry
//   goes React.lazy — one dynamic import() per view — and the boot
//   effect PREFETCHES the active view's chunk in parallel with
//   /api/auth/me + the collection pre-warm, so the chunk is resident
//   before status flips "ready". The ActiveView renders inside a
//   Suspense fallback={null}.

const root = resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const page = () => read("src/app/page.tsx");

const VIEW_IDS = [
  "terminal",
  "dashboard",
  "inventario",
  "ventas",
  "cajas",
  "cajeros",
  "reportes",
  "ajustes",
] as const;

const VIEW_FILES = [
  "terminal-view",
  "dashboard-view",
  "inventory-view",
  "sales-view",
  "registers-view",
  "cashiers-view",
  "reports-view",
  "settings-view",
] as const;

describe("F2/SD-67 — the lazy view registry", () => {
  it("page.tsx carries NO static view imports (the registry is lazy)", () => {
    const staticImports = page().match(
      /^import\s+\{[^}]*\}\s+from\s+"@\/components\/views\//m,
    );
    expect(staticImports).toBeNull();
  });

  it("every view is a dynamic import() in the loader map", () => {
    const s = page();
    for (const f of VIEW_FILES) {
      expect(s).toContain(`import("@/components/views/${f}")`);
    }
  });

  it("the lazy map covers all 8 view ids", () => {
    const s = page();
    for (const id of VIEW_IDS) {
      expect(s).toContain(`${id}:`);
    }
  });

  it("React.lazy builds the component map from the loaders", () => {
    expect(page()).toMatch(/React\.lazy\(/);
  });

  it("the boot effect prefetches the ACTIVE view's chunk (parallel with auth/me)", () => {
    // The prefetch rides the existing boot seam: the loader fires for the
    // view the URL selected, fire-and-forget, before the await on auth.
    expect(page()).toContain("VIEW_LOADERS[activeView]");
  });

  it("the ActiveView renders inside a Suspense fallback={null}", () => {
    expect(page()).toMatch(/React\.Suspense[^>]*fallback=\{null\}/);
  });
});

describe("F2 — the shell chrome pins survive the refactor", () => {
  it("the flush gutter + terminal full-bleed classes are untouched", () => {
    const s = page();
    expect(s).toContain("lg:ml-[220px]");
    expect(s).toContain("lg:ml-[68px]");
    expect(s).toContain('view === "terminal"');
    expect(s).toContain("lg:h-screen");
    expect(s).toContain("lg:overflow-hidden");
    expect(s).toContain("lg:p-0");
  });

  it("the pre-warm seam (INITIAL_COLLECTIONS) is untouched", () => {
    expect(page()).toContain("INITIAL_COLLECTIONS[activeView]");
  });
});

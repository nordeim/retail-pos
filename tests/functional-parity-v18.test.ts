import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The V18 source pins (docs/remediation-plan-v18.md §B1/F1, SD-70/71/72):
//   the error-recovery architecture — the lazy view registry (V17) must
//   never ship a bare Suspense: a failed view chunk (transient blip or
//   stale-hash-after-redeploy) crashes the whole app to Next's built-in
//   English dead-end screen (reproduced live, plan ledger L6). The
//   contract: the boundary wraps the Suspense (the shell survives), the
//   registry rebuilds per retry epoch (React.lazy caches rejections
//   forever — a fresh instance is the only re-import path), the boot
//   prefetch is fire-and-forget-SILENT (the lazy mount owns the error),
//   and the two outer nets (error.tsx + global-error.tsx) exist, use the
//   seam, speak Spanish, and the root net carries its own html/body +
//   globals.css (a resilience surface must not stand on the tree that
//   broke).

const root = resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const page = () => read("src/app/page.tsx");

describe("F1/SD-70 — the view error boundary in page.tsx", () => {
  it("the Suspense mounts INSIDE an error boundary (never a bare Suspense)", () => {
    const s = page();
    expect(s).toMatch(/class\s+\w*[Ee]rror\w*[Bb]oundary/);
    // The boundary element wraps the Suspense element (source order).
    const boundaryIdx = s.search(/<[A-Za-z]*ErrorBoundary|<ViewErrorBoundary/);
    const suspenseIdx = s.indexOf("React.Suspense");
    expect(boundaryIdx).toBeGreaterThan(-1);
    expect(suspenseIdx).toBeGreaterThan(boundaryIdx);
  });

  it("the boundary carries the view+epoch key (route changes and retries both reset it)", () => {
    expect(page()).toMatch(/key=\{`\$\{view\}-\$\{viewEpoch\}`\}/);
  });

  it("the boundary fires the stale-chunk self-heal on catch", () => {
    expect(page()).toMatch(/reloadOnStaleChunk/);
  });

  it("the fallback renders the Spanish recovery card with Reintentar", () => {
    const s = page();
    expect(s).toContain("No se pudo cargar la vista");
    expect(s).toContain("Reintentar");
  });
});

describe("F3/SD-72 — the fire-and-forget-SILENT prefetch", () => {
  it("the boot prefetch swallows its rejection (the lazy mount owns the error)", () => {
    expect(page()).toMatch(
      /VIEW_LOADERS\[activeView\]\(\)\.catch\(\(\) => undefined\)/,
    );
  });
});

describe("F1/SD-71 — the fresh-registry retry (the epoch)", () => {
  it("the lazy registry is built per retry epoch (React.lazy caches rejections)", () => {
    const s = page();
    expect(s).toMatch(/viewEpoch/);
    expect(s).toMatch(/useMemo\(\s*\(\)\s*=>\s*\w*[Vv]iew\w*[Cc]omponents|\(\)\s*=>\s*buildViewComponents\(\)/);
  });

  it("Reintentar bumps the epoch before the boundary resets", () => {
    const s = page();
    const bumpIdx = s.search(/setViewEpoch\(\(n\) => n \+ 1\)/);
    expect(bumpIdx).toBeGreaterThan(-1);
  });
});

describe("F1/SD-70 — the outer nets (error.tsx + global-error.tsx)", () => {
  it("src/app/error.tsx exists, is a client component, uses the seam, speaks Spanish", () => {
    const s = read("src/app/error.tsx");
    expect(s).toContain('"use client"');
    expect(s).toContain("reloadOnStaleChunk");
    expect(s).toMatch(/[Áá]|[Óó]|[Úúñ]/); // Spanish copy present
    expect(s).toContain("reset");
  });

  it("src/app/global-error.tsx is self-contained: html + body + globals.css + the seam", () => {
    const s = read("src/app/global-error.tsx");
    expect(s).toContain('"use client"');
    expect(s).toContain('import "./globals.css"');
    expect(s).toMatch(/<html lang="es">/);
    expect(s).toContain("<body");
    expect(s).toContain("reloadOnStaleChunk");
  });

  it("neither net imports the component tree (resilience surfaces stand alone)", () => {
    for (const p of ["src/app/error.tsx", "src/app/global-error.tsx"]) {
      const s = read(p);
      expect(s, `${p} must not import components`).not.toMatch(
        /from "@\/components\//,
      );
    }
  });
});

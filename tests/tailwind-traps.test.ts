// ---------------------------------------------------------------------------
// The Tailwind-v4 trap guards that live in SOURCE (the e2e pins live in
// tests/e2e/mobile-navigation.spec.ts):
//   · Trap 4 — no margin utilities inside space-y-* containers, and the
//     drawer nav list is a flex gap-* container;
//   · Trap 1 — @theme inline only ever consumes FULL color values;
//   · Trap 5 — --shadow-sm pinned to the reference geometry.
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/** Strip // line comments and /* block comments so docs never trip code pins. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function read(...segments: string[]): string {
  return readFileSync(path.join(import.meta.dirname, "..", ...segments), "utf8");
}

const CSS = read("src", "app", "globals.css");
const MOBILE_CHROME = stripComments(read("src", "components", "layout", "mobile-chrome.tsx"));
const SIDEBAR = stripComments(read("src", "components", "layout", "sidebar.tsx"));

describe("trap 4 — the space-y margin rewrite", () => {
  it("the mobile drawer nav list uses flex gap, never space-y", () => {
    expect(MOBILE_CHROME).toMatch(/flex flex-1 flex-col gap-1/);
    expect(MOBILE_CHROME).not.toContain("space-y");
  });

  it("no space-y-* container in the chrome carries margin-utility children", () => {
    // The only space-* usages allowed anywhere in the chrome: none.
    expect(SIDEBAR).not.toContain("space-y");
    expect(MOBILE_CHROME).not.toMatch(/space-[xy]-/);
  });

  it("the CSS pins the trap rule as a comment for future editors", () => {
    expect(CSS).toContain(":where() rewrite flips the specificity");
  });
});

describe("trap 1 — theme tokens are full colors", () => {
  it("@theme inline maps every var through rgb()/hsl(), never a bare triplet", () => {
    const inlineBlock = CSS.slice(CSS.indexOf("@theme inline"));
    const bareTriplet = /--color-[\w-]+:\s*\d+\s+\d+\s+\d+;/;
    expect(bareTriplet.test(inlineBlock)).toBe(false);
    expect(inlineBlock).toContain("rgb(var(--background))");
  });

  it("keeps the shadcn triplets in :root only", () => {
    const rootBlock = CSS.slice(CSS.indexOf("\n:root {"), CSS.indexOf("\n@theme inline {"));
    expect(rootBlock).toContain("--background: 8 10 20;");
  });
});

describe("trap 5 — the shadow scale", () => {
  it("pins --shadow-sm to the reference geometry", () => {
    expect(CSS).toContain("--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);");
  });
});

describe("the reference design tokens", () => {
  it("carries the measured canvas/surface/border hexes", () => {
    expect(CSS).toContain("--color-vx-canvas: #080a14");
    expect(CSS).toContain("--color-vx-surface: #0d0f1a");
    expect(CSS).toContain("--color-vx-border: #1e2235");
  });

  it("defines the drawer-safe gradient utilities (explicit linear-gradient, never utility gradients)", () => {
    expect(CSS).toContain("linear-gradient");
  });
});

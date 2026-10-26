import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { authSecretBootStatus } from "@/lib/env-check";

// ---------------------------------------------------------------------------
// R4 hygiene pins (remediation-plan-v3 §R4). Identity, gate strictness, dead
// code, the donut color map, the load-failure toast, the env example, and
// the mobile drawer focus contract (the neo-crm pattern: rAF retry +
// activeElement verification + focus return).
// ---------------------------------------------------------------------------

const root = path.join(import.meta.dirname, "..");
const readRoot = (file: string) => readFileSync(path.join(root, file), "utf8");
const readSource = (...segments: string[]) =>
  readFileSync(path.join(root, "src", ...segments), "utf8");

describe("repo identity (M8)", () => {
  it("package.json carries the retail-pos identity", () => {
    const pkg = JSON.parse(readRoot("package.json")) as {
      name: string;
      description: string;
    };
    expect(pkg.name).toBe("retail-pos");
    expect(pkg.description).toMatch(/VeloxPOS/i);
  });

  it("the dead study deps are gone", () => {
    const pkg = JSON.parse(readRoot("package.json")) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies["quill"]).toBeUndefined();
    expect(pkg.dependencies["web-vitals"]).toBeUndefined();
    expect(pkg.dependencies["z-ai-web-dev-sdk"]).toBeUndefined();
  });

  it("the dead ai.ts module is gone", () => {
    expect(() => readSource("lib", "server", "ai.ts")).toThrow();
  });

  it("the vitest header narrates the POS suite (no stale study census)", () => {
    const header = readRoot("vitest.config.ts").slice(0, 4000);
    expect(header).not.toContain("936 tests");
    expect(header).not.toContain("omni-study");
  });

  it("the next.config route comment lists the POS routes only", () => {
    const config = readRoot("next.config.ts");
    expect(config).not.toContain("MyDay");
    expect(config).not.toContain("Tasks");
  });
});

describe("gate strictness restored (L1)", () => {
  it("next.config no longer swallows build errors", () => {
    expect(readRoot("next.config.ts")).not.toContain("ignoreBuildErrors");
  });

  it("tsconfig keeps implicit-any strict", () => {
    expect(readRoot("tsconfig.json")).not.toContain('"noImplicitAny": false');
  });
});

describe("dead code swept (L3)", () => {
  it("the terminal's identical Agregado ternary is gone", () => {
    expect(readSource("components", "views", "terminal-view.tsx")).not.toContain(
      '? "Agregado" : "Agregado"',
    );
  });

  it("the built-then-voided productById is gone", () => {
    expect(readSource("components", "views", "terminal-view.tsx")).not.toContain(
      "void productById",
    );
  });
});

describe("donut color map (L5)", () => {
  it("arcs AND legend swatches read one shared colorByName map", () => {
    const source = readSource("components", "pos", "shared.tsx");
    expect(source).toContain("colorByName");
    // Exactly ONE indexing site — the colorByName assignment itself. The
    // pre-remediation shape indexed twice (arcs over the filtered list,
    // swatches over the raw one).
    expect((source.match(/DONUT_COLORS\[i % DONUT_COLORS\.length\]/g) ?? []).length).toBe(1);
    // Both consumers read the map, never the array position.
    expect(source).toContain("colorByName.get(d.name)");
    expect((source.match(/colorByName\.get\(d\.name\)/g) ?? []).length).toBe(2);
  });
});

describe("load-failure toast (L6)", () => {
  it("loadCollections surfaces a burst failure via the toast store", () => {
    const source = readSource("lib", "store.ts");
    expect(source).toContain("No se pudieron cargar los datos");
    expect(source).toContain("useToastStore");
  });
});

describe("env example contract (L9)", () => {
  it(".env.example documents NEXT_PUBLIC_SITE_URL", () => {
    expect(readRoot(".env.example")).toContain("NEXT_PUBLIC_SITE_URL");
  });

  it("the EXAMPLE AUTH_SECRET value is production-fatal (no shared-deploy boot)", () => {
    const example = readRoot(".env.example");
    const match = example.match(/AUTH_SECRET="([^"]+)"/);
    expect(match).not.toBeNull();
    const status = authSecretBootStatus("production", match?.[1]);
    expect(status.level).toBe("fatal");
  });
});

describe("mobile drawer focus contract (L11)", () => {
  it("focus moves INTO the panel on open (rAF + activeElement verification)", () => {
    const source = readSource("components", "layout", "mobile-chrome.tsx");
    expect(source).toContain("requestAnimationFrame");
    expect(source).toContain("activeElement");
    expect(source).toContain('tabIndex={-1}');
  });

  it("focus RETURNS to the hamburger on close", () => {
    const source = readSource("components", "layout", "mobile-chrome.tsx");
    expect(source).toMatch(/menuButtonRef\.current\?\.focus\(\)/);
  });

  it("Tab wraps inside the drawer (first/last focusable cycle)", () => {
    const source = readSource("components", "layout", "mobile-chrome.tsx");
    expect(source).toContain('event.key !== "Tab"');
    expect(source).toContain("preventDefault");
    expect(source).toContain("last.focus()");
    expect(source).toContain("first.focus()");
  });
});

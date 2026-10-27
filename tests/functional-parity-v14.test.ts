import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The V14 pins — the interaction-state families measured live on BOTH apps
// (docs/remediation-plan-v14.md §0 L4-L25):
//   F1 the dialog motion + geometry family (the reference's full
//      tailwindcss-animate grammar: the slide quartet on the content, the
//      fade pair on the OVERLAY, the 150ms default duration — duration-200
//      is inert on the reference's stack and must not resolve to 200ms on
//      the clone's Tailwind 4.3.3 — the max-w-lg 512px base, the
//      rounded-2xl sm:rounded-lg radius ramp)
//   F2 the focus family (the platform's global violet outline-color +
//      vx-focus's deterministic 3px solid rgba(127, 98, 244, 0.5) — the
//      indigo 129,140,248 halo RETIRES from the chrome the way v11
//      retired it from the form controls and glass buttons)
//   F3 the reports empty-state skins (the measured h-40 centered
//      text-white/25 box) + the reports headings' mb-5 gap

const root = resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const dialog = () => read("src/components/ui/dialog.tsx");
const alertDialog = () => read("src/components/ui/alert-dialog.tsx");
const globals = () => read("src/app/globals.css");
const reports = () => read("src/components/views/reports-view.tsx");

// ---- B1/F1 — the dialog motion family -----------------------------------------

describe("B1 — the dialog motion family (the reference's full grammar)", () => {
  it("the content carries the slide quartet on top of fade + zoom", () => {
    const s = dialog();
    expect(s).toContain("data-[state=open]:animate-in");
    expect(s).toContain("data-[state=open]:fade-in-0");
    expect(s).toContain("data-[state=open]:zoom-in-95");
    expect(s).toContain("data-[state=open]:slide-in-from-left-1/2");
    expect(s).toContain("data-[state=open]:slide-in-from-top-[48%]");
    expect(s).toContain("data-[state=closed]:animate-out");
    expect(s).toContain("data-[state=closed]:fade-out-0");
    expect(s).toContain("data-[state=closed]:zoom-out-95");
    expect(s).toContain("data-[state=closed]:slide-out-to-left-1/2");
    expect(s).toContain("data-[state=closed]:slide-out-to-top-[48%]");
  });

  it("the OVERLAY fades in and out (it never snaps)", () => {
    const s = dialog();
    // The overlay's own className line (not the content's).
    const overlay = s.match(/DialogOverlay[\s\S]{0,600}?className=\{cn\(\s*"([^"]+)"/)?.[1] ?? "";
    expect(overlay).toContain("fixed inset-0 z-50");
    expect(overlay).toContain("data-[state=open]:animate-in");
    expect(overlay).toContain("data-[state=open]:fade-in-0");
    expect(overlay).toContain("data-[state=closed]:animate-out");
    expect(overlay).toContain("data-[state=closed]:fade-out-0");
  });

  it("the animation runs the reference's 150ms — duration-200 is gone", () => {
    const s = dialog();
    // The reference's own duration-200 class is INERT on its older stack
    // (computed 0.15s); the clone's Tailwind 4.3.3 threads --tw-duration
    // to 200ms — so the class must NOT ship (L5/L6/L14).
    expect(s).not.toContain("duration-200");
  });

  it("the geometry: max-w-lg + rounded-2xl sm:rounded-lg (512px / 16px→8px)", () => {
    const s = dialog();
    expect(s).toContain("max-w-lg");
    expect(s).toContain("rounded-2xl sm:rounded-lg");
    expect(s).not.toContain("max-w-md");
  });
});

describe("B1 — the alert-dialog mirrors the family", () => {
  it("the same motion + geometry pins hold on alert-dialog.tsx", () => {
    const s = alertDialog();
    expect(s).toContain("data-[state=open]:slide-in-from-left-1/2");
    expect(s).toContain("data-[state=open]:slide-in-from-top-[48%]");
    expect(s).toContain("data-[state=closed]:slide-out-to-left-1/2");
    expect(s).toContain("data-[state=closed]:slide-out-to-top-[48%]");
    expect(s).not.toContain("duration-200");
    expect(s).toContain("max-w-lg");
    expect(s).toContain("rounded-2xl sm:rounded-lg");
  });
});

// ---- B1/SD-54 — the shared 512px system (the per-surface overrides retire) ----

describe("B1 — every dialog rides the shared max-w-lg base (no width overrides)", () => {
  const sites = [
    ["terminal-view", "src/components/views/terminal-view.tsx"],
    ["inventory-view", "src/components/views/inventory-view.tsx"],
    ["sales-view", "src/components/views/sales-view.tsx"],
    ["cashiers-view", "src/components/views/cashiers-view.tsx"],
    ["registers-view", "src/components/views/registers-view.tsx"],
  ] as const;

  it("no DialogContent carries a max-w-sm / max-w-md width override", () => {
    for (const [name, path] of sites) {
      const s = read(path);
      const calls = s.match(/DialogContent className="[^"]*"/g) ?? [];
      expect(calls.length, `${name} has dialogs`).toBeGreaterThan(0);
      for (const call of calls) {
        expect(call, `${name}: ${call}`).not.toContain("max-w-sm");
        expect(call, `${name}: ${call}`).not.toContain("max-w-md");
      }
    }
  });

  it("the v8 dark-dialog skin pins survive the width retirement", () => {
    for (const [name, path] of sites) {
      const s = read(path);
      const calls = s.match(/DialogContent className="[^"]*"/g) ?? [];
      for (const call of calls) {
        expect(call, `${name}: ${call}`).toContain("bg-[#0f121a]");
        expect(call, `${name}: ${call}`).toContain("text-[#e7e9ef]");
      }
    }
  });

  it("the inventory editor keeps its long-form affordance (max-h + scroll)", () => {
    const s = read("src/components/views/inventory-view.tsx");
    const editor = s.match(/DialogContent className="[^"]*max-h[^"]*"/)?.[0] ?? "";
    expect(editor).toContain("max-h-[90vh]");
    expect(editor).toContain("overflow-y-auto");
  });
});

// ---- B2/F2 — the focus family --------------------------------------------------

describe("B2 — the focus family (the platform violet, not the indigo halo)", () => {
  it("vx-focus draws the deterministic violet outline on :focus-visible", () => {
    const s = globals();
    const block = s.match(/@utility vx-focus \{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(block).toContain("outline: 3px solid rgba(127, 98, 244, 0.5)");
    expect(block).not.toContain("129, 140, 248");
    expect(block).not.toContain("box-shadow");
  });

  it("the global outline-color recolors every default outline (the platform line)", () => {
    const s = globals();
    expect(s).toMatch(/outline-color:\s*rgba\(127, 98, 244, 0\.5\)/);
  });
});

// ---- B3/F3 — the reports empty states + headings -------------------------------

describe("B3 — the reports empty-state skins + the heading gap", () => {
  it("both empty states are the measured h-40 centered text-white/25 box", () => {
    const s = reports();
    const boxes = s.match(/className="flex h-40 items-center justify-center[^"]*"/g) ?? [];
    expect(boxes.length).toBe(2);
    for (const box of boxes) {
      expect(box).toContain("text-white/25");
      expect(box).toContain("text-sm");
    }
    // The retired plain paragraph skin is gone from the empty-state path.
    expect(s).not.toContain('<p className="text-sm text-slate-400">Sin datos');
  });

  it("the three reports cards pass the measured mb-5 heading gap", () => {
    const s = reports();
    const mb5 = s.match(/titleClassName="mb-5"/g) ?? [];
    expect(mb5.length).toBe(3);
  });

  it("the SectionCard wrapper default (mb-4) is untouched for the dashboard", () => {
    const s = read("src/components/pos/shared.tsx");
    expect(s).toContain('"mb-4 flex items-center gap-2"');
  });
});

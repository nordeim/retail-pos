import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The V15 pins — the hover micro-interaction families measured live on BOTH
// apps (docs/remediation-plan-v15.md §0 L5-L9):
//   F1 the icon action button family (the reference's grammar carries
//      `transition-colors` on every row action; the clone's 6 sites snap)
//   F2 the mail button's BLUE hover family (the reference rides
//      hover:bg-blue-50 / hover:text-blue-600 — the clone shipped the Eye
//      button's indigo on both)
//   F3 the category chip's remove control is the TRASH (lucide trash2
//      w-3.5 h-3.5 at 14×14 — not the x h-3 w-3)
//   F4 the badge hover tints (the reference's status badges carry
//      hover:bg-primary/80 + transition-colors — measured violet
//      rgba(127,98,244,0.8) at 150ms; the categoría badge rides
//      hover:bg-secondary/80 the same way)
//   SD-62 the grammar alignment on unobservable superset surfaces (the
//      Quitar buttons + the terminal ticket controls adopt the measured
//      small-red/transition grammar)

const root = resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const inventory = () => read("src/components/views/inventory-view.tsx");
const sales = () => read("src/components/views/sales-view.tsx");
const cashiers = () => read("src/components/views/cashiers-view.tsx");
const registers = () => read("src/components/views/registers-view.tsx");
const settings = () => read("src/components/views/settings-view.tsx");
const terminal = () => read("src/components/views/terminal-view.tsx");
const shared = () => read("src/components/pos/shared.tsx");

// ---- B1/F1+F2 — the icon action button family --------------------------------

describe("B1 — the icon action button family (the reference's grammar)", () => {
  it("the inventory edit + delete buttons transition their hovers", () => {
    const s = inventory();
    expect(s).toContain(
      "vx-focus rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600",
    );
    expect(s).toContain(
      "vx-focus rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500",
    );
  });

  it("the sales Eye button transitions (indigo family)", () => {
    const s = sales();
    expect(s).toContain(
      "vx-focus rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600",
    );
  });

  it("the sales MAIL button rides the reference's BLUE family", () => {
    const s = sales();
    // L6: the reference's mail button is hover:bg-blue-50 text-slate-400
    // hover:text-blue-600 — NOT the Eye button's indigo.
    expect(s).toContain(
      "vx-focus rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600",
    );
    // The anti-regression pin: exactly one indigo action family remains on
    // sales (the Eye); the mail line must not carry it.
    const mailLine = s.match(/Enviar ticket[^\n]*\n[\s\S]{0,400}?className="([^"]+)"/)?.[1] ?? "";
    expect(mailLine).not.toContain("indigo");
  });

  it("the cashiers edit + delete buttons adopt the family grammar", () => {
    // L16: unobservable on the reference (read-only view) — the clone's
    // superset CRUD adopts the measured family (SD-58).
    const s = cashiers();
    expect(s).toContain(
      "vx-focus rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600",
    );
    expect(s).toContain(
      "vx-focus rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500",
    );
  });

  it("the registers delete button keeps the family (the guard)", () => {
    const s = registers();
    expect(s).toContain(
      "vx-focus rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500",
    );
  });
});

// ---- B2/F4 — the badge hover tints ---------------------------------------------

describe("B2 — the badge hover tints (the shadcn stock the reference ships)", () => {
  it("the StatusPill TABLE variant carries hover:bg-primary/80 + the transition", () => {
    const s = shared();
    // L8: measured rgb(220,252,231) → rgba(127,98,244,0.8) at 150ms under a
    // real mouse hover; the text tone stays (green-700 measured after).
    expect(s).toContain('"rounded-md px-2.5 py-0.5 transition-colors hover:bg-primary/80"');
  });

  it("the StatusPill CARD variant stays hover-free (L13 — the register pill)", () => {
    const s = shared();
    const cardVariant = s.match(/variant === "card"\s*\?\s*"([^"]+)"/)?.[1] ?? "";
    expect(cardVariant).toContain("rounded-full");
    expect(cardVariant).not.toContain("hover:");
  });

  it("the categoría badge carries hover:bg-secondary/80 (L9)", () => {
    const s = inventory();
    expect(s).toContain(
      "bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80",
    );
  });
});

// ---- B3/F3 — the chip's remove control is the trash -----------------------------

describe("B3 — the category chip remove icon", () => {
  it("the chip button renders lucide Trash2 at w-3.5 h-3.5 (not the x)", () => {
    const s = settings();
    // L7: the reference's chip remove is lucide-trash2 w-3.5 h-3.5 on
    // text-slate-400 hover:text-red-500 transition-colors (14×14 measured).
    expect(s).toMatch(/<Trash2 className="h-3\.5 w-3\.5" \/>/);
    expect(s).not.toMatch(/<X className="h-3 w-3" \/>/);
    expect(s).toContain("text-slate-400 transition-colors hover:text-red-500");
  });
});

// ---- B4/SD-62 — grammar alignment on unobservable superset surfaces -------------

describe("B4 — the grammar alignment on unobservable surfaces (SD-62)", () => {
  it("the Quitar buttons ride red-500 + the transition", () => {
    const quitar = 'rounded-lg p-1 text-xs text-slate-400 transition-colors hover:text-red-500';
    expect(settings()).toContain(quitar);
    expect(inventory()).toContain(quitar);
  });

  it("the terminal ticket line remove rides red-500 + the transition", () => {
    const s = terminal();
    expect(s).toContain(
      "vx-focus rounded-md p-1 text-slate-500 transition-colors hover:text-red-500",
    );
  });

  it("the terminal qty steppers transition their hovers", () => {
    const s = terminal();
    expect(s.match(/bg-\[#1e2235\][^"]*transition-colors[^"]*"/g)?.length).toBe(2);
  });
});

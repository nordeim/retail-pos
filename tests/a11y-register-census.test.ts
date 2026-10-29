// ---------------------------------------------------------------------------
// Source pins for remediation-plan-v31 — the dialog-open a11y coverage
// audit (the neo-crm session-199 doctrine adopted; the title-guard idiom:
// comment-stripped source, regex pins).
//
// V32 EXTENSION — the view-register completion (the V31-declined future
// cycle, taken now): the register's LAST named gap closes — every authed
// view carries a closed-surface registration. The view inventory rides
// the same NAME form (seven titles: Ajustes + the six V32 registrations;
// the Dashboard's closed surface rides the shell test — the register's
// landing test since V24 — documented here, not double-pinned), and each
// view registration carries its own L-164c2 order guard: the view must be
// VISIBLE (the heading-anchored wait) before the axe scan — the lazy view
// registry means the chunk may still be loading after goto, and a scan on
// a not-yet-rendered view passes vacuously.
//
// The a11y register's own truth pass: a Radix Dialog's content is ABSENT
// from the DOM while closed, so every dialog-open state carries its own
// registration in tests/e2e/a11y-smoke.spec.ts (the F-172c criterion).
// These pins hold the register's INVENTORY (by NAME — the D-197a2/D-199a2
// lesson: a count-anchored claim goes stale the day a registration joins;
// a name never does), the shared scanner's visible-wait contract (the
// L-164c2 vacuous-green cure — a scan on a closed surface passes
// trivially, so the dialog must be VISIBLE before analyze() and the
// Escape close must be ASSERTED, not assumed), and the five label
// associations that cure this cycle's live catch (a Radix SelectTrigger
// renders a <button>; an unassociated <Label> above it is inert for
// accname — the critical button-name violations the first live census
// found on the product dialog, the shift-open dialog, and the Ajustes
// view).
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Quote-aware comment stripper — never strips `/*` or `//` inside string
 * literals. The naive regex form (title-guard's `/\/\*[\s\S]*?\*\//`)
 * trips the `accept="image/*"` attribute trap: the `/*` inside the quoted
 * value opens a phantom block comment that swallows source until the
 * next REAL comment close (observed live: the Moneda label vanished from
 * the stripped settings-view between `image/*` at line 199 and the JSX
 * comment at line 284 — a pin silently passing on swallowed source).
 */
function stripComments(source: string): string {
  let out = "";
  let i = 0;
  let quote: '"' | "'" | "`" | null = null;
  while (i < source.length) {
    const ch = source[i];
    if (quote) {
      out += ch;
      if (ch === "\\") {
        out += source[i + 1] ?? "";
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      i = end === -1 ? source.length : end + 2;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function read(...segments: string[]): string {
  return readFileSync(path.join(import.meta.dirname, "..", ...segments), "utf8");
}

const SMOKE = stripComments(read("tests", "e2e", "a11y-smoke.spec.ts"));
const INVENTORY = stripComments(read("src", "components", "views", "inventory-view.tsx"));
const REGISTERS = stripComments(read("src", "components", "views", "registers-view.tsx"));
const SETTINGS = stripComments(read("src", "components", "views", "settings-view.tsx"));

// The dialog-open register inventory — the NAME form (each title must be
// live in the spec; a missing registration fails loudly at its own name).
const DIALOG_REGISTRATIONS: readonly string[] = [
  "the product dialog opens clean",
  "the product delete-confirm opens clean",
  "the caja create dialog opens clean",
  "the caja delete-confirm opens clean",
  "the shift-open dialog opens clean",
  "the cashier dialog opens clean",
  "the cashier delete-confirm opens clean",
  "the ticket modal opens clean",
  "the four Mi Cuenta dialogs open clean",
  "the payment dialog opens clean",
  "the shift-close dialog opens clean",
  "the Ajustes view is clean of critical/serious violations",
];

// V32 — the authed view closed-surface register inventory (the NAME form).
// The Dashboard's closed surface rides "the shell + dashboard are clean of
// critical/serious violations" (the register's landing test, its own h1
// toHaveText guard predating this census layer) — a fact this comment
// holds, not a membership row.
const VIEW_REGISTRATIONS: readonly string[] = [
  "the Terminal view is clean of critical/serious violations",
  "the Inventario view is clean of critical/serious violations",
  "the Ventas view is clean of critical/serious violations",
  "the Cajas view is clean of critical/serious violations",
  "the Cajeros view is clean of critical/serious violations",
  "the Reportes view is clean of critical/serious violations",
  "the Ajustes view is clean of critical/serious violations",
];

describe("v31 — the dialog-open register census (a11y-smoke.spec.ts)", () => {
  it("carries the shared scanner with the visible-wait + asserted-close contract", () => {
    // The L-164c2 vacuous-green cure, pinned in ORDER inside the helper:
    // the dialog must be visible BEFORE the axe scan runs, and the Escape
    // close must be asserted hidden (a bare Escape press assumes the
    // Radix contract). Both regexes are scoped from the helper's own
    // declaration — analyze() lives in blockingViolations ABOVE the
    // helper, so an unscoped order-regex would never match.
    expect(SMOKE).toMatch(/async function scanDialogOpen\(/);
    expect(SMOKE).toMatch(
      /function scanDialogOpen\([\s\S]*?toBeVisible\(\)[\s\S]*?blockingViolations\(page\)/,
    );
    expect(SMOKE).toMatch(
      /function scanDialogOpen\([\s\S]*?press\("Escape"\)[\s\S]*?toBeHidden\(\)/,
    );
  });

  it("registers every dialog-open state by NAME (the D-197a2 form — no count to go stale)", () => {
    for (const title of DIALOG_REGISTRATIONS) {
      expect(SMOKE, `registration missing from the a11y register: "${title}"`).toContain(title);
    }
  });
});

describe("v31 — the five label associations cure the button-name catch", () => {
  it("the product dialog's Categoría select carries the htmlFor/id pair", () => {
    expect(INVENTORY).toContain('htmlFor="product-category"');
    expect(INVENTORY).toMatch(/id="product-category"/);
  });

  it("the product dialog's Unidad select carries the htmlFor/id pair", () => {
    expect(INVENTORY).toContain('htmlFor="product-unit"');
    expect(INVENTORY).toMatch(/id="product-unit"/);
  });

  it("the shift-open dialog's Cajero/a select carries the htmlFor/id pair", () => {
    expect(REGISTERS).toContain('htmlFor="shift-cashier"');
    expect(REGISTERS).toMatch(/id="shift-cashier"/);
  });

  it("the Ajustes Moneda select carries the htmlFor/id pair", () => {
    expect(SETTINGS).toContain('htmlFor="settings-currency"');
    expect(SETTINGS).toMatch(/id="settings-currency"/);
  });

  it("the Ajustes Proveedor select carries the htmlFor/id pair", () => {
    expect(SETTINGS).toContain('htmlFor="settings-card-provider"');
    expect(SETTINGS).toMatch(/id="settings-card-provider"/);
  });
});

describe("v32 — the view-register completion census (a11y-smoke.spec.ts)", () => {
  it("registers every authed view closed surface by NAME (the register's end state)", () => {
    // The NAME form (the D-197a2/D-199a2 lesson): a count-anchored claim
    // goes stale the day a registration joins; a name never does. The
    // Dashboard rides the shell test (the comment at VIEW_REGISTRATIONS).
    for (const title of VIEW_REGISTRATIONS) {
      expect(SMOKE, `view registration missing from the a11y register: "${title}"`).toContain(title);
    }
  });

  it("waits for each view before scanning it (the L-164c2 order guard, per registration)", () => {
    // The lazy view registry means the view chunk may still be loading
    // after page.goto — a scan on a not-yet-rendered view passes
    // vacuously. Each view registration must carry a toBeVisible() wait
    // BEFORE its blockingViolations(page) scan, scoped from its own title
    // (the first wait and the first scan after the title must be in that
    // order — the next test's body starts after this one's scan).
    for (const title of VIEW_REGISTRATIONS) {
      const start = SMOKE.indexOf(`"${title}"`);
      expect(start, `view registration missing: "${title}"`).toBeGreaterThan(-1);
      const waitIdx = SMOKE.indexOf("toBeVisible()", start);
      const scanIdx = SMOKE.indexOf("blockingViolations(page)", start);
      expect(waitIdx, `"${title}": no visible-wait before the scan`).toBeGreaterThan(-1);
      expect(scanIdx, `"${title}": no axe scan`).toBeGreaterThan(-1);
      expect(
        waitIdx,
        `"${title}": the visible-wait must precede the scan (the vacuous-green guard)`,
      ).toBeLessThan(scanIdx);
    }
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { addDays, isoWeekday, WEEKDAY_MIN, weekWindow } from "@/lib/date";
import { thinLabelIndices } from "@/components/pos/shared";

// ---------------------------------------------------------------------------
// R3 visual-parity pins (remediation-plan-v3 §R3), measured live on the
// reference (veloxposretail.base44.app, 2026-10-26):
//   · dashboard/ajustes card headings: h3, title-case, 16px/700,
//     slate-700 (rgb 51,65,85)  [V1 "card"]
//   · reports headings: h2, uppercase, 14px/700, white/60, 0.7px tracking
//     [V1 "kicker"]
//   · H1: 24px fixed at every width [V2]
//   · chart X labels thinned to ~8, first+last kept [V3]
//   · weekday labels roll per-date, today LAST [V4/M2]
// Pure seams are behavior pins; component/view contracts are source pins.
// ---------------------------------------------------------------------------

const readSource = (...segments: string[]) =>
  readFileSync(path.join(import.meta.dirname, "..", "src", ...segments), "utf8");

describe("weekWindow (V4/M2)", () => {
  it("rolls per-date, ending on today — a window ending Wednesday", () => {
    const wednesday = new Date(2026, 9, 28); // 2026-10-28 is a Wednesday
    const labels = weekWindow(wednesday).map((d) => WEEKDAY_MIN[isoWeekday(d)]);
    expect(labels).toEqual(["jue", "vie", "sáb", "dom", "lun", "mar", "mié"]);
  });

  it("a window ending Monday starts on Tuesday (the positional trap)", () => {
    const monday = new Date(2026, 9, 26); // 2026-10-26 is a Monday
    const labels = weekWindow(monday).map((d) => WEEKDAY_MIN[isoWeekday(d)]);
    expect(labels).toEqual(["mar", "mié", "jue", "vie", "sáb", "dom", "lun"]);
  });

  it("returns 7 local midnights, oldest-first, the last being today", () => {
    const now = new Date(2026, 9, 28, 15, 30);
    const week = weekWindow(now);
    expect(week).toHaveLength(7);
    expect(week[0]).toEqual(addDays(now, -6));
    expect(week[6]).toEqual(addDays(now, 0));
    for (const day of week) {
      expect(day.getHours()).toBe(0);
      expect(day.getMinutes()).toBe(0);
    }
  });

  it("the dashboard route labels roll per-date (no positional WEEKDAY_MIN[index])", () => {
    const route = readSource("app", "api", "dashboard", "route.ts");
    expect(route).toContain("weekWindow");
    expect(route).toContain("isoWeekday");
    expect(route).not.toContain("WEEKDAY_MIN[index]");
  });
});

describe("chart label thinning (V3)", () => {
  it("keeps every label when they already fit", () => {
    expect(thinLabelIndices(7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(thinLabelIndices(8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(thinLabelIndices(0)).toEqual([]);
  });

  it("thins a 30-day window to 8 evenly spaced labels, first and last kept", () => {
    const indices = thinLabelIndices(30);
    expect(indices).toHaveLength(8);
    expect(indices[0]).toBe(0);
    expect(indices[indices.length - 1]).toBe(29);
    // evenly spaced-ish: every gap within 1 of (29/7)
    for (let i = 1; i < indices.length; i += 1) {
      const gap = indices[i] - indices[i - 1];
      expect(gap).toBeGreaterThanOrEqual(4);
      expect(gap).toBeLessThanOrEqual(5);
    }
  });

  it("thins 9 to 8 (the boundary)", () => {
    expect(thinLabelIndices(9)).toHaveLength(8);
    expect(thinLabelIndices(9)[0]).toBe(0);
    expect(thinLabelIndices(9)[7]).toBe(8);
  });
});

describe("SectionCard variants (V1)", () => {
  it("the card variant renders the dashboard/ajustes heading contract", () => {
    const source = readSource("components", "pos", "shared.tsx");
    expect(source).toContain(`variant?: "card" | "kicker"`);
    expect(source).toContain('"text-base font-bold text-slate-700"');
    expect(source).toContain("text-white/60");
    expect(source).toContain("tracking-[0.7px]");
  });

  it("PageHeading is 24px fixed (no sm: size bump)", () => {
    const source = readSource("components", "pos", "shared.tsx");
    expect(source).toContain("text-2xl font-bold tracking-tight text-slate-800");
    expect(source).not.toContain("sm:text-3xl");
  });

  it("the reports view opts into the kicker variant + integer $ Y labels", () => {
    const source = readSource("components", "views", "reports-view.tsx");
    expect(source).toContain('variant="kicker"');
    expect(source).toContain("$${Math.round");
  });

  it("the dashboard view keeps the card variant + plain integer Y labels", () => {
    const source = readSource("components", "views", "dashboard-view.tsx");
    expect(source).not.toContain('variant="kicker"');
    expect(source).toContain("String(Math.round");
  });
});

describe("Ajustes logo button (V5)", () => {
  it("renders the styled Subir logo control over a hidden input", () => {
    const source = readSource("components", "views", "settings-view.tsx");
    expect(source).toContain("Subir logo");
    expect(source).toContain("glass-button");
    expect(source).toMatch(/type="file"/);
  });

  it("ships the glass-button utility", () => {
    const css = readSource("app", "globals.css");
    expect(css).toContain("@utility glass-button");
  });
});

describe("low-stock rows (V6)", () => {
  it("the row leads with an amber chip, bold name, and the amber sub-line", () => {
    const source = readSource("components", "views", "dashboard-view.tsx");
    expect(source).toContain("bg-amber-400/20");
    expect(source).toContain("font-bold text-slate-100");
    expect(source).toContain("en stock (mín.");
  });
});

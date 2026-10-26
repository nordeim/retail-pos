// ---------------------------------------------------------------------------
// The view↔path map — the 8 reference routes (verified live) + the superset
// case-insensitive aliases.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";

import {
  isKnownPath,
  NAV_ITEMS,
  pathForView,
  VIEWS,
  viewFromPath,
  VIEW_TITLES,
} from "@/lib/router";

describe("the 8-view map", () => {
  it("lists the reference nav order exactly", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Terminal",
      "Dashboard",
      "Inventario",
      "Ventas",
      "Cajas",
      "Cajeros",
      "Reportes",
      "Ajustes",
    ]);
  });

  it("carries the verified PascalCase paths", () => {
    const paths = Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item.path]));
    expect(paths).toEqual({
      terminal: "/",
      dashboard: "/Dashboard",
      inventario: "/Inventory",
      ventas: "/Sales",
      cajas: "/Registers",
      cajeros: "/Cashiers",
      reportes: "/Reports",
      ajustes: "/StoreSettings",
    });
  });

  it("keeps VIEWS aligned with NAV_ITEMS", () => {
    expect(VIEWS).toEqual(NAV_ITEMS.map((item) => item.id));
  });
});

describe("pathForView / viewFromPath", () => {
  it("round-trips every view", () => {
    for (const item of NAV_ITEMS) {
      expect(viewFromPath(item.path)).toBe(item.id);
      expect(pathForView(item.id)).toBe(item.path);
    }
  });

  it("is case-insensitive (the superset alias behavior)", () => {
    expect(viewFromPath("/dashboard")).toBe("dashboard");
    expect(viewFromPath("/SALES")).toBe("ventas");
    expect(viewFromPath("/registers")).toBe("cajas");
  });

  it("falls back to the Terminal for root and unknown paths", () => {
    expect(viewFromPath("/")).toBe("terminal");
    expect(viewFromPath("/NonExistent")).toBe("terminal");
    expect(viewFromPath("//")).toBe("terminal");
  });
});

describe("isKnownPath (the 404 gate)", () => {
  it("accepts every canonical path in any case", () => {
    expect(isKnownPath("/")).toBe(true);
    expect(isKnownPath("/StoreSettings")).toBe(true);
    expect(isKnownPath("/sales")).toBe(true);
  });

  it("rejects unknown segments", () => {
    expect(isKnownPath("/ventas2")).toBe(false);
    expect(isKnownPath("/Login")).toBe(false);
  });
});

describe("VIEW_TITLES", () => {
  it("carries the reference copy", () => {
    expect(VIEW_TITLES.ventas.title).toBe("Historial de Ventas");
    expect(VIEW_TITLES.cajas.title).toBe("Cajas Registradoras");
    expect(VIEW_TITLES.ajustes.title).toBe("Ajustes de la Tienda");
    expect(VIEW_TITLES.reportes.subtitle).toBe("Análisis de ventas e ingresos");
  });
});

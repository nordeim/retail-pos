export const DEMO_EMAIL = "owner@veloxpos.local";
export const DEMO_PASSWORD = "VeloxDemo123!";
export const DEMO_NAME = "Cesar Martínez";

/**
 * Session note for spec authors: the main Playwright project starts every
 * test ALREADY authenticated — the "setup" project signs the demo user in
 * once and playwright.config.ts injects the saved storageState. Specs that
 * need the logged-out surface (tests/e2e/auth.spec.ts) opt out with an
 * empty storageState at the file level.
 *
 * The auth endpoints are rate-limited (10 attempts/IP/15 min) — keep the
 * TOTAL number of real login attempts per run well under that budget.
 */

/** The 8 reference routes, in nav order. */
export const ROUTES = [
  { path: "/", heading: "No hay turno activo" },
  { path: "/Dashboard", heading: "Dashboard" },
  { path: "/Inventario", heading: "Inventario" },
  { path: "/Sales", heading: "Historial de Ventas" },
  { path: "/Registers", heading: "Cajas Registradoras" },
  { path: "/Cashiers", heading: "Cajeros" },
  { path: "/Reports", heading: "Reportes" },
  { path: "/StoreSettings", heading: "Ajustes de la Tienda" },
] as const;

/** The seeded product names the inventory asserts can rely on. */
export const SEEDED_PRODUCTS = [
  "Yogurt Danone Natural 900g",
  "Frijoles La Costeña 560g",
  "Leche Lala Entera 1L",
  "Shampoo Pantene 400ml",
  "Cloro Cloralex 1L",
  "Papel Higiénico Pétalo 4 rollos",
  "Sabritas Original 45g",
  "Agua Bonafont 1L",
  "Coca-Cola 600ml",
  "Atún Dolores 295g",
  "Pan Bimbo Blanco",
  "Jabón Zote Barra 400g",
] as const;

// ---------------------------------------------------------------------------
// The single view ↔ path map (AGENTS.md: "src/lib/router.ts is the single
// view↔path map (unit-tested)"). The reference routes at PascalCase paths —
// Terminal at `/`, the rest at their own names — rewritten onto `/` by
// next.config.ts; the SPA store syncs the view with the pathname.
// Pure — unit-pinned by tests/router.test.ts.
// ---------------------------------------------------------------------------

export type ViewId =
  | "terminal"
  | "dashboard"
  | "inventario"
  | "ventas"
  | "cajas"
  | "cajeros"
  | "reportes"
  | "ajustes";

export const VIEWS: ViewId[] = [
  "terminal",
  "dashboard",
  "inventario",
  "ventas",
  "cajas",
  "cajeros",
  "reportes",
  "ajustes",
];

export type NavItem = { id: ViewId; label: string; path: string };

/** The 8 reference views in sidebar order (verified against the live nav). */
export const NAV_ITEMS: NavItem[] = [
  { id: "terminal", label: "Terminal", path: "/" },
  { id: "dashboard", label: "Dashboard", path: "/Dashboard" },
  { id: "inventario", label: "Inventario", path: "/Inventario" },
  { id: "ventas", label: "Ventas", path: "/Sales" },
  { id: "cajas", label: "Cajas", path: "/Registers" },
  { id: "cajeros", label: "Cajeros", path: "/Cashiers" },
  { id: "reportes", label: "Reportes", path: "/Reports" },
  { id: "ajustes", label: "Ajustes", path: "/StoreSettings" },
];

/** Path aliases the rewrites accept (superset: case-insensitive + the
 *  Spanish names the reference 404s on). Canonical paths stay PascalCase. */
export function isKnownPath(pathname: string): boolean {
  const segment = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (!segment) return true; // "/" IS the Terminal
  return NAV_ITEMS.some(
    (item) => item.path.toLowerCase() === `/${segment}`,
  );
}

/** Canonical PascalCase path for a view. */
export function pathForView(view: ViewId): string {
  return NAV_ITEMS.find((item) => item.id === view)?.path ?? "/";
}

/** Map a pathname to its view id — first segment wins, case-insensitive,
 *  trailing slashes tolerated; root/unknown → terminal. */
export function viewFromPath(pathname: string): ViewId {
  const segment = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (!segment) return "terminal";
  const hit = NAV_ITEMS.find((item) => item.path.toLowerCase() === `/${segment}`);
  return hit?.id ?? "terminal";
}

/** The page heading each view renders (reference copy). */
export const VIEW_TITLES: Record<ViewId, { title: string; subtitle: string }> = {
  terminal: { title: "Terminal", subtitle: "Punto de venta" },
  dashboard: { title: "Dashboard", subtitle: "" },
  inventario: { title: "Inventario", subtitle: "" },
  ventas: { title: "Historial de Ventas", subtitle: "" },
  cajas: { title: "Cajas Registradoras", subtitle: "" },
  cajeros: { title: "Cajeros", subtitle: "" },
  reportes: { title: "Reportes", subtitle: "Análisis de ventas e ingresos" },
  ajustes: { title: "Ajustes de la Tienda", subtitle: "Personaliza tu negocio" },
};

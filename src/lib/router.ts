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
  { id: "inventario", label: "Inventario", path: "/Inventory" },
  { id: "ventas", label: "Ventas", path: "/Sales" },
  { id: "cajas", label: "Cajas", path: "/Registers" },
  { id: "cajeros", label: "Cajeros", path: "/Cashiers" },
  { id: "reportes", label: "Reportes", path: "/Reports" },
  { id: "ajustes", label: "Ajustes", path: "/StoreSettings" },
];

/** V9/SD-23: the Spanish route names the rewrites accept as a SUPERSET
 *  (the reference 404s every one of them — live-measured: /Ventas, /Cajas,
 *  /Ajustes, … all render "Página no encontrada" there). The clone keeps
 *  the aliases (they are documented superset behavior) and maps them to
 *  their views; before v9 they fell to the terminal fallback and silently
 *  rendered the WRONG view. `/Terminal` maps too — the ref 404s it while
 *  our rewrite accepts it (the terminal is also reachable at "/"). */
const SPANISH_ALIASES: Record<string, ViewId> = {
  terminal: "terminal",
  ventas: "ventas",
  inventario: "inventario",
  cajas: "cajas",
  cajeros: "cajeros",
  reportes: "reportes",
  ajustes: "ajustes",
};

function aliasForSegment(segment: string | undefined): ViewId | undefined {
  if (!segment) return undefined;
  const hit = NAV_ITEMS.find(
    (item) => item.path.toLowerCase() === `/${segment}`,
  );
  if (hit) return hit.id;
  return SPANISH_ALIASES[segment];
}

/** Path aliases the rewrites accept (superset: case-insensitive + the
 *  Spanish names the reference 404s on). Canonical paths stay PascalCase. */
export function isKnownPath(pathname: string): boolean {
  const segment = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (!segment) return true; // "/" IS the Terminal
  return aliasForSegment(segment) !== undefined;
}

/** Canonical PascalCase path for a view. */
export function pathForView(view: ViewId): string {
  return NAV_ITEMS.find((item) => item.id === view)?.path ?? "/";
}

/** Map a pathname to its view id — first segment wins, case-insensitive,
 *  trailing slashes tolerated; the Spanish aliases resolve too (V9/SD-23);
 *  root/unknown → terminal. */
export function viewFromPath(pathname: string): ViewId {
  const segment = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (!segment) return "terminal";
  return aliasForSegment(segment) ?? "terminal";
}

/**
 * The document (tab) title each view carries — the reference's own strings,
 * live-measured on EVERY route (v7/M1: v6 had measured only the root, which
 * is the one route without a suffix). Ajustes titles as "Store Settings"
 * (the reference's English route naming — its UI is Spanish but its titles
 * are not), and the Terminal is the bare "VeloxPOS".
 */
export const DOCUMENT_TITLES: Record<ViewId, string> = {
  terminal: "VeloxPOS",
  dashboard: "Dashboard | VeloxPOS",
  inventario: "Inventory | VeloxPOS",
  ventas: "Sales | VeloxPOS",
  cajas: "Registers | VeloxPOS",
  cajeros: "Cashiers | VeloxPOS",
  reportes: "Reports | VeloxPOS",
  ajustes: "Store Settings | VeloxPOS",
};

/**
 * The document title for a path — the reference's own algorithm,
 * live-measured across nine probes (V9/F2): an EXACT-CASE match against a
 * canonical PascalCase path resolves to that route's canonical title
 * ("/StoreSettings" → "Store Settings | VeloxPOS"); EVERYTHING else gets
 * the slug treatment — the first segment's hyphens become spaces, each
 * word's first letter is upper-cased (the rest preserved), and
 * " | VeloxPOS" is appended. Measured consequences: "/sales" → "Sales"
 * (coincides with canonical), "/SALES" → "SALES", "/storesettings" →
 * "Storesettings", "/ventas" → "Ventas" (the ref titles its own 404 on
 * /Ventas exactly this way), "/foo-bar-baz" → "Foo Bar Baz". The title is
 * purely PATH-driven — the view rendering is independent (the ref renders
 * the Sales VIEW at /sales while slug-titling it).
 */
export function documentTitleForPath(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment) return DOCUMENT_TITLES.terminal;
  const hit = NAV_ITEMS.find((item) => item.path === `/${segment}`);
  if (hit) return DOCUMENT_TITLES[hit.id];
  const slugCased = segment
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return `${slugCased || "VeloxPOS"} | VeloxPOS`;
}

/**
 * The post-login destination for the 401 gate's `from_url` round-trip
 * (V8/F1 — the reference bounces a logged-out deep route to
 * `/login?from_url=<url>` and RETURNS there after sign-in; live-measured:
 * /Dashboard → login → /Dashboard). SECURITY: the value rides the URL, so
 * it is an open-redirect vector if trusted blindly — this seam accepts
 * only same-origin absolute URLs and site-relative paths, and fails closed
 * to "/" for everything else (foreign origins, protocol-relative URLs,
 * javascript:/data: schemes). "/login" itself maps to "/" so a stale
 * from_url can never loop the login page.
 */
export function safeReturnTo(
  raw: string | null | undefined,
  origin: string,
): string {
  if (!raw) return "/";
  let parsed: URL;
  try {
    parsed = new URL(raw, origin);
  } catch {
    return "/";
  }
  // javascript:/data: parse with a null or foreign origin — the origin
  // equality check rejects every non-http(s) scheme and every other host.
  if (parsed.origin !== origin) return "/";
  const target = parsed.pathname + parsed.search;
  if (target === "/login" || target.startsWith("/login?")) return "/";
  return target;
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

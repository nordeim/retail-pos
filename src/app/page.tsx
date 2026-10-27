"use client";

// ---------------------------------------------------------------------------
// The WHOLE app: one page — auth gate → shell → view switcher. The 8 routes
// (/, /Dashboard, /Inventory, /Sales, /Registers, /Cashiers, /Reports,
// /StoreSettings) are rewritten onto / by next.config.ts; the store syncs
// the view with the pathname (hydrate()).
//
// Load-stability: the ACTIVE view's initial collections pre-warm IN PARALLEL
// with /api/auth/me and the splash flips only when BOTH settle (first paint
// with final geometry). A 401 leaves through window.location.replace("/login")
// — a FULL reload so the login page paints its light chrome from scratch.
// ---------------------------------------------------------------------------

import * as React from "react";

import { MobileChrome } from "@/components/layout/mobile-chrome";
import { Sidebar } from "@/components/layout/sidebar";
import { Zap } from "lucide-react";
import { apiGet, ApiError } from "@/lib/api";
import { useAppStore, usePosStore, type AppUser, type LoadedKey } from "@/lib/store";
import { documentTitleForPath, type ViewId } from "@/lib/router";
import { cn } from "@/lib/utils";

/** Sets data-app-hydrated on the shell commit — the e2e gate that proves the
 *  authed chrome (sidebar nav) has actually rendered. */
function HydrationMarker() {
  React.useEffect(() => {
    document.documentElement.dataset.appHydrated = "true";
  }, []);
  return null;
}

/** The lazy loaders — V17/F2 (SD-67): one dynamic import() per view so
 * each surface ships only its own code (the monolithic registry billed
 * every route ~69 KiB gz of views it never runs; the authed dashboard
 * measured TBT 550 ms / LCP 3.7 s pre-split). The views are named
 * exports; the `.then` adapts them to React.lazy's default shape. */
const VIEW_LOADERS = {
  terminal: () =>
    import("@/components/views/terminal-view").then((m) => ({ default: m.TerminalView })),
  dashboard: () =>
    import("@/components/views/dashboard-view").then((m) => ({ default: m.DashboardView })),
  inventario: () =>
    import("@/components/views/inventory-view").then((m) => ({ default: m.InventoryView })),
  ventas: () =>
    import("@/components/views/sales-view").then((m) => ({ default: m.SalesView })),
  cajas: () =>
    import("@/components/views/registers-view").then((m) => ({ default: m.RegistersView })),
  cajeros: () =>
    import("@/components/views/cashiers-view").then((m) => ({ default: m.CashiersView })),
  reportes: () =>
    import("@/components/views/reports-view").then((m) => ({ default: m.ReportsView })),
  ajustes: () =>
    import("@/components/views/settings-view").then((m) => ({ default: m.SettingsView })),
} as const satisfies Record<ViewId, () => Promise<{ default: React.ComponentType }>>;

/** The lazy view registry — one lazy component per view id. */
const VIEW_COMPONENTS: Record<ViewId, React.LazyExoticComponent<React.ComponentType>> = {
  terminal: React.lazy(VIEW_LOADERS.terminal),
  dashboard: React.lazy(VIEW_LOADERS.dashboard),
  inventario: React.lazy(VIEW_LOADERS.inventario),
  ventas: React.lazy(VIEW_LOADERS.ventas),
  cajas: React.lazy(VIEW_LOADERS.cajas),
  cajeros: React.lazy(VIEW_LOADERS.cajeros),
  reportes: React.lazy(VIEW_LOADERS.reportes),
  ajustes: React.lazy(VIEW_LOADERS.ajustes),
};

/** The collections each view needs on first paint (the pre-warm set). */
const INITIAL_COLLECTIONS: Record<ViewId, LoadedKey[]> = {
  terminal: ["products", "categories", "registers", "shifts", "settings"],
  dashboard: ["settings"],
  inventario: ["products", "categories", "settings"],
  ventas: ["sales", "settings"],
  cajas: ["registers", "shifts", "cashiers", "settings"],
  cajeros: ["cashiers", "shifts", "settings"],
  reportes: ["settings"],
  ajustes: ["settings", "categories"],
};

type GateStatus = "loading" | "ready" | "error";

function Splash({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  return (
    <div className="vx-canvas flex min-h-dvh flex-col items-center justify-center gap-4">
      <span className="vx-gradient flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl text-white">
        <Zap className="h-7 w-7" strokeWidth={2.5} />
      </span>
      {error && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-slate-400">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="vx-focus rounded-md px-3 py-1.5 text-sm font-medium text-violet-300"
            >
              Intentar de nuevo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [status, setStatus] = React.useState<GateStatus>("loading");
  const [gateError, setGateError] = React.useState<string>("");
  const [attempt, setAttempt] = React.useState(0);
  const view = useAppStore((s) => s.view);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);

  React.useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setStatus("loading");
      setGateError("");
      // The view comes from the URL, not the render closure.
      useAppStore.getState().hydrate();
      const activeView = useAppStore.getState().view;

      // V17/F2: prefetch the ACTIVE view's chunk in the same parallel
      // window as the pre-warm — fire-and-forget; by the time status
      // flips "ready" the chunk is resident (no Suspense gap on the
      // standard flow). Never blocks: a rejected prefetch surfaces only
      // if the lazy mount itself retries the import.
      void VIEW_LOADERS[activeView]();

      // The pre-warm rides IN PARALLEL with the auth round-trip and never
      // blocks the shell on failure.
      const prewarm = usePosStore
        .getState()
        .loadCollections(INITIAL_COLLECTIONS[activeView])
        .catch(() => undefined);

      try {
        const { user } = await apiGet<{ user: AppUser }>("/api/auth/me");
        if (cancelled) return;

        await prewarm;
        if (cancelled) return;

        setStatus("ready");
        // The full background refresh.
        void usePosStore.getState().loadAll();
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          // V8/F1: the reference bounces a logged-out deep route to
          // /login?from_url=<current-url> and returns there after sign-in
          // (live-measured on /Dashboard and 404s). The login surface
          // decodes it through safeReturnTo (same-origin only).
          window.location.replace(
            `/login?from_url=${encodeURIComponent(
              window.location.pathname + window.location.search,
            )}`,
          );
          return;
        }
        setGateError(
          err instanceof Error
            ? err.message
            : "Algo salió mal al cargar tu tienda.",
        );
        setStatus("error");
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Personalización is live: the store's two colors drive the accent vars.
  const primaryColor = usePosStore((s) => s.settings?.primaryColor);
  const secondaryColor = usePosStore((s) => s.settings?.secondaryColor);
  React.useEffect(() => {
    if (primaryColor) {
      document.documentElement.style.setProperty("--vx-primary", primaryColor);
    }
    if (secondaryColor) {
      document.documentElement.style.setProperty("--vx-secondary", secondaryColor);
    }
  }, [primaryColor, secondaryColor]);

  // V7/M1 → V9/F2: the tab title follows the PATH, exactly like the
  // reference (live-measured: its titles are path-driven — exact-case
  // canonical match, everything else slug-cased: "/SALES" is
  // "SALES | VeloxPOS" there, "/storesettings" is "Storesettings").
  // Applied once the shell is ready so /login (its own route, its own
  // title) never flickers. The [status, view] deps remain sufficient:
  // SPA navigation always pairs a view change with a path change, and
  // alias→alias same-view hops are unreachable through the UI (the
  // sidebar links are canonical).
  React.useEffect(() => {
    if (status !== "ready") return;
    document.title = documentTitleForPath(window.location.pathname);
  }, [status, view]);

  if (status !== "ready") {
    return (
      <>
        <a href="#main-content" className="vx-skip-link">
          Saltar al contenido
        </a>
        <Splash
          error={status === "error" ? gateError : undefined}
          onRetry={status === "error" ? () => setAttempt((n) => n + 1) : undefined}
        />
      </>
    );
  }

  const ActiveView = VIEW_COMPONENTS[view] ?? VIEW_COMPONENTS.terminal;

  return (
    <>
      <a href="#main-content" className="vx-skip-link">
        Saltar al contenido
      </a>
      <Sidebar />
      <HydrationMarker />
      <MobileChrome />
      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          "vx-scroll min-h-dvh px-4 pb-10 pt-20 outline-none transition-[margin]",
          // V5/G1: the reference's main is flush against the sidebar's right
          // edge (220px/68px) — its own p-6 wrapper provides the 24px gutter,
          // so the H1 lands at x=244 exactly like the reference. The old
          // ml-[244px]/ml-[92px] doubled the gutter by the padding again.
          sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-[220px]",
          // V5/G2: every non-terminal view keeps the p-6 rhythm (24px all
          // sides); the terminal is the reference's ONE full-bleed view
          // (flex h-screen, zero padding, panes scroll internally).
          view === "terminal"
            ? "lg:h-screen lg:overflow-hidden lg:p-0"
            : "lg:px-6 lg:pb-6 lg:pt-6",
        )}
        data-testid="main-content"
      >
        {/* V17/F2: the lazy registry — the fallback stays null because the
            boot prefetch (above) has the chunk resident before "ready" in
            the standard flow; a cold route switch shows the same chrome
            with an empty main for one local chunk fetch. */}
        <React.Suspense fallback={null}>
          <ActiveView />
        </React.Suspense>
      </main>
    </>
  );
}

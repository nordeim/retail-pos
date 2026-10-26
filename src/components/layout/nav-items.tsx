"use client";

// ---------------------------------------------------------------------------
// The ONE nav-item source: every chrome surface (desktop sidebar, mobile
// drawer) renders NavItemLink so a route change never drifts between them.
// Reference anatomy (v4 live probe): a lucide icon + label; the ACTIVE item
// is the translucent violet pill (bg-violet-600/20, violet-300 text, thin
// violet-500/30 border, soft violet shadow); inactive is white/40.
// ---------------------------------------------------------------------------

import * as React from "react";

import { ShoppingCart, ChartColumn, Package, History, Monitor, Users, FileChartColumnIncreasing, Settings } from "lucide-react";

import { useAppStore } from "@/lib/store";
import { type NavItem } from "@/lib/router";
import { cn } from "@/lib/utils";

export const NAV_ICONS: Record<NavItem["id"], React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  terminal: ShoppingCart,
  dashboard: ChartColumn,
  inventario: Package,
  ventas: History,
  cajas: Monitor,
  cajeros: Users,
  reportes: FileChartColumnIncreasing,
  ajustes: Settings,
};

export function NavItemLink({
  item,
  collapsed = false,
  onNavigate,
}: {
  item: NavItem;
  collapsed?: boolean;
  /** The mobile drawer closes itself after navigating; the sidebar doesn't. */
  onNavigate?: () => void;
}) {
  const active = useAppStore((s) => s.view === item.id);
  const navigate = useAppStore((s) => s.navigate);
  const Icon = NAV_ICONS[item.id];

  return (
    <a
      href={item.path === "/" ? "/" : item.path}
      data-testid={`nav-${item.id}`}
      aria-current={active ? "page" : undefined}
      onClick={(event) => {
        // SPA navigation with the canonical URL; a modified click (new tab,
        // bookmark) keeps the native behavior.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;
        event.preventDefault();
        navigate(item.id);
        onNavigate?.();
      }}
      title={collapsed ? item.label : undefined}
      className={cn(
        "vx-focus flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        active
          ? "bg-violet-600/20 text-violet-300 ring-1 ring-violet-500/30 shadow-sm shadow-violet-500/10"
          : "text-white/40 hover:bg-white/5 hover:text-white/80",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </a>
  );
}

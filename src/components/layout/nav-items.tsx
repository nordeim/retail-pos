"use client";

// ---------------------------------------------------------------------------
// The ONE nav-item source: every chrome surface (desktop sidebar, mobile
// drawer) renders NavItemLink so a route change never drifts between them.
// Reference anatomy: a lucide icon + label, the ACTIVE item wrapped in the
// violet gradient pill with white text; inactive text is slate-400.
// ---------------------------------------------------------------------------

import * as React from "react";

import { ShoppingCart, LayoutDashboard, Package, History, Monitor, Users, FileText, Settings } from "lucide-react";

import { useAppStore } from "@/lib/store";
import { type NavItem } from "@/lib/router";
import { cn } from "@/lib/utils";

export const NAV_ICONS: Record<NavItem["id"], React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  terminal: ShoppingCart,
  dashboard: LayoutDashboard,
  inventario: Package,
  ventas: History,
  cajas: Monitor,
  cajeros: Users,
  reportes: FileText,
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
        "vx-focus flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "vx-gradient text-white shadow-[0_4px_14px_rgba(109,40,217,0.35)]"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </a>
  );
}

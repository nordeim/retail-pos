"use client";

// ---------------------------------------------------------------------------
// The desktop chrome: a FIXED dark rail — `hidden lg:flex`, w-[220px]
// expanded / w-[68px] collapsed (reference-measured; the toggle lives at
// the sidebar's BOTTOM, ChevronLeft rotating 180° when collapsed).
// Everything below lg goes through the mobile drawer; main carries the
// lg:ml offset (page.tsx).
// ---------------------------------------------------------------------------

import * as React from "react";
import { ChevronLeft, Zap } from "lucide-react";

import { NavItemLink } from "@/components/layout/nav-items";
import { NAV_ITEMS } from "@/lib/router";
import { useAppStore, usePosStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const storeName = usePosStore((s) => s.settings?.name ?? "Mi Tienda");

  return (
    <aside
      data-testid="desktop-sidebar"
      className="fixed bottom-0 left-0 top-0 z-40 hidden h-screen flex-col border-r bg-[#0d0f1a] text-white transition-all duration-300 lg:flex"
      style={{ width: collapsed ? 68 : 220, borderColor: "#1e2235" }}
    >
      {/* Brand row (v4: the reference's 32px diagonal-gradient chip +
          white/90 tracked label + py-5 row). */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-3 border-b py-5 pl-4 pr-4",
          collapsed && "justify-center px-0 py-5",
        )}
        style={{ borderColor: "#1e2235" }}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
          <Zap className="h-4 w-4" strokeWidth={2} />
        </span>
        {!collapsed && (
          <p className="truncate text-sm font-bold text-white/90 tracking-wide">{storeName}</p>
        )}
      </div>

      {/* The ONE nav-item source (reference: space-y-0.5 rhythm, px-2/py-4). */}
      <nav
        aria-label="Navegación principal"
        className={cn(
          "vx-scroll flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-4",
          collapsed && "px-2",
        )}
      >
        {NAV_ITEMS.map((item) => (
          <NavItemLink key={item.id} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Collapse toggle — the reference parks it at the BOTTOM. */}
      <div
        className="shrink-0 border-t p-3"
        style={{ borderColor: "#1e2235" }}
      >
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          aria-expanded={!collapsed}
          data-testid="sidebar-toggle"
          className="vx-focus flex w-full items-center justify-center rounded-xl p-2 text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
        >
          <ChevronLeft
            className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")}
            strokeWidth={2}
          />
        </button>
      </div>
    </aside>
  );
}

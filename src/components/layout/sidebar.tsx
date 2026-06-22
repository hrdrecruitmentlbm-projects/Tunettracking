"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User } from "@/types";
import { NotificationsPanel } from "./notifications-panel";
import { TunetMark } from "@/components/icons/brand-icons";
import {
  LayoutDashboard,
  Map,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Clock,
} from "lucide-react";
import { COPY } from "@/lib/copy";
import { useMediaQuery } from "@/hooks/use-media-query";

interface SidebarProps {
  user: User;
}

const NAV_ITEMS = {
  admin: [
    { href: "/dashboard/admin", labelKey: "dashboard" as const, icon: LayoutDashboard },
    { href: "/dashboard/map", labelKey: "radarMap" as const, icon: Map },
    { href: "/dashboard/tasks", labelKey: "taskBoard" as const, icon: CheckSquare },
    { href: "/dashboard/attendance", labelKey: "attendance" as const, icon: Clock },
    { href: "/dashboard/admin/users", labelKey: "team" as const, icon: Users },
    { href: "/dashboard/admin/attendance", labelKey: "attendanceOverview" as const, icon: Users },
    { href: "/dashboard/settings", labelKey: "settings" as const, icon: Settings },
  ],
  noc: [
    { href: "/dashboard/noc", labelKey: "dashboard" as const, icon: LayoutDashboard },
    { href: "/dashboard/map", labelKey: "radarMap" as const, icon: Map },
    { href: "/dashboard/tasks", labelKey: "taskBoard" as const, icon: CheckSquare },
    { href: "/dashboard/attendance", labelKey: "attendance" as const, icon: Clock },
    { href: "/dashboard/settings", labelKey: "settings" as const, icon: Settings },
  ],
  foc: [
    { href: "/dashboard/foc", labelKey: "myTasks" as const, icon: CheckSquare },
    { href: "/dashboard/attendance", labelKey: "attendance" as const, icon: Clock },
    { href: "/dashboard/map", labelKey: "map" as const, icon: Map },
    { href: "/dashboard/settings", labelKey: "settings" as const, icon: Settings },
  ],
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const navItems = NAV_ITEMS[user.role] || NAV_ITEMS.noc;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("tunetops-user");
    window.location.href = "/";
  };

  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <aside
      className={cn(
        "h-full bg-tunet-surface border-r border-tunet-border flex flex-col transition-all duration-300",
        isMobile ? "w-64" : collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-tunet-border">
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-tunet-green/20 flex items-center justify-center">
              <TunetMark className="w-5 h-5 text-tunet-green" />
            </div>
            <span className="font-bold text-tunet-text">TunetOps</span>
          </div>
        )}
        {isMobile ? (
          <button
            onClick={closeMobile}
            className="p-1.5 rounded-lg hover:bg-tunet-surface-hover text-tunet-text-muted"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-tunet-surface-hover text-tunet-text-muted"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-tunet-green/20 text-tunet-green"
                  : "text-tunet-text-muted hover:bg-tunet-surface-hover hover:text-tunet-text"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || isMobile) && <span className="text-sm">{COPY.nav[item.labelKey]}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-2">
        <NotificationsPanel userId={user.id} />
      </div>

      <div className="p-2 border-t border-tunet-border">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-tunet-green/20 flex items-center justify-center text-tunet-green text-sm font-medium">
            {user.name.charAt(0)}
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-tunet-text truncate">{user.name}</p>
              <p className="text-xs text-tunet-text-muted uppercase">{user.role}</p>
            </div>
          )}
          {(!collapsed || isMobile) && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-tunet-surface-hover text-tunet-text-muted"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-tunet-surface border border-tunet-border text-tunet-text md:hidden shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeMobile}
            aria-hidden="true"
          />
        )}

        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 md:hidden transform transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  return sidebarContent;
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User } from "@/types";
import { NotificationsPanel } from "./notifications-panel";
import {
  LayoutDashboard,
  Map,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Wifi,
} from "lucide-react";
import { COPY } from "@/lib/copy";

interface SidebarProps {
  user: User;
}

const NAV_ITEMS = {
  admin: [
    { href: "/dashboard/admin", labelKey: "dashboard" as const, icon: LayoutDashboard },
    { href: "/dashboard/map", labelKey: "radarMap" as const, icon: Map },
    { href: "/dashboard/tasks", labelKey: "taskBoard" as const, icon: CheckSquare },
    { href: "/dashboard/admin/users", labelKey: "team" as const, icon: Users },
    { href: "/dashboard/settings", labelKey: "settings" as const, icon: Settings },
  ],
  noc: [
    { href: "/dashboard/noc", labelKey: "dashboard" as const, icon: LayoutDashboard },
    { href: "/dashboard/map", labelKey: "radarMap" as const, icon: Map },
    { href: "/dashboard/tasks", labelKey: "taskBoard" as const, icon: CheckSquare },
    { href: "/dashboard/settings", labelKey: "settings" as const, icon: Settings },
  ],
  foc: [
    { href: "/dashboard/foc", labelKey: "myTasks" as const, icon: CheckSquare },
    { href: "/dashboard/map", labelKey: "map" as const, icon: Map },
    { href: "/dashboard/settings", labelKey: "settings" as const, icon: Settings },
  ],
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = NAV_ITEMS[user.role] || NAV_ITEMS.noc;

  const handleLogout = () => {
    localStorage.removeItem("tunetops-user");
    window.location.href = "/";
  };

  return (
    <aside
      className={cn(
        "h-full bg-tunet-surface border-r border-tunet-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-tunet-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-tunet-green/20 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-tunet-green" />
            </div>
            <span className="font-bold text-tunet-text">TunetOps</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-tunet-surface-hover text-tunet-text-muted"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-tunet-green/20 text-tunet-green"
                  : "text-tunet-text-muted hover:bg-tunet-surface-hover hover:text-tunet-text"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">{COPY.nav[item.labelKey]}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Notifications */}
      {!collapsed && (
        <div className="px-2 pb-2">
          <NotificationsPanel userId={user.id} />
        </div>
      )}
      {collapsed && (
        <div className="px-2 pb-2">
          <NotificationsPanel userId={user.id} />
        </div>
      )}

      {/* User Info */}
      <div className="p-2 border-t border-tunet-border">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-tunet-green/20 flex items-center justify-center text-tunet-green text-sm font-medium">
            {user.name.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-tunet-text truncate">{user.name}</p>
              <p className="text-xs text-tunet-text-muted uppercase">{user.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-tunet-surface-hover text-tunet-text-muted"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

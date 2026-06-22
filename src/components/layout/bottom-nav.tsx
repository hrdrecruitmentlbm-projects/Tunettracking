"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  CheckSquare,
  Settings,
  Users,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";
import { COPY } from "@/lib/copy";

interface BottomNavProps {
  role: UserRole;
}

const NAV_ITEMS = {
  admin: [
    { href: "/dashboard/admin", label: COPY.nav.dashboard, icon: LayoutDashboard },
    { href: "/dashboard/map", label: COPY.nav.radarMap, icon: Map },
    { href: "/dashboard/tasks", label: COPY.nav.taskBoard, icon: CheckSquare },
    { href: "/dashboard/attendance", label: COPY.nav.attendance, icon: Clock },
    { href: "/dashboard/admin/users", label: COPY.nav.team, icon: Users },
    { href: "/dashboard/settings", label: COPY.nav.settings, icon: Settings },
  ],
  noc: [
    { href: "/dashboard/noc", label: COPY.nav.dashboard, icon: LayoutDashboard },
    { href: "/dashboard/map", label: COPY.nav.radarMap, icon: Map },
    { href: "/dashboard/tasks", label: COPY.nav.taskBoard, icon: CheckSquare },
    { href: "/dashboard/attendance", label: COPY.nav.attendance, icon: Clock },
    { href: "/dashboard/settings", label: COPY.nav.settings, icon: Settings },
  ],
  foc: [
    { href: "/dashboard/foc", label: COPY.nav.myTasks, icon: CheckSquare },
    { href: "/dashboard/attendance", label: COPY.nav.attendance, icon: Clock },
    { href: "/dashboard/map", label: COPY.nav.map, icon: Map },
    { href: "/dashboard/settings", label: COPY.nav.settings, icon: Settings },
  ],
};

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role] || NAV_ITEMS.noc;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-tunet-surface border-t border-tunet-border md:hidden">
      <div className="flex justify-around items-stretch h-16">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 transition-colors",
                isActive
                  ? "text-tunet-green"
                  : "text-tunet-text-muted hover:text-tunet-text"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] truncate px-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

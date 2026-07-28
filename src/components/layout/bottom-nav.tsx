"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  CheckSquare,
  Users,
  Clock,
  ClipboardCheck,
  Menu,
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
  ],
  noc: [
    { href: "/dashboard/noc", label: COPY.nav.dashboard, icon: LayoutDashboard },
    { href: "/dashboard/map", label: COPY.nav.radarMap, icon: Map },
    { href: "/dashboard/tasks", label: COPY.nav.taskBoard, icon: CheckSquare },
    { href: "/dashboard/attendance", label: COPY.nav.attendance, icon: Clock },
  ],
  foc: [
    { href: "/dashboard/foc", label: COPY.nav.myTasks, icon: CheckSquare },
    { href: "/dashboard/attendance", label: COPY.nav.attendance, icon: Clock },
    { href: "/dashboard/map", label: COPY.nav.map, icon: Map },
  ],
  marketing: [
    { href: "/dashboard/marketing", label: COPY.nav.dashboard, icon: LayoutDashboard },
    { href: "/dashboard/map", label: COPY.nav.map, icon: Map },
    { href: "/dashboard/marketing/prospects", label: COPY.nav.prospects, icon: Users },
    { href: "/dashboard/marketing/kunjungan", label: COPY.nav.visits, icon: ClipboardCheck },
  ],
};

const HOME_ROUTES = new Set([
  "/dashboard/admin",
  "/dashboard/noc",
  "/dashboard/foc",
  "/dashboard/marketing",
]);

function isRouteMatch(pathname: string, href: string) {
  return pathname === href || (!HOME_ROUTES.has(href) && pathname.startsWith(`${href}/`));
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role] || NAV_ITEMS.noc;
  const hasPrimaryMatch = items.some((item) => isRouteMatch(pathname, item.href));

  const openMore = () => {
    window.dispatchEvent(new CustomEvent("tutrack:open-mobile-nav"));
  };

  return (
    <nav
      className="mobile-primary-nav fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Navigasi utama"
    >
      <div className="mx-auto flex min-h-16 max-w-lg items-stretch overflow-hidden rounded-2xl border border-tunet-border/90 bg-tunet-surface/95 p-1 shadow-[0_16px_50px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
        {items.map((item) => {
          const isActive = isRouteMatch(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "touch-target relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors motion-reduce:transition-none",
                isActive
                  ? "bg-tunet-signal/12 text-tunet-signal"
                  : "text-tunet-text-muted hover:text-tunet-text"
              )}
            >
              <item.icon
                className="w-[19px] h-[19px]"
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className="max-w-full truncate text-[9px] font-medium tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          data-mobile-nav-trigger
          onClick={openMore}
          aria-label="Buka menu lainnya"
          aria-haspopup="dialog"
          className={cn(
            "touch-target relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors motion-reduce:transition-none",
            hasPrimaryMatch
              ? "text-tunet-text-muted hover:text-tunet-text"
              : "bg-tunet-signal/12 text-tunet-signal"
          )}
        >
          <Menu
            className="w-[19px] h-[19px]"
            strokeWidth={hasPrimaryMatch ? 1.8 : 2.2}
          />
          <span className="text-[9px] font-medium tracking-tight">Lainnya</span>
        </button>
      </div>
    </nav>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User } from "@/types";
import { NotificationsPanel } from "./notifications-panel";
import { TuTrackMark } from "@/components/icons/brand-icons";
import {
  LayoutDashboard,
  Map,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  X,
  Clock,
  ClipboardCheck,
  Target,
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
    { href: "/dashboard/attendance", labelKey: "attendance" as const, icon: Clock },
    { href: "/dashboard/admin/users", labelKey: "team" as const, icon: Users },
    { href: "/dashboard/admin/attendance", labelKey: "attendanceOverview" as const, icon: Users },
    { href: "/dashboard/admin/marketing", labelKey: "marketing" as const, icon: Target },
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
  marketing: [
    { href: "/dashboard/marketing", labelKey: "dashboard" as const, icon: LayoutDashboard },
    { href: "/dashboard/map", labelKey: "map" as const, icon: Map },
    { href: "/dashboard/marketing/prospects", labelKey: "prospects" as const, icon: Users },
    { href: "/dashboard/marketing/kunjungan", labelKey: "visits" as const, icon: ClipboardCheck },
    { href: "/dashboard/attendance", labelKey: "attendance" as const, icon: Clock },
    { href: "/dashboard/settings", labelKey: "settings" as const, icon: Settings },
  ],
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const navItems = NAV_ITEMS[user.role] || NAV_ITEMS.noc;

  const activeHref = useMemo(
    () =>
      navItems
        .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
        .sort((a, b) => b.href.length - a.href.length)[0]?.href,
    [navItems, pathname]
  );

  const restoreMobileTriggerFocus = useCallback(() => {
    requestAnimationFrame(() => {
      const visibleTrigger = Array.from(
        document.querySelectorAll<HTMLButtonElement>("[data-mobile-nav-trigger]")
      ).find((element) => element.offsetParent !== null);
      visibleTrigger?.focus();
    });
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    restoreMobileTriggerFocus();
  }, [restoreMobileTriggerFocus]);

  useEffect(() => {
    const openMobile = () => setMobileOpen(true);
    window.addEventListener("tutrack:open-mobile-nav", openMobile);
    return () => window.removeEventListener("tutrack:open-mobile-nav", openMobile);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };
    media.addEventListener("change", closeAtDesktop);
    return () => media.removeEventListener("change", closeAtDesktop);
  }, []);

  const handleDrawerKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobile();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [closeMobile]
  );

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("tutrack-user");
    localStorage.removeItem("tutrack-login-at");
    window.location.href = "/";
  };

  const sidebarContent = (isMobile: boolean) => (
    <aside
      aria-label="Navigasi sampingan"
      className={cn(
        "relative isolate h-full overflow-hidden bg-tunet-surface/96 border-r border-tunet-border flex flex-col transition-[width] duration-300 motion-reduce:transition-none",
        isMobile ? "w-[min(88vw,22rem)] shadow-2xl" : collapsed ? "w-20" : "w-68"
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-16 -z-10 h-64 w-64 rounded-full bg-tunet-signal/8 blur-3xl"
      />

      <div className="h-18 flex items-center justify-between px-3 border-b border-tunet-border/80">
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl border border-tunet-signal/25 bg-tunet-signal/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flex items-center justify-center">
              <TuTrackMark className="w-5 h-5 text-tunet-signal" />
            </div>
            <div className="min-w-0 leading-none">
              <span className="font-display text-base font-semibold tracking-[-0.02em] text-tunet-text">
                TuTrack
              </span>
              <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-tunet-signal">
                Signal room
              </p>
            </div>
          </div>
        )}

        {isMobile ? (
          <button
            type="button"
            onClick={closeMobile}
            className="touch-target inline-flex items-center justify-center rounded-xl text-tunet-text-muted transition-colors hover:bg-tunet-surface-hover hover:text-tunet-text motion-reduce:transition-none"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="touch-target inline-flex items-center justify-center rounded-xl text-tunet-text-muted transition-colors hover:bg-tunet-surface-hover hover:text-tunet-text motion-reduce:transition-none"
            aria-label={collapsed ? "Perluas panel navigasi" : "Ciutkan panel navigasi"}
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform motion-reduce:transition-none",
                collapsed && "rotate-180"
              )}
            />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto" aria-label="Menu utama">
        {(!collapsed || isMobile) && (
          <p className="px-3 pb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-tunet-text-muted">
            Workspace
          </p>
        )}

        {navItems.map((item) => {
          const isActive = activeHref === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? closeMobile : undefined}
              aria-label={COPY.nav[item.labelKey]}
              aria-current={isActive ? "page" : undefined}
              title={!isMobile && collapsed ? COPY.nav[item.labelKey] : undefined}
              className={cn(
                "group relative min-h-11 flex items-center gap-3 rounded-xl px-3 text-sm transition-colors motion-reduce:transition-none",
                collapsed && !isMobile && "justify-center px-0",
                isActive
                  ? "bg-tunet-signal/12 text-tunet-signal shadow-[inset_0_0_0_1px_rgba(55,217,242,0.12)]"
                  : "text-tunet-text-muted hover:bg-tunet-surface-hover hover:text-tunet-text"
              )}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 h-5 w-0.5 rounded-full bg-tunet-signal shadow-[0_0_12px_rgba(55,217,242,0.9)]"
                />
              )}
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} />
              {(!collapsed || isMobile) && (
                <span className="truncate font-medium">{COPY.nav[item.labelKey]}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "px-2 pb-2 [&_button:first-child]:min-h-11",
          collapsed &&
            !isMobile &&
            "[&_button:first-child]:justify-center [&_button:first-child]:px-0 [&_button:first-child>span]:hidden"
        )}
      >
        <NotificationsPanel userId={user.id} />
      </div>

      <div className="p-3 border-t border-tunet-border/80">
        <div
          className={cn(
            "min-h-12 flex items-center gap-3 px-2",
            collapsed && !isMobile && "justify-center"
          )}
        >
          <div className="w-9 h-9 rounded-xl border border-tunet-green/20 bg-tunet-green/10 flex items-center justify-center text-tunet-green text-sm font-semibold">
            {user.name.charAt(0)}
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-tunet-text truncate">{user.name}</p>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-tunet-text-muted">
                {user.role}
              </p>
            </div>
          )}
          {(!collapsed || isMobile) && (
            <button
              type="button"
              onClick={handleLogout}
              className="touch-target inline-flex items-center justify-center rounded-xl text-tunet-text-muted transition-colors hover:bg-status-overdue/10 hover:text-status-overdue motion-reduce:transition-none"
              aria-label="Keluar"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:sticky md:top-0 md:block md:h-screen md:flex-none">
        {sidebarContent(false)}
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px] md:hidden"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <div
            id="mobile-sidebar"
            role="dialog"
            aria-label="Menu navigasi"
            aria-modal="true"
            ref={drawerRef}
            onKeyDown={handleDrawerKeyDown}
            className="fixed inset-y-0 left-0 z-[60] md:hidden animate-in slide-in-from-left duration-300 motion-reduce:animate-none"
          >
            {sidebarContent(true)}
          </div>
        </>
      )}
    </>
  );
}

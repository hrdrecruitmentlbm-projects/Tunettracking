"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CheckSquare,
  Clock,
  ClipboardCheck,
  CornerDownLeft,
  LayoutDashboard,
  Map,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Target,
  Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Task, UserRole } from "@/types";
import { fetchTasks } from "@/lib/db";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

type NavIcon = typeof LayoutDashboard;

interface NavEntry {
  href: string;
  labelKey: keyof typeof COPY.nav;
  icon: NavIcon;
}

/** Power-user navigation targets, mirroring the sidebar NAV_ITEMS. */
const ROLE_NAV: Partial<Record<UserRole, NavEntry[]>> = {
  admin: [
    { href: "/dashboard/admin", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/dashboard/map", labelKey: "radarMap", icon: Map },
    { href: "/dashboard/tasks", labelKey: "taskBoard", icon: CheckSquare },
    { href: "/dashboard/attendance", labelKey: "attendance", icon: Clock },
    { href: "/dashboard/admin/users", labelKey: "team", icon: Users },
    { href: "/dashboard/admin/attendance", labelKey: "attendanceOverview", icon: Users },
    { href: "/dashboard/admin/marketing", labelKey: "marketing", icon: Target },
    { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
  ],
  noc: [
    { href: "/dashboard/noc", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/dashboard/map", labelKey: "radarMap", icon: Map },
    { href: "/dashboard/tasks", labelKey: "taskBoard", icon: CheckSquare },
    { href: "/dashboard/attendance", labelKey: "attendance", icon: Clock },
    { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
  ],
  foc: [
    { href: "/dashboard/foc", labelKey: "myTasks", icon: CheckSquare },
    { href: "/dashboard/attendance", labelKey: "attendance", icon: Clock },
    { href: "/dashboard/map", labelKey: "map", icon: Map },
    { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
  ],
  marketing: [
    { href: "/dashboard/marketing", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/dashboard/map", labelKey: "map", icon: Map },
    { href: "/dashboard/marketing/prospects", labelKey: "prospects", icon: Users },
    { href: "/dashboard/marketing/kunjungan", labelKey: "visits", icon: ClipboardCheck },
    { href: "/dashboard/attendance", labelKey: "attendance", icon: Clock },
    { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
  ],
};

interface CommandEntry {
  key: string;
  label: string;
  hint?: string;
  icon: NavIcon;
  run: () => void;
}

/**
 * Ctrl/Cmd+K command palette for keyboard-heavy NOC/admin operators.
 * Tasks are fetched lazily on first open; selection deep-links using the
 * same URL patterns the notification deep-links use.
 */
export function CommandPalette({ role }: { role: UserRole }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  // Ref (not state) so the lazy-load effect doesn't trigger cascading renders.
  const loadedRef = useRef(false);

  const navEntries = ROLE_NAV[role] ?? [];

  // Global Ctrl/Cmd+K toggle.
  useEffect(() => {
    if (navEntries.length === 0) return;
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navEntries.length]);

  // Load tasks lazily on first open.
  useEffect(() => {
    if (!open || loadedRef.current) return;
    loadedRef.current = true;
    fetchTasks({ limit: 200 }).then(setTasks);
  }, [open]);

  const taskHref = useCallback(
    (taskId: string) =>
      role === "foc"
        ? `/dashboard/foc?task=${taskId}`
        : `/dashboard/tasks?highlight=${taskId}`,
    [role]
  );

  const entries = useMemo<CommandEntry[]>(() => {
    const q = query.trim().toLowerCase();
    const nav: CommandEntry[] = navEntries
      .filter((entry) => !q || COPY.nav[entry.labelKey].toLowerCase().includes(q))
      .map((entry) => ({
        key: `nav-${entry.href}`,
        label: COPY.nav[entry.labelKey],
        icon: entry.icon,
        run: () => router.push(entry.href),
      }));

    // Quick actions — only when they apply to the role.
    const actions: CommandEntry[] = [];
    if (role === "admin" || role === "noc") {
      actions.push({
        key: "action-new-task",
        label: COPY.command.newTask,
        icon: Plus,
        run: () => router.push("/dashboard/tasks?new=1"),
      });
    }
    actions.push({
      key: "action-toggle-theme",
      label: COPY.command.toggleTheme,
      hint: resolvedTheme === "light" ? "Dark" : "Light",
      icon: resolvedTheme === "light" ? Moon : Sun,
      run: () => setTheme(resolvedTheme === "light" ? "dark" : "light"),
    });

    const taskEntries: CommandEntry[] = tasks
      .filter(
        (task) =>
          !task.deleted_at &&
          (!q ||
            task.title.toLowerCase().includes(q) ||
            task.location_name.toLowerCase().includes(q))
      )
      .slice(0, 8)
      .map((task) => ({
        key: `task-${task.id}`,
        label: task.title,
        hint: task.location_name,
        icon: CheckSquare,
        run: () => router.push(taskHref(task.id)),
      }));

    const filteredActions = actions.filter(
      (action) => !q || action.label.toLowerCase().includes(q)
    );

    return [...filteredActions, ...taskEntries, ...nav];
  }, [query, tasks, navEntries, router, taskHref, resolvedTheme, setTheme, role]);

  // Reset the cursor whenever the query changes (cursor also clamped at
  // usage sites so an async task-load can't leave it out of bounds).
  const updateQuery = (next: string) => {
    setQuery(next);
    setActiveIndex(0);
  };

  if (navEntries.length === 0) return null;

  const runEntry = (entry: CommandEntry) => {
    setOpen(false);
    setQuery("");
    entry.run();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, entries.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const entry = entries[Math.min(activeIndex, entries.length - 1)];
      if (entry) runEntry(entry);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <DialogContent className="top-[12%] translate-y-0 gap-0 border-tunet-border bg-tunet-surface p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">{COPY.command.title}</DialogTitle>
        <div className="flex items-center gap-2 border-b border-tunet-border px-4">
          <Search className="size-4 shrink-0 text-tunet-text-muted" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={COPY.command.placeholder}
            aria-label={COPY.command.placeholder}
            className="h-12 w-full bg-transparent text-sm text-tunet-text placeholder:text-tunet-text-muted focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-tunet-border px-1.5 py-0.5 font-mono text-[10px] text-tunet-text-muted sm:block">
            Esc
          </kbd>
        </div>

        <div
          className="max-h-80 overflow-y-auto p-2"
          role="listbox"
          aria-label={COPY.command.title}
        >
          {entries.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-tunet-text-muted">
              {COPY.command.empty(query)}
            </p>
          ) : (
            entries.map((entry, index) => {
              const Icon = entry.icon;
              return (
                <button
                  key={entry.key}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => runEntry(entry)}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors motion-reduce:transition-none",
                    index === activeIndex
                      ? "bg-tunet-signal/12 text-tunet-text"
                      : "text-tunet-text-muted hover:bg-tunet-surface-hover"
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-tunet-text">
                    {entry.label}
                  </span>
                  {entry.hint && (
                    <span className="max-w-40 truncate text-xs text-tunet-text-muted">
                      {entry.hint}
                    </span>
                  )}
                  {index === activeIndex && (
                    <CornerDownLeft
                      className="size-3.5 shrink-0 text-tunet-text-muted"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

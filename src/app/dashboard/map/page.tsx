"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  LocateFixed,
  MapPin,
  Radio,
  Search,
  UserRound,
  Wifi,
  X,
} from "lucide-react";
import { fetchLocations, fetchTasks, fetchUsers, getSessionDate } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { User, Location, Task, UserRole } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { getRelativeTime } from "@/lib/time";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { useHeartbeat } from "@/hooks/use-heartbeat";

const RadarMap = dynamic(() => import("@/components/map/radar-map").then((m) => m.RadarMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#0A0F1C] flex items-center justify-center">
      <div className="text-slate-400 text-sm">{COPY.loading.map}</div>
    </div>
  ),
});

const DASHBOARD_ROUTES: Record<UserRole, string> = {
  admin: "/dashboard/admin",
  noc: "/dashboard/noc",
  foc: "/dashboard/foc",
  marketing: "/dashboard/marketing",
};

type VisibleRole = "foc" | "noc" | "marketing";

const ROLE_FILTERS: Array<{ value: VisibleRole; label: string }> = [
  { value: "foc", label: "FOC" },
  { value: "noc", label: "NOC" },
  { value: "marketing", label: "Marketing" },
];

export default function MapPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dashboardPath, setDashboardPath] = useState("/dashboard/noc");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [focusUserId, setFocusUserId] = useState<string | null>(null);
  const [showRoles, setShowRoles] = useState<VisibleRole[]>(["foc"]);
  const [selectedDate, setSelectedDate] = useState<string>(() => getSessionDate());
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  useHeartbeat({ userId: currentUserId });

  useEffect(() => {
    const stored = localStorage.getItem("tutrack-user");
    if (stored) {
      try {
        const user: User = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDashboardPath(DASHBOARD_ROUTES[user.role] || DASHBOARD_ROUTES.noc);
        setCurrentUserId(user.id);
        if (user.role === "admin") {
          setShowRoles(["foc", "noc", "marketing"]);
        } else if (user.role === "marketing") {
          setShowRoles(["foc", "marketing"]);
        }
      } catch {
        // Invalid cached session is handled by the destination dashboard.
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [nextUsers, nextLocations, nextTasks] = await Promise.all([
        fetchUsers(),
        fetchLocations(),
        fetchTasks(),
      ]);
      if (cancelled) return;
      setUsers(nextUsers);
      setLocations(nextLocations);
      setTasks(nextTasks);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`map-context-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "locations" },
        async () => {
          const nextLocations = await fetchLocations();
          if (!cancelled) setLocations(nextLocations);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        async () => {
          const nextTasks = await fetchTasks();
          if (!cancelled) setTasks(nextTasks);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();
    return users.filter((user) => {
      const roleVisible = showRoles.includes(user.role as VisibleRole);
      return roleVisible && (!query || user.name.toLowerCase().includes(query));
    });
  }, [search, showRoles, users]);

  const focusedUser = users.find((user) => user.id === focusUserId) ?? null;
  const focusedLocation =
    locations.find((location) => location.user_id === focusUserId) ?? null;
  const focusedTasks = tasks.filter(
    (task) => task.assigned_to === focusUserId && task.status !== "done"
  );
  const focusedOverdue = focusedTasks.filter(
    (task) => task.deadline && new Date(task.deadline) < new Date()
  ).length;

  const activeLocationCount = locations.filter((location) =>
    showRoles.includes(location.user?.role as VisibleRole)
  ).length;

  const toggleRole = (role: VisibleRole) => {
    setShowRoles((previous) =>
      previous.includes(role)
        ? previous.filter((item) => item !== role)
        : [...previous, role]
    );
  };

  const handleUserFocus = (userId: string) => {
    setFocusUserId(userId);
    setMobilePanelOpen(false);
  };

  if (loading) {
    return <MapPageSkeleton />;
  }

  return (
    <main className="relative h-[100dvh] min-h-[560px] w-full overflow-hidden bg-[#0A0F1C]">
      <h1 className="sr-only">{COPY.pages.map.title}</h1>
      <p className="sr-only" aria-live="polite">
        {activeLocationCount} lokasi personel tersedia. {filteredUsers.length} personel
        cocok dengan filter saat ini.
      </p>

      <RadarMap
        height="100%"
        variant="flush"
        showRoles={showRoles}
        focusUserId={focusUserId}
        sessionDate={selectedDate}
        layoutKey={`${showRoles.join("-")}-${selectedDate}-${mobilePanelOpen}`}
        coordsClassName="bottom-20 md:bottom-4"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[450] h-40 bg-gradient-to-b from-black/75 via-black/30 to-transparent" />

      <div className="absolute left-3 top-3 z-[500] flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push(dashboardPath)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#0A0F1C]/88 text-white shadow-2xl backdrop-blur-xl transition-colors hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tunet-signal"
          aria-label={COPY.pages.map.back}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="rounded-2xl border border-white/10 bg-[#0A0F1C]/88 px-4 py-2.5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tunet-signal opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-tunet-signal" />
            </span>
            <p className="font-display text-sm font-semibold text-white">
              Radar operasi
            </p>
          </div>
          <p className="hidden text-[10px] text-slate-300 sm:block">
            {activeLocationCount} posisi terhubung
          </p>
        </div>
      </div>

      <div className="absolute left-3 right-3 top-20 z-[500] md:right-[380px]">
        <div className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#0A0F1C]/88 p-1.5 shadow-2xl backdrop-blur-xl">
          <span className="flex h-9 shrink-0 items-center gap-1.5 px-2 text-[10px] uppercase tracking-wider text-slate-400">
            <Radio className="h-3.5 w-3.5 text-tunet-signal" />
            Tim
          </span>
          {ROLE_FILTERS.map((role) => {
            const selected = showRoles.includes(role.value);
            return (
              <button
                key={role.value}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleRole(role.value)}
                className={cn(
                  "min-h-9 shrink-0 rounded-xl px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tunet-signal",
                  selected
                    ? "bg-white text-slate-950"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                {role.label}
              </button>
            );
          })}
          <span className="mx-1 h-5 w-px shrink-0 bg-white/10" />
          <label className="flex h-9 shrink-0 items-center gap-2 rounded-xl px-2 text-xs text-slate-300">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Tanggal sesi</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              max={getSessionDate()}
              className="bg-transparent font-mono text-[11px] text-white outline-none [color-scheme:dark]"
            />
          </label>
          {selectedDate !== getSessionDate() && (
            <button
              type="button"
              onClick={() => setSelectedDate(getSessionDate())}
              className="min-h-9 shrink-0 rounded-xl px-3 text-xs text-tunet-signal transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tunet-signal"
            >
              Hari ini
            </button>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-3 z-[500] hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#0A0F1C]/88 px-3 py-2 text-[10px] text-slate-300 shadow-2xl backdrop-blur-xl md:flex">
        <LegendDot className="bg-tunet-green" label={COPY.pages.map.legendActive} />
        <LegendDot className="bg-status-progress" label={COPY.pages.map.legendIdle} />
        <LegendDot className="bg-status-overdue" label={COPY.pages.map.legendOverdue} />
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-slate-400" />
          {COPY.pages.map.legendRoute}
        </span>
      </div>

      <aside className="absolute bottom-3 right-3 top-3 z-[500] hidden w-[360px] overflow-hidden rounded-3xl border border-white/10 bg-tunet-surface/94 shadow-2xl backdrop-blur-2xl md:flex md:flex-col">
        <RosterPanel
          users={filteredUsers}
          locations={locations}
          tasks={tasks}
          search={search}
          onSearchChange={setSearch}
          focusUserId={focusUserId}
          focusedUser={focusedUser}
          focusedLocation={focusedLocation}
          focusedTaskCount={focusedTasks.length}
          focusedOverdue={focusedOverdue}
          selectedDate={selectedDate}
          onFocus={handleUserFocus}
          onClearFocus={() => setFocusUserId(null)}
        />
      </aside>

      <section
        aria-label="Daftar personel"
        className={cn(
          "absolute inset-x-2 bottom-2 z-[600] flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-tunet-surface/96 shadow-2xl backdrop-blur-2xl transition-[height] duration-300 md:hidden",
          mobilePanelOpen ? "h-[60vh]" : "h-16"
        )}
      >
        <button
          type="button"
          onClick={() => setMobilePanelOpen((open) => !open)}
          className="flex h-16 shrink-0 items-center justify-between px-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tunet-signal"
          aria-expanded={mobilePanelOpen}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-tunet-signal/15 text-tunet-signal">
              <UserRound className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-tunet-text">
                {focusedUser ? focusedUser.name : "Personel lapangan"}
              </p>
              <p className="text-[10px] text-tunet-text-muted">
                {filteredUsers.length} personel pada filter ini
              </p>
            </div>
          </div>
          {mobilePanelOpen ? (
            <ChevronDown className="h-5 w-5 text-tunet-text-muted" />
          ) : (
            <ChevronUp className="h-5 w-5 text-tunet-text-muted" />
          )}
        </button>

        {mobilePanelOpen && (
          <div className="min-h-0 flex-1 border-t border-tunet-border">
            <RosterPanel
              users={filteredUsers}
              locations={locations}
              tasks={tasks}
              search={search}
              onSearchChange={setSearch}
              focusUserId={focusUserId}
              focusedUser={focusedUser}
              focusedLocation={focusedLocation}
              focusedTaskCount={focusedTasks.length}
              focusedOverdue={focusedOverdue}
              selectedDate={selectedDate}
              onFocus={handleUserFocus}
              onClearFocus={() => setFocusUserId(null)}
              compact
            />
          </div>
        )}
      </section>
    </main>
  );
}

function RosterPanel({
  users,
  locations,
  tasks,
  search,
  onSearchChange,
  focusUserId,
  focusedUser,
  focusedLocation,
  focusedTaskCount,
  focusedOverdue,
  selectedDate,
  onFocus,
  onClearFocus,
  compact = false,
}: {
  users: User[];
  locations: Location[];
  tasks: Task[];
  search: string;
  onSearchChange: (value: string) => void;
  focusUserId: string | null;
  focusedUser: User | null;
  focusedLocation: Location | null;
  focusedTaskCount: number;
  focusedOverdue: number;
  selectedDate: string;
  onFocus: (userId: string) => void;
  onClearFocus: () => void;
  compact?: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn("border-b border-tunet-border", compact ? "p-3" : "p-4")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-base font-semibold text-tunet-text">
              Konteks lapangan
            </p>
            <p className="mt-0.5 text-xs text-tunet-text-muted">
              Pilih personel untuk memusatkan peta
            </p>
          </div>
          {focusUserId && (
            <button
              type="button"
              onClick={onClearFocus}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-tunet-text-muted transition-colors hover:bg-tunet-surface-hover hover:text-tunet-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tunet-signal"
              aria-label="Hapus fokus personel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {focusedUser && (
          <div className="mt-4 rounded-2xl border border-tunet-signal/25 bg-tunet-signal/8 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tunet-signal/15 font-display text-sm font-semibold text-tunet-signal">
                {focusedUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="truncate text-sm font-medium text-tunet-text">
                      {focusedUser.name}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-tunet-text-muted">
                      {focusedUser.role}
                    </p>
                  </div>
                  <LocateFixed className="h-4 w-4 shrink-0 text-tunet-signal" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <span className="rounded-lg bg-tunet-bg/70 px-2 py-1.5 text-tunet-text-muted">
                    Tugas aktif{" "}
                    <strong className="font-mono text-tunet-text">
                      {focusedTaskCount}
                    </strong>
                  </span>
                  <span className="rounded-lg bg-tunet-bg/70 px-2 py-1.5 text-tunet-text-muted">
                    Terlambat{" "}
                    <strong
                      className={cn(
                        "font-mono",
                        focusedOverdue > 0
                          ? "text-status-overdue"
                          : "text-tunet-text"
                      )}
                    >
                      {focusedOverdue}
                    </strong>
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[10px] text-tunet-text-muted">
                  <Clock className="h-3 w-3" />
                  {focusedLocation
                    ? `Posisi ${getRelativeTime(focusedLocation.updated_at)}`
                    : COPY.pages.map.neverReported}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tunet-text-muted" />
          <Input
            placeholder={COPY.pages.map.searchPlaceholder}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-9 bg-tunet-bg pl-9 text-xs text-tunet-text"
          />
        </div>

        {selectedDate !== getSessionDate() && (
          <p className="mt-2 text-[10px] text-tunet-text-muted">
            {COPY.pages.map.currentPositionNote}
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {users.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={UserRound}
              title={COPY.empty.noMatchingMembers.title}
              description={COPY.empty.noMatchingMembers.description}
              variant="inline"
            />
          </div>
        ) : (
          <div className="space-y-1">
            {users.map((user) => {
              const location = locations.find((item) => item.user_id === user.id);
              const assignedTasks = tasks.filter(
                (task) => task.assigned_to === user.id && task.status !== "done"
              );
              const overdue = assignedTasks.some(
                (task) => task.deadline && new Date(task.deadline) < new Date()
              );
              const active = assignedTasks.some(
                (task) => task.status === "in_progress"
              );
              const selected = focusUserId === user.id;

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onFocus(user.id)}
                  aria-pressed={selected}
                  className={cn(
                    "group flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tunet-signal",
                    selected
                      ? "bg-tunet-signal/12 ring-1 ring-tunet-signal/30"
                      : "hover:bg-tunet-surface-hover"
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold",
                      user.role === "marketing"
                        ? "bg-purple-500/15 text-purple-400"
                        : overdue
                        ? "bg-status-overdue/15 text-status-overdue"
                        : active
                        ? "bg-tunet-green/15 text-tunet-green"
                        : "bg-status-progress/15 text-status-progress"
                    )}
                  >
                    {user.name.charAt(0)}
                    {location && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-tunet-surface bg-tunet-green" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-tunet-text">
                        {user.name}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-tunet-text-muted">
                        {user.role}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-tunet-text-muted">
                      {location ? (
                        <>
                          <Wifi className="h-3 w-3 text-tunet-green" />
                          {getRelativeTime(location.updated_at)}
                        </>
                      ) : (
                        <>
                          <MapPin className="h-3 w-3" />
                          {user.role === "noc"
                            ? COPY.pages.map.inOffice
                            : COPY.pages.map.neverReported}
                        </>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", className)} />
      {label}
    </span>
  );
}

function MapPageSkeleton() {
  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#0A0F1C]">
      <Skeleton className="h-full w-full rounded-none bg-slate-900" />
      <div className="absolute left-3 top-3 flex gap-2">
        <Skeleton className="h-11 w-11 rounded-2xl" />
        <Skeleton className="h-11 w-36 rounded-2xl" />
      </div>
      <div className="absolute bottom-3 right-3 top-3 hidden w-[360px] space-y-3 rounded-3xl bg-tunet-surface p-4 md:block">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-full rounded-xl" />
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

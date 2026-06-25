"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { fetchUsers, fetchLocations, fetchTasks, getSessionDate } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { User, Location, Task, UserRole } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Wifi, ArrowLeft, Search, MapPin, Users as UsersIcon, Calendar } from "lucide-react";
import { getRelativeTime } from "@/lib/time";
import { COPY } from "@/lib/copy";
import { useHeartbeat } from "@/hooks/use-heartbeat";

const RadarMap = dynamic(() => import("@/components/map/radar-map").then((m) => m.RadarMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl bg-tunet-surface border border-tunet-border flex items-center justify-center">
      <div className="text-tunet-text-muted text-sm">{COPY.loading.map}</div>
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
  const [userRole, setUserRole] = useState<string>("noc");

  useHeartbeat({ userId: currentUserId });

  useEffect(() => {
    const stored = localStorage.getItem("tutrack-user");
    if (stored) {
      const user: User = JSON.parse(stored);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDashboardPath(DASHBOARD_ROUTES[user.role] || DASHBOARD_ROUTES.noc);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentUserId(user.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserRole(user.role);
      if (user.role === "admin") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowRoles(["foc", "noc", "marketing"]);
      } else if (user.role === "marketing") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowRoles(["foc", "marketing"]);
      }
    }
  }, []);
  useEffect(() => {
    async function load() {
      const [u, l, t] = await Promise.all([fetchUsers(), fetchLocations(), fetchTasks()]);
      setUsers(u);
      setLocations(l);
      setTasks(t);
      setLoading(false);
    }
    load();

    // Live-update sidebar timestamps when a FOC reports a new location.
    // The RadarMap component has its own internal Realtime subscription;
    // this one keeps the sidebar in sync without a page refresh.
    const channel = supabase
      .channel(`map-sidebar-locations-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "locations" },
        async () => {
          const l = await fetchLocations();
          setLocations(l);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const focUsers = useMemo(
    () => users.filter((u) => u.role === "foc"),
    [users]
  );
  const nocUsers = useMemo(
    () => users.filter((u) => u.role === "noc"),
    [users]
  );
  const marketingUsers = useMemo(
    () => users.filter((u) => u.role === "marketing"),
    [users]
  );

  const filteredFoc = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return focUsers;
    return focUsers.filter((u) => u.name.toLowerCase().includes(q));
  }, [focUsers, search]);

  const getMarkerColor = (userId: string) => {
    const hasActiveTask = tasks.some(
      (t) => t.assigned_to === userId && t.status === "in_progress"
    );
    const hasOverdueTask = tasks.some(
      (t) =>
        t.assigned_to === userId &&
        t.deadline &&
        new Date(t.deadline) < new Date() &&
        t.status !== "done"
    );

    if (hasOverdueTask) return "bg-status-overdue";
    if (hasActiveTask) return "bg-tunet-green";
    return "bg-status-progress";
  };

  const toggleRole = (role: VisibleRole) => {
    setShowRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleFocClick = (userId: string) => {
    setFocusUserId(userId);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-tunet-bg">
        <div className="h-16 border-b border-tunet-border flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex">
          <div className="flex-1 p-4">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
          <div className="w-80 border-l border-tunet-border p-4 space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-tunet-bg">
      <div className="h-16 border-b border-tunet-border flex items-center justify-between px-6 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(dashboardPath)}
            className="p-2 rounded-lg hover:bg-tunet-surface-hover text-tunet-text-muted transition-colors"
            aria-label={COPY.pages.map.back}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-tunet-text">{COPY.pages.map.title}</h1>
            <p className="text-xs text-tunet-text-muted">{COPY.pages.map.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 text-xs text-tunet-text-muted cursor-pointer">
            <input
              id="filter-foc"
              type="checkbox"
              checked={showRoles.includes("foc")}
              onChange={() => toggleRole("foc")}
              className="rounded accent-tunet-green"
            />
            {COPY.pages.map.roleFoc}
          </label>
          <label className="flex items-center gap-1.5 text-xs text-tunet-text-muted cursor-pointer">
            <input
              id="filter-noc"
              type="checkbox"
              checked={showRoles.includes("noc")}
              onChange={() => toggleRole("noc")}
              className="rounded accent-tunet-green"
            />
            {COPY.pages.map.roleNoc}
          </label>
          <label className="flex items-center gap-1.5 text-xs text-tunet-text-muted cursor-pointer">
            <input
              id="filter-marketing"
              type="checkbox"
              checked={showRoles.includes("marketing")}
              onChange={() => toggleRole("marketing")}
              className="rounded accent-purple-500"
            />
            {COPY.pages.map.roleMarketing}
          </label>
          <div className="w-px h-4 bg-tunet-border" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-tunet-green" />
            <span className="text-xs text-tunet-text-muted">{COPY.pages.map.legendActive}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-progress" />
            <span className="text-xs text-tunet-text-muted">{COPY.pages.map.legendIdle}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-overdue" />
            <span className="text-xs text-tunet-text-muted">{COPY.pages.map.legendOverdue}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[#94A3B8]" />
            <span className="text-xs text-tunet-text-muted">{COPY.pages.map.legendRoute}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-tunet-bg border-2 border-tunet-green" />
            <span className="text-xs text-tunet-text-muted">{COPY.pages.map.legendPing}</span>
          </div>
          <div className="w-px h-4 bg-tunet-border" />
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-tunet-text-muted" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={getSessionDate()}
              className="h-7 px-2 text-xs bg-tunet-bg border border-tunet-border rounded-md text-tunet-text focus:outline-none focus:ring-1 focus:ring-tunet-green"
            />
            {selectedDate !== getSessionDate() && (
              <button
                onClick={() => setSelectedDate(getSessionDate())}
                className="text-xs text-tunet-green hover:underline"
              >
                Hari ini
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4">
          <RadarMap
            height="100%"
            showRoles={showRoles}
            focusUserId={focusUserId}
            sessionDate={selectedDate}
          />
        </div>

        <div className="w-80 border-l border-tunet-border flex flex-col">
          <div className="p-4 border-b border-tunet-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-tunet-text">
                  {COPY.pages.map.focCount(filteredFoc.length)}
                </h2>
                {selectedDate !== getSessionDate() && (
                  <p className="text-[10px] text-tunet-text-muted mt-0.5">
                    {COPY.pages.map.currentPositionNote}
                  </p>
                )}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tunet-text-muted" />
              <Input
                placeholder={COPY.pages.map.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-tunet-bg border-tunet-border text-tunet-text"
              />
            </div>
            <ScrollArea className="h-32">
              <div className="space-y-1 pr-2">
                {filteredFoc.length === 0 ? (
                  <div className="py-4">
                    <EmptyState
                      icon={UsersIcon}
                      title={COPY.empty.noMatchingMembers.title}
                      description={COPY.empty.noMatchingMembers.description}
                      variant="inline"
                    />
                  </div>
                ) : (
                  filteredFoc.map((user) => {
                    const location = locations.find((l) => l.user_id === user.id);
                    const isFocused = focusUserId === user.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleFocClick(user.id)}
                        className={`w-full text-left flex items-center gap-3 p-2 rounded-lg transition-colors ${
                          isFocused
                            ? "bg-tunet-green/10 ring-1 ring-tunet-green/30"
                            : "hover:bg-tunet-surface-hover"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getMarkerColor(user.id)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-tunet-text truncate">{user.name}</p>
                          <p className="text-xs text-tunet-text-muted">
                            {location
                              ? getRelativeTime(location.updated_at)
                              : COPY.pages.map.neverReported}
                          </p>
                        </div>
                        {location && <Wifi className="w-3.5 h-3.5 text-tunet-green flex-shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="p-4 flex-1">
            <h2 className="text-sm font-medium text-tunet-text-muted mb-3">
              {COPY.pages.map.nocCount(nocUsers.length)}
            </h2>
            {nocUsers.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title={COPY.empty.noLocations.title}
                description={COPY.empty.noLocations.description}
                variant="inline"
              />
            ) : (
              <div className="space-y-2">
                {nocUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-2">
                    <div className="w-2 h-2 rounded-full bg-status-assigned" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-tunet-text-muted truncate">{user.name}</p>
                      <p className="text-xs text-tunet-text-muted">{COPY.pages.map.inOffice}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-tunet-border">
            <h2 className="text-sm font-medium text-tunet-text-muted mb-3">
              {COPY.pages.map.marketingCount(marketingUsers.length)}
            </h2>
            {marketingUsers.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title={COPY.empty.noLocations.title}
                description={COPY.empty.noLocations.description}
                variant="inline"
              />
            ) : (
              <div className="space-y-2">
                {marketingUsers.map((user) => {
                  const location = locations.find((l) => l.user_id === user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => setFocusUserId(user.id)}
                      className={`w-full text-left flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        focusUserId === user.id
                          ? "bg-purple-500/10 ring-1 ring-purple-500/30"
                          : "hover:bg-tunet-surface-hover"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0 bg-purple-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-tunet-text truncate">{user.name}</p>
                        <p className="text-xs text-tunet-text-muted">
                          {location
                            ? getRelativeTime(location.updated_at)
                            : COPY.pages.map.neverReported}
                        </p>
                      </div>
                      {location && <Wifi className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Columns2,
  List,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Radio,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TaskDetail } from "@/components/tasks/task-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTasks } from "@/lib/db";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { getTimeRemaining } from "@/lib/time";
import { Task, TaskStatus, STATUS_CONFIG } from "@/types";
import { toast } from "sonner";
import { useTelegramDispatch } from "@/hooks/use-telegram-dispatch";
import { useIncrementalTasks } from "@/hooks/use-incremental-tasks";
import { useHeartbeat } from "@/hooks/use-heartbeat";

const RadarMap = dynamic(() => import("@/components/map/radar-map").then((m) => m.RadarMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-tunet-surface flex items-center justify-center">
      <div className="text-tunet-text-muted text-sm">{COPY.loading.map}</div>
    </div>
  ),
});

type LayoutMode = "balanced" | "map" | "tasks" | "full";
type IncidentFilter = "all" | "active" | "overdue";

const LAYOUT_OPTIONS: Array<{
  value: LayoutMode;
  label: string;
  icon: typeof Columns2;
}> = [
  { value: "balanced", label: "Seimbang", icon: Columns2 },
  { value: "map", label: "Fokus peta", icon: MapIcon },
  { value: "tasks", label: "Fokus tugas", icon: List },
  { value: "full", label: "Peta penuh", icon: Maximize2 },
];

const FILTER_OPTIONS: Array<{
  value: IncidentFilter;
  label: string;
}> = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "overdue", label: "Terlambat" },
];

const PRIORITY_WEIGHT: Record<Task["priority"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function isTaskOverdue(task: Task) {
  return Boolean(
    task.deadline &&
      new Date(task.deadline) < new Date() &&
      task.status !== "done"
  );
}

export default function NOCDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("balanced");
  const [incidentFilter, setIncidentFilter] = useState<IncidentFilter>("all");

  useTelegramDispatch(currentUserId);
  useHeartbeat({ userId: currentUserId });

  useEffect(() => {
    const stored = localStorage.getItem("tutrack-user");
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentUserId(JSON.parse(stored).id);
      } catch {
        // Ignore invalid cached sessions; DashboardLayout handles redirection.
      }
    }
  }, []);

  useEffect(() => {
    async function load() {
      const result = await fetchTasks();
      setTasks(result);
      setLoading(false);
    }
    load();
  }, []);

  useIncrementalTasks(setTasks);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const storedUser = localStorage.getItem("tutrack-user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    if (currentUser) {
      const { updateTaskStatus } = await import("@/lib/db");
      const success = await updateTaskStatus(taskId, newStatus, currentUser.id);
      if (success) {
        setTasks((previous) =>
          previous.map((task) =>
            task.id === taskId
              ? { ...task, status: newStatus, updated_at: new Date().toISOString() }
              : task
          )
        );
      } else {
        toast.error("Failed to update task status");
      }
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleTaskDeleted = async () => {
    const fresh = await fetchTasks();
    setTasks(fresh);
  };

  const handleTaskUpdated = (updated: Task) => {
    setTasks((previous) =>
      previous.map((task) => (task.id === updated.id ? updated : task))
    );
    setSelectedTask(updated);
  };

  const activeTasks = tasks.filter((task) => task.status === "in_progress").length;
  const overdueTasks = tasks.filter(isTaskOverdue).length;
  const completedTasks = tasks.filter((task) => task.status === "done").length;

  const incidentTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (incidentFilter === "active") return task.status === "in_progress";
        if (incidentFilter === "overdue") return isTaskOverdue(task);
        return task.status !== "done";
      })
      .sort((a, b) => {
        const overdueDifference = Number(isTaskOverdue(b)) - Number(isTaskOverdue(a));
        if (overdueDifference !== 0) return overdueDifference;

        const priorityDifference =
          PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        if (priorityDifference !== 0) return priorityDifference;

        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
  }, [incidentFilter, tasks]);

  if (loading) {
    return (
      <DashboardLayout>
        <NOCSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative h-[100dvh] min-h-[640px] overflow-hidden bg-tunet-bg">
        <p id="noc-live-summary" className="sr-only" aria-live="polite">
          {activeTasks} tugas aktif, {overdueTasks} tugas terlambat, dan{" "}
          {incidentTasks.length} tugas dalam antrean saat ini.
        </p>

        <div
          className={cn(
            "grid h-full min-h-0 bg-tunet-border transition-all duration-300",
            layoutMode === "full"
              ? "grid-cols-1"
              : "grid-rows-[minmax(280px,48vh)_minmax(0,1fr)] md:grid-rows-1",
            layoutMode === "balanced" &&
              "md:grid-cols-[minmax(0,7fr)_minmax(340px,5fr)]",
            layoutMode === "map" &&
              "md:grid-cols-[minmax(0,9fr)_minmax(300px,3fr)]",
            layoutMode === "tasks" &&
              "md:grid-cols-[minmax(320px,4fr)_minmax(0,8fr)]"
          )}
        >
          <section className="relative min-h-0 overflow-hidden bg-[#0A0F1C]">
            <RadarMap
              height="100%"
              variant="flush"
              showRoles={["foc"]}
              incidentFilter={incidentFilter}
              layoutKey={`${layoutMode}-${incidentFilter}`}
              coordsClassName="bottom-4"
            />

            <div className="pointer-events-none absolute inset-x-0 top-0 z-[450] h-36 bg-gradient-to-b from-black/70 via-black/25 to-transparent" />

            <div className="absolute inset-x-3 top-3 z-[500] flex items-start justify-between gap-3">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-[#0A0F1C]/88 py-3 pl-12 pr-4 shadow-2xl backdrop-blur-xl md:pl-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tunet-signal opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-tunet-signal" />
                  </span>
                  <p className="truncate font-display text-sm font-semibold text-white">
                    {COPY.pages.noc.title}
                  </p>
                </div>
                <p className="mt-0.5 hidden text-[10px] text-slate-300 sm:block">
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>

              <div
                className="flex max-w-[70%] items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#0A0F1C]/88 p-1.5 shadow-2xl backdrop-blur-xl"
                role="group"
                aria-label="Mode tata letak pusat kendali"
              >
                {LAYOUT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = layoutMode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      title={option.label}
                      onClick={() => setLayoutMode(option.value)}
                      className={cn(
                        "flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tunet-signal",
                        selected
                          ? "bg-white text-slate-950"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden xl:inline">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="absolute left-3 top-24 z-[500] flex items-center gap-1 rounded-2xl border border-white/10 bg-[#0A0F1C]/88 p-1.5 shadow-2xl backdrop-blur-xl"
              role="group"
              aria-label="Filter insiden peta"
            >
              <SlidersGlyph />
              {FILTER_OPTIONS.map((option) => {
                const selected = incidentFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setIncidentFilter(option.value)}
                    className={cn(
                      "min-h-8 rounded-xl px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tunet-signal",
                      selected
                        ? "bg-tunet-signal text-slate-950"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="absolute bottom-4 right-3 z-[500] hidden items-center gap-2 rounded-xl border border-white/10 bg-[#0A0F1C]/88 px-3 py-2 text-[10px] text-slate-300 shadow-xl backdrop-blur-xl sm:flex">
              <Radio className="h-3.5 w-3.5 text-tunet-signal" />
              Posisi lapangan diperbarui langsung
            </div>
          </section>

          {layoutMode !== "full" && (
            <aside
              aria-label="Antrean insiden"
              aria-describedby="noc-live-summary"
              className="flex min-h-0 flex-col overflow-hidden bg-tunet-bg"
            >
              <div className="border-b border-tunet-border bg-tunet-surface px-4 py-4 md:px-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-base font-semibold text-tunet-text">
                      Antrean insiden
                    </p>
                    <p className="mt-0.5 text-xs text-tunet-text-muted">
                      Diurutkan berdasarkan urgensi dan tenggat
                    </p>
                  </div>
                  <span className="rounded-full bg-tunet-signal/15 px-2.5 py-1 font-mono text-xs text-tunet-signal">
                    {incidentTasks.length}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 divide-x divide-tunet-border rounded-xl border border-tunet-border bg-tunet-bg">
                  <Metric
                    icon={Activity}
                    label={COPY.pages.noc.active}
                    value={activeTasks}
                    tone="text-tunet-green"
                  />
                  <Metric
                    icon={AlertTriangle}
                    label={COPY.pages.noc.overdue}
                    value={overdueTasks}
                    tone="text-status-overdue"
                  />
                  <Metric
                    icon={CheckCircle}
                    label={COPY.pages.noc.completed}
                    value={completedTasks}
                    tone="text-status-done"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
                {incidentTasks.length === 0 ? (
                  <div className="flex h-full min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-tunet-border px-6 text-center">
                    <CheckCircle className="mb-3 h-6 w-6 text-status-done" />
                    <p className="text-sm font-medium text-tunet-text">
                      Tidak ada insiden pada filter ini
                    </p>
                    <p className="mt-1 text-xs text-tunet-text-muted">
                      Pilih filter lain untuk melihat antrean tugas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {incidentTasks.map((task) => {
                      const status = STATUS_CONFIG[task.status];
                      const timeRemaining = getTimeRemaining(task.deadline);
                      const overdue = isTaskOverdue(task);

                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => handleTaskClick(task)}
                          className={cn(
                            "group w-full overflow-hidden rounded-2xl border bg-tunet-surface text-left transition-all duration-200",
                            "hover:-translate-y-px hover:border-tunet-signal/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tunet-signal",
                            overdue
                              ? "border-status-overdue/50"
                              : "border-tunet-border"
                          )}
                        >
                          <div
                            className="h-0.5 w-full"
                            style={{ backgroundColor: overdue ? "#EF4444" : status.color }}
                          />
                          <div className="p-3.5">
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                  overdue
                                    ? "bg-status-overdue/15 text-status-overdue"
                                    : "bg-tunet-signal/10 text-tunet-signal"
                                )}
                              >
                                {overdue ? (
                                  <AlertTriangle className="h-4 w-4" />
                                ) : (
                                  <Activity className="h-4 w-4" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="line-clamp-2 text-sm font-medium leading-snug text-tunet-text">
                                    {task.title}
                                  </p>
                                  <span
                                    className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium"
                                    style={{
                                      color: status.color,
                                      backgroundColor: `${status.color}18`,
                                    }}
                                  >
                                    {status.label}
                                  </span>
                                </div>

                                <div className="mt-2 flex items-center gap-1.5 text-xs text-tunet-text-muted">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{task.location_name}</span>
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-3 border-t border-tunet-border/70 pt-2.5">
                                  <span className="text-[10px] uppercase tracking-wider text-tunet-text-muted">
                                    {task.priority}
                                  </span>
                                  <span
                                    className={cn(
                                      "flex items-center gap-1 font-mono text-[11px]",
                                      overdue
                                        ? "text-status-overdue"
                                        : timeRemaining?.isUrgent
                                        ? "text-tunet-ember"
                                        : "text-tunet-text-muted"
                                    )}
                                  >
                                    <Clock className="h-3 w-3" />
                                    {timeRemaining?.short ?? "Tanpa tenggat"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      <TaskDetail
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={handleStatusChange}
        canChangeStatus={true}
        canDelete={true}
        onDeleted={handleTaskDeleted}
        canEdit={true}
        onUpdated={handleTaskUpdated}
      />
    </DashboardLayout>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", tone)} />
      <div className="min-w-0">
        <p className={cn("font-mono text-sm font-semibold tabular-nums", tone)}>{value}</p>
        <p className="truncate text-[9px] uppercase tracking-wider text-tunet-text-muted">
          {label}
        </p>
      </div>
    </div>
  );
}

function SlidersGlyph() {
  return (
    <span className="flex h-8 w-8 items-center justify-center text-slate-400" aria-hidden="true">
      <span className="relative h-3.5 w-3.5">
        <span className="absolute left-0 top-0.5 h-px w-full bg-current" />
        <span className="absolute left-1 top-0 h-1 w-1 rounded-full bg-current" />
        <span className="absolute bottom-0.5 left-0 h-px w-full bg-current" />
        <span className="absolute bottom-0 right-1 h-1 w-1 rounded-full bg-current" />
      </span>
    </span>
  );
}

function NOCSkeleton() {
  return (
    <div className="grid h-[100dvh] grid-rows-[48vh_1fr] bg-tunet-bg md:grid-cols-[7fr_5fr] md:grid-rows-1">
      <Skeleton className="h-full w-full rounded-none" />
      <div className="space-y-4 border-l border-tunet-border p-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-full rounded-xl" />
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

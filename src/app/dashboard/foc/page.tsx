"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SignalTower } from "@/components/icons/brand-icons";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDetail } from "@/components/tasks/task-detail";
import { fetchTasks, upsertLocation, updateTaskStatus } from "@/lib/db";
import { PRIORITY_CONFIG, STATUS_CONFIG, Task, TaskStatus, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  MapPin,
  CheckCircle,
  RefreshCw,
  Navigation,
  Send,
  Timer,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { COPY } from "@/lib/copy";
import { useTelegramDispatch } from "@/hooks/use-telegram-dispatch";
import { useIncrementalTasks } from "@/hooks/use-incremental-tasks";
import { useHeartbeat } from "@/hooks/use-heartbeat";

const LOCATION_INTERVAL = 2 * 60 * 1000;
const TELEGRAM_BOT_USERNAME = "TuTrackTrackingBot";
const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  assigned: "in_progress",
  in_progress: "review",
  review: "done",
  done: null,
};
const NEXT_STATUS_LABEL: Record<TaskStatus, string | null> = {
  assigned: COPY.taskCard.start,
  in_progress: COPY.taskCard.submitReview,
  review: COPY.taskCard.complete,
  done: null,
};
const FOC_TASK_ORDER: Record<TaskStatus, number> = {
  in_progress: 0,
  assigned: 1,
  review: 2,
  done: 3,
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function compareFieldTasks(a: Task, b: Task): number {
  const statusDelta = FOC_TASK_ORDER[a.status] - FOC_TASK_ORDER[b.status];
  if (statusDelta !== 0) return statusDelta;
  if (!a.deadline && !b.deadline) return 0;
  if (!a.deadline) return 1;
  if (!b.deadline) return -1;
  return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
}

function formatTaskDeadline(deadline?: string): string {
  if (!deadline) return "Tanpa tenggat";
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "Tenggat belum tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function FOCDashboardPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <FOCDashboardSkeleton />
        </DashboardLayout>
      }
    >
      <FOCDashboard />
    </Suspense>
  );
}

function FOCDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("tutrack-location-enabled") === "true";
  });
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [countdownMs, setCountdownMs] = useState(LOCATION_INTERVAL);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useTelegramDispatch(currentUser?.id);

  useHeartbeat({ userId: currentUser?.id });

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("tutrack-user") : null;
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    async function load() {
      const t = await fetchTasks();
      setTasks(t);
      setLoading(false);
    }
    load();
  }, []);

  useIncrementalTasks(setTasks);

  // Auto-open task from ?task=... query param
  useEffect(() => {
    const taskId = searchParams.get("task");
    if (taskId && tasks.length > 0) {
      const target = tasks.find((t) => t.id === taskId);
      if (target) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedTask(target);
        setDetailOpen(true);
        const params = new URLSearchParams(Array.from(searchParams.entries()).filter(([k]) => k !== "task"));
        const qs = params.toString();
        router.replace(pathname + (qs ? `?${qs}` : ""), { scroll: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, searchParams]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const userId = currentUser?.id;
  const telegramUsername = currentUser?.telegram_id;

  const sendLocationToServer = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    return new Promise<boolean>((resolve) => {
      if (!("geolocation" in navigator)) {
        toast.error(COPY.toasts.geolocationUnsupported);
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(loc);
          setLastUpdated(new Date());

          await upsertLocation(userId, loc.lat, loc.lng, position.coords.accuracy);
          resolve(true);
        },
        (error) => {
          console.error("GPS error:", error);
          resolve(error.code === GeolocationPositionError.TIMEOUT);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [userId]);

  // Restore location sharing interval on mount if previously enabled
  useEffect(() => {
    if (locationEnabled && userId) {
      intervalRef.current = setInterval(async () => {
        await sendLocationToServer();
      }, LOCATION_INTERVAL);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Countdown timer for next auto-update
  useEffect(() => {
    if (!locationEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdownMs(LOCATION_INTERVAL);
      return;
    }
    const tick = () => {
      if (!lastUpdated) {
        setCountdownMs(LOCATION_INTERVAL);
        return;
      }
      const elapsed = Date.now() - lastUpdated.getTime();
      const remaining = Math.max(0, LOCATION_INTERVAL - elapsed);
      setCountdownMs(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [locationEnabled, lastUpdated]);

  const myTasks = useMemo(
    () => tasks.filter((task) => task.assigned_to === userId),
    [tasks, userId]
  );
  const pendingTasks = useMemo(
    () => myTasks.filter((task) => task.status !== "done").sort(compareFieldTasks),
    [myTasks]
  );
  const completedTasks = useMemo(
    () =>
      myTasks
        .filter((task) => task.status === "done")
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ),
    [myTasks]
  );
  const activeTask = pendingTasks[0] ?? null;
  const nextTask = pendingTasks[1] ?? null;
  const timelineTasks = [...pendingTasks.slice(2), ...completedTasks];

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!userId) return;
    const previous = tasks.find((t) => t.id === taskId);
    if (previous) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
        )
      );
    }
    const success = await updateTaskStatus(taskId, newStatus, userId);
    if (!success) {
      if (previous) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? previous : t)));
      }
      toast.error(COPY.toasts.taskStatusUpdateFailed);
    } else {
      toast.success(COPY.toasts.taskStatusUpdated);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleManualUpdate = async () => {
    setUpdatingLocation(true);
    const ok = await sendLocationToServer();
    if (ok) {
      toast.success(COPY.toasts.locationUpdated);
    } else {
      toast.error(COPY.toasts.geolocationDenied);
    }
    setUpdatingLocation(false);
  };

  const toggleLocation = async () => {
    if (locationEnabled) {
      setLocationEnabled(false);
      localStorage.setItem("tutrack-location-enabled", "false");
      setCurrentLocation(null);
      setLastUpdated(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      toast.info(COPY.toasts.locationSharingDisabled);
    } else {
      if (!("geolocation" in navigator)) {
        toast.error(COPY.toasts.geolocationUnsupported);
        return;
      }

      toast.info(COPY.toasts.gettingLocation);
      const ok = await sendLocationToServer();
      if (!ok) {
        toast.error(COPY.toasts.geolocationDenied);
        return;
      }
      setLocationEnabled(true);
      localStorage.setItem("tutrack-location-enabled", "true");
      toast.success(COPY.toasts.locationSharingEnabled);

      intervalRef.current = setInterval(async () => {
        await sendLocationToServer();
      }, LOCATION_INTERVAL);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <FOCDashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg pb-6">
        <div className="min-h-16 border-b border-tunet-border flex items-center justify-between gap-3 px-4 py-3 md:px-6 pl-16 md:pl-6">
          <div>
            <h1 className="font-display text-xl font-semibold text-tunet-text">
              {COPY.pages.foc.title}
            </h1>
            <p className="text-sm text-tunet-text-muted">{COPY.pages.foc.subtitle}</p>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-tunet-green/60 bg-tunet-green/10 text-tunet-green"
          >
            {COPY.pages.foc.pending(pendingTasks.length)}
          </Badge>
        </div>

        <section
          aria-labelledby="location-sharing-title"
          className="sticky top-0 z-20 border-b border-tunet-border bg-tunet-bg/95 px-4 py-3 backdrop-blur-md md:px-6"
        >
          <div className="mx-auto max-w-3xl">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                    locationEnabled
                      ? "bg-tunet-green/15 text-tunet-green"
                      : "bg-tunet-surface text-tunet-text-muted"
                  }`}
                >
                  <SignalTower
                    aria-hidden="true"
                    className={`size-5 ${
                      locationEnabled
                        ? "motion-safe:animate-pulse motion-reduce:animate-none"
                        : ""
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <h2 id="location-sharing-title" className="text-sm font-semibold text-tunet-text">
                    Pelacakan lokasi
                  </h2>
                  <p className="truncate text-sm text-tunet-text-muted" role="status">
                    {locationEnabled
                      ? lastUpdated
                        ? `Aktif, diperbarui ${lastUpdated.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "Aktif, mengambil posisi terbaru"
                      : "Tidak aktif"}
                  </p>
                </div>
              </div>

              <Button
                onClick={toggleLocation}
                aria-pressed={locationEnabled}
                variant={locationEnabled ? "outline" : "default"}
                className={
                  locationEnabled
                    ? "min-h-11 min-w-24 border-tunet-green/60 text-tunet-green hover:bg-tunet-green/10"
                    : "min-h-11 min-w-24 bg-emerald-700 text-white hover:bg-emerald-800"
                }
              >
                {locationEnabled ? "Matikan" : "Aktifkan"}
              </Button>
            </div>

            {locationEnabled && (
              <div className="mt-3 grid gap-2 border-t border-tunet-border pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="grid min-w-0 grid-cols-2 gap-2 text-sm text-tunet-text-muted">
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin aria-hidden="true" className="size-4 shrink-0" />
                    <span className="truncate font-mono text-xs">
                      {currentLocation
                        ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`
                        : "Mengambil lokasi"}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Timer aria-hidden="true" className="size-4 shrink-0" />
                    <span className="font-mono text-xs">
                      Berikutnya {formatCountdown(countdownMs)}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleManualUpdate}
                  disabled={updatingLocation}
                  variant="outline"
                  className="min-h-11 w-full border-tunet-border text-tunet-text hover:bg-tunet-surface-hover sm:w-auto"
                >
                  {updatingLocation ? (
                    <>
                      <RefreshCw
                        aria-hidden="true"
                        className="mr-2 size-4 motion-safe:animate-spin motion-reduce:animate-none"
                      />
                      Memperbarui
                    </>
                  ) : (
                    <>
                      <Navigation aria-hidden="true" className="mr-2 size-4" />
                      Perbarui sekarang
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-6">
          {activeTask && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
              <FOCFocusTask
                heading={
                  activeTask.status === "in_progress"
                    ? "Sedang dikerjakan"
                    : "Tugas utama"
                }
                description="Prioritas pertama untuk diselesaikan di lapangan."
                task={activeTask}
                onOpen={handleTaskClick}
                onAdvance={handleStatusChange}
                prominent
              />
              {nextTask && (
                <FOCFocusTask
                  heading="Berikutnya"
                  description="Siap setelah tugas utama bergerak ke tahap selanjutnya."
                  task={nextTask}
                  onOpen={handleTaskClick}
                  onAdvance={handleStatusChange}
                />
              )}
            </div>
          )}

          {myTasks.length === 0 && (
            <div className="py-10">
              <EmptyState
                icon={CheckCircle}
                title={COPY.empty.noActiveTasks.title}
                description={COPY.empty.noActiveTasks.description}
              />
            </div>
          )}

          {timelineTasks.length > 0 && (
            <section aria-labelledby="task-timeline-title">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2
                    id="task-timeline-title"
                    className="font-display text-lg font-semibold text-tunet-text"
                  >
                    Alur kerja hari ini
                  </h2>
                  <p className="text-sm text-tunet-text-muted">
                    Sisa antrean dan tugas yang sudah selesai.
                  </p>
                </div>
                <span className="shrink-0 text-sm text-tunet-text-muted">
                  {timelineTasks.length} tugas
                </span>
              </div>
              <ol className="space-y-3">
                {timelineTasks.map((task, index) => (
                  <FOCTimelineTask
                    key={task.id}
                    task={task}
                    isLast={index === timelineTasks.length - 1}
                    onOpen={handleTaskClick}
                    onAdvance={handleStatusChange}
                  />
                ))}
              </ol>
            </section>
          )}

          <details className="group rounded-2xl border border-tunet-border bg-tunet-surface">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tunet-green/70 [&::-webkit-details-marker]:hidden">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                  telegramUsername
                    ? "bg-tunet-green/15 text-tunet-green"
                    : "bg-tunet-surface-hover text-tunet-text-muted"
                }`}
              >
                <Send aria-hidden="true" className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-tunet-text">Diagnostik Telegram</p>
                <p className="truncate text-sm text-tunet-text-muted">
                  {telegramUsername
                    ? `Terhubung sebagai ${telegramUsername}`
                    : "Bot belum terhubung"}
                </p>
              </div>
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-tunet-text-muted transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180"
              />
            </summary>
            <div className="space-y-3 border-t border-tunet-border px-4 py-4">
              <p className="text-sm leading-relaxed text-tunet-text-muted">
                Bagikan lokasi melalui bot ketika browser tidak dapat tetap terbuka. Di
                Telegram, pilih lampiran, lalu Lokasi, dan kirimkan ke bot.
              </p>
              {telegramUsername ? (
                <a
                  href={`https://t.me/${TELEGRAM_BOT_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-tunet-green/60 px-4 text-sm font-medium text-tunet-green transition-colors hover:bg-tunet-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tunet-green/70 motion-reduce:transition-none sm:w-auto"
                >
                  <Send aria-hidden="true" className="mr-2 size-4" />
                  Buka bot Telegram
                </a>
              ) : (
                <p className="text-sm text-tunet-text">
                  Hubungi NOC bila akun Telegram belum terdaftar.
                </p>
              )}
            </div>
          </details>
        </div>

        <TaskDetail
          task={selectedTask}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onStatusChange={handleStatusChange}
          canChangeStatus={true}
        />
      </div>
    </DashboardLayout>
  );
}

interface FOCFocusTaskProps {
  heading: string;
  description: string;
  task: Task;
  onOpen: (task: Task) => void;
  onAdvance: (taskId: string, status: TaskStatus) => void;
  prominent?: boolean;
}

function FOCFocusTask({
  heading,
  description,
  task,
  onOpen,
  onAdvance,
  prominent = false,
}: FOCFocusTaskProps) {
  const nextStatus = NEXT_STATUS[task.status];
  const actionLabel = NEXT_STATUS_LABEL[task.status];

  return (
    <section aria-labelledby={`focus-task-${task.id}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2
            id={`focus-task-${task.id}`}
            className={`font-display font-semibold text-tunet-text ${
              prominent ? "text-xl" : "text-lg"
            }`}
          >
            {heading}
          </h2>
          <p className="mt-1 text-sm text-tunet-text-muted">{description}</p>
        </div>
        <Badge
          variant="outline"
          className="shrink-0"
          style={{
            borderColor: `${STATUS_CONFIG[task.status].color}66`,
            backgroundColor: `${STATUS_CONFIG[task.status].color}1A`,
            color: STATUS_CONFIG[task.status].color,
          }}
        >
          {STATUS_CONFIG[task.status].label}
        </Badge>
      </div>

      <TaskCard task={task} onClick={onOpen} />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpen(task)}
          className="min-h-12 border-tunet-border text-tunet-text hover:bg-tunet-surface-hover"
        >
          Detail tugas
          <ArrowUpRight aria-hidden="true" className="ml-2 size-4" />
        </Button>
        {nextStatus && actionLabel && (
          <Button
            type="button"
            onClick={() => onAdvance(task.id, nextStatus)}
            aria-label={`${actionLabel}: ${task.title}`}
            className="min-h-12 bg-emerald-700 text-white hover:bg-emerald-800"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </section>
  );
}

interface FOCTimelineTaskProps {
  task: Task;
  isLast: boolean;
  onOpen: (task: Task) => void;
  onAdvance: (taskId: string, status: TaskStatus) => void;
}

function FOCTimelineTask({
  task,
  isLast,
  onOpen,
  onAdvance,
}: FOCTimelineTaskProps) {
  const nextStatus = NEXT_STATUS[task.status];
  const actionLabel = NEXT_STATUS_LABEL[task.status];
  const status = STATUS_CONFIG[task.status];
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <li className="relative pl-7">
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute bottom-[-0.75rem] left-[0.4375rem] top-5 w-px bg-tunet-border"
        />
      )}
      <span
        aria-hidden="true"
        className="absolute left-0 top-5 size-3.5 rounded-full border-[3px] border-tunet-bg"
        style={{ backgroundColor: status.color }}
      />

      <div className="rounded-xl border border-tunet-border bg-tunet-surface p-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <button
            type="button"
            onClick={() => onOpen(task)}
            aria-label={`Buka detail ${task.title}`}
            className="min-h-14 min-w-0 rounded-lg px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tunet-green/70"
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-tunet-text">{task.title}</span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${status.color}1A`,
                  color: status.color,
                }}
              >
                {status.label}
              </span>
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tunet-text-muted">
              <span className="flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-3.5" />
                {task.location_name}
              </span>
              <span>{formatTaskDeadline(task.deadline)}</span>
              <span>Prioritas {priority.label}</span>
            </span>
          </button>

          {nextStatus && actionLabel && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onAdvance(task.id, nextStatus)}
              aria-label={`${actionLabel}: ${task.title}`}
              className="min-h-11 w-full border-tunet-green/60 text-tunet-green hover:bg-tunet-green/10 sm:w-auto"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

function FOCDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-tunet-bg pb-6" role="status" aria-label="Memuat tugas lapangan">
      <div className="min-h-16 border-b border-tunet-border flex items-center justify-between px-4 py-3 md:px-6 pl-16 md:pl-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-28 motion-reduce:animate-none" />
          <Skeleton className="h-4 w-40 motion-reduce:animate-none" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full motion-reduce:animate-none" />
      </div>

      <div className="border-b border-tunet-border px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Skeleton className="size-11 rounded-xl motion-reduce:animate-none" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-48 motion-reduce:animate-none" />
          </div>
          <Skeleton className="h-11 w-24 rounded-lg motion-reduce:animate-none" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-40 motion-reduce:animate-none" />
          <div className="rounded-xl border border-tunet-border bg-tunet-surface p-4 space-y-3">
            <Skeleton className="h-4 w-2/3 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-1/2 motion-reduce:animate-none" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full motion-reduce:animate-none" />
              <Skeleton className="h-5 w-16 rounded-full motion-reduce:animate-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 rounded-lg motion-reduce:animate-none" />
            <Skeleton className="h-12 rounded-lg motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

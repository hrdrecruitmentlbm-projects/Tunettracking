"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDetail } from "@/components/tasks/task-detail";
import { fetchTasks, upsertLocation, updateTaskStatus } from "@/lib/db";
import { Task, TaskStatus, User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  MapPin,
  Radio,
  RadioOff,
  CheckCircle,
  RefreshCw,
  Navigation,
  Send,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { COPY } from "@/lib/copy";
import { useTelegramDispatch } from "@/hooks/use-telegram-dispatch";
import { useIncrementalTasks } from "@/hooks/use-incremental-tasks";

const LOCATION_INTERVAL = 2 * 60 * 1000;
const TELEGRAM_BOT_USERNAME = "TunetOpsTrackingBot";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function FOCDashboardPage() {
  return (
    <Suspense fallback={null}>
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
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [countdownMs, setCountdownMs] = useState(LOCATION_INTERVAL);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useTelegramDispatch(currentUser?.id);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("tunetops-user") : null;
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Countdown timer for next auto-update
  useEffect(() => {
    if (!locationEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdownMs(LOCATION_INTERVAL);
      return;
    }
    const tick = () => {
      if (!lastUpdated) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCountdownMs(LOCATION_INTERVAL);
        return;
      }
      const elapsed = Date.now() - lastUpdated.getTime();
      const remaining = Math.max(0, LOCATION_INTERVAL - elapsed);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdownMs(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [locationEnabled, lastUpdated]);

  const userId = currentUser?.id;
  const telegramUsername = currentUser?.telegram_id;

  const myTasks = tasks.filter((t) => t.assigned_to === userId);
  const pendingTasks = myTasks.filter((t) => t.status !== "done");
  const completedTasks = myTasks.filter((t) => t.status === "done");

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
      <div className="min-h-screen bg-tunet-bg pb-20 md:pb-0">
        <div className="h-16 border-b border-tunet-border flex items-center justify-between px-4 md:px-6 pl-16 md:pl-6">
          <div>
            <h1 className="text-lg font-semibold text-tunet-text">{COPY.pages.foc.title}</h1>
            <p className="text-xs text-tunet-text-muted">{COPY.pages.foc.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-tunet-green border-tunet-green">
              {COPY.pages.foc.pending(pendingTasks.length)}
            </Badge>
          </div>
        </div>

        {/* Persistent Location Sharing Card (always visible, no tab) */}
        <div className="p-4 md:p-6 border-b border-tunet-border">
          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      locationEnabled
                        ? "bg-tunet-green/20 text-tunet-green"
                        : "bg-tunet-surface-hover text-tunet-text-muted"
                    }`}
                  >
                    {locationEnabled ? (
                      <Radio className="w-6 h-6 animate-pulse" />
                    ) : (
                      <RadioOff className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-tunet-text">Bagikan Lokasi Saya</p>
                    <p className="text-xs text-tunet-text-muted">
                      {locationEnabled
                        ? "Aktif • Pembaruan otomatis setiap 2 menit"
                        : "Aktifkan agar NOC dapat melacak posisi Anda"}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={toggleLocation}
                  variant={locationEnabled ? "outline" : "default"}
                  size="lg"
                  className={
                    locationEnabled
                      ? "border-tunet-green text-tunet-green hover:bg-tunet-green/10"
                      : "bg-tunet-green hover:bg-tunet-green-dark text-white"
                  }
                >
                  {locationEnabled ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </div>

              {locationEnabled && (
                <div className="pt-3 border-t border-tunet-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-tunet-text-muted">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="font-mono">
                        {currentLocation
                          ? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`
                          : "Mengambil lokasi..."}
                      </span>
                    </div>
                    {lastUpdated && (
                      <div className="flex items-center gap-1.5 text-tunet-text-muted">
                        <Timer className="w-3.5 h-3.5" />
                        <span className="font-mono">{formatCountdown(countdownMs)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-tunet-text-muted">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Terakhir diperbarui: {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}</span>
                  </div>
                  <Button
                    onClick={handleManualUpdate}
                    disabled={updatingLocation}
                    variant="outline"
                    size="sm"
                    className="w-full border-tunet-border text-tunet-text hover:bg-tunet-surface-hover"
                  >
                    {updatingLocation ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Memperbarui...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5 mr-2" />
                        Perbarui Lokasi Saya Sekarang
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Telegram integration - compact section below */}
              <div className="pt-3 border-t border-tunet-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        telegramUsername
                          ? "bg-tunet-green/20 text-tunet-green"
                          : "bg-tunet-surface-hover text-tunet-text-muted"
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-tunet-text">Bot Telegram</p>
                      <p className="text-[10px] text-tunet-text-muted truncate">
                        {telegramUsername
                          ? `Terhubung: ${telegramUsername}`
                          : "Belum terhubung"}
                      </p>
                    </div>
                  </div>
                  {telegramUsername && (
                    <a
                      href={`https://t.me/${TELEGRAM_BOT_USERNAME}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-2 py-1 text-xs rounded-md bg-tunet-green/20 text-tunet-green hover:bg-tunet-green/30"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Buka
                    </a>
                  )}
                </div>
                {telegramUsername && (
                  <p className="text-[10px] text-tunet-text-muted mt-2">
                    📍 Tap 📎 → Lokasi → Bagikan di bot untuk share lokasi via Telegram (bahkan saat browser ditutup)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {pendingTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-tunet-text">{COPY.pages.foc.activeTasks}</h2>
                <span className="text-xs text-tunet-text-muted">
                  {COPY.pages.foc.taskCountOne(pendingTasks.length)}
                </span>
              </div>
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onClick={handleTaskClick}
                  />
                ))}
              </div>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-status-done" />
                <h2 className="text-sm font-medium text-tunet-text-muted">{COPY.pages.foc.completed}</h2>
                <span className="text-xs text-tunet-text-muted">({completedTasks.length})</span>
              </div>
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <div key={task.id} className="relative">
                    <div className="absolute -left-1 top-3 bottom-3 w-0.5 bg-status-done/40 rounded-full" />
                    <TaskCard
                      task={task}
                      onClick={handleTaskClick}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {myTasks.length === 0 && (
            <div className="py-8">
              <EmptyState
                icon={CheckCircle}
                title={COPY.empty.noActiveTasks.title}
                description={COPY.empty.noActiveTasks.description}
              />
            </div>
          )}
        </div>

        {currentUser && <BottomNav role={currentUser.role} />}

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

function FOCDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-tunet-bg pb-20 md:pb-0">
      <div className="h-16 border-b border-tunet-border flex items-center justify-between px-4 md:px-6 pl-16 md:pl-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <div className="p-4 md:p-6 border-b border-tunet-border">
        <div className="rounded-xl border border-tunet-border bg-tunet-surface p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-tunet-border bg-tunet-surface p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

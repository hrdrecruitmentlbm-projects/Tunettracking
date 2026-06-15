"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDetail } from "@/components/tasks/task-detail";
import { fetchTasks, upsertLocation, updateTaskStatus } from "@/lib/db";
import { Task, TaskStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
} from "lucide-react";
import { toast } from "sonner";
import { COPY } from "@/lib/copy";
import { useTelegramDispatch } from "@/hooks/use-telegram-dispatch";

const LOCATION_INTERVAL = 2 * 60 * 1000;
const TELEGRAM_BOT_USERNAME = "TunetOpsTrackingBot";

export default function FOCDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("tunetops-user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const userId = currentUser?.id;
  const telegramUsername = currentUser?.telegram_id;

  useTelegramDispatch(userId);

  useEffect(() => {
    async function load() {
      const t = await fetchTasks();
      setTasks(t);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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
      <div className="min-h-screen bg-tunet-bg">
        <div className="h-16 border-b border-tunet-border flex items-center justify-between px-4">
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

        <div className="p-4 border-b border-tunet-border">
          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4">
              <Tabs defaultValue="location">
                <TabsList>
                  <TabsTrigger value="location">
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    Lokasi
                  </TabsTrigger>
                  <TabsTrigger value="telegram">
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Telegram
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="location" className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          locationEnabled
                            ? "bg-tunet-green/20 text-tunet-green"
                            : "bg-tunet-surface-hover text-tunet-text-muted"
                        }`}
                      >
                        {locationEnabled ? (
                          <Radio className="w-5 h-5 animate-pulse" />
                        ) : (
                          <RadioOff className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-tunet-text">Bagikan Lokasi Saya</p>
                        <p className="text-xs text-tunet-text-muted">
                          {locationEnabled
                            ? "Pembaruan setiap 2 menit. NOC dapat melihat posisi Anda."
                            : "Aktifkan agar NOC dapat melacak posisi Anda"}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={toggleLocation}
                      variant={locationEnabled ? "outline" : "default"}
                      className={
                        locationEnabled
                          ? "border-tunet-green text-tunet-green hover:bg-tunet-green/10"
                          : "bg-tunet-green hover:bg-tunet-green-dark text-white"
                      }
                    >
                      {locationEnabled ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </div>

                  {locationEnabled && currentLocation && (
                    <div className="pt-3 border-t border-tunet-border space-y-2">
                      <div className="flex items-center gap-2 text-xs text-tunet-text-muted">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="font-mono">
                          {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                        </span>
                      </div>
                      {lastUpdated && (
                        <div className="flex items-center gap-2 text-xs text-tunet-text-muted">
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Terakhir diperbarui: {lastUpdated.toLocaleTimeString()}</span>
                        </div>
                      )}
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
                </TabsContent>

                <TabsContent value="telegram" className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          telegramUsername
                            ? "bg-tunet-green/20 text-tunet-green"
                            : "bg-tunet-surface-hover text-tunet-text-muted"
                        }`}
                      >
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-tunet-text">Bot Telegram</p>
                        <p className="text-xs text-tunet-text-muted">
                          {telegramUsername
                            ? `Terhubung: ${telegramUsername}`
                            : "Belum terhubung. Minta admin untuk mengatur nama pengguna Telegram Anda."}
                        </p>
                      </div>
                    </div>
                    {telegramUsername ? (
                      <a
                        href={`https://t.me/${TELEGRAM_BOT_USERNAME}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-3 py-2 text-sm rounded-md bg-tunet-green/20 text-tunet-green hover:bg-tunet-green/30"
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        Buka Bot
                      </a>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-tunet-surface text-tunet-text-muted border border-tunet-border"
                      >
                        {COPY.statusBadge.notSet}
                      </Badge>
                    )}
                  </div>

                  {telegramUsername && (
                    <div className="pt-3 border-t border-tunet-border">
                      <p className="text-xs text-tunet-text-muted mb-2">
                        📍 Bagikan lokasi melalui Telegram — berfungsi bahkan saat browser ditutup
                      </p>
                      <ol className="text-xs text-tunet-text-muted space-y-1 list-decimal list-inside">
                        <li>Buka bot dan kirim /start</li>
                        <li>Ketuk 📎 → Lokasi → Bagikan</li>
                        <li>Marker Anda muncul di peta radar</li>
                      </ol>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="p-4 space-y-4">
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
              <h2 className="text-sm font-medium text-tunet-text-muted mb-3">{COPY.pages.foc.completed}</h2>
              <div className="space-y-3 opacity-60">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={handleTaskClick}
                  />
                ))}
              </div>
            </div>
          )}

          {myTasks.length === 0 && (
            <div className="py-8">
              <EmptyState
                icon={CheckCircle}
                title={COPY.empty.allCaughtUp.title}
                description={COPY.empty.allCaughtUp.description}
              />
            </div>
          )}
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

function FOCDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-tunet-bg">
      <div className="h-16 border-b border-tunet-border flex items-center justify-between px-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <div className="p-4 border-b border-tunet-border">
        <div className="rounded-xl border border-tunet-border bg-tunet-surface p-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
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

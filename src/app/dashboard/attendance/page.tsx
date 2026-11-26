"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Link from "next/link";
import { AttendanceButtons } from "@/components/attendance/attendance-buttons";
import { AttendanceStatsCards } from "@/components/attendance/attendance-stats";
import { AttendanceHistory } from "@/components/attendance/attendance-history";
import { TodoFormDialog } from "@/components/attendance/todo-form-dialog";
import { TodoList } from "@/components/attendance/todo-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { upsertLocation } from "@/lib/db";
import { Attendance, AttendanceReminderSettings, AttendanceStats, AttendanceTodo, GroupedDay } from "@/types";
import { AlarmClock, Clock, MapPin, Navigation, X } from "lucide-react";
import { toast } from "sonner";

interface AttendancePayload {
  today: Attendance[];
  history: GroupedDay[];
  stats: AttendanceStats;
}

export default function AttendancePage() {
  const [data, setData] = useState<AttendancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [schedule, setSchedule] = useState<AttendanceReminderSettings | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fieldUserId, setFieldUserId] = useState<string | null>(null);
  const [showGpsBanner, setShowGpsBanner] = useState(false);
  const [activatingGps, setActivatingGps] = useState(false);

  const load = async (showSpinner: boolean = true) => {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const [res, schedRes] = await Promise.all([
        fetch("/api/attendance", { cache: "no-store" }),
        fetch("/api/attendance/reminder-settings", { cache: "no-store" }),
      ]);
      if (res.ok) {
        const json = (await res.json()) as AttendancePayload;
        setData(json);
      }
      if (schedRes.ok) {
        const schedJson = (await schedRes.json()) as {
          settings: AttendanceReminderSettings;
        };
        setSchedule(schedJson.settings);
      }
    } catch (err) {
      console.error("Failed to load attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function checkInitial() {
      try {
        const raw = localStorage.getItem("tutrack-user");
        if (raw) {
          const parsed = JSON.parse(raw) as { id?: string; role?: string };
          if (parsed.role === "admin" && !cancelled) {
            setIsAdmin(true);
          }
          if (
            (parsed.role === "foc" || parsed.role === "marketing") &&
            parsed.id
          ) {
            if (!cancelled) setFieldUserId(parsed.id);
            const promptSeen =
              localStorage.getItem("tutrack-gps-prompt-seen") === "true";
            const alreadyEnabled =
              localStorage.getItem("tutrack-location-enabled") === "true";

            if (!promptSeen && !alreadyEnabled && "geolocation" in navigator) {
              let permState: PermissionState | null = null;
              if ("permissions" in navigator && navigator.permissions?.query) {
                try {
                  const perm = await navigator.permissions.query({
                    name: "geolocation",
                  });
                  permState = perm.state;
                } catch {
                  // Permissions API unavailable
                }
              }
              if (!cancelled && permState !== "granted") {
                setShowGpsBanner(true);
              } else if (permState === "granted") {
                localStorage.setItem("tutrack-gps-prompt-seen", "true");
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }

    async function loadInitial() {
      try {
        const [res, schedRes] = await Promise.all([
          fetch("/api/attendance", { cache: "no-store" }),
          fetch("/api/attendance/reminder-settings", { cache: "no-store" }),
        ]);
        if (!cancelled && res.ok) {
          const json = (await res.json()) as AttendancePayload;
          setData(json);
        }
        if (!cancelled && schedRes.ok) {
          const schedJson = (await schedRes.json()) as {
            settings: AttendanceReminderSettings;
          };
          setSchedule(schedJson.settings);
        }
      } catch (err) {
        console.error("Failed to load attendance:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void checkInitial();
    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasBerangkat = (data?.today ?? []).some((t) => t.type === "berangkat");

  const handleRecorded = (record: Attendance) => {
    setData((prev) => {
      if (!prev) return prev;
      const newToday = [...prev.today.filter((t) => t.type !== record.type), record];
      load();
      return { ...prev, today: newToday };
    });
  };

  const handleBerangkatClick = () => {
    setTodoDialogOpen(true);
  };

  const handleTodoSubmit = async (todos: string[], photo: File | null) => {
    setTodoDialogOpen(false);

    let lat: number | null = null;
    let lng: number | null = null;

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            maximumAge: 60_000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        toast.message(COPY.attendance.locationDenied);
      }
    }

    try {
      // Build FormData for photo upload
      const formData = new FormData();
      formData.append("photo", photo!);
      formData.append(
        "payload",
        JSON.stringify({ type: "berangkat", location_lat: lat, location_lng: lng, todos })
      );

      const res = await fetch("/api/attendance", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 409) {
          toast.error(COPY.attendance.duplicate);
        } else {
          toast.error(body.error || COPY.attendance.failedRecord);
        }
        return;
      }

      const record = (await res.json()) as Attendance;
      handleRecorded(record);
      if (lat != null && lng != null && record.user_id) {
        void upsertLocation(record.user_id, lat, lng, undefined, "web_app");
        localStorage.setItem("tutrack-location-enabled", "true");
        localStorage.setItem("tutrack-gps-prompt-seen", "true");
        sessionStorage.removeItem("tutrack-location-paused");
        setShowGpsBanner(false);
        window.dispatchEvent(
          new CustomEvent("tutrack-location-control", {
            detail: { action: "start" },
          })
        );
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tutrack-attendance-updated"));
      }
      if (lat != null && lng != null) {
        toast.success(COPY.attendance.locationSaved(lat, lng));
      }
      toast.success(`${COPY.attendance.berangkatLabel} ${COPY.attendance.recorded}`);
    } catch (err) {
      console.error("Attendance record error:", err);
      toast.error(COPY.attendance.failedRecord);
    }
  };

  const handleEnableGpsOnce = () => {
    if (!("geolocation" in navigator)) {
      toast.error(COPY.toasts.geolocationUnsupported);
      return;
    }
    setActivatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (fieldUserId) {
          await upsertLocation(
            fieldUserId,
            latitude,
            longitude,
            accuracy,
            "web_app"
          );
        }
        localStorage.setItem("tutrack-location-enabled", "true");
        localStorage.setItem("tutrack-gps-prompt-seen", "true");
        sessionStorage.removeItem("tutrack-location-paused");
        window.dispatchEvent(
          new CustomEvent("tutrack-location-control", {
            detail: { action: "start" },
          })
        );
        setShowGpsBanner(false);
        setActivatingGps(false);
        toast.success("GPS aktif. Posisi akan terlacak otomatis saat aplikasi dibuka.");
      },
      () => {
        setActivatingGps(false);
        toast.error(COPY.toasts.geolocationDenied);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
    );
  };

  const handleDismissGpsBanner = () => {
    localStorage.setItem("tutrack-gps-prompt-seen", "true");
    setShowGpsBanner(false);
  };

  const todayTodos: AttendanceTodo[] =
    (data?.today.find((t) => t.type === "berangkat") as Attendance & { todos?: AttendanceTodo[] })?.todos ?? [];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        <div className="h-16 border-b border-tunet-border flex items-center px-6">
          <div>
            <h1 className="text-lg font-semibold text-tunet-text">
              {COPY.attendance.title}
            </h1>
            <p className="text-xs text-tunet-text-muted">
              {COPY.attendance.subtitle}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6 max-w-6xl">
          {showGpsBanner && (
            <div
              role="region"
              aria-label="Aktivasi GPS saat absen"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-tunet-signal/35 bg-tunet-signal/10 px-4 py-3"
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-tunet-signal" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-tunet-text">
                    Izinkan GPS sekali saat absen
                  </p>
                  <p className="text-[11px] text-tunet-text-muted">
                    Setelah diizinkan, peta &amp; rute berjalan otomatis setiap kali aplikasi dibuka tanpa memunculkan pengingat ini lagi.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={activatingGps}
                  onClick={handleEnableGpsOnce}
                  className="h-8 bg-tunet-green text-xs text-white hover:bg-tunet-green-dark"
                >
                  <Navigation className="mr-1.5 h-3.5 w-3.5" />
                  {activatingGps ? "Mengaktifkan..." : "Izinkan GPS"}
                </Button>
                <button
                  type="button"
                  onClick={handleDismissGpsBanner}
                  aria-label="Tutup pemberitahuan GPS"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-tunet-text-muted hover:bg-tunet-surface-hover hover:text-tunet-text"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {schedule && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-tunet-border bg-tunet-surface px-4 py-3 text-xs">
              <div className="flex items-center gap-2 text-tunet-text">
                <AlarmClock className="h-4 w-4 text-tunet-ember" />
                <span>
                  Jadwal absen:{" "}
                  <strong className="font-mono-data">
                    Berangkat {schedule.berangkat_time} WIB
                  </strong>{" "}
                  ·{" "}
                  <strong className="font-mono-data">
                    Pulang {schedule.pulang_time} WIB
                  </strong>
                  {schedule.grace_minutes > 0 &&
                    ` (+${schedule.grace_minutes}m toleransi)`}
                  {!schedule.enabled && " (Alarm nonaktif)"}
                </span>
              </div>
              {isAdmin && (
                <Link
                  href="/dashboard/settings"
                  className="font-medium text-tunet-signal hover:underline"
                >
                  Ubah Jam Absen
                </Link>
              )}
            </div>
          )}

          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-tunet-text">
                <Clock className="h-4 w-4 text-tunet-signal" />
                {COPY.attendance.todayTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceButtons
                today={data?.today ?? []}
                onRecorded={handleRecorded}
                onBerangkatClick={handleBerangkatClick}
              />
            </CardContent>
          </Card>

          {hasBerangkat && (
            <Card className="bg-tunet-surface border-tunet-border">
              <CardContent className="pt-6">
                <TodoList
                  todos={todayTodos}
                  onAddClick={!hasBerangkat ? undefined : undefined}
                />
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-tunet-text-muted">
              {COPY.attendance.statsTitle}
            </h2>
            <AttendanceStatsCards stats={data?.stats ?? null} loading={loading} />
          </div>

          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <CardTitle className="text-tunet-text">
                {COPY.attendance.historyTitle}
              </CardTitle>
              <p className="text-xs text-tunet-text-muted">
                {COPY.attendance.historySubtitle}
              </p>
            </CardHeader>
            <CardContent>
              <AttendanceHistory rows={data?.history ?? []} loading={loading} />
            </CardContent>
          </Card>
        </div>
      </div>

      <TodoFormDialog
        open={todoDialogOpen}
        onOpenChange={setTodoDialogOpen}
        onSubmit={handleTodoSubmit}
      />
    </DashboardLayout>
  );
}

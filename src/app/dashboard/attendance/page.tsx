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
import { COPY } from "@/lib/copy";
import { Attendance, AttendanceReminderSettings, AttendanceStats, AttendanceTodo, GroupedDay } from "@/types";
import { AlarmClock, Clock } from "lucide-react";
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

  const load = async () => {
    setLoading(true);
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
    try {
      const raw = localStorage.getItem("tutrack-user");
      if (raw && JSON.parse(raw).role === "admin") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsAdmin(true);
      }
    } catch {
      // ignore
    }
    load();
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

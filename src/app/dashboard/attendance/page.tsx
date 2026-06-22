"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AttendanceButtons } from "@/components/attendance/attendance-buttons";
import { AttendanceStatsCards } from "@/components/attendance/attendance-stats";
import { AttendanceHistory } from "@/components/attendance/attendance-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COPY } from "@/lib/copy";
import { Attendance, AttendanceStats } from "@/types";
import { GroupedDay } from "@/lib/db-attendance";
import { Clock } from "lucide-react";

interface AttendancePayload {
  today: Attendance[];
  history: GroupedDay[];
  stats: AttendanceStats;
}

export default function AttendancePage() {
  const [data, setData] = useState<AttendancePayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as AttendancePayload;
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const handleRecorded = (record: Attendance) => {
    setData((prev) => {
      if (!prev) return prev;
      const newToday = [...prev.today.filter((t) => t.type !== record.type), record];
      // Re-fetch stats from server for accuracy
      load();
      return { ...prev, today: newToday };
    });
  };

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
              />
            </CardContent>
          </Card>

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
    </DashboardLayout>
  );
}

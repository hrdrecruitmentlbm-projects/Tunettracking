"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AdminAttendanceTable } from "@/components/attendance/admin-attendance-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { AttendanceWithUser } from "@/types";
import { ClipboardCheck, CalendarDays } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function offsetDateStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function AdminAttendancePage() {
  const [startDate, setStartDate] = useState(offsetDateStr(7));
  const [endDate, setEndDate] = useState(todayStr());
  const [rows, setRows] = useState<AttendanceWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (s: string, e: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/attendance?startDate=${s}&endDate=${e}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const json = (await res.json()) as { rows: AttendanceWithUser[] };
        setRows(json.rows);
      }
    } catch (err) {
      console.error("Failed to load admin attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    load(startDate, endDate);
  }, []);

  const handleApply = () => {
    if (startDate > endDate) return;
    load(startDate, endDate);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        <div className="h-16 border-b border-tunet-border flex items-center px-6">
          <div>
            <Breadcrumbs items={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Absensi" }]} className="mb-1" />
            <h1 className="text-lg font-semibold text-tunet-text">
              {COPY.attendance.adminTitle}
            </h1>
            <p className="text-xs text-tunet-text-muted">
              {COPY.attendance.adminSubtitle}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4 max-w-6xl">
          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-tunet-text">
                <CalendarDays className="h-4 w-4 text-tunet-signal" />
                {COPY.attendance.adminFilterDate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="attendance-start-date" className="text-xs text-tunet-text-muted">Dari</Label>
                  <Input
                    id="attendance-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate}
                    className="bg-tunet-bg border-tunet-border text-tunet-text font-mono-data"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="attendance-end-date" className="text-xs text-tunet-text-muted">Sampai</Label>
                  <Input
                    id="attendance-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={todayStr()}
                    className="bg-tunet-bg border-tunet-border text-tunet-text font-mono-data"
                  />
                </div>
                <Button
                  onClick={handleApply}
                  className="bg-tunet-green hover:bg-tunet-green-dark text-white"
                >
                  Terapkan
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-tunet-text">
                <ClipboardCheck className="h-4 w-4 text-tunet-green" />
                Rekap Absensi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-4 py-3 border-b border-tunet-border"
                    >
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-4 w-14 rounded-full ml-auto" />
                    </div>
                  ))}
                </div>
              ) : (
                <AdminAttendanceTable rows={rows} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AdminAttendanceTable } from "@/components/attendance/admin-attendance-table";
import { AttendanceStatsCards } from "@/components/attendance/attendance-stats-cards";
import { AttendanceMatrixGrid } from "@/components/attendance/attendance-matrix";
import { AttendanceMissingList } from "@/components/attendance/attendance-missing-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { AttendanceWithUser } from "@/types";
import { RosterEntry, buildMatrix, getWorkingDates } from "@/lib/attendance-matrix";
import { ClipboardCheck, CalendarDays, ChevronDown, ChevronRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

/**
 * Today as a local-calendar date string.
 *
 * Deliberately NOT `toISOString().slice(0, 10)`: that converts to UTC, so in
 * WIB (UTC+7) every moment between 00:00 and 07:00 local would return
 * *yesterday*, silently shifting the default range by a day. The server-side
 * `attendance_today_jakarta` RPC exists for the same reason.
 */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function offsetDateStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const RANGE_PRESETS: Array<{ label: string; days: number }> = [
  { label: "7 hari", days: 6 },
  { label: "14 hari", days: 13 },
  { label: "30 hari", days: 29 },
];

export default function AdminAttendancePage() {
  const [startDate, setStartDate] = useState(offsetDateStr(6));
  const [endDate, setEndDate] = useState(todayStr());
  const [applied, setApplied] = useState({ start: offsetDateStr(6), end: todayStr() });
  const [rows, setRows] = useState<AttendanceWithUser[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);

  const load = useCallback(async (s: string, e: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/attendance?startDate=${s}&endDate=${e}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const json = (await res.json()) as {
          rows: AttendanceWithUser[];
          roster: RosterEntry[];
        };
        setRows(json.rows);
        setRoster(json.roster ?? []);
      }
    } catch (err) {
      console.error("Failed to load admin attendance:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    load(applied.start, applied.end);
  }, [applied]);

  const handleApply = () => {
    if (startDate > endDate) return;
    setApplied({ start: startDate, end: endDate });
  };

  const applyPreset = (days: number) => {
    const s = offsetDateStr(days);
    setStartDate(s);
    setEndDate(todayStr());
    setApplied({ start: s, end: todayStr() });
  };

  /**
   * Working dates drive every number below. The roster -- not the punch rows --
   * determines who appears, so an employee with zero attendance in the period
   * still gets a full row of Alfa cells instead of vanishing from the report.
   */
  const matrix = useMemo(
    () => buildMatrix(roster, rows, getWorkingDates(applied.start, applied.end)),
    [roster, rows, applied]
  );

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

        <div className="p-6 space-y-4 max-w-7xl">
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
                <div className="flex items-center gap-1.5">
                  {RANGE_PRESETS.map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => applyPreset(p.days)}
                      className="rounded-full border border-tunet-border bg-tunet-bg px-2.5 py-1 text-[11px] text-tunet-text-muted transition-colors hover:border-tunet-signal/50 hover:text-tunet-signal"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <AttendanceStatsCards matrix={matrix} loading={loading} />

          <AttendanceMatrixGrid matrix={matrix} loading={loading} />

          <AttendanceMissingList matrix={matrix} loading={loading} />

          {/* Row-level detail, kept below the matrix and collapsed by default. */}
          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <button
                type="button"
                onClick={() => setShowLog((v) => !v)}
                className="flex w-full items-center gap-2 text-left"
              >
                {showLog ? (
                  <ChevronDown className="h-4 w-4 text-tunet-text-muted" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-tunet-text-muted" />
                )}
                <ClipboardCheck className="h-4 w-4 text-tunet-green" />
                <span className="text-sm font-medium text-tunet-text">
                  {showLog
                    ? COPY.attendance.adminHideLog
                    : COPY.attendance.adminCollapseLog}
                </span>
              </button>
            </CardHeader>
            {showLog && (
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
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

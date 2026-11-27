"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchOverdueNotifications,
  fetchTaskDoneTimestamps,
  fetchTasks,
  fetchUsers,
} from "@/lib/db";
import {
  evaluateEmployeeReports,
  type EmployeeReportRow,
  type ReportPeriod,
  type TaskDeadlineOutcome,
} from "@/lib/employee-report";
import { formatDateTimeWIB, formatLateDuration } from "@/lib/time";
import { Notification, ROLE_LABELS, Task, User, UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertTriangle,
  Award,
  BellRing,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";

const PERIOD_OPTIONS: Array<{ value: ReportPeriod; label: string }> = [
  { value: "all", label: "Semua Waktu" },
  { value: "month", label: "Bulan Ini" },
  { value: "30d", label: "30 Hari" },
  { value: "7d", label: "7 Hari" },
];

const OUTCOME_BADGE: Record<
  TaskDeadlineOutcome,
  { label: string; className: string }
> = {
  active_overdue: {
    label: "Melewati Tenggat",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  completed_late: {
    label: "Selesai Terlambat",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  completed_on_time: {
    label: "Tepat Waktu",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  active_on_track: {
    label: "Dalam Jadwal",
    className: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  },
  no_deadline_done: {
    label: "Selesai (Tanpa Tenggat)",
    className: "bg-tunet-surface-hover text-tunet-text-muted border-tunet-border",
  },
  no_deadline_active: {
    label: "Aktif (Tanpa Tenggat)",
    className: "bg-tunet-surface-hover text-tunet-text-muted border-tunet-border",
  },
};

function formatLateFromMs(ms: number): string {
  const mins = Math.floor(ms / (1000 * 60));
  if (mins < 1) return "< 1 menit";
  const days = Math.floor(mins / (60 * 24));
  const hours = Math.floor((mins % (60 * 24)) / 60);
  const remMins = mins % 60;
  if (days > 0) return hours > 0 ? `${days} hari ${hours} jam` : `${days} hari`;
  if (hours > 0) return remMins > 0 ? `${hours} jam ${remMins} mnt` : `${hours} jam`;
  return `${mins} menit`;
}

export default function AdminRapotPage() {
  const [currentUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("tutrack-user");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [overdueNotifs, setOverdueNotifs] = useState<Notification[]>([]);
  const [doneAtByTaskId, setDoneAtByTaskId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [checkingOverdue, setCheckingOverdue] = useState(false);

  const [period, setPeriod] = useState<ReportPeriod>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [lateOnly, setLateOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRow, setSelectedRow] = useState<EmployeeReportRow | null>(null);

  const isLeader = currentUser?.role === "admin" || currentUser?.role === "noc";

  const loadData = useCallback(async () => {
    setLoading(true);
    const [nextUsers, nextTasks, nextOverdueNotifs] = await Promise.all([
      fetchUsers(),
      fetchTasks({ limit: 500 }),
      fetchOverdueNotifications(),
    ]);

    const doneTaskIdsMissingTimestamp = nextTasks
      .filter((t) => t.status === "done" && !t.completed_at)
      .map((t) => t.id);

    const doneMap =
      doneTaskIdsMissingTimestamp.length > 0
        ? await fetchTaskDoneTimestamps(doneTaskIdsMissingTimestamp)
        : {};

    setUsers(nextUsers);
    setTasks(nextTasks);
    setOverdueNotifs(nextOverdueNotifs);
    setDoneAtByTaskId(doneMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLeader) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadData();
    } else {
      setLoading(false);
    }
  }, [isLeader, loadData]);

  const handleRunOverdueCheck = async () => {
    setCheckingOverdue(true);
    try {
      const res = await fetch("/api/tasks/overdue-check", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        checkedOverdueTasks?: number;
        notificationsCreated?: number;
        telegramSent?: number;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Gagal memeriksa tenggat tugas");
      } else if ((data.notificationsCreated || 0) > 0) {
        toast.success(
          `${data.notificationsCreated} notifikasi keterlambatan baru dikirim${
            data.telegramSent ? ` (${data.telegramSent} Telegram)` : ""
          }.`
        );
        window.dispatchEvent(new CustomEvent("tutrack:refresh-notifications"));
      } else {
        toast.info(
          `Pemeriksaan selesai: ${data.checkedOverdueTasks || 0} tugas melewati tenggat (semua sudah tercatat).`
        );
      }
      await loadData();
    } catch {
      toast.error("Terjadi kesalahan saat memeriksa tenggat tugas");
    }
    setCheckingOverdue(false);
  };

  const { rows, summary } = useMemo(
    () =>
      evaluateEmployeeReports({
        users,
        tasks,
        overdueNotifications: overdueNotifs,
        doneAtByTaskId,
        period,
      }),
    [users, tasks, overdueNotifs, doneAtByTaskId, period]
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (roleFilter !== "all" && row.user.role !== roleFilter) return false;
      if (lateOnly && row.totalLateCount === 0 && row.overdueAlertsCount === 0) {
        return false;
      }
      if (
        q &&
        !row.user.name.toLowerCase().includes(q) &&
        !ROLE_LABELS[row.user.role].toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [rows, roleFilter, lateOnly, search]);

  const handleExportCsv = () => {
    if (filteredRows.length === 0) {
      toast.info("Tidak ada data untuk diekspor");
      return;
    }

    const header = [
      "Nama Karyawan",
      "Peran",
      "Predikat",
      "Keterangan Predikat",
      "Ketepatan Waktu (%)",
      "Total Tugas",
      "Tugas Bertenggat",
      "Selesai Tepat Waktu",
      "Selesai Terlambat",
      "Masih Terlambat",
      "Notifikasi Telat",
    ];

    const escapeCsv = (val: string | number) => {
      const s = String(val);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const lines = [
      header.map(escapeCsv).join(","),
      ...filteredRows.map((r) =>
        [
          r.user.name,
          ROLE_LABELS[r.user.role],
          r.grade.grade,
          r.grade.label,
          r.onTimeRate !== null ? `${r.onTimeRate}%` : "-",
          r.totalTasks,
          r.tasksWithDeadline,
          r.completedOnTime,
          r.completedLate,
          r.activeOverdue,
          r.overdueAlertsCount,
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ];

    const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapot-karyawan-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Rapot Karyawan berhasil diekspor ke CSV");
  };

  if (currentUser && !isLeader) {
    return (
      <DashboardLayout>
        <div className="flex min-h-dvh items-center justify-center bg-tunet-bg p-6">
          <EmptyState
            icon={ShieldAlert}
            title="Akses Terbatas"
            description="Halaman Rapot Karyawan hanya dapat diakses oleh Admin dan Leader (NOC)."
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-dvh bg-tunet-bg">
        <header className="border-b border-tunet-border px-4 pb-4 pt-16 md:px-6 md:py-5">
          <Breadcrumbs
            items={[
              { label: currentUser?.role === "noc" ? "NOC" : "Admin", href: currentUser?.role === "noc" ? "/dashboard/noc" : "/dashboard/admin" },
              { label: "Rapot Karyawan" },
            ]}
          />
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-tunet-text md:text-3xl">
                Rapot Karyawan
              </h1>
              <p className="mt-1 text-sm text-tunet-text-muted">
                Catatan ketepatan waktu, riwayat keterlambatan tenggat (deadline), dan nilai kepatuhan tiap karyawan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRunOverdueCheck}
                disabled={checkingOverdue}
                className="border-tunet-border text-tunet-text hover:bg-tunet-surface-hover"
              >
                <RefreshCw
                  className={cn("mr-1.5 size-4", checkingOverdue && "animate-spin")}
                />
                {checkingOverdue ? "Memeriksa..." : "Cek Tenggat Sekarang"}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportCsv}
                className="border-tunet-border text-tunet-text hover:bg-tunet-surface-hover"
              >
                <Download className="mr-1.5 size-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[100rem] space-y-5 p-4 md:p-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-tunet-border bg-tunet-surface">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-tunet-text-muted">
                  Karyawan Dievaluasi
                </CardTitle>
                <Users className="size-4 text-tunet-signal" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono tabular-nums text-tunet-text">
                  {summary.totalEmployees}
                </div>
                <p className="mt-1 text-xs text-tunet-text-muted">
                  {summary.evaluatedEmployees} memiliki tugas bertenggat
                </p>
              </CardContent>
            </Card>

            <Card className="border-tunet-border bg-tunet-surface">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-tunet-text-muted">
                  Kepatuhan Deadline Tim
                </CardTitle>
                <Award className="size-4 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono tabular-nums text-tunet-text">
                  {summary.teamOnTimeRate !== null ? `${summary.teamOnTimeRate}%` : "—"}
                </div>
                <p className="mt-1 text-xs text-tunet-text-muted">
                  Rata-rata selesai tepat waktu
                </p>
              </CardContent>
            </Card>

            <Card className="border-tunet-border bg-tunet-surface">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-tunet-text-muted">
                  Sedang Melewati Tenggat
                </CardTitle>
                <AlertTriangle className="size-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "text-2xl font-bold font-mono tabular-nums",
                    summary.totalActiveOverdue > 0 ? "text-red-400" : "text-tunet-text"
                  )}
                >
                  {summary.totalActiveOverdue}
                </div>
                <p className="mt-1 text-xs text-tunet-text-muted">
                  Tugas aktif belum selesai lewat deadline
                </p>
              </CardContent>
            </Card>

            <Card className="border-tunet-border bg-tunet-surface">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-tunet-text-muted">
                  Total Catatan Terlambat
                </CardTitle>
                <Clock className="size-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono tabular-nums text-tunet-text">
                  {summary.totalLateRecords}
                </div>
                <p className="mt-1 text-xs text-tunet-text-muted">
                  {summary.totalCompletedLate} selesai terlambat · {summary.totalActiveOverdue} masih terlambat
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filter Bar */}
          <Card className="border-tunet-border bg-tunet-surface">
            <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPeriod(opt.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      period === opt.value
                        ? "border-tunet-green/60 bg-tunet-green/15 text-tunet-green"
                        : "border-tunet-border bg-tunet-bg text-tunet-text-muted hover:text-tunet-text"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}

                <span className="mx-1 hidden h-4 w-px bg-tunet-border sm:inline-block" />

                <button
                  type="button"
                  onClick={() => setLateOnly((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    lateOnly
                      ? "border-red-500/50 bg-red-500/15 text-red-400"
                      : "border-tunet-border bg-tunet-bg text-tunet-text-muted hover:text-tunet-text"
                  )}
                >
                  <AlertTriangle className="size-3.5" />
                  Hanya Yang Terlambat
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as "all" | UserRole)}
                  aria-label="Filter peran karyawan"
                  className="h-9 rounded-lg border border-tunet-border bg-tunet-bg px-3 text-xs text-tunet-text focus:outline-none focus:ring-2 focus:ring-tunet-green/50"
                >
                  <option value="all">Semua Peran</option>
                  <option value="foc">FOC</option>
                  <option value="marketing">Marketing</option>
                  <option value="noc">NOC</option>
                </select>

                <div className="relative sm:w-64">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-tunet-text-muted" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama karyawan..."
                    className="h-9 bg-tunet-bg pl-9 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Report Table */}
          <Card className="border-tunet-border bg-tunet-surface">
            <CardHeader className="border-b border-tunet-border/70 pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium text-tunet-text">
                  Rekap Rapot Ketepatan Waktu Karyawan
                </CardTitle>
                <span className="text-xs text-tunet-text-muted">
                  Klik baris karyawan untuk melihat rincian tugas terlambat
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={Award}
                    title="Belum ada data rapot"
                    description="Tidak ada data karyawan yang sesuai dengan filter saat ini."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-tunet-border hover:bg-transparent">
                        <TableHead className="text-tunet-text-muted">Karyawan</TableHead>
                        <TableHead className="text-tunet-text-muted">Predikat</TableHead>
                        <TableHead className="text-tunet-text-muted">Ketepatan Waktu</TableHead>
                        <TableHead className="text-right text-tunet-text-muted">Total Tugas</TableHead>
                        <TableHead className="text-right text-tunet-text-muted">Tepat Waktu</TableHead>
                        <TableHead className="text-right text-tunet-text-muted">Selesai Telat</TableHead>
                        <TableHead className="text-right text-tunet-text-muted">Masih Telat</TableHead>
                        <TableHead className="text-right text-tunet-text-muted">Notif Telat</TableHead>
                        <TableHead className="text-right text-tunet-text-muted">Rincian</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.map((row) => (
                        <TableRow
                          key={row.user.id}
                          onClick={() => setSelectedRow(row)}
                          className="cursor-pointer border-tunet-border/70 transition-colors hover:bg-tunet-surface-hover/60"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-tunet-bg border border-tunet-border text-xs font-semibold text-tunet-text">
                                {row.user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-tunet-text">{row.user.name}</p>
                                <p className="text-[11px] text-tunet-text-muted">
                                  {ROLE_LABELS[row.user.role]}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("font-mono text-xs", row.grade.badgeClass)}
                            >
                              {row.grade.grade === "-"
                                ? "Belum Ada"
                                : `${row.grade.grade} · ${row.grade.label}`}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-36">
                            {row.onTimeRate !== null ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-mono font-semibold text-tunet-text">
                                    {row.onTimeRate}%
                                  </span>
                                  <span className="text-[11px] text-tunet-text-muted">
                                    {row.completedOnTime}/{row.completedOnTime + row.completedLate + row.activeOverdue}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-tunet-bg">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${row.onTimeRate}%`,
                                      backgroundColor:
                                        row.onTimeRate >= 90
                                          ? "#10B981"
                                          : row.onTimeRate >= 75
                                          ? "#22D3EE"
                                          : row.onTimeRate >= 50
                                          ? "#F59E0B"
                                          : "#EF4444",
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-tunet-text-muted">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-tunet-text">
                            {row.totalTasks}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-emerald-400">
                            {row.completedOnTime}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-mono tabular-nums",
                              row.completedLate > 0 ? "text-amber-400 font-semibold" : "text-tunet-text-muted"
                            )}
                          >
                            {row.completedLate}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-mono tabular-nums",
                              row.activeOverdue > 0 ? "text-red-400 font-semibold" : "text-tunet-text-muted"
                            )}
                          >
                            {row.activeOverdue}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-tunet-text-muted">
                            {row.overdueAlertsCount}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRow(row);
                              }}
                              className="h-8 text-xs text-tunet-signal hover:text-tunet-signal"
                            >
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Employee Rapot Detail Sheet */}
        <Sheet open={Boolean(selectedRow)} onOpenChange={(o) => !o && setSelectedRow(null)}>
          <SheetContent
            side="right"
            className="w-full border-tunet-border bg-tunet-surface sm:max-w-xl"
          >
            {selectedRow && (
              <>
                <SheetHeader>
                  <div className="flex items-center justify-between gap-3 pr-6">
                    <div>
                      <SheetTitle className="text-lg text-tunet-text">
                        Rapot: {selectedRow.user.name}
                      </SheetTitle>
                      <SheetDescription className="text-tunet-text-muted">
                        {ROLE_LABELS[selectedRow.user.role]} · {selectedRow.totalTasks} tugas tercatat
                      </SheetDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("font-mono text-xs", selectedRow.grade.badgeClass)}
                    >
                      {selectedRow.grade.grade === "-"
                        ? "Belum Ada Tenggat"
                        : `Nilai ${selectedRow.grade.grade} (${selectedRow.grade.label})`}
                    </Badge>
                  </div>
                </SheetHeader>

                <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
                  {/* Mini breakdown */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-lg border border-tunet-border bg-tunet-bg p-3">
                      <p className="text-[11px] text-tunet-text-muted">Tepat Waktu</p>
                      <p className="mt-1 text-lg font-bold font-mono text-emerald-400">
                        {selectedRow.completedOnTime}
                      </p>
                    </div>
                    <div className="rounded-lg border border-tunet-border bg-tunet-bg p-3">
                      <p className="text-[11px] text-tunet-text-muted">Selesai Telat</p>
                      <p className="mt-1 text-lg font-bold font-mono text-amber-400">
                        {selectedRow.completedLate}
                      </p>
                    </div>
                    <div className="rounded-lg border border-tunet-border bg-tunet-bg p-3">
                      <p className="text-[11px] text-tunet-text-muted">Masih Telat</p>
                      <p className="mt-1 text-lg font-bold font-mono text-red-400">
                        {selectedRow.activeOverdue}
                      </p>
                    </div>
                    <div className="rounded-lg border border-tunet-border bg-tunet-bg p-3">
                      <p className="text-[11px] text-tunet-text-muted">Kepatuhan</p>
                      <p className="mt-1 text-lg font-bold font-mono text-tunet-text">
                        {selectedRow.onTimeRate !== null ? `${selectedRow.onTimeRate}%` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-tunet-text-muted">
                      Daftar Tugas & Catatan Tenggat ({selectedRow.items.length})
                    </h3>

                    {selectedRow.items.length === 0 ? (
                      <div className="rounded-lg border border-tunet-border bg-tunet-bg p-6 text-center text-xs text-tunet-text-muted">
                        Belum ada tugas yang diberikan pada periode ini.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedRow.items.map((item) => {
                          const meta = OUTCOME_BADGE[item.outcome];
                          const isLate =
                            item.outcome === "active_overdue" ||
                            item.outcome === "completed_late";

                          return (
                            <div
                              key={item.task.id}
                              className={cn(
                                "rounded-xl border p-3.5 transition-colors",
                                item.outcome === "active_overdue"
                                  ? "border-red-500/40 bg-red-500/5"
                                  : item.outcome === "completed_late"
                                  ? "border-amber-500/35 bg-amber-500/5"
                                  : "border-tunet-border bg-tunet-bg"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-sm text-tunet-text">
                                    {item.task.title}
                                  </p>
                                  <p className="mt-0.5 text-xs text-tunet-text-muted">
                                    {item.task.location_name}
                                    {item.task.creator?.name
                                      ? ` · Pemberi tugas: ${item.task.creator.name}`
                                      : ""}
                                  </p>
                                </div>
                                <Badge variant="outline" className={cn("shrink-0 text-[11px]", meta.className)}>
                                  {meta.label}
                                </Badge>
                              </div>

                              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tunet-text-muted">
                                {item.task.deadline ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="size-3.5" />
                                    Tenggat: {formatDateTimeWIB(item.task.deadline)}
                                  </span>
                                ) : (
                                  <span>Tanpa tenggat</span>
                                )}

                                {item.completedAt && (
                                  <span className="inline-flex items-center gap-1">
                                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                                    Selesai: {formatDateTimeWIB(item.completedAt)}
                                  </span>
                                )}

                                {isLate && item.task.deadline && (
                                  <span className="inline-flex items-center gap-1 font-medium text-red-400">
                                    <AlertTriangle className="size-3.5" />
                                    Terlambat{" "}
                                    {item.lateMs > 0
                                      ? formatLateFromMs(item.lateMs)
                                      : formatLateDuration(
                                          item.task.deadline,
                                          item.completedAt || new Date()
                                        )}
                                  </span>
                                )}

                                {item.hadOverdueNotification && (
                                  <span className="inline-flex items-center gap-1 text-amber-400">
                                    <BellRing className="size-3" />
                                    Notifikasi terlambat terkirim
                                  </span>
                                )}
                              </div>

                              <div className="mt-2.5 flex justify-end">
                                <Link
                                  href={`/dashboard/tasks?highlight=${item.task.id}`}
                                  onClick={() => setSelectedRow(null)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-tunet-signal hover:underline"
                                >
                                  Lihat Tugas
                                  <ExternalLink className="size-3" />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}

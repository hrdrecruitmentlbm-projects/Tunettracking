"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AttendanceMatrix, buildMissingList } from "@/lib/attendance-matrix";
import { formatDuration, formatShortDate } from "@/lib/time";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { UserX, CheckCircle2 } from "lucide-react";

interface AttendanceMissingListProps {
  matrix: AttendanceMatrix;
  loading?: boolean;
  onSelectDate?: (userId: string, date: string) => void;
}

/**
 * Direct answer to "who was missing in this period".
 *
 * Sorted worst-first, with lupa-absen-pagi breaking ties because that status
 * makes hours-worked unknowable. The three absence kinds are kept in separate
 * columns so a single forgotten morning punch never hides inside a total.
 */
export function AttendanceMissingList({
  matrix,
  loading,
  onSelectDate,
}: AttendanceMissingListProps) {
  const [showClean, setShowClean] = useState(false);

  const rows = useMemo(() => buildMissingList(matrix), [matrix]);
  const withAbsence = rows.filter((r) => r.tidakHadir > 0);
  const clean = rows.filter((r) => r.tidakHadir === 0);
  const visible = showClean ? rows : withAbsence;

  if (loading) {
    return (
      <Card className="bg-tunet-surface border-tunet-border">
        <CardHeader>
          <Skeleton className="h-4 w-44" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="ml-auto h-3 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-tunet-surface border-tunet-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-tunet-text">
          <UserX className="h-4 w-4 text-status-overdue" />
          {COPY.attendance.adminMissingTitle}
        </CardTitle>
        <p className="text-xs text-tunet-text-muted">
          {COPY.attendance.adminMissingSubtitle}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {withAbsence.length === 0 ? (
          <EmptyState
            glyph="team"
            icon={CheckCircle2}
            title={COPY.attendance.adminMissingClean}
            description={`${clean.length} karyawan lengkap di rentang ini.`}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-tunet-border">
                    <TableHead className="text-tunet-text-muted">
                      {COPY.attendance.adminColEmployee}
                    </TableHead>
                    <TableHead className="text-tunet-text-muted">
                      {COPY.attendance.adminColRole}
                    </TableHead>
                    <TableHead
                      className="text-center text-tunet-text-muted"
                      title={COPY.attendance.adminStatusAlphaPagiLong}
                    >
                      {COPY.attendance.adminColLupaPagi}
                    </TableHead>
                    <TableHead
                      className="text-center text-tunet-text-muted"
                      title={COPY.attendance.adminStatusAlphaPulangLong}
                    >
                      {COPY.attendance.adminColLupaPulang}
                    </TableHead>
                    <TableHead
                      className="text-center text-tunet-text-muted"
                      title={COPY.attendance.adminStatusAlphaLong}
                    >
                      {COPY.attendance.adminColAlphaFull}
                    </TableHead>
                    <TableHead className="text-center text-tunet-text-muted">
                      {COPY.attendance.adminColTotalMissing}
                    </TableHead>
                    <TableHead className="text-center text-tunet-text-muted">
                      {COPY.attendance.adminStatPercentage}
                    </TableHead>
                    <TableHead className="text-center text-tunet-text-muted">
                      {COPY.attendance.adminColTotalHours}
                    </TableHead>
                    <TableHead className="text-tunet-text-muted">
                      {COPY.attendance.adminColLastPresent}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((r) => {
                    const roleColor =
                      r.role === "admin"
                        ? "bg-tunet-green/20 text-tunet-green"
                        : r.role === "noc"
                        ? "bg-status-assigned/20 text-status-assigned"
                        : r.role === "marketing"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-status-progress/20 text-status-progress";
                    return (
                      <TableRow
                        key={r.userId}
                        className="border-tunet-border hover:bg-tunet-bg/40"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-tunet-green/20 flex items-center justify-center text-tunet-green text-[10px] font-medium shrink-0">
                              {r.name.charAt(0)}
                            </span>
                            <span className="text-sm text-tunet-text">{r.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase",
                              roleColor
                            )}
                          >
                            {r.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {r.alfaPagi > 0 ? (
                            <span className="font-mono-data text-sm font-semibold tabular-nums text-status-overdue">
                              {r.alfaPagi}
                            </span>
                          ) : (
                            <span className="font-mono-data text-sm text-tunet-text-muted">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {r.alfaPulang > 0 ? (
                            <span className="font-mono-data text-sm tabular-nums text-status-overdue/80">
                              {r.alfaPulang}
                            </span>
                          ) : (
                            <span className="font-mono-data text-sm text-tunet-text-muted">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {r.alfa > 0 ? (
                            <span className="font-mono-data text-sm tabular-nums text-status-overdue/60">
                              {r.alfa}
                            </span>
                          ) : (
                            <span className="font-mono-data text-sm text-tunet-text-muted">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "font-mono-data text-sm font-semibold tabular-nums",
                              r.tidakHadir > 0
                                ? "text-status-overdue"
                                : "text-tunet-text-muted"
                            )}
                          >
                            {r.tidakHadir}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "font-mono-data text-sm tabular-nums",
                              r.tidakHadir > 0
                                ? "text-status-overdue"
                                : "text-tunet-green"
                            )}
                          >
                            {r.hadir}/{r.scheduled}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono-data text-xs tabular-nums text-tunet-text-muted">
                          {formatDuration(r.totalMinutes)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1">
                            {r.absentDates.length === 0 && (
                              <span className="text-xs text-tunet-green">
                                Lengkap
                              </span>
                            )}
                            {r.absentDates.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => onSelectDate?.(r.userId, d)}
                                title={`${d} — lihat di matriks`}
                                className="rounded border border-tunet-border bg-tunet-bg px-1.5 py-0.5 font-mono-data text-[10px] tabular-nums text-tunet-text-muted transition-colors hover:border-tunet-signal/50 hover:text-tunet-signal"
                              >
                                {formatShortDate(d)}
                              </button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {clean.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClean((v) => !v)}
                className="text-[11px] text-tunet-text-muted transition-colors hover:text-tunet-text"
              >
                {showClean
                  ? "Sembunyikan yang lengkap"
                  : `Tampilkan ${clean.length} karyawan yang lengkap`}
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

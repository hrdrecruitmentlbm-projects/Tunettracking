"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupedDay } from "@/lib/db-attendance";
import { formatAttendanceDate, formatTimeWIB, formatDuration } from "@/lib/time";
import { COPY } from "@/lib/copy";
import { CalendarOff, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceHistoryProps {
  rows: GroupedDay[];
  loading?: boolean;
}

export function AttendanceHistory({ rows, loading }: AttendanceHistoryProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b border-tunet-border"
          >
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        glyph="inbox"
        icon={CalendarOff}
        title={COPY.attendance.emptyHistory.title}
        description={COPY.attendance.emptyHistory.description}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-tunet-border">
            <TableHead className="text-tunet-text-muted">
              {COPY.attendance.colDate}
            </TableHead>
            <TableHead className="text-tunet-text-muted">
              {COPY.attendance.colBerangkat}
            </TableHead>
            <TableHead className="text-tunet-text-muted">
              {COPY.attendance.colPulang}
            </TableHead>
            <TableHead className="text-tunet-text-muted">
              {COPY.attendance.colDuration}
            </TableHead>
            <TableHead className="text-tunet-text-muted">
              {COPY.attendance.colStatus}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const complete = !!(r.berangkat && r.pulang);
            const statusColor = complete
              ? "bg-tunet-green/15 text-tunet-green border-tunet-green/40"
              : "bg-tunet-ember/15 text-tunet-ember border-tunet-ember/40";
            const StatusIcon = complete ? Check : AlertTriangle;
            const statusLabel = complete
              ? COPY.attendance.adminStatusLengkap
              : r.berangkat
              ? COPY.attendance.adminStatusBelumPulang
              : COPY.attendance.adminStatusBelumBerangkat;

            return (
              <TableRow key={r.date} className="border-tunet-border">
                <TableCell className="text-sm text-tunet-text">
                  {formatAttendanceDate(r.date)}
                </TableCell>
                <TableCell className="font-mono-data text-sm tabular-nums text-tunet-text">
                  {formatTimeWIB(r.berangkat?.timestamp)}
                </TableCell>
                <TableCell className="font-mono-data text-sm tabular-nums text-tunet-text">
                  {formatTimeWIB(r.pulang?.timestamp)}
                </TableCell>
                <TableCell className="font-mono-data text-sm tabular-nums text-tunet-text-muted">
                  {formatDuration(r.durationMinutes)}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      statusColor
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusLabel}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

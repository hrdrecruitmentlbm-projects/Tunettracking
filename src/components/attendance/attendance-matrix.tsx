"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { AttendanceMatrix, CellStatus, MatrixCell, countByStatus } from "@/lib/attendance-matrix";
import { formatDuration, formatTimeWIB, formatAttendanceDate } from "@/lib/time";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";
import {
  STATUS_META,
  STATUS_FILTER_ORDER,
  filterLabel,
} from "./attendance-status-meta";
import { fetchAttendancePhotoUrl } from "./attendance-photo";
import { Grid3x3, ImageIcon, ListTodo, Info } from "lucide-react";

interface AttendanceMatrixGridProps {
  matrix: AttendanceMatrix;
  loading?: boolean;
}

const ROLE_COLOR: Record<string, string> = {
  admin: "bg-tunet-green/20 text-tunet-green",
  noc: "bg-status-assigned/20 text-status-assigned",
  marketing: "bg-purple-500/20 text-purple-400",
  foc: "bg-status-progress/20 text-status-progress",
};

function shortDate(date: string): { day: string; dow: string } {
  const iso = `${date}T12:00:00+07:00`;
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", timeZone: "Asia/Jakarta" }),
    dow: d.toLocaleDateString("id-ID", { weekday: "narrow", timeZone: "Asia/Jakarta" }),
  };
}

export function AttendanceMatrixGrid({ matrix, loading }: AttendanceMatrixGridProps) {
  const [filter, setFilter] = useState<CellStatus | "all">("all");
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  const statusCounts = useMemo(() => countByStatus(matrix), [matrix]);

  const loadPhoto = useCallback(
    async (filePath: string) => {
      if (photoUrls[filePath]) return photoUrls[filePath];
      try {
        const url = await fetchAttendancePhotoUrl(filePath);
        setPhotoUrls((prev) => ({ ...prev, [filePath]: url }));
        return url;
      } catch {
        return null;
      }
    },
    [photoUrls]
  );

  if (loading) {
    return (
      <Card className="bg-tunet-surface border-tunet-border">
        <CardHeader>
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-6 w-28" />
              <div className="flex flex-1 gap-1">
                {Array.from({ length: 14 }).map((__, j) => (
                  <Skeleton key={j} className="h-6 flex-1" />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (matrix.dates.length === 0 || matrix.people.length === 0) {
    return (
      <Card className="bg-tunet-surface border-tunet-border">
        <CardContent className="pt-6">
          <EmptyState
            glyph="team"
            icon={Grid3x3}
            title={
              matrix.people.length === 0
                ? COPY.attendance.adminNoRoster.title
                : COPY.attendance.adminMatrixEmpty.title
            }
            description={
              matrix.people.length === 0
                ? COPY.attendance.adminNoRoster.description
                : COPY.attendance.adminMatrixEmpty.description
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-tunet-surface border-tunet-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-tunet-text">
          <Grid3x3 className="h-4 w-4 text-tunet-green" />
          {COPY.attendance.adminMatrixTitle}
        </CardTitle>
        <p className="text-xs text-tunet-text-muted">
          {COPY.attendance.adminMatrixSubtitle}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filter chips with live counts */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTER_ORDER.map((status) => {
            const count =
              status === "all"
                ? matrix.cellMap.size
                : statusCounts[status];
            const active = filter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "border-tunet-signal/60 bg-tunet-signal/15 text-tunet-signal"
                    : "border-tunet-border bg-tunet-bg text-tunet-text-muted hover:border-tunet-signal/40 hover:text-tunet-text"
                )}
              >
                {status !== "all" && (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      STATUS_META[status].dot
                    )}
                  />
                )}
                {filterLabel(status)}
                <span className="font-mono-data tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Grid: sticky name column, scrollable date axis */}
        <div className="max-w-full overflow-auto">
          <table className="border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-tunet-surface px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-tunet-text-muted">
                  {COPY.attendance.adminColEmployee}
                </th>
                {matrix.dates.map((date) => {
                  const s = shortDate(date);
                  return (
                    <th
                      key={date}
                      className="px-0.5 pb-1 align-bottom"
                      title={formatAttendanceDate(date)}
                    >
                      <div className="font-mono-data text-[10px] tabular-nums text-tunet-text-muted">
                        {s.day}
                      </div>
                      <div className="text-[10px] uppercase text-tunet-text-muted/60">
                        {s.dow}
                      </div>
                    </th>
                  );
                })}
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-tunet-text-muted">
                  {COPY.attendance.adminColSummary}
                </th>
              </tr>
            </thead>
            <tbody>
              {matrix.people.map((person) => (
                <tr key={person.userId} className="group">
                  <td className="sticky left-0 z-10 border-t border-tunet-border bg-tunet-surface px-3 py-1">
                    <div className="flex items-center gap-2">
                      <span className="w-28 truncate text-xs text-tunet-text">
                        {person.name}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                          ROLE_COLOR[person.role] ?? "bg-tunet-border/50 text-tunet-text-muted"
                        )}
                      >
                        {person.role}
                      </span>
                    </div>
                  </td>
                  {matrix.dates.map((date) => {
                    const cell = matrix.cellMap.get(`${person.userId}::${date}`);
                    if (!cell) return null;
                    const meta = STATUS_META[cell.status];
                    // Dim rather than remove: the grid keeps its shape so the
                    // surrounding context stays readable while filtering.
                    const dimmed = filter !== "all" && cell.status !== filter;
                    return (
                      <td
                        key={date}
                        className="border-t border-tunet-border p-0.5 text-center"
                      >
                        <Popover key={`${person.userId}-${date}`}>
                          <PopoverTrigger
                            render={
                              <button
                                type="button"
                                aria-label={`${person.name} ${formatAttendanceDate(date)} — ${meta.label}`}
                                className={cn(
                                  "h-6 w-6 rounded border transition-all",
                                  meta.cell,
                                  dimmed && "opacity-15"
                                )}
                              >
                                <span className="text-[10px] leading-none">
                                  {meta.glyph}
                                </span>
                              </button>
                            }
                          />
                          <PopoverContent side="top" align="center">
                            <CellDetail
                              cell={cell}
                              personName={person.name}
                              onLoadPhoto={loadPhoto}
                              photoUrl={cell.photo_file_id ? photoUrls[cell.photo_file_id] : undefined}
                            />
                          </PopoverContent>
                        </Popover>
                      </td>
                    );
                  })}
                  <td className="border-t border-tunet-border px-3 py-1 whitespace-nowrap">
                    <span
                      className={cn(
                        "font-mono-data text-xs tabular-nums",
                        person.tidakHadir > 0
                          ? "text-status-overdue"
                          : "text-tunet-green"
                      )}
                    >
                      {person.hadir}/{person.scheduled}
                    </span>
                    {person.tidakHadir > 0 && (
                      <span className="ml-1.5 font-mono-data text-[10px] tabular-nums text-tunet-text-muted">
                        −{person.tidakHadir}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {/* Column totals */}
              <tr>
                <td className="sticky left-0 z-10 border-t border-tunet-border bg-tunet-surface px-3 py-1.5 text-[11px] font-medium text-tunet-text-muted">
                  {COPY.attendance.adminStatPercentage}
                </td>
                {matrix.days.map((d) => (
                  <td
                    key={d.date}
                    className="border-t border-tunet-border p-0.5 text-center font-mono-data text-[10px] tabular-nums text-tunet-text-muted"
                  >
                    {d.hadir}/{d.total}
                  </td>
                ))}
                <td className="border-t border-tunet-border px-3 py-1.5 font-mono-data text-xs tabular-nums text-tunet-text">
                  {matrix.totals.percentage}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-tunet-border pt-3">
          <span className="text-[11px] uppercase tracking-wide text-tunet-text-muted">
            {COPY.attendance.adminMatrixLegend}
          </span>
          {STATUS_FILTER_ORDER.filter((s): s is CellStatus => s !== "all").map(
            (status) => {
              const meta = STATUS_META[status];
              return (
                <div key={status} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border text-[10px]",
                      meta.cell
                    )}
                  >
                    {meta.glyph}
                  </span>
                  <span className="text-[11px] text-tunet-text-muted" title={meta.description}>
                    {meta.label}
                  </span>
                </div>
              );
            }
          )}
        </div>

        <p className="flex items-start gap-1.5 text-[11px] text-tunet-text-muted">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{COPY.attendance.adminNoteNoLeaveTable}</span>
        </p>
      </CardContent>
    </Card>
  );
}

function CellDetail({
  cell,
  personName,
  onLoadPhoto,
  photoUrl,
}: {
  cell: MatrixCell;
  personName: string;
  onLoadPhoto: (path: string) => Promise<string | null | undefined>;
  photoUrl?: string;
}) {
  const meta = STATUS_META[cell.status];
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-tunet-text">{personName}</p>
        <p className="text-[11px] text-tunet-text-muted">
          {formatAttendanceDate(cell.date)}
        </p>
      </div>

      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
          meta.badge
        )}
      >
        <span>{meta.glyph}</span>
        {meta.label}
      </span>
      <p className="text-[11px] leading-relaxed text-tunet-text-muted">
        {meta.description}
      </p>

      {cell.status !== "alfa" && (
        <div className="grid grid-cols-2 gap-2 border-t border-tunet-border pt-2 font-mono-data text-[11px] tabular-nums">
          <div>
            <div className="text-tunet-text-muted">{COPY.attendance.adminColBerangkat}</div>
            <div className={cn(!cell.berangkat && "text-status-overdue")}>
              {formatTimeWIB(cell.berangkat)}
            </div>
          </div>
          <div>
            <div className="text-tunet-text-muted">{COPY.attendance.adminColPulang}</div>
            <div className={cn(!cell.pulang && "text-status-overdue")}>
              {formatTimeWIB(cell.pulang)}
            </div>
          </div>
          <div>
            <div className="text-tunet-text-muted">{COPY.attendance.adminColDuration}</div>
            <div
              className={cn(
                cell.durationUnreliable && "text-status-progress"
              )}
            >
              {cell.status === "alfaPagi"
                ? COPY.attendance.adminCellHoursUnknown
                : formatDuration(cell.durationMinutes)}
            </div>
          </div>
        </div>
      )}

      {cell.photo_file_id && (
        <div className="border-t border-tunet-border pt-2">
          <button
            type="button"
            className="flex items-center gap-1.5 text-[11px] text-tunet-green hover:underline"
            onClick={async () => {
              const url = photoUrl ?? (await onLoadPhoto(cell.photo_file_id!));
              if (url) window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            {COPY.attendance.photoTitle}
          </button>
          {photoUrl && (
            <a
              href={photoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt={COPY.attendance.photoTitle}
                className="h-20 w-20 rounded border border-tunet-border object-cover"
              />
            </a>
          )}
        </div>
      )}

      {cell.todos.length > 0 && (
        <div className="border-t border-tunet-border pt-2">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-tunet-text-muted">
            <ListTodo className="h-3.5 w-3.5" />
            {COPY.attendance.todoListTitle}
          </p>
          <ul className="space-y-0.5">
            {cell.todos.map((t) => (
              <li key={t.id} className="flex items-start gap-1.5 text-[11px] text-tunet-text">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-tunet-green" />
                {t.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

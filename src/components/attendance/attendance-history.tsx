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
import { GroupedDay } from "@/types";
import { formatAttendanceDate, formatTimeWIB, formatDuration } from "@/lib/time";
import { COPY } from "@/lib/copy";
import { CalendarOff, Check, AlertTriangle, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";

interface AttendanceHistoryProps {
  rows: GroupedDay[];
  loading?: boolean;
}

async function fetchAttendancePhotoUrl(filePath: string): Promise<string> {
  const id = filePath.split("/").pop() || "photo";
  const res = await fetch(`/api/attendance/photo/${id}?path=${encodeURIComponent(filePath)}`);
  if (!res.ok) throw new Error("Failed to fetch photo");
  const data = await res.json();
  return data.url;
}

export function AttendanceHistory({ rows, loading }: AttendanceHistoryProps) {
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  const loadPhotoUrl = useCallback(async (filePath: string) => {
    if (photoUrls[filePath]) return photoUrls[filePath];
    try {
      const url = await fetchAttendancePhotoUrl(filePath);
      setPhotoUrls((prev) => ({ ...prev, [filePath]: url }));
      return url;
    } catch {
      return null;
    }
  }, [photoUrls]);

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
              {COPY.attendance.photoTitle}
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

            const photoId = r.berangkat?.photo_file_id;
            const isPhotoExpanded = expandedPhoto === photoId;

            return (
              <TableRow key={r.date} className="border-tunet-border">
                <TableCell className="text-sm text-tunet-text">
                  {formatAttendanceDate(r.date)}
                </TableCell>
                <TableCell>
                  {photoId ? (
                    <button
                      type="button"
                      onClick={async () => {
                        if (isPhotoExpanded) {
                          setExpandedPhoto(null);
                        } else {
                          setExpandedPhoto(photoId);
                          await loadPhotoUrl(photoId);
                        }
                      }}
                      className="flex items-center gap-1.5 text-tunet-green hover:text-tunet-green/80 transition-colors"
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-[11px]">Lihat</span>
                    </button>
                  ) : (
                    <span className="text-tunet-text-muted text-[11px]">-</span>
                  )}
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

      {/* Expanded Photo View */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setExpandedPhoto(null)}>
          <div className="relative max-w-lg max-h-[80vh] p-2" onClick={(e) => e.stopPropagation()}>
            {photoUrls[expandedPhoto] ? (
              <img
                src={photoUrls[expandedPhoto]}
                alt={COPY.attendance.photoPreview}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 rounded-lg bg-tunet-surface flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setExpandedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-tunet-bg/80 text-tunet-text-muted hover:text-white transition-colors"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AttendanceWithUser, AttendanceTodo, UserRole } from "@/types";
import { formatAttendanceDate, formatTimeWIB, formatDuration } from "@/lib/time";
import { COPY } from "@/lib/copy";
import { Search, CalendarOff, Check, AlertTriangle, X, ChevronDown, ChevronRight, ListTodo, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminAttendanceTableProps {
  rows: AttendanceWithUser[];
  loading?: boolean;
}

async function fetchAttendancePhotoUrl(filePath: string): Promise<string> {
  const id = filePath.split("/").pop() || "photo";
  const res = await fetch(`/api/attendance/photo/${id}?path=${encodeURIComponent(filePath)}`);
  if (!res.ok) throw new Error("Failed to fetch photo");
  const data = await res.json();
  return data.url;
}

interface GroupedRow {
  userId: string;
  name: string;
  role: UserRole;
  date: string;
  berangkat: string | null;
  pulang: string | null;
  durationMinutes: number | null;
  status: "complete" | "incomplete" | "anomali";
  todos: AttendanceTodo[];
  photo_file_id: string | null;
}

function groupAdminRows(rows: AttendanceWithUser[]): GroupedRow[] {
  const map = new Map<string, GroupedRow>();
  for (const r of rows) {
    if (!r.user) continue;
    const key = `${r.user_id}::${r.attendance_date}`;
    const existing: GroupedRow =
      map.get(key) ?? {
        userId: r.user_id,
        name: r.user.name,
        role: r.user.role,
        date: r.attendance_date,
        berangkat: null,
        pulang: null,
        durationMinutes: null,
        status: "incomplete",
        todos: [],
        photo_file_id: null,
      };
    if (r.type === "berangkat") {
      existing.berangkat = r.timestamp;
      if (r.todos && r.todos.length > 0) {
        existing.todos = r.todos;
      }
      if (r.photo_file_id) {
        existing.photo_file_id = r.photo_file_id;
      }
    } else {
      existing.pulang = r.timestamp;
    }

    if (existing.berangkat && existing.pulang) {
      const diff =
        new Date(existing.pulang).getTime() - new Date(existing.berangkat).getTime();
      existing.durationMinutes = Math.max(0, Math.round(diff / 60000));
      existing.status =
        existing.durationMinutes < 0 || existing.durationMinutes > 18 * 60
          ? "anomali"
          : "complete";
    } else {
      existing.status = "incomplete";
    }

    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : a.name.localeCompare(b.name)
  );
}

export function AdminAttendanceTable({ rows, loading }: AdminAttendanceTableProps) {
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [search, setSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
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

  const grouped = useMemo(() => groupAdminRows(rows), [rows]);

  const filtered = useMemo(() => {
    return grouped.filter((g) => {
      const matchRole = roleFilter === "all" || g.role === roleFilter;
      const q = search.trim().toLowerCase();
      const matchSearch = !q || g.name.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [grouped, roleFilter, search]);

  const toggleRow = async (key: string, photoPath?: string | null) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    if (photoPath) loadPhotoUrl(photoPath);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b border-tunet-border"
          >
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-14 rounded-full ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <EmptyState
        glyph="team"
        icon={CalendarOff}
        title={COPY.attendance.adminEmpty.title}
        description={COPY.attendance.adminEmpty.description}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tunet-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama..."
            className="pl-9 bg-tunet-bg border-tunet-border text-tunet-text"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tunet-text-muted hover:text-tunet-text"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            if (v === "all" || v === "admin" || v === "noc" || v === "foc" || v === "marketing") {
              setRoleFilter(v);
            }
          }}
        >
          <SelectTrigger className="w-40 bg-tunet-bg border-tunet-border text-tunet-text">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-tunet-surface border-tunet-border">
            <SelectItem value="all" className="text-tunet-text">
              Semua peran
            </SelectItem>
            <SelectItem value="admin" className="text-tunet-text">
              Admin
            </SelectItem>
            <SelectItem value="noc" className="text-tunet-text">
              NOC
            </SelectItem>
            <SelectItem value="foc" className="text-tunet-text">
              FOC
            </SelectItem>
            <SelectItem value="marketing" className="text-tunet-text">
              Marketing
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

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
              <TableHead className="text-tunet-text-muted">
                {COPY.attendance.colDate}
              </TableHead>
              <TableHead className="text-tunet-text-muted">
                {COPY.attendance.photoTitle}
              </TableHead>
              <TableHead className="text-tunet-text-muted">
                {COPY.attendance.adminColBerangkat}
              </TableHead>
              <TableHead className="text-tunet-text-muted">
                {COPY.attendance.adminColPulang}
              </TableHead>
              <TableHead className="text-tunet-text-muted">
                {COPY.attendance.adminColDuration}
              </TableHead>
              <TableHead className="text-tunet-text-muted">
                {COPY.attendance.adminColStatus}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const statusMeta = (() => {
                switch (r.status) {
                  case "complete":
                    return {
                      label: COPY.attendance.adminStatusLengkap,
                      cls: "bg-tunet-green/15 text-tunet-green border-tunet-green/40",
                      Icon: Check,
                    };
                  case "anomali":
                    return {
                      label: COPY.attendance.adminStatusAnomali,
                      cls: "bg-status-overdue/15 text-status-overdue border-status-overdue/40",
                      Icon: AlertTriangle,
                    };
                  default:
                    return {
                      label: r.berangkat
                        ? COPY.attendance.adminStatusBelumPulang
                        : COPY.attendance.adminStatusBelumBerangkat,
                      cls: "bg-tunet-ember/15 text-tunet-ember border-tunet-ember/40",
                      Icon: AlertTriangle,
                    };
                }
              })();
              const roleColor =
                r.role === "admin"
                  ? "bg-tunet-green/20 text-tunet-green"
                  : r.role === "noc"
                  ? "bg-status-assigned/20 text-status-assigned"
                  : r.role === "marketing"
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-status-progress/20 text-status-progress";

              const rowKey = `${r.userId}::${r.date}`;
              const isExpanded = expandedRows.has(rowKey);
              const hasTodos = r.todos.length > 0;
              const hasPhoto = !!r.photo_file_id;
              const isExpandable = hasTodos || hasPhoto;

              return (
                <>
                  <TableRow
                    key={rowKey}
                    className={cn(
                      "border-tunet-border",
                      isExpandable && "cursor-pointer hover:bg-tunet-bg/50"
                    )}
                    onClick={isExpandable ? () => toggleRow(rowKey, r.photo_file_id) : undefined}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {isExpandable && (
                          <span className="text-tunet-text-muted">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </span>
                        )}
                        <div className="w-7 h-7 rounded-full bg-tunet-green/20 flex items-center justify-center text-tunet-green text-xs font-medium">
                          {r.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-tunet-text">{r.name}</span>
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
                    <TableCell className="text-sm text-tunet-text-muted">
                      {formatAttendanceDate(r.date)}
                    </TableCell>
                    <TableCell>
                      {r.photo_file_id ? (
                        <button
                          type="button"
                          className="flex items-center gap-1.5 text-tunet-green hover:text-tunet-green/80 transition-colors"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const url = await loadPhotoUrl(r.photo_file_id!);
                            if (url) window.open(url, "_blank", "noopener,noreferrer");
                          }}
                        >
                          <ImageIcon className="h-4 w-4" />
                          <span className="text-[11px]">Foto</span>
                        </button>
                      ) : (
                        <span className="text-tunet-text-muted text-[11px]">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono-data text-sm tabular-nums text-tunet-text">
                      {formatTimeWIB(r.berangkat)}
                    </TableCell>
                    <TableCell className="font-mono-data text-sm tabular-nums text-tunet-text">
                      {formatTimeWIB(r.pulang)}
                    </TableCell>
                    <TableCell className="font-mono-data text-sm tabular-nums text-tunet-text-muted">
                      {formatDuration(r.durationMinutes)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          statusMeta.cls
                        )}
                      >
                        <statusMeta.Icon className="h-3 w-3" />
                        {statusMeta.label}
                      </span>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (hasTodos || hasPhoto) && (
                    <TableRow key={`${rowKey}-todos`} className="border-tunet-border bg-tunet-bg/30">
                      <TableCell colSpan={8} className="px-6 py-3">
                        <div className="flex flex-wrap items-start gap-6">
                          {hasPhoto && (
                            <div>
                              <p className="text-xs font-medium text-tunet-text-muted mb-2">
                                Foto Absensi:
                              </p>
                              {photoUrls[r.photo_file_id!] ? (
                                <a
                                  href={photoUrls[r.photo_file_id!]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={photoUrls[r.photo_file_id!]}
                                    alt="Foto absensi"
                                    className="w-32 h-32 object-cover rounded-lg border border-tunet-border hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              ) : (
                                <div className="w-32 h-32 rounded-lg border border-tunet-border bg-tunet-bg flex items-center justify-center">
                                  <Skeleton className="w-full h-full" />
                                </div>
                              )}
                            </div>
                          )}
                          {hasTodos && (
                            <div className="flex items-start gap-2">
                              <ListTodo className="h-4 w-4 text-tunet-green mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-tunet-text-muted mb-1">
                                  To-Do Hari Itu:
                                </p>
                                <ul className="space-y-0.5">
                                  {r.todos.map((todo) => (
                                    <li
                                      key={todo.id}
                                      className="flex items-center gap-2 text-sm text-tunet-text"
                                    >
                                      <span className="h-1 w-1 rounded-full bg-tunet-green shrink-0" />
                                      {todo.title}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

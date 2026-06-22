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
import { AttendanceWithUser, UserRole } from "@/types";
import { formatAttendanceDate, formatTimeWIB, formatDuration } from "@/lib/time";
import { COPY } from "@/lib/copy";
import { Search, CalendarOff, Check, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminAttendanceTableProps {
  rows: AttendanceWithUser[];
  loading?: boolean;
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
      };
    if (r.type === "berangkat") existing.berangkat = r.timestamp;
    else existing.pulang = r.timestamp;

    if (existing.berangkat && existing.pulang) {
      const diff =
        new Date(existing.pulang).getTime() - new Date(existing.berangkat).getTime();
      existing.durationMinutes = Math.max(0, Math.round(diff / 60000));
      // Anomali: pulang < berangkat, or duration over 18 hours
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

  const grouped = useMemo(() => groupAdminRows(rows), [rows]);

  const filtered = useMemo(() => {
    return grouped.filter((g) => {
      const matchRole = roleFilter === "all" || g.role === roleFilter;
      const q = search.trim().toLowerCase();
      const matchSearch = !q || g.name.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [grouped, roleFilter, search]);

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
            if (v === "all" || v === "admin" || v === "noc" || v === "foc") {
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
                  : "bg-status-progress/20 text-status-progress";

              return (
                <TableRow key={`${r.userId}::${r.date}`} className="border-tunet-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
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
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

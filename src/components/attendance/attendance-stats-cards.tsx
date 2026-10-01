"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AttendanceMatrix, CellStatus } from "@/lib/attendance-matrix";
import { formatDuration } from "@/lib/time";
import { COPY } from "@/lib/copy";
import { STATUS_META } from "./attendance-status-meta";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  UserCheck,
  UserX,
  Percent,
  Timer,
  AlertTriangle,
  Users,
  Info,
} from "lucide-react";

interface AttendanceStatsCardsProps {
  matrix: AttendanceMatrix;
  loading?: boolean;
}

/** Segment order for the stacked day bar: hadir first, then absences. */
const DAY_SEGMENTS: Array<{ key: CellStatus; label: string }> = [
  { key: "lengkap", label: "Lengkap" },
  { key: "anomali", label: "Anomali" },
  { key: "alfaPagi", label: "Lupa Pagi" },
  { key: "alfaPulang", label: "Lupa Pulang" },
  { key: "alfa", label: "Alfa" },
];

/**
 * Severity tones for the KPI cards.
 *
 * Colors are drawn from the same three the matrix cells use, so the legend
 * under the grid doubles as the legend for these cards. A new color here would
 * break that link.
 */
type Tone = "neutral" | "good" | "warn" | "bad";

const TONE_STYLES: Record<Tone, { value: string; card: string; icon: string }> = {
  neutral: {
    value: "text-tunet-text",
    card: "border-tunet-border bg-tunet-bg",
    icon: "text-tunet-text-muted",
  },
  good: {
    value: "text-tunet-green",
    card: "border-tunet-green/25 bg-tunet-green/10 border-l-tunet-green",
    icon: "text-tunet-green",
  },
  warn: {
    value: "text-status-progress",
    card: "border-status-progress/25 bg-status-progress/10 border-l-status-progress",
    icon: "text-status-progress",
  },
  bad: {
    value: "text-status-overdue",
    card: "border-status-overdue/25 bg-status-overdue/10 border-l-status-overdue",
    icon: "text-status-overdue",
  },
};

/** Attendance at or above this is healthy. */
const HEALTHY_PERCENT = 85;
/** At or above this but below HEALTHY is worth a look. */
const WARNING_PERCENT = 70;

function toneForPercentage(pct: number): Tone {
  if (pct >= HEALTHY_PERCENT) return "good";
  if (pct >= WARNING_PERCENT) return "warn";
  return "bad";
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  tone?: Tone;
}) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={cn(
        "rounded-lg border border-l-[3px] p-3",
        styles.card
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 text-[11px] uppercase tracking-wide",
          tone === "neutral" ? "text-tunet-text-muted" : styles.icon
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          "mt-1.5 font-mono-data text-2xl font-semibold tabular-nums",
          styles.value
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-tunet-text-muted">{sub}</div>}
    </div>
  );
}

export function AttendanceStatsCards({ matrix, loading }: AttendanceStatsCardsProps) {
  const { totals, dates, days, people } = matrix;

  const maxDayTotal = useMemo(
    () => Math.max(1, ...days.map((d) => d.total)),
    [days]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-tunet-border bg-tunet-bg p-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-7 w-14" />
          </div>
        ))}
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <Card className="bg-tunet-surface border-tunet-border">
        <CardContent className="pt-6">
          <EmptyState
            glyph="team"
            icon={CalendarDays}
            title={COPY.attendance.adminMatrixEmpty.title}
            description={COPY.attendance.adminMatrixEmpty.description}
          />
        </CardContent>
      </Card>
    );
  }

  const totalCells = totals.scheduled * people.length;
  const personBars = people.filter((p) => p.tidakHadir > 0 || p.scheduled > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label={COPY.attendance.adminStatWorkingDays}
          value={String(totals.scheduled)}
          sub={`${people.length} karyawan`}
          icon={CalendarDays}
        />
        {/* Hadir is toned from the attendance rate, not hardcoded green: 36 of
            72 slots is 50% attendance, and a green "36" beside a red "50%" is
            self-contradictory. */}
        <StatCard
          label={COPY.attendance.adminStatHadir}
          value={String(totals.hadir)}
          sub={totalCells ? `dari ${totalCells} slot` : undefined}
          icon={UserCheck}
          tone={toneForPercentage(totals.percentage)}
        />
        <StatCard
          label={COPY.attendance.adminStatAlfa}
          value={String(totals.tidakHadir)}
          sub={`${totals.alfaPagi} lupa pagi · ${totals.alfaPulang} lupa pulang · ${totals.alfa} tanpa absen`}
          icon={UserX}
          tone={totals.tidakHadir > 0 ? "bad" : "good"}
        />
        <StatCard
          label={COPY.attendance.adminStatPercentage}
          value={`${totals.percentage}%`}
          icon={Percent}
          tone={toneForPercentage(totals.percentage)}
        />
        <StatCard
          label={COPY.attendance.adminStatAvgDuration}
          value={formatDuration(totals.averageMinutes)}
          icon={Timer}
        />
        <StatCard
          label={COPY.attendance.adminStatUnreliable}
          value={String(totals.alfaPulang)}
          sub={totals.anomali > 0 ? `+${totals.anomali} anomali` : undefined}
          icon={AlertTriangle}
          tone="warn"
        />
      </div>

      {totals.averageMinutes != null && (
        <p className="flex items-start gap-1.5 text-[11px] text-tunet-text-muted">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            {COPY.attendance.adminStatAvgDurationNote(
              totals.scheduled * people.length -
                totals.alfaPagi -
                totals.alfaPulang -
                totals.alfa -
                totals.anomali
            )}
          </span>
        </p>
      )}

      {/* Per-day stacked bar */}
      <Card className="bg-tunet-surface border-tunet-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-tunet-text">
            <CalendarDays className="h-4 w-4 text-tunet-signal" />
            Kehadiran per hari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* The chart body needs a definite height: a percentage-height bar
              inside an auto-height parent resolves to auto and collapses to
              nothing, which is why the bars rendered as hairlines. */}
          <div className="flex h-32 items-end gap-1 overflow-x-auto pb-1">
            {days.map((d) => {
              const height = (d.total / maxDayTotal) * 100;
              return (
                <div
                  key={d.date}
                  className="flex h-full w-8 shrink-0 flex-col items-center justify-end gap-1"
                  title={`${d.date} — ${d.hadir}/${d.total} hadir (${d.percentage}%)`}
                >
                  <span className="font-mono-data text-[10px] tabular-nums text-tunet-text-muted">
                    {d.percentage}
                  </span>
                  <div
                    className="flex w-full flex-col-reverse overflow-hidden rounded-sm border border-tunet-border"
                    style={{ height: `${Math.max(height, 8)}%` }}
                  >
                    {DAY_SEGMENTS.map(({ key }) => {
                      const count = d[key];
                      if (count === 0) return null;
                      return (
                        <div
                          key={key}
                          className={cn("w-full", STATUS_META[key].dot, "opacity-80")}
                          style={{ flexGrow: count }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {DAY_SEGMENTS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-1.5 text-[11px] text-tunet-text-muted">
                <span className={cn("h-2 w-2 rounded-sm", STATUS_META[key].dot)} />
                {label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-person attendance rate */}
      <Card className="bg-tunet-surface border-tunet-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-tunet-text">
            <Users className="h-4 w-4 text-tunet-signal" />
            Tingkat kehadiran per karyawan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {personBars.length === 0 && (
            <p className="text-sm text-tunet-text-muted">
              {COPY.attendance.adminMissingClean}
            </p>
          )}
          {personBars.map((p) => (
            <div key={p.userId} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-tunet-text">
                {p.name}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-tunet-bg">
                <div
                  className={cn(
                    "h-full rounded-full",
                    p.percentage >= 90
                      ? "bg-tunet-green"
                      : p.percentage >= 75
                      ? "bg-status-progress"
                      : "bg-status-overdue"
                  )}
                  style={{ width: `${p.percentage}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right font-mono-data text-[11px] tabular-nums text-tunet-text-muted">
                {p.hadir}/{p.scheduled}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

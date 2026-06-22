"use client";

import { AttendanceStats } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import { CalendarDays, Clock, Percent, Layers } from "lucide-react";

interface AttendanceStatsCardsProps {
  stats: AttendanceStats | null;
  loading?: boolean;
}

export function AttendanceStatsCards({ stats, loading }: AttendanceStatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: COPY.attendance.statThisMonth,
      value: `${stats.thisMonthDays}`,
      icon: CalendarDays,
      accent: "text-tunet-green",
    },
    {
      label: COPY.attendance.statAvgDuration,
      value: formatDuration(stats.averageDurationMinutes),
      icon: Clock,
      accent: "text-tunet-signal",
    },
    {
      label: COPY.attendance.statHadir,
      value: `${stats.hadirPercentage}%`,
      icon: Percent,
      accent: "text-tunet-ember",
    },
    {
      label: COPY.attendance.statTotal,
      value: `${stats.totalDays}`,
      icon: Layers,
      accent: "text-status-assigned",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="bg-tunet-surface border-tunet-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-tunet-text-muted">{c.label}</p>
              <c.icon className={cn("h-3.5 w-3.5", c.accent)} />
            </div>
            <p className="mt-2 font-mono-data text-2xl font-semibold tabular-nums text-tunet-text">
              {c.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

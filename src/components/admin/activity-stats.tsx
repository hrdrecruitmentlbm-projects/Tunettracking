"use client";

import { Card, CardContent } from "@/components/ui/card";
import { COPY } from "@/lib/copy";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCard {
  label: string;
  value: number;
  delta: number;
  color: string;
}

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUp className="w-3.5 h-3.5 text-tunet-green" />;
  if (delta < 0) return <TrendingDown className="w-3.5 h-3.5 text-status-overdue" />;
  return <Minus className="w-3.5 h-3.5 text-tunet-text-muted" />;
}

function TrendText({ delta }: { delta: number }) {
  const sign = delta > 0 ? "+" : "";
  return (
    <span
      className={`text-[10px] font-mono tabular-nums ${
        delta > 0
          ? "text-tunet-green"
          : delta < 0
          ? "text-status-overdue"
          : "text-tunet-text-muted"
      }`}
    >
      {sign}{delta} {COPY.pages.admin.vsYesterday}
    </span>
  );
}

interface ActivityStatsProps {
  newToday: number;
  newYesterday: number;
  completedToday: number;
  completedYesterday: number;
  activeToday: number;
  activeYesterday: number;
}

export function ActivityStats({
  newToday,
  newYesterday,
  completedToday,
  completedYesterday,
  activeToday,
  activeYesterday,
}: ActivityStatsProps) {
  const stats: StatCard[] = [
    {
      label: COPY.pages.admin.newToday,
      value: newToday,
      delta: newToday - newYesterday,
      color: "text-tunet-signal",
    },
    {
      label: COPY.pages.admin.completedToday,
      value: completedToday,
      delta: completedToday - completedYesterday,
      color: "text-tunet-green",
    },
    {
      label: COPY.pages.admin.activeToday,
      value: activeToday,
      delta: activeToday - activeYesterday,
      color: "text-status-assigned",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="bg-tunet-surface border-tunet-border">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-tunet-text-muted">
              {s.label}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className={`font-display text-2xl font-semibold tabular-nums ${s.color}`}>
                {s.value}
              </p>
              <div className="flex items-center gap-1">
                <TrendIcon delta={s.delta} />
                <TrendText delta={s.delta} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

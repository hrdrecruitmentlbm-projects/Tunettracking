"use client";

import { Task, TaskStatus, STATUS_CONFIG } from "@/types";
import { cn } from "@/lib/utils";

interface PipelineBarProps {
  tasks: Task[];
  completedToday: number;
  className?: string;
}

const ORDER: TaskStatus[] = ["assigned", "in_progress", "review", "done"];

export function PipelineBar({ tasks, completedToday, className }: PipelineBarProps) {
  const total = tasks.length || 1;
  const counts = Object.fromEntries(
    ORDER.map((s) => [s, tasks.filter((t) => t.status === s).length])
  ) as Record<TaskStatus, number>;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-medium text-tunet-text">Alur Tugas</p>
          <p className="text-xs text-tunet-text-muted">
            {tasks.length} total · {counts.done} selesai · {counts.in_progress} berjalan
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold tabular-nums text-tunet-text">
            {completedToday}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-tunet-text-muted">
            Selesai hari ini
          </p>
        </div>
      </div>

      {/* The bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-tunet-surface-hover">
        {ORDER.map((s) => {
          const pct = (counts[s] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={s}
              className="h-full transition-all duration-500 ease-out first:rounded-l-full last:rounded-r-full"
              style={{ width: `${pct}%`, backgroundColor: STATUS_CONFIG[s].color }}
              title={`${STATUS_CONFIG[s].label}: ${counts[s]}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {ORDER.map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: STATUS_CONFIG[s].color }}
            />
            <span className="text-tunet-text-muted">{STATUS_CONFIG[s].label}</span>
            <span className="font-mono tabular-nums text-tunet-text">{counts[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

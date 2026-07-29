"use client";

import { useMemo } from "react";
import { Task, STATUS_CONFIG } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";

interface TimelineViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const DAY_MS = 86400000;
const DAY_W = 32;
const ROW_H = 28;
const BAR_H = 20;
const ROW_GAP = 4;
const PAD_LEFT = 16;
const LABEL_W = 110;

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#6B7280",
};

function toMidnight(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function TimelineView({ tasks, onTaskClick }: TimelineViewProps) {
  const { grouped, noDeadlineTasks, rangeStart, totalDays, todayOffset } = useMemo(() => {
    const now = new Date();
    const todayMs = toMidnight(now);
    const noDeadline: Task[] = [];
    const grouped: Record<string, Task[]> = {};
    let earliest = Infinity;
    let latest = -Infinity;

    for (const t of tasks) {
      if (!t.deadline) { noDeadline.push(t); continue; }
      (grouped[t.status] ??= []).push(t);
      const createdMs = new Date(t.created_at).getTime();
      const deadlineMs = new Date(t.deadline).getTime();
      if (createdMs < earliest) earliest = createdMs;
      if (deadlineMs > latest) latest = deadlineMs;
    }

    const start = earliest === Infinity ? todayMs - 7 * DAY_MS : Math.min(earliest, todayMs - 3 * DAY_MS);
    const end = latest === -Infinity ? todayMs + 7 * DAY_MS : Math.max(latest, todayMs + 3 * DAY_MS);
    const days = Math.ceil((end - start) / DAY_MS);
    const todayOff = Math.floor((todayMs - start) / DAY_MS);

    return { grouped, noDeadlineTasks: noDeadline, rangeStart: start, totalDays: days, todayOffset: todayOff };
  }, [tasks]);

  const totalW = totalDays * DAY_W + PAD_LEFT;

  // ponytail: simple day interval based on range
  const dayInterval = totalDays > 60 ? 14 : totalDays > 30 ? 7 : totalDays > 14 ? 3 : 1;
  const dayLabels = useMemo(() => {
    const labels: { day: number; label: string }[] = [];
    for (let d = 0; d < totalDays; d += dayInterval) {
      const date = new Date(rangeStart + d * DAY_MS);
      labels.push({ day: d, label: date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) });
    }
    return labels;
  }, [rangeStart, totalDays, dayInterval]);

  return (
    <div className="h-full w-full overflow-auto">
      {Object.keys(grouped).length === 0 && noDeadlineTasks.length === 0 ? (
        <p className="py-12 text-center text-sm text-tunet-text-muted">{COPY.taskList.emptyMessage}</p>
      ) : (
        <div className="relative" style={{ minWidth: totalW + LABEL_W }}>
          {/* day headers */}
          <div className="sticky top-0 z-10 flex bg-tunet-bg" style={{ height: ROW_H, marginLeft: LABEL_W }}>
            <div className="relative flex-1">
              {dayLabels.map(({ day, label }) => (
                <div
                  key={day}
                  className="absolute text-[10px] text-tunet-text-muted"
                  style={{ left: PAD_LEFT + day * DAY_W, top: 8, whiteSpace: "nowrap" }}
                >
                  {label}
                </div>
              ))}
              {/* today marker */}
              <div
                className="absolute top-0 w-px h-full border-l border-dashed border-status-overdue/60"
                style={{ left: PAD_LEFT + todayOffset * DAY_W }}
              />
            </div>
          </div>

          {/* status rows */}
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const statusTasks = grouped[status] || [];
            if (statusTasks.length === 0) return null;
            const rowHeight = statusTasks.length * (ROW_H + ROW_GAP) + ROW_GAP;
            return (
              <div key={status} className="flex border-b border-tunet-border/40 last:border-0">
                <div
                  className="sticky left-0 z-10 flex shrink-0 items-center gap-2 bg-tunet-bg pr-3 text-xs font-medium text-tunet-text"
                  style={{ width: LABEL_W, minHeight: rowHeight }}
                >
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                  <span className="truncate">{config.label}</span>
                  <span className="font-mono text-[10px] tabular-nums text-tunet-text-muted">{statusTasks.length}</span>
                </div>
                <div className="relative flex-1" style={{ minHeight: rowHeight }}>
                  {statusTasks.map((task, idx) => {
                    const left = PAD_LEFT + Math.floor((new Date(task.created_at).getTime() - rangeStart) / DAY_MS) * DAY_W;
                    const width = Math.max(DAY_W, Math.floor((new Date(task.deadline!).getTime() - new Date(task.created_at).getTime()) / DAY_MS) * DAY_W);
                    return (
                      <TooltipProvider key={task.id}>
                        <Tooltip>
                          <TooltipTrigger>
                            <button
                              type="button"
                              onClick={() => onTaskClick?.(task)}
                              className={cn(
                                "absolute left-0 rounded-[3px] transition-opacity hover:opacity-80",
                                task.status === "done" && "opacity-45"
                              )}
                              style={{
                                left,
                                top: ROW_GAP + idx * (ROW_H + ROW_GAP),
                                width: Math.max(width, 4),
                                height: BAR_H,
                                backgroundColor: PRIORITY_COLORS[task.priority] || "#6B7280",
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="text-xs max-w-48">
                            <p className="font-medium text-tunet-text">{task.title}</p>
                            <p className="text-tunet-text-muted mt-0.5">{task.assignee?.name || COPY.taskList.unassigned}</p>
                            <p className="text-tunet-text-muted">{task.deadline ? new Date(task.deadline).toLocaleDateString("id-ID") : "—"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* tasks without deadline */}
          {noDeadlineTasks.length > 0 && (
            <div className="flex border-t border-tunet-border/60">
              <div className="flex shrink-0 items-center gap-2 bg-tunet-bg pr-3 text-xs text-tunet-text-muted"
                style={{ width: LABEL_W, minHeight: ROW_H + 8 }}>
                <span>Tanpa tenggat</span>
                <span className="font-mono text-[10px]">{noDeadlineTasks.length}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 px-4 py-2">
                {noDeadlineTasks.map(task => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onTaskClick?.(task)}
                    className="rounded-md border border-tunet-border bg-tunet-surface px-2 py-1 text-xs text-tunet-text-muted hover:border-tunet-signal/40 hover:text-tunet-text transition-colors truncate max-w-40"
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

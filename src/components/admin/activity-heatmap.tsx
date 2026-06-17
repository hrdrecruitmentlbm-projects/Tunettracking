"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

interface ActivityHeatmapProps {
  data: HeatmapCell[];
  className?: string;
}

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function ActivityHeatmap({ data, className }: ActivityHeatmapProps) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const get = (day: number, hour: number) =>
    data.find((d) => d.day === day && d.hour === hour)?.count ?? 0;

  return (
    <TooltipProvider>
      <div className={cn("space-y-2", className)}>
        <div className="flex items-baseline justify-between">
          <p className="font-display text-sm font-medium text-tunet-text">
            Aktivitas Tim (7 hari terakhir)
          </p>
          <div className="flex items-center gap-2 text-[10px] text-tunet-text-muted">
            <span>Sepi</span>
            <div className="flex gap-0.5">
              {[0.15, 0.35, 0.6, 0.85, 1].map((op) => (
                <div
                  key={op}
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: `rgba(34, 211, 238, ${op})` }}
                />
              ))}
            </div>
            <span>Padat</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hour labels (top axis) */}
            <div className="flex pl-8 mb-1">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="flex-1 text-center text-[9px] font-mono tabular-nums text-tunet-text-muted/60"
                >
                  {h % 4 === 0 ? h.toString().padStart(2, "0") : ""}
                </div>
              ))}
            </div>

            {DAYS.map((day, dayIdx) => (
              <div key={day} className="flex items-center mb-0.5">
                <div className="w-8 text-[10px] text-tunet-text-muted">{day}</div>
                <div className="flex flex-1 gap-0.5">
                  {HOURS.map((h) => {
                    const v = get(dayIdx, h);
                    const op = v === 0 ? 0.04 : 0.15 + (v / max) * 0.85;
                    return (
                      <Tooltip key={h}>
                        <TooltipTrigger
                          className="flex-1 h-3.5 rounded-sm transition-transform hover:scale-110 p-0 m-0 bg-transparent border-0 cursor-default"
                          style={{ background: `rgba(34, 211, 238, ${op})` }}
                        />
                        <TooltipContent
                          side="top"
                          className="bg-tunet-surface border-tunet-border text-xs"
                        >
                          {day}, {h.toString().padStart(2, "0")}:00 · {v} aktivitas
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

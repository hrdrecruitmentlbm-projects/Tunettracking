"use client";

import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

interface DailyActivityChartProps {
  data: { date: string; count: number }[];
  className?: string;
}

export function DailyActivityChart({ data, className }: DailyActivityChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const days = data.length;
  const barWidth = Math.max(8, Math.min(24, Math.floor(280 / days)));
  const gap = Math.max(2, Math.floor(barWidth * 0.3));
  const chartHeight = 120;
  const padBottom = 20;
  const padTop = 8;
  const innerH = chartHeight - padTop - padBottom;
  const svgWidth = days * (barWidth + gap) + gap;

  const formatLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const d = new Date(dateStr + "T00:00:00");
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <p className="font-display text-sm font-medium text-tunet-text">
          {COPY.pages.admin.dailyActivity}
        </p>
        <p className="text-[10px] text-tunet-text-muted">
          {COPY.pages.admin.dailyActivitySub(days)}
        </p>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={svgWidth}
          height={chartHeight}
          viewBox={`0 0 ${svgWidth} ${chartHeight}`}
          className="overflow-visible"
        >
          {/* Bars */}
          {data.map((d, i) => {
            const barH = max > 0 ? (d.count / max) * innerH : 0;
            const x = gap + i * (barWidth + gap);
            const y = padTop + innerH - barH;
            const today = isToday(d.date);

            return (
              <g key={d.date}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barH, d.count > 0 ? 2 : 0)}
                  rx={2}
                  className={today ? "fill-tunet-signal" : "fill-tunet-signal/40"}
                />

                {/* Count label on top of bar */}
                {d.count > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize="9"
                    className="fill-tunet-text-muted font-mono tabular-nums"
                  >
                    {d.count}
                  </text>
                )}

                {/* Date label */}
                {i % Math.max(1, Math.floor(days / 7)) === 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    fontSize="9"
                    className={cn(
                      "font-mono",
                      today ? "fill-tunet-signal font-medium" : "fill-tunet-text-muted"
                    )}
                  >
                    {formatLabel(d.date)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Baseline */}
          <line
            x1={0}
            y1={padTop + innerH}
            x2={svgWidth}
            y2={padTop + innerH}
            className="stroke-tunet-border"
            strokeWidth={1}
          />
        </svg>
      </div>
    </div>
  );
}

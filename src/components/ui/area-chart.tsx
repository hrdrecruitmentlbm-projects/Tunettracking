"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AreaChartProps {
  /** Primary series, oldest -> newest. Length N. */
  data: number[];
  /** Optional secondary series of equal length, drawn under the primary as a faint reference. */
  baseline?: number[];
  width?: number;
  height?: number;
  /** Tailwind text color class for the primary stroke (e.g. "text-tunet-signal"). */
  strokeClass?: string;
  showAxis?: boolean;
  className?: string;
}

export function AreaChart({
  data,
  baseline,
  width = 480,
  height = 140,
  strokeClass = "text-tunet-signal",
  showAxis = true,
  className,
}: AreaChartProps) {
  const gradId = React.useId();
  const all = [...data, ...(baseline ?? [])];
  const max = Math.max(1, ...all);
  const padX = 2;
  const padTop = 8;
  const padBottom = showAxis ? 18 : 4;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const toPoints = (series: number[]) => {
    const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;
    return series.map((v, i) => {
      const x = padX + i * stepX;
      const y = padTop + innerH - (v / max) * innerH;
      return [x, y] as const;
    });
  };

  const buildPath = (pts: readonly (readonly [number, number])[]) => {
    if (pts.length === 0) return { line: "", area: "" };
    const line = pts
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");
    const last = pts[pts.length - 1];
    const first = pts[0];
    const area = `${line} L${last[0].toFixed(1)} ${(padTop + innerH).toFixed(
      1
    )} L${first[0].toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`;
    return { line, area };
  };

  const primary = toPoints(data);
  const primaryPath = buildPath(primary);
  const baselinePts = baseline ? toPoints(baseline) : [];
  const baselinePath = buildPath(baselinePts);
  const last = primary[primary.length - 1];
  const lastVal = data[data.length - 1] ?? 0;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" className={strokeClass} />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" className={strokeClass} />
        </linearGradient>
      </defs>

      {/* Baseline (faint) */}
      {baseline && (
        <path
          d={baselinePath.line}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="2 3"
          className="text-tunet-text-muted/40"
        />
      )}

      {/* Primary fill */}
      <path d={primaryPath.area} fill={`url(#${gradId})`} className={strokeClass} />

      {/* Primary line */}
      <path
        d={primaryPath.line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeClass}
      />

      {/* Endpoint dot + value */}
      {last && (
        <g>
          <circle
            cx={last[0]}
            cy={last[1]}
            r={6}
            fill="currentColor"
            className={`${strokeClass} opacity-15`}
          />
          <circle cx={last[0]} cy={last[1]} r={2.5} fill="currentColor" className={strokeClass} />
          <text
            x={last[0]}
            y={last[1] - 10}
            textAnchor="middle"
            className="fill-tunet-text font-mono tabular-nums"
            fontSize="10"
          >
            {lastVal}
          </text>
        </g>
      )}

      {/* X axis ticks */}
      {showAxis && (
        <g>
          {[0, Math.floor(data.length / 2), data.length - 1].map((i) => {
            const x = primary[i]?.[0] ?? 0;
            return (
              <text
                key={i}
                x={x}
                y={height - 4}
                textAnchor="middle"
                fontSize="9"
                className="fill-tunet-text-muted font-mono"
              >
                {i === 0
                  ? "14h lalu"
                  : i === data.length - 1
                  ? "hari ini"
                  : `${data.length - i}h`}
              </text>
            );
          })}
        </g>
      )}
    </svg>
  );
}

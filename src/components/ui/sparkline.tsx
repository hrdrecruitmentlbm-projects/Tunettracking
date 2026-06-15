"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
  showDots?: boolean
  className?: string
}

function Sparkline({
  data,
  width = 120,
  height = 32,
  stroke = "currentColor",
  fill = "currentColor",
  showDots = false,
  className,
}: SparklineProps) {
  const gradientId = React.useId();

  if (!data || data.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center text-tunet-text-muted", className)}
        style={{ width, height }}
      >
        <span className="text-[10px]">—</span>
      </div>
    );
  }

  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((v, i) => {
    const x = padding + i * stepX;
    const y = padding + innerH - ((v - min) / range) * innerH;
    return { x, y, value: v };
  });

  const pathLine = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const pathArea =
    points.length > 0
      ? `${pathLine} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : "";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.25" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      {pathArea && <path d={pathArea} fill={`url(#${gradientId})`} />}
      <path
        d={pathLine}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots &&
        points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={1.5}
            fill={stroke}
          />
        ))}
    </svg>
  )
}

interface TrendBadgeProps {
  data: number[]
  className?: string
}

function TrendBadge({ data, className }: TrendBadgeProps) {
  if (!data || data.length < 2) {
    return null
  }

  const first = data[0]
  const last = data[data.length - 1]
  const delta = last - first
  const pct = first === 0 ? (last > 0 ? 100 : 0) : Math.round((delta / first) * 100)

  let Icon = Minus
  let colorClass = "text-tunet-text-muted"

  if (delta > 0) {
    Icon = TrendingUp
    colorClass = "text-tunet-green"
  } else if (delta < 0) {
    Icon = TrendingDown
    colorClass = "text-status-overdue"
  }

  return (
    <div className={cn("flex items-center gap-1 text-xs", colorClass, className)}>
      <Icon className="w-3 h-3" />
      <span className="font-medium">
        {delta > 0 ? "+" : ""}
        {pct}%
      </span>
    </div>
  )
}

export { Sparkline, TrendBadge }

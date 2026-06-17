"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  /** 0..1 */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Tailwind text-* color class for the stroke (e.g. "text-tunet-signal"). */
  colorClass?: string;
  trackClass?: string;
  label?: string;
  className?: string;
}

export function ProgressRing({
  value,
  size = 32,
  strokeWidth = 3,
  colorClass = "text-tunet-signal",
  trackClass = "text-tunet-surface-hover",
  label,
  className,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  const offset = c * (1 - clamped);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackClass}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-700 ease-out", colorClass)}
        />
      </svg>
      {label && (
        <span className="absolute font-mono tabular-nums text-[9px] text-tunet-text">
          {label}
        </span>
      )}
    </div>
  );
}

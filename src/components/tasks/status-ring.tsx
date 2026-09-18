"use client";

import { Check } from "lucide-react";
import { STATUS_CONFIG, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusRingProps {
  status: TaskStatus;
  /** When set, the ring renders as a button (advance / open menu). */
  onClick?: () => void;
  ariaLabel?: string;
  title?: string;
  /** Expand the hit area without shifting layout — mobile targets need 44px. */
  expandedHitArea?: boolean;
  className?: string;
}

/**
 * Mockup-style status ring: a colored circle that fills with a check once the
 * task is done. Purely presentational — callers decide whether a tap advances
 * a status (FOC) or opens a status menu (admin/NOC).
 */
export function StatusRing({
  status,
  onClick,
  ariaLabel,
  title,
  expandedHitArea = false,
  className,
}: StatusRingProps) {
  const color = STATUS_CONFIG[status].color;
  const done = status === "done";

  const visual = (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors motion-reduce:transition-none",
        done && "shadow-[0_0_10px_rgba(16,185,129,0.35)]"
      )}
      style={{ borderColor: color, backgroundColor: done ? color : "transparent" }}
    >
      {done && <Check className="size-3 text-white" strokeWidth={3} />}
    </span>
  );

  if (!onClick) {
    return (
      <span className={cn("inline-flex", className)} role="img" aria-label={ariaLabel} title={title}>
        {visual}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      className={cn(
        "inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-tunet-signal",
        expandedHitArea && "p-2 -m-2",
        className
      )}
    >
      {visual}
    </button>
  );
}

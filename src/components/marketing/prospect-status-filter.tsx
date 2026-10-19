"use client";

import { ProspectStatusConfig } from "@/types";
import { cn } from "@/lib/utils";

interface ProspectStatusFilterProps {
  statuses: ProspectStatusConfig[];
  /** Active status key, or "all" */
  value: string;
  onChange: (value: string) => void;
  /** Row counts keyed by status key */
  counts: Record<string, number>;
  /** Count for the "Semua" chip */
  total: number;
  className?: string;
}

/**
 * Status chips for the marketing prospect tables. Sits under the tabs so the
 * current filter is visible at a glance (the old dropdown hid the options).
 * Labels/colors come from Settings > Label Status Prospek.
 */
export function ProspectStatusFilter({
  statuses,
  value,
  onChange,
  counts,
  total,
  className,
}: ProspectStatusFilterProps) {
  return (
    <div
      role="group"
      aria-label="Filter status prospek"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      <FilterChip
        label="Semua"
        count={total}
        color="#94A3B8"
        active={value === "all"}
        onClick={() => onChange("all")}
      />
      {statuses.map((status) => (
        <FilterChip
          key={status.key}
          label={status.label}
          count={counts[status.key] ?? 0}
          color={status.color}
          active={value === status.key}
          onClick={() => onChange(status.key)}
        />
      ))}
    </div>
  );
}

function FilterChip({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors motion-reduce:transition-none",
        active
          ? "text-tunet-text"
          : "border-tunet-border bg-tunet-surface text-tunet-text-muted hover:bg-tunet-surface-hover hover:text-tunet-text"
      )}
      style={
        active
          ? { backgroundColor: color + "26", borderColor: color + "80" }
          : undefined
      }
    >
      <span
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span>{label}</span>
      <span className={cn("tabular-nums", active ? "text-tunet-text-muted" : "text-tunet-text-muted/70")}>
        {count}
      </span>
    </button>
  );
}

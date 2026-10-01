import { CellStatus } from "@/lib/attendance-matrix";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

/**
 * Presentation for each attendance status. Shared by the matrix grid, the
 * legend, and the missing-attendance list so the three never drift apart.
 *
 * Color alone cannot separate the three absence states at a glance, so each
 * one also carries a distinct pattern and glyph. `alfaPagi` (pulang recorded,
 * no berangkat) gets the loudest treatment because its hours-worked are
 * unknowable and the record is internally inconsistent.
 */

export interface StatusMeta {
  label: string;
  description: string;
  /** Cell background + border. */
  cell: string;
  /** Small solid dot/badge color. */
  dot: string;
  /** Badge text + background for tables. */
  badge: string;
  /** Glyph rendered inside the matrix cell. */
  glyph: string;
  /** Counts toward "hadir". */
  isHadir: boolean;
  /** Dashed ring to draw attention in a wide grid. */
  ring?: boolean;
}

export const STATUS_META: Record<CellStatus, StatusMeta> = {
  lengkap: {
    label: COPY.attendance.adminStatusLengkap,
    description: COPY.attendance.adminStatusLengkapLong,
    cell: "bg-tunet-green/25 border-tunet-green/50 hover:bg-tunet-green/35",
    dot: "bg-tunet-green",
    badge: "bg-tunet-green/15 text-tunet-green border-tunet-green/40",
    glyph: "✓",
    isHadir: true,
  },
  anomali: {
    label: COPY.attendance.adminStatusAnomali,
    description: COPY.attendance.adminStatusAnomaliLong,
    cell: "bg-status-progress/25 border-status-progress/50 hover:bg-status-progress/35",
    dot: "bg-status-progress",
    badge: "bg-status-progress/15 text-status-progress border-status-progress/40",
    glyph: "⏱",
    isHadir: true,
  },
  alfaPagi: {
    label: COPY.attendance.adminStatusAlphaPagi,
    description: COPY.attendance.adminStatusAlphaPagiLong,
    // Dashed ring: findable at a glance in a wide grid.
    cell: "bg-status-overdue/30 border-status-overdue ring-1 ring-status-overdue/70 ring-offset-1 ring-offset-tunet-surface hover:bg-status-overdue/40",
    dot: "bg-status-overdue",
    badge:
      "bg-status-overdue/20 text-status-overdue border-status-overdue/60 font-semibold",
    glyph: "⚠",
    isHadir: false,
    ring: true,
  },
  alfaPulang: {
    label: COPY.attendance.adminStatusAlphaPulang,
    description: COPY.attendance.adminStatusAlphaPulangLong,
    cell: "bg-status-overdue/15 border-status-overdue/60 hover:bg-status-overdue/25",
    dot: "bg-status-overdue/70",
    badge: "bg-status-overdue/10 text-status-overdue border-status-overdue/40",
    glyph: "◐",
    isHadir: false,
  },
  alfa: {
    label: COPY.attendance.adminStatusAlphaFull,
    description: COPY.attendance.adminStatusAlphaLong,
    cell: "bg-status-overdue/10 border-dashed border-status-overdue/50 hover:bg-status-overdue/20",
    dot: "bg-status-overdue/50",
    badge: "bg-status-overdue/10 text-status-overdue border-status-overdue/30",
    glyph: "✗",
    isHadir: false,
  },
};

/** Filter chip order. `all` first, then the problem cases worst-first. */
export const STATUS_FILTER_ORDER: Array<CellStatus | "all"> = [
  "all",
  "alfaPagi",
  "alfaPulang",
  "alfa",
  "anomali",
  "lengkap",
];

export function filterLabel(status: CellStatus | "all"): string {
  if (status === "all") return COPY.attendance.adminFilterAll;
  return STATUS_META[status].label;
}

export function statusBadgeClass(status: CellStatus): string {
  return cn(
    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
    STATUS_META[status].badge
  );
}

import { COPY } from "./copy";

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return COPY.time.justNow;
  if (diffMins < 60) return COPY.time.minutesAgo(diffMins);
  if (diffHours < 24) return COPY.time.hoursAgo(diffHours);
  return COPY.time.daysAgo(diffDays);
}

export interface TimeRemaining {
  label: string;
  isOverdue: boolean;
  isUrgent: boolean;
  short: string;
}

export function getTimeRemaining(deadline: string | null | undefined): TimeRemaining | null {
  if (!deadline) return null;

  const now = new Date();
  const target = new Date(deadline);
  const diffMs = target.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const mins = Math.floor(absMs / (1000 * 60));
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  const isUrgent = !isOverdue && diffMs < 24 * 60 * 60 * 1000;

  let label: string;
  let short: string;

  if (mins < 60) {
    label = isOverdue
      ? COPY.time.overdueBy(`${mins} menit`)
      : COPY.time.inMinutes(mins);
    short = isOverdue ? `-${mins}m` : `${mins}m`;
  } else if (hours < 24) {
    label = isOverdue
      ? COPY.time.overdueBy(`${hours} jam`)
      : COPY.time.inHours(hours);
    short = isOverdue ? `-${hours}j` : `${hours}j`;
  } else {
    label = isOverdue
      ? COPY.time.overdueBy(`${days} hari`)
      : COPY.time.inDays(days);
    short = isOverdue ? `-${days}h` : `${days}h`;
  }

  if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000 && hours === 0) {
    label = COPY.time.dueToday;
  }

  return { label, isOverdue, isUrgent, short };
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export function formatLongDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

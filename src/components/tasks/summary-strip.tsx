"use client";

import { COPY } from "@/lib/copy";

interface SummaryStripProps {
  total: number;
  critical: number;
  overdue: number;
  inProgress: number;
  done: number;
}

export function SummaryStrip({ total, critical, overdue, inProgress, done }: SummaryStripProps) {
  if (total === 0) return null;
  return (
    <div className="flex items-center gap-3 md:gap-5 overflow-x-auto px-1 py-2 text-xs text-tunet-text-muted">
      <span className="shrink-0 font-medium text-tunet-text">{COPY.summaryStrip.total(total)}</span>
      {critical > 0 && <span className="shrink-0 text-priority-critical">{COPY.summaryStrip.urgent(critical)}</span>}
      {overdue > 0 && <span className="shrink-0 text-status-overdue">{COPY.summaryStrip.overdue(overdue)}</span>}
      {inProgress > 0 && <span className="shrink-0 text-status-progress">{COPY.summaryStrip.inProgress(inProgress)}</span>}
      {done > 0 && <span className="shrink-0 text-status-done">{COPY.summaryStrip.done(done)}</span>}
    </div>
  );
}

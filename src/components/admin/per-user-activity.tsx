"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@/types";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface PerUserActivityProps {
  users: User[];
  tasks: { assigned_to?: string; status: string; deadline?: string }[];
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-tunet-green",
  noc: "bg-status-assigned",
  foc: "bg-status-progress",
  marketing: "bg-purple-500",
  finance: "bg-teal-500",
};

export function PerUserActivity({ users, tasks }: PerUserActivityProps) {
  const now = new Date();
  // Build per-user stats: task count + completed count + active overdue count
  const userStats = users
    .map((u) => {
      const myTasks = tasks.filter((t) => t.assigned_to === u.id);
      const done = myTasks.filter((t) => t.status === "done").length;
      const overdue = myTasks.filter(
        (t) => t.deadline && t.status !== "done" && new Date(t.deadline) < now
      ).length;
      const total = myTasks.length;
      const rate = total > 0 ? done / total : 0;
      return { user: u, total, done, overdue, rate };
    })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total);

  const maxTotal = Math.max(1, ...userStats.map((s) => s.total));

  if (userStats.length === 0) {
    return (
      <Card className="bg-tunet-surface border-tunet-border">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-tunet-text">
            {COPY.pages.admin.perUserActivity}
          </CardTitle>
          <Link
            href="/dashboard/admin/rapot"
            className="inline-flex items-center gap-1 text-xs font-medium text-tunet-signal hover:underline"
          >
            Rapot Karyawan
            <ArrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-tunet-text-muted text-center py-6">
            {COPY.pages.admin.noPingsYet}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-tunet-surface border-tunet-border">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-medium text-tunet-text">
          {COPY.pages.admin.perUserActivity}
        </CardTitle>
        <Link
          href="/dashboard/admin/rapot"
          className="inline-flex items-center gap-1 text-xs font-medium text-tunet-signal hover:underline"
        >
          Rapot Karyawan
          <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {userStats.map((s) => (
          <div key={s.user.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    ROLE_COLORS[s.user.role] ?? "bg-tunet-text-muted"
                  )}
                />
                <span className="text-sm text-tunet-text truncate">{s.user.name}</span>
                <span className="text-[10px] text-tunet-text-muted uppercase">
                  {s.user.role}
                </span>
                {s.overdue > 0 && (
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-500/15 text-red-400">
                    {s.overdue} terlambat
                  </span>
                )}
              </div>
              <span className="text-xs font-mono tabular-nums text-tunet-text-muted whitespace-nowrap ml-2">
                {s.done}/{s.total} {COPY.pages.admin.tasksAssigned} · {Math.round(s.rate * 100)}% {COPY.pages.admin.completionRate}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-tunet-surface-hover overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(s.total / maxTotal) * 100}%`,
                  backgroundColor:
                    s.overdue > 0
                      ? "#F59E0B"
                      : s.rate >= 0.8
                      ? "#10B981"
                      : s.rate >= 0.5
                      ? "#22D3EE"
                      : "#F97316",
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@/types";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

interface PerUserActivityProps {
  users: User[];
  tasks: { assigned_to?: string; status: string }[];
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-tunet-green",
  noc: "bg-status-assigned",
  foc: "bg-status-progress",
  marketing: "bg-purple-500",
};

export function PerUserActivity({ users, tasks }: PerUserActivityProps) {
  // Build per-user stats: task count + completed count
  const userStats = users
    .map((u) => {
      const myTasks = tasks.filter((t) => t.assigned_to === u.id);
      const done = myTasks.filter((t) => t.status === "done").length;
      const total = myTasks.length;
      const rate = total > 0 ? done / total : 0;
      return { user: u, total, done, rate };
    })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total);

  const maxTotal = Math.max(1, ...userStats.map((s) => s.total));

  if (userStats.length === 0) {
    return (
      <Card className="bg-tunet-surface border-tunet-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-tunet-text">
            {COPY.pages.admin.perUserActivity}
          </CardTitle>
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
      <CardHeader>
        <CardTitle className="text-sm font-medium text-tunet-text">
          {COPY.pages.admin.perUserActivity}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {userStats.map((s) => (
          <div key={s.user.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
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
                    s.rate >= 0.8
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

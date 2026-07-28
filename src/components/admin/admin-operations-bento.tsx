"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, Clock, Radio, Users } from "lucide-react";
import { ActivityStats } from "@/components/admin/activity-stats";
import { PerUserActivity } from "@/components/admin/per-user-activity";
import { PipelineBar } from "@/components/admin/pipeline-bar";
import { AreaChart } from "@/components/ui/area-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendBadge } from "@/components/ui/sparkline";
import { COPY } from "@/lib/copy";
import { getTimeRemaining } from "@/lib/time";
import { Task, User } from "@/types";

interface AdminOperationsBentoProps {
  users: User[];
  tasks: Task[];
  trendCurrent: number[];
  trendBaseline?: number[];
  activeCount: number;
  activeTasks: number;
  overdueTasks: number;
  completedToday: number;
  completedYesterday: number;
  newToday: number;
  newYesterday: number;
  activeToday: number;
  activeYesterday: number;
  roleCounts: {
    noc: number;
    foc: number;
    marketing: number;
  };
}

export function AdminOperationsBento({
  users,
  tasks,
  trendCurrent,
  trendBaseline,
  activeCount,
  activeTasks,
  overdueTasks,
  completedToday,
  completedYesterday,
  newToday,
  newYesterday,
  activeToday,
  activeYesterday,
  roleCounts,
}: AdminOperationsBentoProps) {
  const expiringTasks = tasks
    .filter((task) => task.status !== "done" && task.deadline && !task.deleted_at)
    .sort(
      (first, second) =>
        new Date(first.deadline!).getTime() - new Date(second.deadline!).getTime()
    )
    .slice(0, 5);

  return (
    <section
      aria-label="Ringkasan operasi"
      className="mx-auto grid max-w-[100rem] grid-flow-dense grid-cols-1 gap-3 p-4 md:p-6 lg:grid-cols-12"
    >
      <Card className="border-tunet-border bg-tunet-surface lg:col-span-8 lg:min-h-[22rem]">
        <CardHeader className="border-b border-tunet-border/70">
          <div>
            <p className="mb-1 text-xs font-medium tracking-[0.14em] text-tunet-ember">
              Intervensi sekarang
            </p>
            <CardTitle className="text-xl tracking-tight text-tunet-text">
              Pekerjaan yang membutuhkan perhatian
            </CardTitle>
          </div>
          <Link
            href="/dashboard/tasks"
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-tunet-text-muted transition-colors hover:bg-tunet-surface-hover hover:text-tunet-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tunet-signal"
          >
            Semua tugas
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </CardHeader>
        <CardContent className="pt-1">
          {expiringTasks.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Tidak ada tenggat mendesak"
              description="Tugas dengan tenggat terdekat akan muncul di sini."
              variant="inline"
            />
          ) : (
            <div className="flex flex-col">
              {expiringTasks.map((task, index) => {
                const remaining = getTimeRemaining(task.deadline);
                return (
                  <Link
                    key={task.id}
                    href={`/dashboard/tasks?highlight=${task.id}`}
                    className="group flex min-h-14 items-center gap-4 border-b border-tunet-border/60 py-3 last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tunet-signal"
                  >
                    <span className="font-mono text-xs tabular-nums text-tunet-text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-tunet-text transition-colors group-hover:text-tunet-signal">
                        {task.title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-tunet-text-muted">
                        {task.assignee?.name || COPY.taskCard.unassigned} · {task.location_name}
                      </span>
                    </span>
                    {remaining && (
                      <span
                        className={
                          remaining.isOverdue
                            ? "font-mono text-xs tabular-nums text-status-overdue"
                            : remaining.isUrgent
                              ? "font-mono text-xs tabular-nums text-tunet-ember"
                              : "font-mono text-xs tabular-nums text-tunet-text-muted"
                        }
                      >
                        {remaining.short}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-tunet-border bg-tunet-surface lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-tunet-text">
            <Radio className="size-4 text-tunet-signal" aria-hidden="true" />
            Operasi langsung
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-tunet-border">
            {[
              { label: "Online", value: activeCount, icon: Radio },
              { label: "Total tim", value: users.length, icon: Users },
              { label: "Berjalan", value: activeTasks, icon: Activity },
              { label: "Terlambat", value: overdueTasks, icon: Clock },
            ].map((metric) => (
              <div key={metric.label} className="bg-tunet-bg/80 p-4">
                <metric.icon className="mb-3 size-4 text-tunet-text-muted" aria-hidden="true" />
                <p className="font-mono text-2xl font-semibold tabular-nums text-tunet-text">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs text-tunet-text-muted">{metric.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs leading-5 text-tunet-text-muted">
            {roleCounts.noc} NOC · {roleCounts.foc} FOC · {roleCounts.marketing} Marketing
          </p>
          <ActivityStats
            newToday={newToday}
            newYesterday={newYesterday}
            completedToday={completedToday}
            completedYesterday={completedYesterday}
            activeToday={activeToday}
            activeYesterday={activeYesterday}
          />
        </CardContent>
      </Card>

      <Card className="border-tunet-border bg-tunet-surface lg:col-span-5">
        <CardHeader>
          <CardTitle className="text-base text-tunet-text">Aliran pekerjaan</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineBar tasks={tasks} completedToday={completedToday} />
        </CardContent>
      </Card>

      <Card className="border-tunet-border bg-tunet-surface lg:col-span-7">
        <CardHeader>
          <div>
            <CardTitle className="text-base text-tunet-text">Tren penyelesaian</CardTitle>
            <p className="mt-1 text-xs text-tunet-text-muted">
              14 hari · {trendCurrent.reduce((sum, value) => sum + value, 0)} tugas selesai
            </p>
          </div>
          <TrendBadge data={trendCurrent} />
        </CardHeader>
        <CardContent className="text-tunet-signal">
          <AreaChart
            data={trendCurrent}
            baseline={trendBaseline}
            width={760}
            height={180}
            strokeClass="text-tunet-signal"
          />
        </CardContent>
      </Card>

      <div className="lg:col-span-12">
        <PerUserActivity users={users} tasks={tasks} />
      </div>
    </section>
  );
}

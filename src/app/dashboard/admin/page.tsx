"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  fetchUsers,
  fetchTasks,
  fetchCompletionTrend,
  fetchDailyPingCount,
  type CompletionTrendPoint,
  type DailyPingCount,
} from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendBadge } from "@/components/ui/sparkline";
import { AreaChart } from "@/components/ui/area-chart";
import { ProgressRing } from "@/components/ui/progress-ring";
import { AdminHero } from "@/components/admin/admin-hero";
import { PipelineBar } from "@/components/admin/pipeline-bar";
import { ActivityStats } from "@/components/admin/activity-stats";
import { DailyActivityChart } from "@/components/admin/daily-activity-chart";
import { PerUserActivity } from "@/components/admin/per-user-activity";
import { User, Task } from "@/types";
import { COPY } from "@/lib/copy";
import { useTelegramDispatch } from "@/hooks/use-telegram-dispatch";
import { useHeartbeat } from "@/hooks/use-heartbeat";
import { getTimeRemaining } from "@/lib/time";
import { Clock, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trend, setTrend] = useState<CompletionTrendPoint[]>([]);
  const [dailyPings, setDailyPings] = useState<DailyPingCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  useTelegramDispatch(currentUserId);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tutrack-user");
      if (stored) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCurrentUserId(JSON.parse(stored).id);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  useEffect(() => {
    async function load() {
      const [u, t, tr, dp] = await Promise.all([
        fetchUsers(),
        fetchTasks({ limit: 200 }),
        fetchCompletionTrend(14),
        fetchDailyPingCount(14),
      ]);
      setUsers(u);
      setTasks(t);
      setTrend(tr);
      setDailyPings(dp);
      setLoading(false);
    }
    load();
  }, []);

  const totalUsers = users.length;
  const focCount = users.filter((u) => u.role === "foc").length;
  const nocCount = users.filter((u) => u.role === "noc").length;
  const marketingCount = users.filter((u) => u.role === "marketing").length;
  const overdueTasks = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done"
  ).length;
  const activeTasks = tasks.filter((t) => t.status === "in_progress").length;
  const trendCounts = trend.map((t) => t.count);
  const trendBaseline = trend.length > 7 ? trend.slice(0, 7).map((t) => t.count) : undefined;
  const trendCurrent = trend.length > 7 ? trend.slice(7, 14).map((t) => t.count) : trendCounts;

  // Count "completed today" — tasks marked done whose updated_at is today
  const completedToday = tasks.filter((t) => {
    if (t.status !== "done") return false;
    const updated = new Date(t.updated_at);
    const now = new Date();
    return updated.toDateString() === now.toDateString();
  }).length;

  // Count "completed yesterday"
  const completedYesterday = tasks.filter((t) => {
    if (t.status !== "done") return false;
    const updated = new Date(t.updated_at);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return updated.toDateString() === yesterday.toDateString();
  }).length;

  // Tasks created today
  const newToday = tasks.filter((t) => {
    const created = new Date(t.created_at);
    return created.toDateString() === new Date().toDateString();
  }).length;

  // Tasks created yesterday
  const newYesterday = tasks.filter((t) => {
    const created = new Date(t.created_at);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return created.toDateString() === yesterday.toDateString();
  }).length;

  // Active today (from ping data)
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);
  const activeToday = dailyPings.find((d) => d.date === todayStr)?.count ?? 0;
  const activeYesterday = dailyPings.find((d) => d.date === yesterdayStr)?.count ?? 0;

  // Per-user completion rate (7-day lookback)
  const completionByUser: Record<string, number> = {};
  for (const u of users) {
    const myTasks = tasks.filter((t) => t.assigned_to === u.id);
    const done = myTasks.filter((t) => t.status === "done").length;
    completionByUser[u.id] = myTasks.length > 0 ? done / myTasks.length : 0;
  }

  // Active users via heartbeat (replaces static is_active filter)
  const { activeCount } = useHeartbeat({
    userId: currentUserId,
    watchCount: true,
  });

  // Top 5 expiring tasks (non-done, with deadline, closest first)
  const expiringTasks = tasks
    .filter((t) => t.status !== "done" && t.deadline && !t.deleted_at)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <DashboardLayout>
        <AdminDashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        <AdminHero
          totalUsers={totalUsers}
          activeUsers={activeCount}
          overdueCount={overdueTasks}
        />

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="bg-tunet-surface border-tunet-border lg:col-span-2">
              <CardContent className="p-5">
                <PipelineBar tasks={tasks} completedToday={completedToday} />
              </CardContent>
            </Card>

            <Card className="bg-tunet-surface border-tunet-border">
              <CardContent className="p-5 space-y-4">
                <div>
                  <p className="font-display text-sm font-medium text-tunet-text">
                    Total Tim
                  </p>
                  <p className="font-display text-2xl font-semibold tabular-nums text-tunet-text">
                    {totalUsers}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {nocCount} NOC
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {focCount} FOC
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {marketingCount} MKT
                    </Badge>
                  </div>
                </div>
                <div className="h-px bg-tunet-border" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-tunet-text-muted">
                      Aktif
                    </p>
                    <p className="font-display text-xl font-semibold tabular-nums text-status-progress">
                      {activeTasks}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-tunet-text-muted">
                      Terlambat
                    </p>
                    <p className="font-display text-xl font-semibold tabular-nums text-status-overdue">
                      {overdueTasks}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="bg-tunet-surface border-tunet-border lg:col-span-2">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="font-display text-sm font-medium text-tunet-text">
                      Tren Penyelesaian
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-tunet-text-muted">
                      14 hari · {trendCurrent.reduce((a, b) => a + b, 0)} selesai
                    </p>
                  </div>
                  <TrendBadge data={trendCurrent} />
                </div>
                <div className="text-tunet-signal">
                  <AreaChart
                    data={trendCurrent}
                    baseline={trendBaseline}
                    width={680}
                    height={160}
                    strokeClass="text-tunet-signal"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-tunet-surface border-tunet-border">
              <CardContent className="p-5">
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="bg-tunet-surface border-tunet-border lg:col-span-2">
              <CardContent className="p-5">
                <DailyActivityChart data={dailyPings} />
              </CardContent>
            </Card>

            <div className="lg:col-span-1">
              <PerUserActivity users={users} tasks={tasks} />
            </div>
          </div>

          {expiringTasks.length > 0 && (
            <Card className="bg-tunet-surface border-tunet-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-tunet-text flex items-center gap-2">
                  <Clock className="w-4 h-4 text-tunet-ember" />
                  {COPY.pages.admin.expiringSoon}
                </CardTitle>
                <Link
                  href="/dashboard/tasks"
                  className="text-[10px] uppercase tracking-wider text-tunet-text-muted hover:text-tunet-signal flex items-center gap-1"
                >
                  {COPY.pages.admin.viewAll}
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-tunet-border/60">
                  {expiringTasks.map((task) => {
                    const tr = getTimeRemaining(task.deadline);
                    return tr ? (
                      <Link
                        key={task.id}
                        href={`/dashboard/tasks?highlight=${task.id}`}
                        className="flex items-center justify-between px-5 py-3 hover:bg-tunet-surface-hover transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-tunet-text truncate">{task.title}</p>
                          <p className="text-[10px] text-tunet-text-muted mt-0.5">
                            {task.assigned_to
                              ? users.find((u) => u.id === task.assigned_to)?.name || "—"
                              : COPY.taskCard.unassigned}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-mono tabular-nums whitespace-nowrap ml-3 ${
                            tr.isOverdue
                              ? "text-status-overdue"
                              : tr.isUrgent
                              ? "text-tunet-ember"
                              : "text-tunet-text-muted"
                          }`}
                        >
                          {tr.short}
                        </span>
                      </Link>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="px-6 pb-6">
          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <CardTitle className="text-tunet-text">{COPY.pages.admin.teamMembers}</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <EmptyState
                  glyph="team"
                  title={COPY.empty.noTeamMembers.title}
                  description={COPY.empty.noTeamMembers.description}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-tunet-border">
                        <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">
                          {COPY.pages.team.colName}
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">
                          {COPY.pages.team.colRole}
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">
                          {COPY.pages.team.colPhone}
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">
                          Performa
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">
                          {COPY.pages.team.colStatus}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const rate = completionByUser[user.id] ?? 0;
                        const ringColor =
                          rate >= 0.8
                            ? "text-tunet-green"
                            : rate >= 0.5
                            ? "text-tunet-signal"
                            : "text-tunet-ember";
                        return (
                        <tr key={user.id} className="border-b border-tunet-border last:border-0">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-tunet-green/20 flex items-center justify-center text-tunet-green text-sm font-medium">
                                {user.name.charAt(0)}
                              </div>
                              <span className="text-sm text-tunet-text">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                user.role === "admin"
                                  ? "bg-tunet-green/20 text-tunet-green"
                                  : user.role === "noc"
                                  ? "bg-status-assigned/20 text-status-assigned"
                                  : user.role === "marketing"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : "bg-status-progress/20 text-status-progress"
                              }`}
                            >
                              {user.role.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-tunet-text-muted">{user.phone}</td>
                          <td className="py-3 px-4">
                            <ProgressRing
                              value={rate}
                              colorClass={ringColor}
                              label={`${Math.round(rate * 100)}%`}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                user.is_active
                                  ? "bg-tunet-green/20 text-tunet-green"
                                  : "bg-status-overdue/20 text-status-overdue"
                              }`}
                            >
                              {user.is_active ? COPY.pages.team.active : COPY.pages.team.inactive}
                            </Badge>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-tunet-bg">
      <div className="h-16 border-b border-tunet-border flex items-center px-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="w-10 h-10 rounded-lg" />
              </div>
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="px-6 pb-6">
        <Card className="bg-tunet-surface border-tunet-border">
          <CardHeader>
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            <SkeletonText lines={5} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

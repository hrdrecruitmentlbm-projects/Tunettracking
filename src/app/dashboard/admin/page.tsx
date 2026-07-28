"use client";

import { useEffect, useState } from "react";
import { AdminHero } from "@/components/admin/admin-hero";
import { AdminOperationsBento } from "@/components/admin/admin-operations-bento";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { useHeartbeat } from "@/hooks/use-heartbeat";
import { useTelegramDispatch } from "@/hooks/use-telegram-dispatch";
import {
  fetchCompletionTrend,
  fetchDailyPingCount,
  fetchTasks,
  fetchUsers,
  type CompletionTrendPoint,
  type DailyPingCount,
} from "@/lib/db";
import { Task, User } from "@/types";

function isSameDay(value: string, date: Date) {
  return new Date(value).toDateString() === date.toDateString();
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trend, setTrend] = useState<CompletionTrendPoint[]>([]);
  const [dailyPings, setDailyPings] = useState<DailyPingCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const stored = localStorage.getItem("tutrack-user");
    if (!stored) return undefined;
    try {
      return JSON.parse(stored).id;
    } catch {
      return undefined;
    }
  });

  useTelegramDispatch(currentUserId);

  useEffect(() => {
    async function load() {
      const [nextUsers, nextTasks, nextTrend, nextPings] = await Promise.all([
        fetchUsers(),
        fetchTasks({ limit: 200 }),
        fetchCompletionTrend(14),
        fetchDailyPingCount(14),
      ]);
      setUsers(nextUsers);
      setTasks(nextTasks);
      setTrend(nextTrend);
      setDailyPings(nextPings);
      setLoading(false);
    }
    load();
  }, []);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const overdueTasks = tasks.filter(
    (task) => task.deadline && new Date(task.deadline) < today && task.status !== "done"
  ).length;
  const activeTasks = tasks.filter((task) => task.status === "in_progress").length;
  const completedToday = tasks.filter(
    (task) => task.status === "done" && isSameDay(task.updated_at, today)
  ).length;
  const completedYesterday = tasks.filter(
    (task) => task.status === "done" && isSameDay(task.updated_at, yesterday)
  ).length;
  const newToday = tasks.filter((task) => isSameDay(task.created_at, today)).length;
  const newYesterday = tasks.filter((task) => isSameDay(task.created_at, yesterday)).length;

  const todayKey = today.toISOString().slice(0, 10);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  const activeToday = dailyPings.find((point) => point.date === todayKey)?.count ?? 0;
  const activeYesterday = dailyPings.find((point) => point.date === yesterdayKey)?.count ?? 0;

  const trendCounts = trend.map((point) => point.count);
  const trendBaseline = trend.length > 7 ? trend.slice(0, 7).map((point) => point.count) : undefined;
  const trendCurrent = trend.length > 7 ? trend.slice(7, 14).map((point) => point.count) : trendCounts;
  const { activeCount } = useHeartbeat({ userId: currentUserId, watchCount: true });

  if (loading) {
    return (
      <DashboardLayout>
        <AdminDashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-dvh bg-tunet-bg">
        <AdminHero
          totalUsers={users.length}
          activeUsers={activeCount}
          overdueCount={overdueTasks}
        />
        <AdminOperationsBento
          users={users}
          tasks={tasks}
          trendCurrent={trendCurrent}
          trendBaseline={trendBaseline}
          activeCount={activeCount}
          activeTasks={activeTasks}
          overdueTasks={overdueTasks}
          completedToday={completedToday}
          completedYesterday={completedYesterday}
          newToday={newToday}
          newYesterday={newYesterday}
          activeToday={activeToday}
          activeYesterday={activeYesterday}
          roleCounts={{
            noc: users.filter((user) => user.role === "noc").length,
            foc: users.filter((user) => user.role === "foc").length,
            marketing: users.filter((user) => user.role === "marketing").length,
          }}
        />
      </div>
    </DashboardLayout>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="min-h-dvh bg-tunet-bg">
      <div className="flex min-h-48 items-end border-b border-tunet-border p-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-80 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="mx-auto grid max-w-[100rem] grid-flow-dense grid-cols-1 gap-3 p-4 md:p-6 lg:grid-cols-12">
        <Card className="border-tunet-border bg-tunet-surface lg:col-span-8">
          <CardHeader>
            <Skeleton className="h-6 w-64 max-w-full" />
          </CardHeader>
          <CardContent>
            <SkeletonText lines={5} />
          </CardContent>
        </Card>
        <Card className="border-tunet-border bg-tunet-surface lg:col-span-4">
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </CardContent>
        </Card>
        <Card className="border-tunet-border bg-tunet-surface lg:col-span-5">
          <CardContent>
            <Skeleton className="h-44" />
          </CardContent>
        </Card>
        <Card className="border-tunet-border bg-tunet-surface lg:col-span-7">
          <CardContent>
            <Skeleton className="h-44" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
